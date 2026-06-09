import type { CreateOrderCommand, TradingUser } from '@repo/types';
import { redisStreams, config, constant } from '@repo/config';
import { v4 as uuid } from 'uuid';
import { users } from '../state/users.js';
import { openOrders } from '../state/orders.js';
import { prices } from '../state/prices.js';
import { prisma } from '@repo/db';
import {
  marketSymbolMapper,
  orderCalculator,
  priceNormalizer,
  tradeInputValidator,
} from '@repo/trading-core';

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

async function sendCreateOrderResponse(result: CreateOrderCommand, message: Record<string, unknown>) {
  const requestId = result.requestId || result.correlationId;
  await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
    function: 'createOrder',
    message: JSON.stringify(message),
    requestId,
    correlationId: requestId,
  });
}

function removeOpenOrder(orderId: string) {
  const orderIndex = openOrders.findIndex((order) => order.orderId === orderId);
  if (orderIndex !== -1) {
    openOrders.splice(orderIndex, 1);
  }
}

export async function createOrderFunction(result: CreateOrderCommand) {
  try {
    // Check if user exists
    const user = users.find((user: TradingUser) => user.userId === result.userId);

    if (!user) {
      console.error('User not found:', result.userId);
      await sendCreateOrderResponse(result, {
        error: 'User not found',
        success: false,
      });
      return;
    }

    // Normalize symbol (convert BTCUSDT to btc, etc.)
    const normalizedSymbol = marketSymbolMapper.normalizeSymbol(result.symbol);

    const bidValue = tradeInputValidator.parsePositiveNumber(result.bid);
    const askValue = tradeInputValidator.parsePositiveNumber(result.ask);

    if (bidValue === null || askValue === null) {
      await sendCreateOrderResponse(result, {
        error: 'Bid and ask must be positive numbers',
        success: false,
      });
      return;
    }

    if (askValue < bidValue) {
      await sendCreateOrderResponse(result, {
        error: 'Ask price must be greater than or equal to bid price',
        success: false,
      });
      return;
    }

    const priceAssetName = marketSymbolMapper.getPriceAssetName(normalizedSymbol);
    const priceData = {
      asset: priceAssetName,
      price: (bidValue + askValue) / 2,
      bidValue,
      askValue,
      decimal: 8,
    };

    // Validate order type
    const orderType = tradeInputValidator.parseOrderSide(result.type);
    if (!orderType) {
      console.error(`Invalid order type: ${result.type}`);
      await sendCreateOrderResponse(result, {
        error: `Invalid order type: ${result.type}. Must be 'buy' or 'sell'`,
        success: false,
      });
      return;
    }

    const expectedPrice = priceNormalizer.getEntryPrice(orderType, priceData);

    // Validate quantity
    const quantity = tradeInputValidator.parsePositiveNumber(result.quantity);
    if (quantity === null) {
      console.error(`Invalid quantity: ${result.quantity}`);
      await sendCreateOrderResponse(result, {
        error: `Invalid quantity: ${result.quantity}`,
        success: false,
      });
      return;
    }

    // Calculate margin required: (quantity * price) / leverage
    const leverage = tradeInputValidator.parsePositiveInteger(result.leverage);
    if (leverage === null) {
      console.error(`Invalid leverage: ${result.leverage}`);
      await sendCreateOrderResponse(result, {
        error: 'Leverage must be a positive whole number',
        success: false,
      });
      return;
    }

    const marginRequired = orderCalculator.getMargin(quantity, expectedPrice, leverage);

    // Fetch user balance from database
    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { userID: result.userId },
        select: { balance: true },
      });
    } catch (dbError) {
      console.error('Error fetching user balance from database:', dbError);
      await sendCreateOrderResponse(result, {
        error: 'Failed to fetch user balance from database',
        success: false,
      });
      return;
    }

    if (!dbUser) {
      console.error('User not found in database:', result.userId);
      await sendCreateOrderResponse(result, {
        error: 'User not found in database',
        success: false,
      });
      return;
    }

    // Validate sufficient balance
    if (dbUser.balance < marginRequired) {
      console.error(
        `Insufficient balance. Required: ${marginRequired}, Available: ${dbUser.balance}`,
      );
      await sendCreateOrderResponse(result, {
        error: `Insufficient balance. Required: $${marginRequired.toFixed(2)}, Available: $${dbUser.balance.toFixed(2)}`,
        success: false,
      });
      return;
    }

    const parsedTakeProfit = tradeInputValidator.parseOptionalPositiveNumber(result.takeProfit);
    const parsedStopLoss = tradeInputValidator.parseOptionalPositiveNumber(result.stopLoss);
    const parsedSlippage = tradeInputValidator.parseOptionalNonNegativeNumber(result.slippage);

    if (
      (result.takeProfit !== undefined &&
        result.takeProfit !== null &&
        result.takeProfit !== '' &&
        parsedTakeProfit === null) ||
      (result.stopLoss !== undefined &&
        result.stopLoss !== null &&
        result.stopLoss !== '' &&
        parsedStopLoss === null)
    ) {
      await sendCreateOrderResponse(result, {
        error: 'Take profit and stop loss must be positive numbers',
        success: false,
      });
      return;
    }

    if (
      result.slippage !== undefined &&
      result.slippage !== null &&
      result.slippage !== '' &&
      parsedSlippage === null
    ) {
      await sendCreateOrderResponse(result, {
        error: 'Slippage must be zero or a positive number',
        success: false,
      });
      return;
    }

    const takeProfitValue = parsedTakeProfit ?? undefined;
    const stopLossValue = parsedStopLoss ?? undefined;
    const slippageValue = parsedSlippage ?? undefined;

    // Create the order with expected price
    const orderId = uuid();
    const newOrder = {
      userId: result.userId,
      orderId: orderId,
      symbol: normalizedSymbol as 'btc' | 'sol' | 'eth',
      type: orderType as 'buy' | 'sell',
      quantity: quantity,
      leverage,
      openPrice: expectedPrice,
      openTime: new Date(),
      takeProfit: takeProfitValue,
      stopLoss: stopLossValue,
      stippage: slippageValue,
    };

    openOrders.push(newOrder);

    const currentExecutionPrice = expectedPrice;

    prices.splice(
      0,
      prices.length,
      ...priceNormalizer.upsertPrice(prices, priceData),
    );

    const invalidTakeProfit =
      takeProfitValue !== undefined &&
      (orderType === 'buy'
        ? takeProfitValue <= currentExecutionPrice
        : takeProfitValue >= currentExecutionPrice);
    const invalidStopLoss =
      stopLossValue !== undefined &&
      (orderType === 'buy'
        ? stopLossValue >= currentExecutionPrice
        : stopLossValue <= currentExecutionPrice);

    if (invalidTakeProfit || invalidStopLoss) {
      removeOpenOrder(orderId);

      const expectedDirection =
        orderType === 'buy'
          ? 'For buy orders, take profit must be above the open price and stop loss must be below it.'
          : 'For sell orders, take profit must be below the open price and stop loss must be above it.';

      await sendCreateOrderResponse(result, {
        error: `${expectedDirection} Current execution price: $${currentExecutionPrice.toFixed(2)}`,
        success: false,
      });
      return;
    }

    // Recalculate margin with execution price from client-provided bid/ask
    const actualMarginRequired = orderCalculator.getMargin(
      quantity,
      currentExecutionPrice,
      leverage,
    );

    // Re-check balance with actual margin (in case price changed significantly within slippage tolerance)
    // Fetch fresh balance from database to ensure we have the latest value
    let updatedDbUser;
    try {
      updatedDbUser = await prisma.user.findUnique({
        where: { userID: result.userId },
        select: { balance: true },
      });
    } catch (dbError) {
      console.error('Error re-fetching user balance:', dbError);
      removeOpenOrder(orderId);
      await sendCreateOrderResponse(result, {
        error: 'Failed to verify balance for actual execution price',
        success: false,
      });
      return;
    }

    if (!updatedDbUser) {
      console.error('User not found when re-checking balance');
      removeOpenOrder(orderId);
      await sendCreateOrderResponse(result, {
        error: 'User not found when verifying balance',
        success: false,
      });
      return;
    }

    if (updatedDbUser.balance < actualMarginRequired) {
      console.error(
        `Insufficient balance for actual execution price. Required: ${actualMarginRequired}, Available: ${updatedDbUser.balance}`,
      );
      removeOpenOrder(orderId);
      await sendCreateOrderResponse(result, {
        error: `Insufficient balance for actual execution price. Required: $${actualMarginRequired.toFixed(2)}, Available: $${updatedDbUser.balance.toFixed(2)}`,
        success: false,
      });
      return;
    }

    // Deduct margin from user balance and update database
    try {
      const balanceUpdate = await prisma.user.updateMany({
        where: {
          userID: result.userId,
          balance: { gte: actualMarginRequired },
        },
        data: {
          balance: { decrement: actualMarginRequired },
        },
      });

      if (balanceUpdate.count !== 1) {
        removeOpenOrder(orderId);
        await sendCreateOrderResponse(result, {
          error: 'Insufficient balance while reserving margin',
          success: false,
        });
        return;
      }

      const refreshedUser = await prisma.user.findUnique({
        where: { userID: result.userId },
        select: { balance: true },
      });
      const newBalance = refreshedUser?.balance ?? updatedDbUser.balance - actualMarginRequired;

      // Also update in-memory user balance
      const inMemoryUser = users.find((u: TradingUser) => u.userId === result.userId);
      if (inMemoryUser) {
        inMemoryUser.balance = newBalance;
      }
    } catch (balanceUpdateError) {
      console.error('Error updating balance in database:', balanceUpdateError);
      removeOpenOrder(orderId);
      await sendCreateOrderResponse(result, {
        error: 'Failed to update balance in database',
        success: false,
      });
      return;
    }

    // Send success response
    await sendCreateOrderResponse(result, {
      success: true,
      orderId,
      userId: result.userId,
      message: 'Order created successfully',
    });
  } catch (error: unknown) {
    console.error('Error in createOrderFunction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    await sendCreateOrderResponse(result, {
      error: errorMessage,
      success: false,
    });
  }
}

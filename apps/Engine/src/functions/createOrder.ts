import { redisStreams, config, constant } from "@repo/config";
import { v4 as uuid } from "uuid";
import { users } from "../data/users.js";
import { openOrders } from "../data/orders.js";
import { prices } from "../data/price.js";
import { prisma } from "@repo/db";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

// Helper function to normalize symbol (BTCUSDT -> btc, ETHUSDT -> eth, etc.)
function normalizeSymbol(symbol: string): string {
  const symbolUpper = symbol.toUpperCase();
  if (symbolUpper.includes('BTC')) return 'btc';
  if (symbolUpper.includes('ETH')) return 'eth';
  if (symbolUpper.includes('SOL')) return 'sol';
  // Return lowercase version if no match
  return symbol.toLowerCase();
}

// Helper function to get price asset name from normalized symbol
// Prices use "BTC_USDC_PERP", "ETH_USDC_PERP", "SOL_USDC_PERP" format
function getPriceAssetName(normalizedSymbol: string): string {
  const mapping: Record<string, string> = {
    'btc': 'BTC_USDC_PERP',
    'eth': 'ETH_USDC_PERP',
    'sol': 'SOL_USDC_PERP',
  };
  return mapping[normalizedSymbol] || normalizedSymbol.toUpperCase();
}

export async function createOrderFunction(result: any) {
  console.log("createOrderFunction called with:", JSON.stringify(result, null, 2));
  console.log("Available prices:", prices);
  console.log("Slippage value:", result.slippage, "Type:", typeof result.slippage);

  try {
    // Check if user exists
    const user = users.find((user: any) => user.userId === result.userId);
    
    if (!user) {
      console.error("User not found:", result.userId);
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: "User not found",
            success: false 
          }) 
        }
      );
      return;
    }

    console.log("User found:", user.userId);

    // Normalize symbol (convert BTCUSDT to btc, etc.)
    const normalizedSymbol = normalizeSymbol(result.symbol);
    const priceAssetName = getPriceAssetName(normalizedSymbol);
    console.log(`Symbol normalized: ${result.symbol} -> ${normalizedSymbol} -> ${priceAssetName}`);

    // Fetch the current bid/ask price based on the price asset name
    // Prices use format like "BTC_USDC_PERP", "ETH_USDC_PERP", "SOL_USDC_PERP"
    const priceData = prices.find((p: any) => {
      // Try matching with price asset name (e.g., BTC_USDC_PERP)
      if (p.asset === priceAssetName) {
        return true;
      }
      // Try exact match with original symbol
      if (p.asset === result.symbol) {
        return true;
      }
      // Try case-insensitive match
      if (p.asset?.toUpperCase() === priceAssetName.toUpperCase()) {
        return true;
      }
      // Try normalized symbol match
      return p.asset?.toLowerCase() === normalizedSymbol;
    });
    
    console.log("Price data found:", priceData);

    if (!priceData) {
      console.error(`Price data not found for symbol: ${result.symbol} (normalized: ${normalizedSymbol}, expected asset: ${priceAssetName})`);
      console.error(`Available price assets:`, prices.map(p => p.asset));
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: `Price data not found for symbol: ${result.symbol}. Please ensure price data is available.`,
            success: false 
          }) 
        }
      );
      return;
    }

    // Validate order type
    const orderType = result.type?.toLowerCase();
    if (orderType !== "buy" && orderType !== "sell") {
      console.error(`Invalid order type: ${result.type}`);
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: `Invalid order type: ${result.type}. Must be 'buy' or 'sell'`,
            success: false 
          }) 
        }
      );
      return;
    }

    // Calculate expected open price based on order type
    let expectedPrice: number;
    if (orderType === "buy") {
      expectedPrice = priceData.askValue;
    } else {
      expectedPrice = priceData.bidValue;
    }

    // Validate quantity
    const quantity = parseFloat(result.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      console.error(`Invalid quantity: ${result.quantity}`);
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: `Invalid quantity: ${result.quantity}`,
            success: false 
          }) 
        }
      );
      return;
    }

    // Calculate margin required: (quantity * price) / leverage
    const leverage = parseInt(result.leverage) || 1;
    const marginRequired = (quantity * expectedPrice) / leverage;
    console.log(`Margin calculation: quantity=${quantity}, price=${expectedPrice}, leverage=${leverage}, marginRequired=${marginRequired}`);

    // Fetch user balance from database
    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { userID: result.userId },
        select: { balance: true }
      });
    } catch (dbError) {
      console.error("Error fetching user balance from database:", dbError);
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: "Failed to fetch user balance from database",
            success: false 
          }) 
        }
      );
      return;
    }

    if (!dbUser) {
      console.error("User not found in database:", result.userId);
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: "User not found in database",
            success: false 
          }) 
        }
      );
      return;
    }

    console.log(`User balance from database: ${dbUser.balance}`);
    
    // Validate sufficient balance
    if (dbUser.balance < marginRequired) {
      console.error(`Insufficient balance. Required: ${marginRequired}, Available: ${dbUser.balance}`);
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: `Insufficient balance. Required: $${marginRequired.toFixed(2)}, Available: $${dbUser.balance.toFixed(2)}`,
            success: false 
          }) 
        }
      );
      return;
    }

    const parsedTakeProfit =
      result.takeProfit !== undefined && result.takeProfit !== null && result.takeProfit !== ""
        ? (typeof result.takeProfit === "number" ? result.takeProfit : parseFloat(String(result.takeProfit)))
        : undefined;
    const parsedStopLoss =
      result.stopLoss !== undefined && result.stopLoss !== null && result.stopLoss !== ""
        ? (typeof result.stopLoss === "number" ? result.stopLoss : parseFloat(String(result.stopLoss)))
        : undefined;

    if (
      (parsedTakeProfit !== undefined && (!Number.isFinite(parsedTakeProfit) || parsedTakeProfit <= 0)) ||
      (parsedStopLoss !== undefined && (!Number.isFinite(parsedStopLoss) || parsedStopLoss <= 0))
    ) {
      const requestId = result.requestId || result.correlationId;
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        {
          function: "createOrder",
          message: JSON.stringify({
            error: "Take profit and stop loss must be positive numbers",
            success: false
          }),
          requestId,
          correlationId: requestId
        }
      );
      return;
    }

    // Create the order with expected price
    const orderId = uuid();
    const newOrder = {
      userId: result.userId,
      orderId: orderId,
      symbol: normalizedSymbol as "btc" | "sol" | "eth",
      type: orderType as "buy" | "sell",
      quantity: quantity,
      leverage: parseInt(result.leverage) || 1,
      openPrice: expectedPrice,
      openTime: new Date(),
      takeProfit: parsedTakeProfit,
      stopLoss: parsedStopLoss,
      stippage: result.slippage !== undefined && result.slippage !== null && result.slippage !== ""
        ? (typeof result.slippage === 'number' ? result.slippage : parseFloat(String(result.slippage)))
        : undefined,
    };

    openOrders.push(newOrder);
    console.log("Order created with expected price:", newOrder);

    // Check slippage after order creation
    // Re-fetch current price to check if it has moved beyond slippage tolerance
    const currentPriceData = prices.find((p: any) => {
      if (p.asset === priceAssetName) return true;
      if (p.asset === result.symbol) return true;
      if (p.asset?.toUpperCase() === priceAssetName.toUpperCase()) return true;
      return p.asset?.toLowerCase() === normalizedSymbol;
    });

    if (!currentPriceData) {
      console.error("Price data not found during slippage check");
      // Remove the order we just created
      const orderIndex = openOrders.findIndex(o => o.orderId === orderId);
      if (orderIndex !== -1) {
        openOrders.splice(orderIndex, 1);
      }
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: "Price data not found during slippage check",
            success: false 
          }) 
        }
      );
      return;
    }

    // Get current execution price
    let currentExecutionPrice: number;
    if (orderType === "buy") {
      currentExecutionPrice = currentPriceData.askValue;
    } else {
      currentExecutionPrice = currentPriceData.bidValue;
    }

    const invalidTakeProfit =
      parsedTakeProfit !== undefined &&
      (orderType === "buy"
        ? parsedTakeProfit <= currentExecutionPrice
        : parsedTakeProfit >= currentExecutionPrice);
    const invalidStopLoss =
      parsedStopLoss !== undefined &&
      (orderType === "buy"
        ? parsedStopLoss >= currentExecutionPrice
        : parsedStopLoss <= currentExecutionPrice);

    if (invalidTakeProfit || invalidStopLoss) {
      const orderIndex = openOrders.findIndex(o => o.orderId === orderId);
      if (orderIndex !== -1) {
        openOrders.splice(orderIndex, 1);
      }

      const expectedDirection =
        orderType === "buy"
          ? "For buy orders, take profit must be above the open price and stop loss must be below it."
          : "For sell orders, take profit must be below the open price and stop loss must be above it.";

      const requestId = result.requestId || result.correlationId;
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        {
          function: "createOrder",
          message: JSON.stringify({
            error: `${expectedDirection} Current execution price: $${currentExecutionPrice.toFixed(2)}`,
            success: false
          }),
          requestId,
          correlationId: requestId
        }
      );
      return;
    }

    // Check slippage if slippage value is provided
    if (result.slippage !== undefined && result.slippage !== null && result.slippage !== "") {
      const slippageTolerance = typeof result.slippage === 'number' 
        ? result.slippage 
        : parseFloat(String(result.slippage));
      
      if (!isNaN(slippageTolerance) && slippageTolerance >= 0) {
        // Calculate price difference percentage
        const priceDifference = Math.abs(currentExecutionPrice - expectedPrice);
        const priceDifferencePercent = (priceDifference / expectedPrice) * 100;

        console.log(`Slippage check: Expected=${expectedPrice}, Current=${currentExecutionPrice}, Difference=${priceDifferencePercent.toFixed(4)}%, Tolerance=${slippageTolerance}%`);

        // If slippage exceeds tolerance, cancel the order
        if (priceDifferencePercent > slippageTolerance) {
          console.warn(`Slippage exceeded! ${priceDifferencePercent.toFixed(4)}% > ${slippageTolerance}%. Cancelling order.`);
          
          // Remove the order from openOrders
          const orderIndex = openOrders.findIndex(o => o.orderId === orderId);
          if (orderIndex !== -1) {
            openOrders.splice(orderIndex, 1);
            console.log("Order removed due to slippage:", orderId);
          }

          // Send error response
          await RedisStreams.addToRedisStream(
            constant.secondaryRedisStream,
            { 
              function: "createOrder", 
              message: JSON.stringify({ 
                error: `Order cancelled due to slippage. Expected price: ${expectedPrice}, Current price: ${currentExecutionPrice}, Slippage: ${priceDifferencePercent.toFixed(4)}% (Tolerance: ${slippageTolerance}%)`,
                success: false 
              }) 
            }
          );
          console.log("Slippage error response sent to Backend");
          return;
        }
      }
    }

    // Update order with actual execution price (in case it changed slightly but within slippage)
    const orderIndex = openOrders.findIndex(o => o.orderId === orderId);
    if (orderIndex !== -1 && openOrders[orderIndex]) {
      openOrders[orderIndex].openPrice = currentExecutionPrice;
    }

    // Recalculate margin with actual execution price
    const actualMarginRequired = (quantity * currentExecutionPrice) / leverage;
    console.log(`Actual margin required (using execution price): ${actualMarginRequired}`);

    // Re-check balance with actual margin (in case price changed significantly within slippage tolerance)
    // Fetch fresh balance from database to ensure we have the latest value
    let updatedDbUser;
    try {
      updatedDbUser = await prisma.user.findUnique({
        where: { userID: result.userId },
        select: { balance: true }
      });
    } catch (dbError) {
      console.error("Error re-fetching user balance:", dbError);
      // Remove the order
      const failedOrderIndex = openOrders.findIndex(o => o.orderId === orderId);
      if (failedOrderIndex !== -1) {
        openOrders.splice(failedOrderIndex, 1);
      }
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: "Failed to verify balance for actual execution price",
            success: false 
          }) 
        }
      );
      return;
    }

    if (!updatedDbUser) {
      console.error("User not found when re-checking balance");
      // Remove the order
      const failedOrderIndex = openOrders.findIndex(o => o.orderId === orderId);
      if (failedOrderIndex !== -1) {
        openOrders.splice(failedOrderIndex, 1);
      }
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: "User not found when verifying balance",
            success: false 
          }) 
        }
      );
      return;
    }

    if (updatedDbUser.balance < actualMarginRequired) {
      console.error(`Insufficient balance for actual execution price. Required: ${actualMarginRequired}, Available: ${updatedDbUser.balance}`);
      // Remove the order
      const failedOrderIndex = openOrders.findIndex(o => o.orderId === orderId);
      if (failedOrderIndex !== -1) {
        openOrders.splice(failedOrderIndex, 1);
      }
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: `Insufficient balance for actual execution price. Required: $${actualMarginRequired.toFixed(2)}, Available: $${updatedDbUser.balance.toFixed(2)}`,
            success: false 
          }) 
        }
      );
      return;
    }

    // Deduct margin from user balance and update database
    try {
      console.log(`Deducting margin: ${actualMarginRequired} from balance: ${updatedDbUser.balance}`);

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
        const failedOrderIndex = openOrders.findIndex(o => o.orderId === orderId);
        if (failedOrderIndex !== -1) {
          openOrders.splice(failedOrderIndex, 1);
        }
        const requestId = result.requestId || result.correlationId;
        await RedisStreams.addToRedisStream(
          constant.secondaryRedisStream,
          {
            function: "createOrder",
            message: JSON.stringify({
              error: "Insufficient balance while reserving margin",
              success: false
            }),
            requestId: requestId,
            correlationId: requestId
          }
        );
        return;
      }

      const refreshedUser = await prisma.user.findUnique({
        where: { userID: result.userId },
        select: { balance: true },
      });
      const newBalance = refreshedUser?.balance ?? updatedDbUser.balance - actualMarginRequired;

      console.log(`Balance updated successfully in database. New balance: ${newBalance}`);
      
      // Also update in-memory user balance
      const inMemoryUser = users.find((u: any) => u.userId === result.userId);
      if (inMemoryUser) {
        inMemoryUser.balance = newBalance;
        console.log(`In-memory user balance updated: ${newBalance}`);
      }
    } catch (balanceUpdateError) {
      console.error("Error updating balance in database:", balanceUpdateError);
      // Remove the order since we couldn't deduct balance
      const failedOrderIndex = openOrders.findIndex(o => o.orderId === orderId);
      if (failedOrderIndex !== -1) {
        openOrders.splice(failedOrderIndex, 1);
      }
      await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { 
          function: "createOrder", 
          message: JSON.stringify({ 
            error: "Failed to update balance in database",
            success: false 
          }) 
        }
      );
      return;
    }

    console.log("Order created successfully with actual price:", {
      ...newOrder,
      openPrice: currentExecutionPrice
    });
    console.log("Total open orders:", openOrders.length);

    // Send success response
    const requestId = result.requestId || result.correlationId;
    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { 
        function: "createOrder", 
        message: JSON.stringify({ 
          success: true,
          orderId: orderId,
          userId: result.userId,
          message: "Order created successfully"
        }),
        requestId: requestId,
        correlationId: requestId
      }
    );
    console.log("Success response sent to Backend");
  } catch (error: any) {
    console.error("Error in createOrderFunction:", error);
    const requestId = result.requestId || result.correlationId;
    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { 
        function: "createOrder", 
        message: JSON.stringify({ 
          error: error?.message || "Failed to create order",
          success: false 
        }),
        requestId: requestId,
        correlationId: requestId
      }
    );
  }
}

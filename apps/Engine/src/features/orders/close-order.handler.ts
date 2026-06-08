import { redisStreams, config, constant } from "@repo/config";
import { users } from "../state/users.js";
import { closeOrders, openOrders } from "../state/orders.js";
import { prices } from "../state/prices.js";
import { prisma } from "@repo/db";
import type { CloseReason } from "@repo/types";
import {
  marketSymbolMapper,
  orderCalculator,
  priceNormalizer,
} from "@repo/trading-core";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

type CloseOpenOrderOptions = {
  orderId: string;
  userId: string;
  requestId?: string;
  closeReason?: CloseReason;
  sendResponse?: boolean;
};

async function sendCloseResponse(
  requestId: string | undefined,
  message: Record<string, unknown>,
) {
  await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
    function: "createCloseOrder",
    message: JSON.stringify(message),
    requestId,
    correlationId: requestId,
  });
}

export async function closeOpenOrder({
  orderId,
  userId,
  requestId,
  closeReason = "manual",
  sendResponse = true,
}: CloseOpenOrderOptions) {
  const orderIndex = openOrders.findIndex((order) => order.orderId === orderId);

  if (orderIndex === -1) {
    if (sendResponse) {
      await sendCloseResponse(requestId, { error: "Order not found", orderId });
    }
    return { success: false, error: "Order not found" };
  }

  const order = openOrders[orderIndex];

  if (!order || order.userId !== userId) {
    if (sendResponse) {
      await sendCloseResponse(requestId, { error: "Order not found", orderId });
    }
    return { success: false, error: "Order not found" };
  }

  const priceAssetName = marketSymbolMapper.getPriceAssetName(
    order.symbol || "",
  );
  const priceData = priceNormalizer.findPriceForSymbol(
    prices,
    order.symbol || "",
  );

  if (!priceData) {
    console.error(
      `Price data not found for symbol: ${order.symbol} (expected asset: ${priceAssetName})`,
    );
    console.error(
      "Available price assets:",
      prices.map((p) => p.asset),
    );
    if (sendResponse) {
      await sendCloseResponse(requestId, {
        error: "Price data not found",
        orderId,
      });
    }
    return { success: false, error: "Price data not found" };
  }

  // For buy orders, close at bid price. For sell orders, close at ask price.
  const closePrice = priceNormalizer.getExitPrice(order, priceData);
  const profitLoss = orderCalculator.getProfitLoss(order, closePrice);
  const reservedMargin = orderCalculator.getMargin(
    order.quantity,
    order.openPrice,
    order.leverage,
  );
  const balanceAdjustment = reservedMargin + profitLoss;

  try {
    const updatedUser = await prisma.user.update({
      where: { userID: userId },
      data: { balance: { increment: balanceAdjustment } },
      select: { balance: true },
    });

    const inMemoryUser = users.find((user: any) => user.userId === userId);
    if (inMemoryUser) {
      inMemoryUser.balance = updatedUser.balance;
    }
  } catch (balanceUpdateError) {
    console.error(
      "Failed to update user balance while closing order:",
      balanceUpdateError,
    );
    if (sendResponse) {
      await sendCloseResponse(requestId, {
        error: "Failed to update balance",
        orderId,
      });
    }
    return { success: false, error: "Failed to update balance" };
  }

  openOrders.splice(orderIndex, 1);

  const closeTime = new Date();
  const orderResult = {
    orderId: order.orderId,
    userId: order.userId,
    symbol: order.symbol,
    type: order.type,
    quantity: order.quantity,
    leverage: order.leverage,
    takeProfit: order.takeProfit || null,
    stopLoss: order.stopLoss || null,
    stippage: order.stippage || null,
    openPrice: order.openPrice,
    closePrice,
    openTime: order.openTime,
    closeTime,
    profitLoss,
    closeReason,
  };

  closeOrders.unshift(orderResult);

  await RedisStreams.addToRedisStream(constant.dbStorageStream, {
    function: "createCloseOrder",
    message: orderResult,
  });

  if (sendResponse) {
    await sendCloseResponse(requestId, orderResult);
  }

  return { success: true, order: orderResult };
}

export async function createCloseOrderFunction(result: any) {
  if (!users.some((user: any) => user.userId === result.userId)) {
    const requestId = result.requestId || result.correlationId;
    await sendCloseResponse(requestId, {
      error: "User not found",
      userId: result.userId,
    });
    return;
  }

  await closeOpenOrder({
    orderId: result.orderId,
    userId: result.userId,
    requestId: result.requestId || result.correlationId,
    closeReason: "manual",
    sendResponse: true,
  });
}

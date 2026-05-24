import { redisStreams, config, constant } from "@repo/config";
import { users } from "../data/users.js";
import { openOrders } from "../data/orders.js";
import { prices } from "../data/price.js";
import { prisma } from "@repo/db";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

type CloseReason = "manual" | "take_profit" | "stop_loss";

type CloseOpenOrderOptions = {
  orderId: string;
  userId: string;
  requestId?: string;
  closeReason?: CloseReason;
  sendResponse?: boolean;
};

function getPriceAssetName(symbol: string): string {
  const symbolUpper = symbol.toUpperCase();
  if (symbolUpper.includes("BTC")) return "BTC_USDC_PERP";
  if (symbolUpper.includes("ETH")) return "ETH_USDC_PERP";
  if (symbolUpper.includes("SOL")) return "SOL_USDC_PERP";
  return symbol.toUpperCase();
}

async function sendCloseResponse(
  requestId: string | undefined,
  message: Record<string, unknown>
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
    console.log("Order not found:", orderId);
    if (sendResponse) {
      await sendCloseResponse(requestId, { error: "Order not found", orderId });
    }
    return { success: false, error: "Order not found" };
  }

  const order = openOrders[orderIndex];
  console.log("Found order to close:", order);

  if (!order || order.userId !== userId) {
    console.log("Order does not belong to user:", orderId, userId);
    if (sendResponse) {
      await sendCloseResponse(requestId, { error: "Order not found", orderId });
    }
    return { success: false, error: "Order not found" };
  }

  const priceAssetName = getPriceAssetName(order.symbol || "");
  const priceData = prices.find((p: any) => {
    if (p.asset === priceAssetName) return true;
    if (p.asset === order.symbol) return true;
    return p.asset?.toUpperCase() === priceAssetName.toUpperCase();
  });

  if (!priceData) {
    console.error(`Price data not found for symbol: ${order.symbol} (expected asset: ${priceAssetName})`);
    console.error("Available price assets:", prices.map((p) => p.asset));
    if (sendResponse) {
      await sendCloseResponse(requestId, { error: "Price data not found", orderId });
    }
    return { success: false, error: "Price data not found" };
  }

  // For buy orders, close at bid price. For sell orders, close at ask price.
  const closePrice = order.type === "buy" ? priceData.bidValue : priceData.askValue;
  const profitLoss =
    order.type === "buy"
      ? (closePrice - order.openPrice) * order.quantity
      : (order.openPrice - closePrice) * order.quantity;
  const reservedMargin = (order.quantity * order.openPrice) / order.leverage;
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

    console.log("Released margin and applied P/L:", {
      reservedMargin,
      profitLoss,
      balanceAdjustment,
      newBalance: updatedUser.balance,
      closeReason,
    });
  } catch (balanceUpdateError) {
    console.error("Failed to update user balance while closing order:", balanceUpdateError);
    if (sendResponse) {
      await sendCloseResponse(requestId, { error: "Failed to update balance", orderId });
    }
    return { success: false, error: "Failed to update balance" };
  }

  openOrders.splice(orderIndex, 1);
  console.log("Order removed from openOrders. Remaining open orders:", openOrders.length);

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

  console.log("Closing order with calculated values:", {
    orderId: orderResult.orderId,
    openPrice: orderResult.openPrice,
    closePrice: orderResult.closePrice,
    profitLoss: orderResult.profitLoss,
    closeReason,
  });

  await RedisStreams.addToRedisStream(constant.dbStorageStream, {
    function: "createCloseOrder",
    message: orderResult,
  });
  console.log("Sent order to DBStorage for database persistence");

  if (sendResponse) {
    await sendCloseResponse(requestId, orderResult);
    console.log("Sent closed order response to Backend");
  }

  return { success: true, order: orderResult };
}

export async function createCloseOrderFunction(result: any) {
  console.log("createCloseOrderFunction called with:", result);

  if (!users.some((user: any) => user.userId === result.userId)) {
    console.log("User not found:", result.userId);
    const requestId = result.requestId || result.correlationId;
    await sendCloseResponse(requestId, { error: "User not found", userId: result.userId });
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

import { redisStreams, config, constant } from "@repo/config";
import { v4 as uuid } from "uuid";
import { users } from "../data/users.js";
import { openOrders } from "../data/orders.js";
import { prices } from "../data/price.js";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function createCloseOrderFunction(result: any) {
  console.log("createCloseOrderFunction called with:", result);

  // Check if user exists
  if (users.some((user: any) => user.userId === result.userId)) {
    console.log("User found");
    
    // Find the order to close
    const orderIndex = openOrders.findIndex((order) => order.orderId === result.orderId);
    
    if (orderIndex === -1) {
      console.log("Order not found:", result.orderId);
      await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
        function: "createCloseOrder",
        message: JSON.stringify({ error: "Order not found", orderId: result.orderId }),
      });
      return;
    }

    const order = openOrders[orderIndex];
    console.log("Found order to close:", order);

    // Helper function to get price asset name from symbol
    const getPriceAssetName = (symbol: string): string => {
      const symbolUpper = symbol.toUpperCase();
      if (symbolUpper.includes('BTC')) return 'BTC_USDC_PERP';
      if (symbolUpper.includes('ETH')) return 'ETH_USDC_PERP';
      if (symbolUpper.includes('SOL')) return 'SOL_USDC_PERP';
      return symbol.toUpperCase();
    };

    // Get current price for the symbol
    // Prices use format like "BTC_USDC_PERP", "ETH_USDC_PERP", "SOL_USDC_PERP"
    const priceAssetName = getPriceAssetName(order?.symbol || "");
    const priceData = prices.find((p: any) => {
      // Try matching with price asset name (e.g., BTC_USDC_PERP)
      if (p.asset === priceAssetName) return true;
      // Try exact match with order symbol
      if (p.asset === order?.symbol) return true;
      // Try case-insensitive match
      return p.asset?.toUpperCase() === priceAssetName.toUpperCase();
    });
    
    if (!priceData) {
      console.error(`Price data not found for symbol: ${order?.symbol} (expected asset: ${priceAssetName})`);
      console.error(`Available price assets:`, prices.map(p => p.asset));
      await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
        function: "createCloseOrder",
        message: JSON.stringify({ error: "Price data not found", orderId: result.orderId }),
      });
      return;
    }

    // Calculate close price based on order type
    // For buy orders, close at bid price (sell price)
    // For sell orders, close at ask price (buy price)
    const closePrice = order?.type === "buy" ? priceData.bidValue : priceData.askValue;
    
    // Calculate profit/loss
    // For buy orders: profit if closePrice > openPrice
    // For sell orders: profit if closePrice < openPrice
    let profitLoss: number;
    if (order?.type === "buy") {
      profitLoss = (closePrice - order?.openPrice) * order?.quantity;
    } else {
      profitLoss = (order?.openPrice || 0 - closePrice) * (order?.quantity || 0);
    }

    // Remove order from in-memory openOrders array
    openOrders.splice(orderIndex, 1);
    console.log("Order removed from openOrders. Remaining open orders:", openOrders.length);

    // Create the closed order result matching Prisma schema
    const closeTime = new Date();
    const orderResult = {
      orderId: order?.orderId,
      userId: order?.userId,
      symbol: order?.symbol,
      type: order?.type,
      quantity: order?.quantity,
      leverage: order?.leverage,
      takeProfit: order?.takeProfit || null,
      stopLoss: order?.stopLoss || null,
      stippage: order?.stippage || null,
      openPrice: order?.openPrice,
      closePrice: closePrice,
      openTime: order?.openTime,
      closeTime: closeTime,
      profitLoss: profitLoss,
    };

    console.log("Closing order with calculated values:", {
      orderId: orderResult.orderId,
      openPrice: orderResult.openPrice,
      closePrice: orderResult.closePrice,
      profitLoss: orderResult.profitLoss,
    });

    // Send to DBStorage to save in database
    await RedisStreams.addToRedisStream(constant.dbStorageStream, {
      function: "createCloseOrder",
      message: orderResult,
    });
    console.log("Sent order to DBStorage for database persistence");

    // Send response back to Backend (stringified for consistency with getOpenOrderFunction)
    await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
      function: "createCloseOrder",
      message: JSON.stringify(orderResult),
    });
    console.log("Sent closed order response to Backend");
  } else {
    console.log("User not found:", result.userId);
    await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
      function: "createCloseOrder",
      message: JSON.stringify({ error: "User not found", userId: result.userId }),
    });
  }
}
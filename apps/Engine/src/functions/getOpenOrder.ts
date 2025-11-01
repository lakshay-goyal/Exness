import { users } from "../data/users.js";
import { openOrders } from "../data/orders.js";
import { prices } from "../data/price.js";
import { redisStreams, config, constant } from "@repo/config";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function getOpenOrderFunction(result: any) {
  console.log("getOpenOrderFunction called with:", result);

  // Check if a user with the same userId already exists
  if (users.some((user: any) => user.userId === result.userId)) {
    console.log("User found");
    
    // Filter open orders for this user
    const userOpenOrders = openOrders.filter((order) => order.userId === result.userId);
    
    // Helper function to get price asset name from symbol
    const getPriceAssetName = (symbol: string): string => {
      const symbolUpper = symbol.toUpperCase();
      if (symbolUpper.includes('BTC')) return 'BTC_USDC_PERP';
      if (symbolUpper.includes('ETH')) return 'ETH_USDC_PERP';
      if (symbolUpper.includes('SOL')) return 'SOL_USDC_PERP';
      return symbol.toUpperCase();
    };

    // Enhance each order with current price from prices data
    const enhancedOrders = userOpenOrders.map((order) => {
      // Prices use format like "BTC_USDC_PERP", "ETH_USDC_PERP", "SOL_USDC_PERP"
      const priceAssetName = getPriceAssetName(order.symbol);
      const priceData = prices.find((p: any) => {
        // Try matching with price asset name (e.g., BTC_USDC_PERP)
        if (p.asset === priceAssetName) return true;
        // Try exact match with order symbol
        if (p.asset === order.symbol) return true;
        // Try case-insensitive match
        return p.asset?.toUpperCase() === priceAssetName.toUpperCase();
      });
      
      // Calculate current price based on order type (use bid for sell, ask for buy)
      let currentPrice = order.openPrice; // Default to openPrice if price data not available
      
      if (priceData) {
        // For buy orders, show ask price (what it would cost to buy more)
        // For sell orders, show bid price (what it would cost to sell)
        currentPrice = order.type === "buy" ? priceData.askValue : priceData.bidValue;
      }
      
      return {
        ...order,
        currentPrice,
        status: "open"
      };
    });

    console.log("Enhanced Open Orders Data:", enhancedOrders);
    
    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { function:"getOpenOrder", message: JSON.stringify(enhancedOrders) }
    );
    console.log("Open orders sent to secondary stream");
    return;
  } else {
    console.log("User not found, returning empty array");
    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { function:"getOpenOrder", message: JSON.stringify([]) }
    );
    return;
  }
}
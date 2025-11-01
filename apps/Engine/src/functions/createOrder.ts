import { redisStreams, config, constant } from "@repo/config";
import { v4 as uuid } from "uuid";
import { users } from "../data/users.js";
import { openOrders } from "../data/orders.js";
import { prices } from "../data/price.js";

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
  console.log("createOrderFunction called with:", result);
  console.log("Available prices:", prices);

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

    // Calculate open price based on order type
    let openPrice: number;
    if (orderType === "buy") {
      openPrice = priceData.askValue;
    } else {
      openPrice = priceData.bidValue;
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

    // Create the order
    const orderId = uuid();
    const newOrder = {
      userId: result.userId,
      orderId: orderId,
      symbol: normalizedSymbol as "btc" | "sol" | "eth",
      type: orderType as "buy" | "sell",
      quantity: quantity,
      leverage: parseInt(result.leverage) || 1,
      openPrice: openPrice,
      openTime: new Date(),
    };

    openOrders.push(newOrder);

    console.log("Order created successfully:", newOrder);
    console.log("Total open orders:", openOrders.length);

    // Send success response
    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { 
        function: "createOrder", 
        message: JSON.stringify({ 
          success: true,
          orderId: orderId,
          userId: result.userId,
          message: "Order created successfully"
        }) 
      }
    );
    console.log("Success response sent to Backend");
  } catch (error: any) {
    console.error("Error in createOrderFunction:", error);
    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { 
        function: "createOrder", 
        message: JSON.stringify({ 
          error: error?.message || "Failed to create order",
          success: false 
        }) 
      }
    );
  }
}

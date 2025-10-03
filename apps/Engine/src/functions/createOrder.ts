import { redisStreams, config, constant } from "@repo/config";
import { v4 as uuid } from "uuid";
import { users } from "../data/users.js";
import { openOrders } from "../data/orders.js";
import { prices } from "../data/price.js";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function createOrderFunction(result: any) {
  console.log(result);

  console.log("Good");
  // Check if a user with the same email already exists
  if (users.some((user: any) => user.userId === result.userId)) {
    console.log("User fined");
    
    // Fetch the current bid/ask price based on the order type
    const priceData = prices.find((p: any) => p.asset === result.symbol);
    console.log("User fined priceData", priceData);
    let openPrice: number;

    if (!priceData) {
      throw new Error(`Price data not found for symbol: ${result.symbol}`);
    }

    if (result.type === "buy") {
      openPrice = priceData.askValue;
    } else if (result.type === "sell") {
      openPrice = priceData.bidValue;
    } else {
      throw new Error(`Invalid order type: ${result.type}`);
    }

    openOrders.push({
      userId: result.userId,
      orderId: uuid(),
      symbol: result.symbol,
      type: result.type,
      quantity: result.quantity,
      leverage: result.leverage,
      openPrice,
      openTime: new Date(),
    });

    console.log("Open Orders:", openOrders);
    

    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { function: "createOrder", message: result.userId }
    );
    console.log(users, "Order created");
  } else {
    const existingUser = users.find(
      (user: any) => user.userId === result.userId
    );
    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { function:"createOrder", message: existingUser?.userId }
    );
  }
}

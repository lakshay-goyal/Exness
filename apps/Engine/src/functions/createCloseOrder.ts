import { redisStreams, config, constant } from "@repo/config";
import { v4 as uuid } from "uuid";
import { users } from "../data/users.js";
import { openOrders } from "../data/orders.js";
import { prices } from "../data/price.js";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function createCloseOrderFunction(result: any) {
  console.log(result);

  console.log("Good");
  // Check if a user with the same email already exists
  if (users.some((user: any) => user.userId === result.userId)) {
    console.log("User found");
    // console.log("Order ID: ", result.orderId);
    const order = openOrders.find((order) => order.orderId === result.orderId);
    console.log("Order: ", order);
    if (!order) {
      await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
        function:"createCloseOrder",
        message: "Order not found",
      });
    } else {
      openOrders.splice(openOrders.indexOf(order), 1);
      
      await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
        function:"createCloseOrder",
        message: order,
      });
      console.log("Closing order found", order);
    }
  } else {
    await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
      function:"createCloseOrder",
      message: "User not found",
    });
  }
  
}



export interface CloseOrders {
    closePrice: number;
    closeTime: Date;
    profitLoss: number;
  }
  
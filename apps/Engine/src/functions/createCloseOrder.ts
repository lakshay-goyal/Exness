// import { redisStreams, config } from "@repo/config";
// import { v4 as uuid } from "uuid";
// import { users } from "../data/users.js";
// import { openOrders } from "../data/orders.js";
// import { prices } from "../data/price.js";

// // connect redis streams
// const RedisStreams = redisStreams(config.REDIS_URL);
// await RedisStreams.connect();

// export async function createCloseOrderFunction(payload: any) {
//   const jsonString = Object.values(payload).join("");
//   const result = JSON.parse(jsonString);
//   console.log(result);

//   console.log("Good");
//   // Check if a user with the same email already exists
//   const order = openOrders.find((order) => order.orderId === result.orderId);
//   if (!order) {
//     await RedisStreams.addToRedisStream("exness:tradeReceive", "tradeReceiveGroup", {
//       message: "Order not found",
//     });
//     console.log("Order not found");
    
//     return;
//   }
//   await RedisStreams.addToRedisStream("exness:tradeReceive", "tradeReceiveGroup", {
//       function:"createCloseOrder",message: order,
//     });
//   console.log("Closing order found", order);
  
// }

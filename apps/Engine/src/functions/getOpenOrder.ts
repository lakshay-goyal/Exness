// import { users } from "../data/users.js";
// import { openOrders } from "../data/orders.js";
// import { redisStreams, config } from "@repo/config";

// // connect redis streams
// const RedisStreams = redisStreams(config.REDIS_URL);
// await RedisStreams.connect();

// export async function getOpenOrderFunction(payload: any) {
//   const jsonString = Object.values(payload).join("");
//   const result = JSON.parse(jsonString);
//   console.log(result);

//   console.log("Good");
//   // Check if a user with the same email already exists
//   if (users.some((user: any) => user.userId === result.userId)) {
//     console.log("User founded");
//     const data = openOrders.filter((order) => order.userId === result.userId);

//     console.log("Open Orders Data:", data);
    

//     await RedisStreams.addToRedisStream(
//       "exness:tradeReceive",
//       "tradeReceiveGroup",
//       { message: JSON.stringify(data) }
//     );
//     console.log("users after creation");
//   } else {
//     await RedisStreams.addToRedisStream(
//       "exness:tradeReceive",
//       "tradeReceiveGroup",
//       { message: "Open Order Not Found" }
//     );
//   }
// }
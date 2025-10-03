import { users } from "../data/users.js";
import { openOrders } from "../data/orders.js";
import { redisStreams, config, constant } from "@repo/config";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function getOpenOrderFunction(result: any) {
  console.log(result);

  console.log("Good");
  // Check if a user with the same email already exists
  if (users.some((user: any) => user.userId === result.userId)) {
    console.log("User founded");
    const data = openOrders.filter((order) => order.userId === result.userId);

    console.log("Open Orders Data:", data);
    

    await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
      { function:"getOpenOrder", message: JSON.stringify(data) }
    );
    console.log("users after creation");
    return;
} else {
    await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
      { function:"getOpenOrder", message: "Open Order Not Found" }
    );
    return;
  }
}
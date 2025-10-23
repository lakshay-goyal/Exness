import { users } from "../data/users.js";
import { config, constant, redisStreams } from "@repo/config";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function getBalanceFunction(payload: any) {
  console.log("=== getBalanceFunction called ===");
  console.log("Payload:", payload);
  
  const userId: string = payload.userId;
  console.log("Looking for userId:", userId);
  console.log("Available users:", users);

  const user = users.find((item) => item.userId === userId);

  if (user) {
    console.log("User found:", user);
    console.log(`Balance for ${userId}: ${user.balance}`);

    try {
      await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
        function: "getBalance",
        message: user.balance,
      });
      console.log("Sent balance response to secondaryRedisStream");
    } catch (error) {
      console.error("Error sending balance response:", error);
      await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
        function: "getBalance",
        message: (user.balance = 0),
      });
    }
    console.log(user.balance / 100, "maybe");
  } else {
    console.log("Available users:", users);
    console.log(`User ${userId} not found ❌`);
    return null;
  }
}

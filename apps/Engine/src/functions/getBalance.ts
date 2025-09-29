import { users } from "../data/users.js";
import { config, constant, redisStreams } from "@repo/config";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function getBalanceFunction(payload: any) {
  const userId: string = payload.userId;
  console.log(userId);

  const user = users.find((item) => item.userId === userId);

  if (user) {
    console.log(users);

    console.log(`Balance for ${userId}: ${user.balance}`);

    try {
      await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
        function: "getBalance",
        message: user.balance,
      });
    } catch (error) {
      await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
        function: "getBalance",
        message: (user.balance = 0),
      });
    }
    console.log(user.balance / 100, "maybe");
  } else {
    console.log(users);
    console.log(`User ${userId} not found ❌`);
    return null;
  }
}

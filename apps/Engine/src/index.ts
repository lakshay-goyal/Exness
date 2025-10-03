import { config, redisStreams, constant } from "@repo/config";
import { tradeFunction } from "./functions/tradeFunction.js";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

// Continuously consume next messages and dispatch to tradeFunction
while (true) {
  const result = await RedisStreams.readNextFromRedisStream(
    constant.redisStream,
    0
  );
  if (result) {
    await tradeFunction(result);
  }
}
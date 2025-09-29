import { config, redisStreams, constant } from "@repo/config";
import { tradeFunction } from "./functions/tradeFunction.js";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

await RedisStreams.readRedisStream(
  constant.redisStream,
  tradeFunction
);
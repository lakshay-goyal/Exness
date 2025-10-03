import { config, redisStreams, constant } from "@repo/config";
import { dbStorageFunction } from "./functions/dbStorageFunction.js";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

await RedisStreams.readRedisStream(constant.dbStorageStream, dbStorageFunction);

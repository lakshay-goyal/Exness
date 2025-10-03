import { config, redisStreams } from "@repo/config";
import { createUserFunction } from "./createUser.js";
import { getBalanceFunction } from "./getBalance.js";
import { createOrderFunction } from "./createOrder.js";
import { getOpenOrderFunction } from "./getOpenOrder.js";
import { createCloseOrderFunction } from "./createCloseOrder.js";
import { pricePollerFunction } from "./pricePoller.js";

const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function tradeFunction(result: any) {
  console.log(result.function, "trade function payload");

  if (result.function === "createCloseOrder") {
    await createCloseOrderFunction(result);
  }
  if (result.function === "createUser") {
    await createUserFunction(result);
  }
  if (result.function === "getBalance") {
    await getBalanceFunction(result);
  }
  if (result.function === "createOrder") {
    await createOrderFunction(result);
  }
  if (result.function === "getOpenOrder") {
    await getOpenOrderFunction(result);
  }
  if (result.function === "pricePoller") {
    pricePollerFunction(result);
  }

}

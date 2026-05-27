import { redisStreams, config, constant } from "@repo/config";
import { users } from "../data/users.js";
import { closeOrders } from "../data/orders.js";

const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function getCloseOrdersFunction(result: any) {
  console.log("getCloseOrdersFunction called with:", result);

  const requestId = result.requestId || result.correlationId;

  if (!users.some((user: any) => user.userId === result.userId)) {
    await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
      function: "getCloseOrders",
      message: JSON.stringify([]),
      requestId,
      correlationId: requestId,
    });
    return;
  }

  const userCloseOrders = closeOrders
    .filter((order) => order.userId === result.userId)
    .map((order) => ({
      ...order,
      status: "closed",
    }));

  await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
    function: "getCloseOrders",
    message: JSON.stringify(userCloseOrders),
    requestId,
    correlationId: requestId,
  });
}

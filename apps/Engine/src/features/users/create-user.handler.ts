import { users } from "../state/users.js";
import { closeOrders, openOrders } from "../state/orders.js";
import { redisStreams, config, constant } from "@repo/config";

const INITIAL_USER_BALANCE = 500000;

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function createUserFunction(result: any) {
  let user = users.find(
    (u) => u.userId === result.userId || u.userEmail === result.userEmail,
  );

  if (!user) {
    const newUser = {
      userId: result.userId,
      userEmail: result.userEmail,
      balance: INITIAL_USER_BALANCE,
    };

    users.push(newUser);
  } else {
    if (user.userId !== result.userId) {
      const previousUserId = user.userId;
      user.userId = result.userId;
      openOrders.forEach((order) => {
        if (order.userId === previousUserId) order.userId = result.userId;
      });
      closeOrders.forEach((order) => {
        if (order.userId === previousUserId) order.userId = result.userId;
      });
    }
    if (user.userEmail !== result.userEmail) {
      user.userEmail = result.userEmail;
    }
  }

  await RedisStreams.addToRedisStream(constant.dbStorageStream, {
    function: "createUser",
    message: result,
  });

  await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
    function: "createUser",
    message: result.userId,
    requestId: result.requestId || result.correlationId, // Pass through correlation ID
    correlationId: result.requestId || result.correlationId,
  });
}

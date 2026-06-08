import type { CreateUserCommand } from '@repo/types';
import { users } from '../state/users.js';
import { closeOrders, openOrders } from '../state/orders.js';
import { redisStreams, config, REDIS_STREAMS, DEFAULTS } from '@repo/config';

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function createUserFunction(result: CreateUserCommand) {
  let user = users.find((u) => u.userId === result.userId || u.userEmail === result.userEmail);

  if (!user) {
    const newUser = {
      userId: result.userId,
      userEmail: result.userEmail,
      balance: DEFAULTS.INITIAL_USER_BALANCE,
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

  await RedisStreams.addToRedisStream(REDIS_STREAMS.DB_STORAGE, {
    function: 'createUser',
    message: result,
  });

  await RedisStreams.addToRedisStream(REDIS_STREAMS.EXNESS_RECEIVE, {
    function: 'createUser',
    message: result.userId,
    requestId: result.requestId || result.correlationId, // Pass through correlation ID
    correlationId: result.requestId || result.correlationId,
  });
}

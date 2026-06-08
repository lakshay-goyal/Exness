import { users } from '../state/users.js';
import { openOrders } from '../state/orders.js';
import { prices } from '../state/prices.js';
import { redisStreams, config, constant } from '@repo/config';
import { orderCalculator, priceNormalizer } from '@repo/trading-core';

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function getOpenOrderFunction(result: any) {
  // Check if a user with the same userId already exists
  if (users.some((user: any) => user.userId === result.userId)) {
    // Filter open orders for this user
    const userOpenOrders = openOrders.filter((order) => order.userId === result.userId);

    // Enhance each order with current price from prices data
    const enhancedOrders = userOpenOrders.map((order) => {
      const priceData = priceNormalizer.findPriceForSymbol(prices, order.symbol);
      const currentPrice = orderCalculator.getCurrentOpenOrderPrice(order, priceData);

      return {
        ...order,
        currentPrice,
        status: 'open',
      };
    });

    const requestId = result.requestId || result.correlationId;
    await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
      function: 'getOpenOrder',
      message: JSON.stringify(enhancedOrders),
      requestId: requestId,
      correlationId: requestId,
    });
    return;
  } else {
    const requestId = result.requestId || result.correlationId;
    await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
      function: 'getOpenOrder',
      message: JSON.stringify([]),
      requestId: requestId,
      correlationId: requestId,
    });
    return;
  }
}

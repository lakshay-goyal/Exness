import { redisStreams, config, REDIS_STREAMS, DEFAULTS } from '@repo/config';
import { prisma } from '@repo/db';

// Lazy initialization of Redis streams for sending responses
let RedisStreamsInstance: ReturnType<typeof redisStreams> | null = null;

const getRedisStreams = async (): Promise<ReturnType<typeof redisStreams>> => {
  if (RedisStreamsInstance === null) {
    RedisStreamsInstance = redisStreams(config.REDIS_URL);
    await RedisStreamsInstance.connect();
  }
  return RedisStreamsInstance;
};

export interface StreamData {
  function?: string;
  message?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

export const dbStorageFunction = async (result: StreamData): Promise<void> => {
  if (result.function === 'createCloseOrder') {
    const orderData = result?.message;

    if (orderData === undefined) {
      console.error('createCloseOrder: Missing order data', result);
      return;
    }

    const { userId } = orderData;
    if (userId === undefined || userId === null) {
      console.error('createCloseOrder: Missing userId', orderData);
      return;
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({ where: { userID: String(userId) } });
    if (user === null) {
      console.error('createCloseOrder aborted: user not found', userId);
      return;
    }

    try {
      // Prepare order data matching Prisma schema
      // Ensure symbol is lowercase to match enum (btc, sol, eth)
      const symbol = (orderData.symbol as string | undefined)?.toLowerCase();
      if (symbol === undefined || !['btc', 'sol', 'eth'].includes(symbol)) {
        console.error('createCloseOrder: Invalid symbol', orderData.symbol);
        return;
      }

      // Ensure type is lowercase to match OrderSide enum (buy, sell)
      const type = (orderData.type as string | undefined)?.toLowerCase();
      if (type === undefined || !['buy', 'sell'].includes(type)) {
        console.error('createCloseOrder: Invalid type', orderData.type);
        return;
      }

      // Convert Date objects to proper DateTime if needed
      const openTime =
        orderData.openTime instanceof Date ? orderData.openTime : new Date(orderData.openTime as string);
      const closeTime =
        orderData.closeTime instanceof Date ? orderData.closeTime : new Date(orderData.closeTime as string);

      // Create order in database
      await prisma.orders.create({
        data: {
          orderId: String(orderData.orderId),
          userId: String(userId),
          symbol: symbol as 'btc' | 'sol' | 'eth',
          type: type as 'buy' | 'sell',
          quantity: parseFloat(String(orderData.quantity)) || 0,
          leverage: parseInt(String(orderData.leverage), 10) || 1,
          takeProfit: orderData.takeProfit ? parseFloat(String(orderData.takeProfit)) : null,
          stopLoss: orderData.stopLoss ? parseFloat(String(orderData.stopLoss)) : null,
          stippage: orderData.stippage ? parseFloat(String(orderData.stippage)) : null,
          openPrice: parseFloat(String(orderData.openPrice)) || 0,
          closePrice: parseFloat(String(orderData.closePrice)) || 0,
          openTime: openTime,
          closeTime: closeTime,
          profitLoss: parseFloat(String(orderData.profitLoss)) || 0,
          closeReason: String(orderData.closeReason || 'manual'),
        },
      });
    } catch (error) {
      console.error('createCloseOrder: Error saving to database', error);
      console.error('Failed order data:', orderData);
    }
  }

  if (result.function === 'getCloseOrders') {
    // Extract userId from result - it could be at top level or in message
    const userId = result?.userId || result?.message;
    const requestId = result.requestId || result.correlationId;

    if (userId === undefined || userId === null) {
      console.error('getCloseOrders: Missing userId');
      try {
        const RedisStreams = await getRedisStreams();
        await RedisStreams.addToRedisStream(REDIS_STREAMS.EXNESS_RECEIVE, {
          function: 'getCloseOrders',
          message: JSON.stringify([]),
          requestId,
          correlationId: requestId,
        });
      } catch (error) {
        console.error('Error sending error response:', error);
      }
      return;
    }

    try {
      const RedisStreams = await getRedisStreams();

      // Fetch all closed orders for the user
      // Closed orders are stored in the database (open orders are in memory)
      const closeOrders = await prisma.orders.findMany({
        where: {
          userId: String(userId),
        },
        orderBy: {
          closeTime: 'desc',
        },
      });

      // Format the response to match frontend expectations
      const formattedCloseOrders = closeOrders.map((order: Record<string, unknown>) => ({
        orderId: String(order.orderId ?? order.id),
        symbol: order.symbol,
        type: order.type,
        quantity: order.quantity,
        openPrice: order.openPrice,
        closePrice: order.closePrice,
        openTime: order.openTime instanceof Date ? order.openTime.toISOString() : order.openTime,
        closeTime: order.closeTime instanceof Date ? order.closeTime.toISOString() : order.closeTime,
        profitLoss: order.profitLoss ?? 0,
        takeProfit: order.takeProfit ?? null,
        stopLoss: order.stopLoss ?? null,
        closeReason: order.closeReason ?? 'manual',
        status: 'closed',
      }));

      await RedisStreams.addToRedisStream(REDIS_STREAMS.EXNESS_RECEIVE, {
        function: 'getCloseOrders',
        message: JSON.stringify(formattedCloseOrders),
        requestId,
        correlationId: requestId,
      });
    } catch (error) {
      console.error('Error fetching closeOrders:', error);
      const RedisStreams = await getRedisStreams();
      await RedisStreams.addToRedisStream(REDIS_STREAMS.EXNESS_RECEIVE, {
        function: 'getCloseOrders',
        message: JSON.stringify([]),
        requestId,
        correlationId: requestId,
      });
    }
  }

  if (result.function === 'createUser') {
    const { userId, userEmail } = result.message || {};
    if (userId !== undefined && userId !== null && userEmail !== undefined && userEmail !== null) {
      try {
        // First, check if user exists by email
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: String(userEmail) },
        });

        if (existingUserByEmail !== null) {
          // User already exists with this email, update the userID if different
          if (existingUserByEmail.userID !== String(userId)) {
            await prisma.user.update({
              where: { email: String(userEmail) },
              data: { userID: String(userId) },
            });
          }
        } else {
          // Check if userID already exists
          const existingUserByID = await prisma.user.findUnique({
            where: { userID: String(userId) },
          });

          if (existingUserByID !== null) {
            // Update email for existing userID
            await prisma.user.update({
              where: { userID: String(userId) },
              data: { email: String(userEmail) },
            });
          } else {
            // Create new user
            await prisma.user.create({
              data: {
                userID: String(userId),
                email: String(userEmail),
                balance: DEFAULTS.INITIAL_USER_BALANCE,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error in createUser:', error);
        // If there's still a conflict, try to find and update existing user
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [{ email: String(userEmail) }, { userID: String(userId) }],
          },
        });

        if (existingUser !== null) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { userID: String(userId), email: String(userEmail) },
          });
        }
      }
    }
  }
};

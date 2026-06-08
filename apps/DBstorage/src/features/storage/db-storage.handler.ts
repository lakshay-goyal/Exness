import { redisStreams, config, REDIS_STREAMS, DEFAULTS } from '@repo/config';
import { prisma } from '@repo/db';

// Lazy initialization of Redis streams for sending responses
let RedisStreamsInstance: ReturnType<typeof redisStreams> | null = null;

async function getRedisStreams() {
  if (!RedisStreamsInstance) {
    RedisStreamsInstance = redisStreams(config.REDIS_URL);
    await RedisStreamsInstance.connect();
  }
  return RedisStreamsInstance;
}

export async function dbStorageFunction(result: any) {
  if (result.function === 'createCloseOrder') {
    const orderData = result?.message;

    if (!orderData) {
      console.error('createCloseOrder: Missing order data', result);
      return;
    }

    const userId = orderData.userId;
    if (!userId) {
      console.error('createCloseOrder: Missing userId', orderData);
      return;
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({ where: { userID: userId } });
    if (!user) {
      console.error('createCloseOrder aborted: user not found', userId);
      return;
    }

    try {
      // Prepare order data matching Prisma schema
      // Ensure symbol is lowercase to match enum (btc, sol, eth)
      const symbol = orderData.symbol?.toLowerCase();
      if (!symbol || !['btc', 'sol', 'eth'].includes(symbol)) {
        console.error('createCloseOrder: Invalid symbol', orderData.symbol);
        return;
      }

      // Ensure type is lowercase to match OrderSide enum (buy, sell)
      const type = orderData.type?.toLowerCase();
      if (!type || !['buy', 'sell'].includes(type)) {
        console.error('createCloseOrder: Invalid type', orderData.type);
        return;
      }

      // Convert Date objects to proper DateTime if needed
      const openTime =
        orderData.openTime instanceof Date ? orderData.openTime : new Date(orderData.openTime);
      const closeTime =
        orderData.closeTime instanceof Date ? orderData.closeTime : new Date(orderData.closeTime);

      // Create order in database
      const createdOrder = await prisma.orders.create({
        data: {
          orderId: orderData.orderId,
          userId: userId,
          symbol: symbol as 'btc' | 'sol' | 'eth',
          type: type as 'buy' | 'sell',
          quantity: parseFloat(orderData.quantity) || 0,
          leverage: parseInt(orderData.leverage) || 1,
          takeProfit: orderData.takeProfit ? parseFloat(orderData.takeProfit) : null,
          stopLoss: orderData.stopLoss ? parseFloat(orderData.stopLoss) : null,
          stippage: orderData.stippage ? parseFloat(orderData.stippage) : null,
          openPrice: parseFloat(orderData.openPrice) || 0,
          closePrice: parseFloat(orderData.closePrice) || 0,
          openTime: openTime,
          closeTime: closeTime,
          profitLoss: parseFloat(orderData.profitLoss) || 0,
          closeReason: orderData.closeReason || 'manual',
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

    if (!userId) {
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
          userId: userId,
        },
        orderBy: {
          closeTime: 'desc',
        },
      });

      // Format the response to match frontend expectations
      const formattedCloseOrders = closeOrders.map((order: any) => ({
        orderId: order.orderId || order.id,
        symbol: order.symbol,
        type: order.type,
        quantity: order.quantity,
        openPrice: order.openPrice,
        closePrice: order.closePrice,
        openTime: order.openTime?.toISOString() || order.openTime,
        closeTime: order.closeTime?.toISOString() || order.closeTime,
        profitLoss: order.profitLoss || 0,
        takeProfit: order.takeProfit ?? null,
        stopLoss: order.stopLoss ?? null,
        closeReason: order.closeReason || 'manual',
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
    if (userId && userEmail) {
      try {
        // First, check if user exists by email
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: userEmail },
        });

        if (existingUserByEmail) {
          // User already exists with this email, update the userID if different
          if (existingUserByEmail.userID !== userId) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { userID: userId },
            });
          } else {
          }
        } else {
          // Check if userID already exists
          const existingUserByID = await prisma.user.findUnique({
            where: { userID: userId },
          });

          if (existingUserByID) {
            // Update email for existing userID
            await prisma.user.update({
              where: { userID: userId },
              data: { email: userEmail },
            });
          } else {
            // Create new user
            await prisma.user.create({
              data: {
                userID: userId,
                email: userEmail,
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
            OR: [{ email: userEmail }, { userID: userId }],
          },
        });

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { userID: userId, email: userEmail },
          });
        }
      }
    } else {
    }
  }
}

import { redisStreams, config, constant } from "@repo/config";
import { prisma } from "@repo/db";

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
  console.log("dbStorageFunction called with:", result);
  
  if (result.function === "createCloseOrder") {
    console.log("createCloseOrder", result.message);
    const userId = result?.message?.userId;
    if (!userId) {
      console.log("createCloseOrder missing userId", result.message);
      return;
    }
    
    const user = await prisma.user.findUnique({ where: { userID: userId } });
    if (!user) {
      console.log("createCloseOrder aborted: user not found", userId);
      return;
    }
    await prisma.orders.create({ data: { ...result.message } });
    console.log("createCloseOrder created", result.message);
  }
  
  if (result.function === "getCloseOrders") {
    console.log("getCloseOrders", result.message);
    const userId = result?.userId || result?.message?.userId;
    
    try {
      const RedisStreams = await getRedisStreams();
      
      if (!userId) {
        await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
          function: "getCloseOrders",
          message: JSON.stringify({ error: "Missing userId" }),
        });
        return;
      }
      
      // Fetch all closed orders for the user
      // Closed orders are stored in the database (open orders are in memory)
      const closeOrders = await prisma.orders.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          closeTime: "desc",
        },
      });
      
      console.log(`Found ${closeOrders.length} closed orders for user ${userId}`);
      
      await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
        function: "getCloseOrders",
        message: JSON.stringify(closeOrders),
      });
    } catch (error) {
      console.error("Error fetching closeOrders:", error);
      const RedisStreams = await getRedisStreams();
      await RedisStreams.addToRedisStream(constant.secondaryRedisStream, {
        function: "getCloseOrders",
        message: JSON.stringify({ error: "Failed to fetch closeOrders" }),
      });
    }
  }
  
  if (result.function === "createUser") {
    const { userId, userEmail } = result.message || {};
    if (userId && userEmail) {
      console.log("createUser upserted 1 : ", { userId, userEmail });
      
      try {
        // First, check if user exists by email
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: userEmail }
        });
        
        if (existingUserByEmail) {
          // User already exists with this email, update the userID if different
          if (existingUserByEmail.userID !== userId) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { userID: userId }
            });
            console.log("Updated existing user's userID", { userId, userEmail });
          } else {
            console.log("User already exists with same userID", { userId, userEmail });
          }
        } else {
          // Check if userID already exists
          const existingUserByID = await prisma.user.findUnique({
            where: { userID: userId }
          });
          
          if (existingUserByID) {
            // Update email for existing userID
            await prisma.user.update({
              where: { userID: userId },
              data: { email: userEmail }
            });
            console.log("Updated existing user's email", { userId, userEmail });
          } else {
            // Create new user
            await prisma.user.create({
              data: { userID: userId, email: userEmail }
            });
            console.log("Created new user", { userId, userEmail });
          }
        }
      } catch (error) {
        console.error("Error in createUser:", error);
        // If there's still a conflict, try to find and update existing user
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: userEmail },
              { userID: userId }
            ]
          }
        });
        
        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { userID: userId, email: userEmail }
          });
          console.log("Updated existing user to resolve conflict", { userId, userEmail });
        }
      }
    } else {
      console.log("createUser missing fields", result.message);
    }
  }
}


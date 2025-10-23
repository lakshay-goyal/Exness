import { redisStreams, config, constant } from "@repo/config";
import { prisma } from "@repo/db";

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


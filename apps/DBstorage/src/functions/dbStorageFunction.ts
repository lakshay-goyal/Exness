import { redisStreams, config, constant } from "@repo/config";
import { prisma } from "@repo/db";

export async function dbStorageFunction(result: any) {
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
      await prisma.user.upsert({
        where: { userID: userId },
        update: { email: userEmail },
        create: { userID: userId, email: userEmail },
      });
      console.log("createUser upserted", { userId, userEmail });
    } else {
      console.log("createUser missing fields", result.message);
    }
  }
}


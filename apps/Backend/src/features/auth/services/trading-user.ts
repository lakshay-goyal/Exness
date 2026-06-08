import { prisma } from '@repo/db';

export async function ensureTradingUser(userId: string, email: string) {
  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    return existingByEmail;
  }

  const existingByUserId = await prisma.user.findUnique({
    where: { userID: userId },
  });

  if (existingByUserId) {
    if (existingByUserId.email !== email) {
      return prisma.user.update({
        where: { userID: userId },
        data: { email },
      });
    }

    return existingByUserId;
  }

  return prisma.user.create({
    data: {
      userID: userId,
      email,
    },
  });
}

import { prisma } from "@repo/db";

class BalanceService {
  async getBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { userID: userId },
    });

    if (!user) {
      return { ok: false as const, error: "User not found" };
    }

    const balance = (user as { balance?: number }).balance ?? 0;

    return {
      ok: true as const,
      data: {
        status: "success",
        message: balance,
      },
    };
  }
}

export const balanceService = new BalanceService();

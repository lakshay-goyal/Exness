import { PrismaClient } from '../generated/prisma';
import { withAccelerate } from '@prisma/extension-accelerate';

interface GlobalWithPrisma {
  prisma: PrismaClient | undefined;
}

const globalForPrisma = global as unknown as GlobalWithPrisma;

const createPrismaClient = (): PrismaClient => new PrismaClient().$extends(withAccelerate()) as unknown as PrismaClient;

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

const nodeEnv = process.env.NODE_ENV;
if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

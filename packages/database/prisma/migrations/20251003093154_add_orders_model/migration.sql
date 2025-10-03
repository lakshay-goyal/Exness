-- CreateEnum
CREATE TYPE "public"."Symbol" AS ENUM ('btc', 'sol', 'eth');

-- CreateEnum
CREATE TYPE "public"."OrderSide" AS ENUM ('buy', 'sell');

-- CreateTable
CREATE TABLE "public"."Orders" (
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" "public"."Symbol" NOT NULL,
    "type" "public"."OrderSide" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "leverage" INTEGER NOT NULL,
    "takeProfit" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "stippage" DOUBLE PRECISION,
    "openPrice" DOUBLE PRECISION NOT NULL,
    "closePrice" DOUBLE PRECISION NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "profitLoss" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("orderId")
);

-- CreateIndex
CREATE INDEX "Orders_userId_idx" ON "public"."Orders"("userId");

-- AddForeignKey
ALTER TABLE "public"."Orders" ADD CONSTRAINT "Orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

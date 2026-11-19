-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('buy', 'sell');

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "tradingAccountId" TEXT NOT NULL,
    "tradingInstrumentId" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "fee" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trade_tradingAccountId_executedAt_idx" ON "Trade"("tradingAccountId", "executedAt");

-- CreateIndex
CREATE INDEX "Trade_tradingInstrumentId_idx" ON "Trade"("tradingInstrumentId");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "TradingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_tradingInstrumentId_fkey" FOREIGN KEY ("tradingInstrumentId") REFERENCES "TradingInstrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


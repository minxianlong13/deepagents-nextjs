-- CreateEnum
CREATE TYPE "TradingEarningKind" AS ENUM ('stock_lending');

-- CreateTable
CREATE TABLE "TradingEarning" (
    "id" TEXT NOT NULL,
    "tradingAccountId" TEXT NOT NULL,
    "kind" "TradingEarningKind" NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "tradingInstrumentId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradingEarning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradingEarning_tradingAccountId_receivedAt_idx" ON "TradingEarning"("tradingAccountId", "receivedAt");

-- CreateIndex
CREATE INDEX "TradingEarning_tradingInstrumentId_idx" ON "TradingEarning"("tradingInstrumentId");

-- AddForeignKey
ALTER TABLE "TradingEarning" ADD CONSTRAINT "TradingEarning_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "TradingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradingEarning" ADD CONSTRAINT "TradingEarning_tradingInstrumentId_fkey" FOREIGN KEY ("tradingInstrumentId") REFERENCES "TradingInstrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


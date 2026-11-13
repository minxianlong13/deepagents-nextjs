-- CreateEnum
CREATE TYPE "TradingBroker" AS ENUM ('wealthsimple', 'ibkr');

-- CreateEnum
CREATE TYPE "TradingAccountType" AS ENUM ('non_registered');

-- CreateEnum
CREATE TYPE "TradingInstrumentType" AS ENUM ('stock', 'etf');

-- CreateTable
CREATE TABLE "TradingAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "broker" "TradingBroker" NOT NULL,
    "accountType" "TradingAccountType" NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "initialFund" DECIMAL(20,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradingInstrument" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instrumentType" "TradingInstrumentType" NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingInstrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "tradingAccountId" TEXT NOT NULL,
    "tradingInstrumentId" TEXT NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "averageCost" DECIMAL(20,8) NOT NULL,
    "currentPrice" DECIMAL(20,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradingAccount_broker_accountType_idx"
    ON "TradingAccount"("broker", "accountType");

-- CreateIndex
CREATE UNIQUE INDEX "TradingInstrument_symbol_currency_key"
    ON "TradingInstrument"("symbol", "currency");

-- CreateIndex
CREATE INDEX "TradingInstrument_isActive_idx"
    ON "TradingInstrument"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Position_tradingAccountId_tradingInstrumentId_key"
    ON "Position"("tradingAccountId", "tradingInstrumentId");

-- CreateIndex
CREATE INDEX "Position_tradingInstrumentId_idx"
    ON "Position"("tradingInstrumentId");

-- AddForeignKey
ALTER TABLE "Position"
    ADD CONSTRAINT "Position_tradingAccountId_fkey"
    FOREIGN KEY ("tradingAccountId") REFERENCES "TradingAccount"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position"
    ADD CONSTRAINT "Position_tradingInstrumentId_fkey"
    FOREIGN KEY ("tradingInstrumentId") REFERENCES "TradingInstrument"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

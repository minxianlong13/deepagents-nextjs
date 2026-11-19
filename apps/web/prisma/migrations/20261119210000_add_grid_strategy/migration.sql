-- CreateEnum
CREATE TYPE "GridSpacingMode" AS ENUM ('percent', 'amount');

-- CreateEnum
CREATE TYPE "GridSizingMode" AS ENUM ('shares', 'amount');

-- CreateTable
CREATE TABLE "GridStrategy" (
    "id" TEXT NOT NULL,
    "tradingAccountId" TEXT NOT NULL,
    "tradingInstrumentId" TEXT NOT NULL,
    "anchorPrice" DECIMAL(20,8) NOT NULL,
    "spacingMode" "GridSpacingMode" NOT NULL,
    "stepValue" DECIMAL(20,8) NOT NULL,
    "sizingMode" "GridSizingMode" NOT NULL,
    "sizeValue" DECIMAL(20,8) NOT NULL,
    "levelsPerSide" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GridStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GridStrategy_tradingInstrumentId_idx" ON "GridStrategy"("tradingInstrumentId");

-- CreateIndex
CREATE UNIQUE INDEX "GridStrategy_tradingAccountId_tradingInstrumentId_key" ON "GridStrategy"("tradingAccountId", "tradingInstrumentId");

-- AddForeignKey
ALTER TABLE "GridStrategy" ADD CONSTRAINT "GridStrategy_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "TradingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GridStrategy" ADD CONSTRAINT "GridStrategy_tradingInstrumentId_fkey" FOREIGN KEY ("tradingInstrumentId") REFERENCES "TradingInstrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


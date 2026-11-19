import type { TradingAccountReadRepositories } from "../application/get-trading-account";
import type { TradeRepositories } from "../application/execute-trade";
import type { PriceQuoteProvider, PriceRefreshRepositories } from "../application/refresh-position-prices";
import type { EarningRepositories } from "../application/record-earning";
import { PrismaEarningRepository } from "./repositories/prisma-earning-repository";
import { PrismaPositionPriceRepository } from "./repositories/prisma-position-price-repository";
import { PrismaPositionRepository } from "./repositories/prisma-position-repository";
import { PrismaPositionWriteRepository } from "./repositories/prisma-position-write-repository";
import { PrismaTradeRepository } from "./repositories/prisma-trade-repository";
import { PrismaTradingAccountRepository } from "./repositories/prisma-trading-account-repository";
import { PrismaTradingInstrumentRepository } from "./repositories/prisma-trading-instrument-repository";
import type { GridReportRepositories } from "../application/grid-report";
import type { DailyBarProvider } from "../application/repositories";
import { EodhdDailyBarProvider } from "./eodhd-daily-bar-provider";
import { EodhdQuoteProvider } from "./eodhd-quote-provider";
import { PrismaGridStrategyRepository } from "./repositories/prisma-grid-strategy-repository";

export { EodhdMarketData } from "./eodhd-market-data";
export type { EodhdMarketDataOptions, EtfDailyPrices, HistoricalDailyPrice, MarketDataSymbol, RealTimeQuote } from "./eodhd-market-data";

export function createPrismaTradingRepositories(): TradingAccountReadRepositories & {
  instruments: PrismaTradingInstrumentRepository;
} {
  return {
    accounts: new PrismaTradingAccountRepository(),
    instruments: new PrismaTradingInstrumentRepository(),
    positions: new PrismaPositionRepository(),
    trades: new PrismaTradeRepository(),
    earnings: new PrismaEarningRepository(),
  };
}

export function createPrismaTradeRepositories(): TradeRepositories {
  return {
    accounts: new PrismaTradingAccountRepository(),
    instruments: new PrismaTradingInstrumentRepository(),
    positionWrites: new PrismaPositionWriteRepository(),
  };
}

export function createPrismaPriceRefreshRepositories(): PriceRefreshRepositories {
  return {
    accounts: new PrismaTradingAccountRepository(),
    instruments: new PrismaTradingInstrumentRepository(),
    positions: new PrismaPositionRepository(),
    positionPrices: new PrismaPositionPriceRepository(),
  };
}

/** Default provider for refreshing holding prices: EODHD's latest daily close. */
export function createMarketQuoteProvider(): PriceQuoteProvider {
  return new EodhdQuoteProvider();
}

export function createPrismaEarningRepositories(): EarningRepositories {
  return {
    accounts: new PrismaTradingAccountRepository(),
    instruments: new PrismaTradingInstrumentRepository(),
    earnings: new PrismaEarningRepository(),
  };
}

export function createPrismaGridReportRepositories(): GridReportRepositories {
  return { ...createPrismaTradingRepositories(), grids: new PrismaGridStrategyRepository() };
}

/** Latest session bar for grid reports: EODHD's official daily bar, or the live day bar when newer. */
export function createDailyBarProvider(): DailyBarProvider {
  return new EodhdDailyBarProvider();
}

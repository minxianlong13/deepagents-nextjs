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
import { SearchAgentQuoteProvider } from "./search-agent-quote-provider";

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

export function createSearchAgentQuoteProvider(): PriceQuoteProvider {
  return new SearchAgentQuoteProvider();
}

export function createPrismaEarningRepositories(): EarningRepositories {
  return {
    accounts: new PrismaTradingAccountRepository(),
    instruments: new PrismaTradingInstrumentRepository(),
    earnings: new PrismaEarningRepository(),
  };
}

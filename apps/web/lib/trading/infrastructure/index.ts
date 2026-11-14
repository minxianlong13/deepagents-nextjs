import type { TradingAccountReadRepositories } from "../application/get-trading-account";
import { PrismaPositionRepository } from "./repositories/prisma-position-repository";
import { PrismaTradingAccountRepository } from "./repositories/prisma-trading-account-repository";
import { PrismaTradingInstrumentRepository } from "./repositories/prisma-trading-instrument-repository";

export function createPrismaTradingRepositories(): TradingAccountReadRepositories {
  return {
    accounts: new PrismaTradingAccountRepository(),
    instruments: new PrismaTradingInstrumentRepository(),
    positions: new PrismaPositionRepository(),
  };
}

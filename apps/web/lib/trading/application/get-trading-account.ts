import { calculateAccountTotals, calculatePositionValues, validatePosition } from "../domain";
import type {
  PositionRepository,
  TradingAccountRepository,
  TradingInstrumentRepository,
} from "./repositories";

export interface TradingAccountDetails {
  id: string;
  name: string;
  broker: string;
  accountType: string;
  currency: string;
  initialFund: string;
  positions: Array<{
    id: string;
    instrumentId: string;
    symbol: string;
    instrumentName: string;
    instrumentType: string;
    quantity: string;
    averageCost: string;
    currentPrice: string | null;
    costBasis: string;
    marketValue: string | null;
    unrealizedReturn: string | null;
    unrealizedReturnPercent: string | null;
  }>;
  totalCostBasis: string;
  totalMarketValue: string | null;
  totalUnrealizedReturn: string | null;
}

export interface TradingAccountReadRepositories {
  accounts: TradingAccountRepository;
  instruments: TradingInstrumentRepository;
  positions: PositionRepository;
}

export async function getTradingAccounts(
  repositories: Pick<TradingAccountReadRepositories, "accounts">,
) {
  return repositories.accounts.findAll();
}

export async function getTradingAccount(
  accountId: string,
  repositories: TradingAccountReadRepositories,
): Promise<TradingAccountDetails | null> {
  const account = await repositories.accounts.findById(accountId);
  if (!account) return null;

  const positions = await repositories.positions.findByAccountId(account.id);
  const instruments = await repositories.instruments.findByIds(
    [...new Set(positions.map((position) => position.tradingInstrumentId))],
  );
  const instrumentsById = new Map(instruments.map((instrument) => [instrument.id, instrument]));

  const details = positions.map((position) => {
    const instrument = instrumentsById.get(position.tradingInstrumentId);
    if (!instrument) {
      throw new Error(`Trading instrument ${position.tradingInstrumentId} for position ${position.id} was not found`);
    }

    validatePosition({
      accountId: account.id,
      accountCurrency: account.currency,
      instrumentId: instrument.id,
      instrumentCurrency: instrument.currency,
      positionAccountId: position.tradingAccountId,
      positionInstrumentId: position.tradingInstrumentId,
      quantity: position.quantity,
      averageCost: position.averageCost,
    });

    const values = calculatePositionValues(position);
    return {
      id: position.id,
      instrumentId: instrument.id,
      symbol: instrument.symbol,
      instrumentName: instrument.name,
      instrumentType: instrument.instrumentType,
      quantity: position.quantity,
      averageCost: position.averageCost,
      currentPrice: position.currentPrice,
      costBasis: values.costBasis.toString(),
      marketValue: values.marketValue?.toString() ?? null,
      unrealizedReturn: values.unrealizedReturn?.toString() ?? null,
      unrealizedReturnPercent: values.unrealizedReturnPercent?.toString() ?? null,
    };
  });
  const totals = calculateAccountTotals(positions);

  return {
    id: account.id,
    name: account.name,
    broker: account.broker,
    accountType: account.accountType,
    currency: account.currency,
    initialFund: account.initialFund,
    positions: details,
    totalCostBasis: totals.totalCostBasis.toString(),
    totalMarketValue: totals.totalMarketValue?.toString() ?? null,
    totalUnrealizedReturn: totals.totalUnrealizedReturn?.toString() ?? null,
  };
}

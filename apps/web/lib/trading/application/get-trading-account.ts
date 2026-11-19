import { calculateAccountTotals, calculatePositionValues, decimal, sumDecimals, summarizeTradeLedger, validatePosition } from "../domain";
import type {
  EarningRepository,
  PositionRepository,
  TradeRepository,
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
  /** Initial fund plus net cash from trades (sell proceeds − buy costs, after fees) plus earnings. */
  cashBalance: string;
  /** Cash plus holdings market value; null while any holding has no current price. */
  totalFund: string | null;
  /** Total fund minus initial fund; null when total fund is unavailable. */
  totalReturn: string | null;
  realizedReturn: string;
  /** Income outside of trades, such as stock lending. Included in cash and total fund. */
  totalEarnings: string;
  totalFees: string;
  tradeCount: number;
  /** Every trade in the account, newest execution first. */
  trades: Array<{
    id: string;
    instrumentId: string;
    symbol: string;
    instrumentName: string;
    side: "buy" | "sell";
    quantity: string;
    price: string;
    fee: string;
    executedAt: string;
    cashFlow: string;
    realizedReturn: string | null;
    quantityAfter: string;
    averageCostAfter: string | null;
  }>;
  /** Earnings entries, most recently received first. */
  earnings: Array<{
    id: string;
    kind: string;
    amount: string;
    instrumentId: string | null;
    symbol: string | null;
    receivedAt: string;
    note: string | null;
  }>;
}

export interface TradingAccountReadRepositories {
  accounts: TradingAccountRepository;
  instruments: TradingInstrumentRepository;
  positions: PositionRepository;
  trades: TradeRepository;
  earnings: Pick<EarningRepository, "findByAccountId">;
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
  const trades = await repositories.trades.findByAccountId(account.id);
  const earnings = await repositories.earnings.findByAccountId(account.id);
  const instruments = await repositories.instruments.findByIds([
    ...new Set([
      ...[...positions, ...trades].map((record) => record.tradingInstrumentId),
      ...earnings.flatMap((earning) => (earning.tradingInstrumentId ? [earning.tradingInstrumentId] : [])),
    ]),
  ]);
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
  const ledger = summarizeTradeLedger(trades.map((trade) => ({ ...trade, instrumentId: trade.tradingInstrumentId })));
  const totalEarnings = sumDecimals(earnings.map((earning) => decimal(earning.amount)));
  const cashBalance = decimal(account.initialFund).plus(ledger.netCashFlow).plus(totalEarnings);
  const totalFund = totals.totalMarketValue === null ? null : cashBalance.plus(totals.totalMarketValue);

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
    cashBalance: cashBalance.toString(),
    totalFund: totalFund?.toString() ?? null,
    totalReturn: totalFund?.minus(decimal(account.initialFund)).toString() ?? null,
    realizedReturn: ledger.realizedReturn.toString(),
    totalEarnings: totalEarnings.toString(),
    totalFees: ledger.totalFees.toString(),
    tradeCount: trades.length,
    trades: trades
      .map((trade, index) => {
        const entry = ledger.entries[index]!;
        const instrument = instrumentsById.get(trade.tradingInstrumentId);
        return {
          id: trade.id,
          instrumentId: trade.tradingInstrumentId,
          symbol: instrument?.symbol ?? trade.tradingInstrumentId,
          instrumentName: instrument?.name ?? "Unknown instrument",
          side: trade.side,
          quantity: trade.quantity,
          price: trade.price,
          fee: trade.fee,
          executedAt: trade.executedAt.toISOString(),
          cashFlow: entry.cashFlow.toString(),
          realizedReturn: entry.realizedReturn?.toString() ?? null,
          quantityAfter: entry.quantityAfter.toString(),
          averageCostAfter: entry.averageCostAfter?.toString() ?? null,
        };
      })
      .sort((a, b) => b.executedAt.localeCompare(a.executedAt)),
    earnings: earnings.map((earning) => ({
      id: earning.id,
      kind: earning.kind,
      amount: earning.amount,
      instrumentId: earning.tradingInstrumentId,
      symbol: earning.tradingInstrumentId ? (instrumentsById.get(earning.tradingInstrumentId)?.symbol ?? null) : null,
      receivedAt: earning.receivedAt.toISOString(),
      note: earning.note,
    })),
  };
}

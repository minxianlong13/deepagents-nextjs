import type { PositionChange, TradeSide } from "../domain";

export interface TradingAccountRecord {
  id: string;
  name: string;
  broker: string;
  accountType: string;
  currency: string;
  initialFund: string;
}

export interface TradingInstrumentRecord {
  id: string;
  symbol: string;
  name: string;
  instrumentType: string;
  currency: string;
  isActive: boolean;
}

export interface PositionRecord {
  id: string;
  tradingAccountId: string;
  tradingInstrumentId: string;
  quantity: string;
  averageCost: string;
  currentPrice: string | null;
}

export interface TradingAccountRepository {
  findById(id: string): Promise<TradingAccountRecord | null>;
  findAll(): Promise<TradingAccountRecord[]>;
}

export interface TradingInstrumentRepository {
  findByIds(ids: readonly string[]): Promise<TradingInstrumentRecord[]>;
}

export interface PositionRepository {
  findByAccountId(accountId: string): Promise<PositionRecord[]>;
}

export interface TradingInstrumentListRepository {
  findActiveByCurrency(currency: string): Promise<TradingInstrumentRecord[]>;
}

export interface TradeRecordInput {
  accountId: string;
  instrumentId: string;
  side: TradeSide;
  quantity: string;
  price: string;
  fee: string;
  executedAt: Date;
}

/**
 * Records a trade and updates the account's position for its instrument in one transaction.
 * The current position is read under a row lock and passed to `update`, which computes the change;
 * `update` may throw to abort without writing anything.
 */
export interface PositionWriteRepository {
  recordTrade(
    trade: TradeRecordInput,
    update: (current: PositionRecord | null) => PositionChange,
  ): Promise<void>;
}

export interface PositionPriceRepository {
  updateCurrentPrice(positionId: string, accountId: string, price: string): Promise<void>;
}

export interface TradeRecord {
  id: string;
  tradingInstrumentId: string;
  side: TradeSide;
  quantity: string;
  price: string;
  fee: string;
  executedAt: Date;
}

export interface TradeRepository {
  /** Trades in the order they were applied to positions (oldest recorded first). */
  findByAccountId(accountId: string): Promise<TradeRecord[]>;
}

export type EarningKind = "stock_lending";

export interface EarningRecord {
  id: string;
  kind: EarningKind;
  amount: string;
  tradingInstrumentId: string | null;
  receivedAt: Date;
  note: string | null;
}

export interface EarningRepository {
  /** Earnings for the account, most recently received first. */
  findByAccountId(accountId: string): Promise<EarningRecord[]>;
  create(input: Omit<EarningRecord, "id"> & { accountId: string }): Promise<void>;
}

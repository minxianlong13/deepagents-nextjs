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

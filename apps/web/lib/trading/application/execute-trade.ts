import { applyTrade, type TradeSide } from "../domain";
import type {
  PositionWriteRepository,
  TradingAccountRepository,
  TradingInstrumentRepository,
} from "./repositories";

export interface ExecuteTradeInput {
  accountId: string;
  instrumentId: string;
  side: TradeSide;
  quantity: string;
  price: string;
  /** Fees and commissions; defaults to 0. */
  fee?: string;
  /** When the trade was executed at the broker. */
  executedAt: Date;
}

/** Allowance for clock differences between the browser and the server. */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

export interface TradeRepositories {
  accounts: Pick<TradingAccountRepository, "findById">;
  instruments: Pick<TradingInstrumentRepository, "findByIds">;
  positionWrites: PositionWriteRepository;
}

export class TradeRejectedError extends Error {}

export async function executeTrade(
  input: ExecuteTradeInput,
  repositories: TradeRepositories,
  now: Date = new Date(),
): Promise<void> {
  if (Number.isNaN(input.executedAt.getTime())) throw new TradeRejectedError("Trade date and time is invalid");
  if (input.executedAt.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
    throw new TradeRejectedError("Trade date and time cannot be in the future");
  }

  const account = await repositories.accounts.findById(input.accountId);
  if (!account) throw new TradeRejectedError("Trading account was not found");

  const [instrument] = await repositories.instruments.findByIds([input.instrumentId]);
  if (!instrument) throw new TradeRejectedError("Trading instrument was not found");
  if (instrument.currency.toUpperCase() !== account.currency.toUpperCase()) {
    throw new TradeRejectedError("Instrument currency must match account currency");
  }

  const trade = {
    accountId: account.id,
    instrumentId: instrument.id,
    side: input.side,
    quantity: input.quantity,
    price: input.price,
    fee: input.fee ?? "0",
    executedAt: input.executedAt,
  };
  await repositories.positionWrites.recordTrade(trade, (current) => {
    if (input.side === "buy" && !current && !instrument.isActive) {
      throw new TradeRejectedError(`${instrument.symbol} is inactive and cannot be bought`);
    }
    try {
      return applyTrade(current, trade);
    } catch (error) {
      throw new TradeRejectedError(error instanceof Error ? error.message : "Trade was rejected");
    }
  });
}

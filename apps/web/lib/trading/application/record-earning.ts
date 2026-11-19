import { decimal } from "../domain";
import type {
  EarningKind,
  EarningRepository,
  TradingAccountRepository,
  TradingInstrumentRepository,
} from "./repositories";

export interface RecordEarningInput {
  accountId: string;
  kind: EarningKind;
  amount: string;
  instrumentId?: string | null;
  receivedAt: Date;
  note?: string | null;
}

export interface EarningRepositories {
  accounts: Pick<TradingAccountRepository, "findById">;
  instruments: Pick<TradingInstrumentRepository, "findByIds">;
  earnings: Pick<EarningRepository, "create">;
}

export class EarningRejectedError extends Error {}

const AMOUNT_PATTERN = /^\d+(\.\d{1,8})?$/;
/** Allowance for clock differences between the browser and the server. */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

export async function recordEarning(
  input: RecordEarningInput,
  repositories: EarningRepositories,
  now: Date = new Date(),
): Promise<void> {
  if (!AMOUNT_PATTERN.test(input.amount) || decimal(input.amount).isZero()) {
    throw new EarningRejectedError("Earnings amount must be greater than zero");
  }
  if (Number.isNaN(input.receivedAt.getTime())) throw new EarningRejectedError("Received date is invalid");
  if (input.receivedAt.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
    throw new EarningRejectedError("Received date cannot be in the future");
  }

  const account = await repositories.accounts.findById(input.accountId);
  if (!account) throw new EarningRejectedError("Trading account was not found");

  const instrumentId = input.instrumentId || null;
  if (instrumentId) {
    const [instrument] = await repositories.instruments.findByIds([instrumentId]);
    if (!instrument) throw new EarningRejectedError("Trading instrument was not found");
    if (instrument.currency.toUpperCase() !== account.currency.toUpperCase()) {
      throw new EarningRejectedError("Instrument currency must match account currency");
    }
  }

  await repositories.earnings.create({
    accountId: account.id,
    kind: input.kind,
    amount: input.amount,
    tradingInstrumentId: instrumentId,
    receivedAt: input.receivedAt,
    note: input.note?.trim() || null,
  });
}

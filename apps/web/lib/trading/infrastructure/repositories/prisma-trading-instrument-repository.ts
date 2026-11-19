import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import type {
  TradingInstrumentListRepository,
  TradingInstrumentRecord,
  TradingInstrumentRepository,
} from "../../application/repositories";

export class PrismaTradingInstrumentRepository implements TradingInstrumentRepository, TradingInstrumentListRepository {
  async findByIds(ids: readonly string[]): Promise<TradingInstrumentRecord[]> {
    if (ids.length === 0) return [];
    return prisma.$queryRaw<TradingInstrumentRecord[]>(Prisma.sql`
      SELECT "id", "symbol", "name", "instrumentType"::text AS "instrumentType", "currency", "isActive"
      FROM "TradingInstrument" WHERE "id" = ANY(${[...ids]}::text[])
    `);
  }

  async findActiveByCurrency(currency: string): Promise<TradingInstrumentRecord[]> {
    return prisma.$queryRaw<TradingInstrumentRecord[]>(Prisma.sql`
      SELECT "id", "symbol", "name", "instrumentType"::text AS "instrumentType", "currency", "isActive"
      FROM "TradingInstrument"
      WHERE "isActive" = true AND UPPER("currency") = UPPER(${currency})
      ORDER BY "symbol" ASC
    `);
  }
}

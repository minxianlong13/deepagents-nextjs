import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import type { TradingInstrumentRecord, TradingInstrumentRepository } from "../../application/repositories";

export class PrismaTradingInstrumentRepository implements TradingInstrumentRepository {
  async findByIds(ids: readonly string[]): Promise<TradingInstrumentRecord[]> {
    if (ids.length === 0) return [];
    return prisma.$queryRaw<TradingInstrumentRecord[]>(Prisma.sql`
      SELECT "id", "symbol", "name", "instrumentType"::text AS "instrumentType", "currency", "isActive"
      FROM "TradingInstrument" WHERE "id" = ANY(${[...ids]}::text[])
    `);
  }
}

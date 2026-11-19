import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import type { TradeRecord, TradeRepository } from "../../application/repositories";

export class PrismaTradeRepository implements TradeRepository {
  async findByAccountId(accountId: string): Promise<TradeRecord[]> {
    return prisma.$queryRaw<TradeRecord[]>(Prisma.sql`
      SELECT "id", "tradingInstrumentId", "side"::text AS "side", "quantity"::text AS "quantity",
        "price"::text AS "price", "fee"::text AS "fee", "executedAt"
      FROM "Trade" WHERE "tradingAccountId" = ${accountId}
      ORDER BY "createdAt" ASC, "id" ASC
    `);
  }
}

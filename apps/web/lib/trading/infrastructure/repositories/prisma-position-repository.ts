import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import type { PositionRecord, PositionRepository } from "../../application/repositories";

type PositionRow = Omit<PositionRecord, "quantity" | "averageCost" | "currentPrice"> & {
  quantity: string;
  averageCost: string;
  currentPrice: string | null;
};

export class PrismaPositionRepository implements PositionRepository {
  async findByAccountId(accountId: string): Promise<PositionRecord[]> {
    return prisma.$queryRaw<PositionRow[]>(Prisma.sql`
      SELECT "id", "tradingAccountId", "tradingInstrumentId", "quantity"::text AS "quantity",
        "averageCost"::text AS "averageCost", "currentPrice"::text AS "currentPrice"
      FROM "Position" WHERE "tradingAccountId" = ${accountId}
      ORDER BY "tradingInstrumentId" ASC
    `);
  }
}

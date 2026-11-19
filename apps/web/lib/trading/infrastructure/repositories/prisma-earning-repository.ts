import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import type { EarningRecord, EarningRepository } from "../../application/repositories";

export class PrismaEarningRepository implements EarningRepository {
  async findByAccountId(accountId: string): Promise<EarningRecord[]> {
    return prisma.$queryRaw<EarningRecord[]>(Prisma.sql`
      SELECT "id", "kind"::text AS "kind", "amount"::text AS "amount", "tradingInstrumentId", "receivedAt", "note"
      FROM "TradingEarning" WHERE "tradingAccountId" = ${accountId}
      ORDER BY "receivedAt" DESC, "createdAt" DESC
    `);
  }

  async create(input: Omit<EarningRecord, "id"> & { accountId: string }): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "TradingEarning" ("id", "tradingAccountId", "kind", "amount", "tradingInstrumentId", "receivedAt", "note", "createdAt")
      VALUES (${randomUUID()}, ${input.accountId}, CAST(${input.kind} AS "TradingEarningKind"), CAST(${input.amount} AS DECIMAL(20,8)),
        ${input.tradingInstrumentId}, ${input.receivedAt}, ${input.note}, ${new Date()})
    `);
  }
}

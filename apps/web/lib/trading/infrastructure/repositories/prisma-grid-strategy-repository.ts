import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import type { GridStrategyRecord, GridStrategyRepository } from "../../application/repositories";

export class PrismaGridStrategyRepository implements GridStrategyRepository {
  async find(accountId: string, instrumentId: string): Promise<GridStrategyRecord | null> {
    const rows = await prisma.$queryRaw<GridStrategyRecord[]>(Prisma.sql`
      SELECT "tradingAccountId" AS "accountId", "tradingInstrumentId" AS "instrumentId",
        "anchorPrice"::text AS "anchorPrice", "spacingMode"::text AS "spacingMode", "stepValue"::text AS "stepValue",
        "sizingMode"::text AS "sizingMode", "sizeValue"::text AS "sizeValue", "levelsPerSide"
      FROM "GridStrategy"
      WHERE "tradingAccountId" = ${accountId} AND "tradingInstrumentId" = ${instrumentId}
      LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async save(record: GridStrategyRecord): Promise<void> {
    const now = new Date();
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "GridStrategy" ("id", "tradingAccountId", "tradingInstrumentId", "anchorPrice", "spacingMode", "stepValue",
        "sizingMode", "sizeValue", "levelsPerSide", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${record.accountId}, ${record.instrumentId}, CAST(${record.anchorPrice} AS DECIMAL(20,8)),
        CAST(${record.spacingMode} AS "GridSpacingMode"), CAST(${record.stepValue} AS DECIMAL(20,8)),
        CAST(${record.sizingMode} AS "GridSizingMode"), CAST(${record.sizeValue} AS DECIMAL(20,8)), ${record.levelsPerSide}, ${now}, ${now})
      ON CONFLICT ("tradingAccountId", "tradingInstrumentId") DO UPDATE SET
        "anchorPrice" = EXCLUDED."anchorPrice", "spacingMode" = EXCLUDED."spacingMode", "stepValue" = EXCLUDED."stepValue",
        "sizingMode" = EXCLUDED."sizingMode", "sizeValue" = EXCLUDED."sizeValue", "levelsPerSide" = EXCLUDED."levelsPerSide",
        "updatedAt" = EXCLUDED."updatedAt"
    `);
  }
}

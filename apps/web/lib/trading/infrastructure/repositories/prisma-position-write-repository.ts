import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import type { PositionChange } from "../../domain";
import type { PositionRecord, PositionWriteRepository, TradeRecordInput } from "../../application/repositories";

export class PrismaPositionWriteRepository implements PositionWriteRepository {
  async recordTrade(
    trade: TradeRecordInput,
    update: (current: PositionRecord | null) => PositionChange,
  ): Promise<void> {
    const { accountId, instrumentId } = trade;
    await prisma.$transaction(async (tx) => {
      // Lock the account row so concurrent trades on the same account (including first buys) serialize.
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "TradingAccount" WHERE "id" = ${accountId} FOR UPDATE`);
      const rows = await tx.$queryRaw<PositionRecord[]>(Prisma.sql`
        SELECT "id", "tradingAccountId", "tradingInstrumentId", "quantity"::text AS "quantity",
          "averageCost"::text AS "averageCost", "currentPrice"::text AS "currentPrice"
        FROM "Position"
        WHERE "tradingAccountId" = ${accountId} AND "tradingInstrumentId" = ${instrumentId}
        FOR UPDATE
      `);
      const current = rows[0] ?? null;
      const change = update(current);
      const now = new Date();

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "Trade" ("id", "tradingAccountId", "tradingInstrumentId", "side", "quantity", "price", "fee", "executedAt", "createdAt")
        VALUES (${randomUUID()}, ${accountId}, ${instrumentId}, CAST(${trade.side} AS "TradeSide"),
          CAST(${trade.quantity} AS DECIMAL(20,8)), CAST(${trade.price} AS DECIMAL(20,8)), CAST(${trade.fee} AS DECIMAL(20,8)),
          ${trade.executedAt}, ${now})
      `);

      if (change.kind === "delete") {
        if (current) await tx.$executeRaw(Prisma.sql`DELETE FROM "Position" WHERE "id" = ${current.id}`);
        return;
      }

      const quantity = change.quantity.toFixed();
      const averageCost = change.averageCost.toFixed();
      if (current) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "Position"
          SET "quantity" = CAST(${quantity} AS DECIMAL(20,8)), "averageCost" = CAST(${averageCost} AS DECIMAL(20,8)), "updatedAt" = ${now}
          WHERE "id" = ${current.id}
        `);
      } else {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "Position" ("id", "tradingAccountId", "tradingInstrumentId", "quantity", "averageCost", "currentPrice", "createdAt", "updatedAt")
          VALUES (${randomUUID()}, ${accountId}, ${instrumentId}, CAST(${quantity} AS DECIMAL(20,8)), CAST(${averageCost} AS DECIMAL(20,8)), NULL, ${now}, ${now})
        `);
      }
    });
  }
}

import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import type { TradingAccountRecord, TradingAccountRepository } from "../../application/repositories";

type AccountRow = Omit<TradingAccountRecord, "initialFund"> & { initialFund: string };

export class PrismaTradingAccountRepository implements TradingAccountRepository {
  async findById(id: string): Promise<TradingAccountRecord | null> {
    const rows = await prisma.$queryRaw<AccountRow[]>(Prisma.sql`
      SELECT "id", "name", "broker"::text AS "broker", "accountType"::text AS "accountType",
        "currency", "initialFund"::text AS "initialFund"
      FROM "TradingAccount" WHERE "id" = ${id} LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async findAll(): Promise<TradingAccountRecord[]> {
    return prisma.$queryRaw<AccountRow[]>(Prisma.sql`
      SELECT "id", "name", "broker"::text AS "broker", "accountType"::text AS "accountType",
        "currency", "initialFund"::text AS "initialFund"
      FROM "TradingAccount" ORDER BY "name" ASC, "id" ASC
    `);
  }
}

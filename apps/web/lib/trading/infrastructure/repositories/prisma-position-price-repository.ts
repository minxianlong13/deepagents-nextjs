import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import type { PositionPriceRepository } from "../../application/repositories";

export class PrismaPositionPriceRepository implements PositionPriceRepository {
  async updateCurrentPrice(positionId: string, accountId: string, price: string): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE "Position"
      SET "currentPrice" = CAST(${price} AS DECIMAL(20,8)), "updatedAt" = ${new Date()}
      WHERE "id" = ${positionId} AND "tradingAccountId" = ${accountId}
    `);
  }
}

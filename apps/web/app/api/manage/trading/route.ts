import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import * as z from "zod/v4";
import prisma from "@/lib/db/prisma";

export const runtime = "nodejs";

const decimalString = z
  .string()
  .regex(/^\d+(\.\d{1,8})?$/, "Use a non-negative number with up to 8 decimal places.");
const currency = z
  .string()
  .regex(/^[A-Z]{3}$/, "Use a three-letter uppercase currency code.");

const accountInput = z.object({
  name: z.string().trim().min(1).max(100),
  broker: z.enum(["wealthsimple", "ibkr"]),
  accountType: z.literal("non_registered"),
  currency,
  initialFund: decimalString,
});

const instrumentInput = z.object({
  symbol: z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9._-]+$/),
  name: z.string().trim().min(1).max(120),
  instrumentType: z.enum(["stock", "etf"]),
  currency,
  isActive: z.boolean().default(true),
});

const requestInput = z.discriminatedUnion("resource", [
  z.object({ resource: z.literal("account"), id: z.string().min(1).optional(), data: accountInput }),
  z.object({ resource: z.literal("instrument"), id: z.string().min(1).optional(), data: instrumentInput }),
]);

type AccountRow = {
  id: string;
  name: string;
  broker: string;
  accountType: string;
  currency: string;
  initialFund: string;
  createdAt: Date;
  updatedAt: Date;
  positionCount: number;
};

type InstrumentRow = {
  id: string;
  symbol: string;
  name: string;
  instrumentType: string;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  positionCount: number;
};

function serializeAccount(row: AccountRow) {
  return {
    id: row.id,
    name: row.name,
    broker: row.broker,
    accountType: row.accountType,
    currency: row.currency,
    initialFund: row.initialFund,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    _count: { positions: row.positionCount },
  };
}

function serializeInstrument(row: InstrumentRow) {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    instrumentType: row.instrumentType,
    currency: row.currency,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    _count: { positions: row.positionCount },
  };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to save trading data.";
  const isConflict = message.includes("duplicate key") || message.includes("unique constraint");
  return NextResponse.json(
    { error: isConflict ? "A record with these values already exists." : message },
    { status: isConflict ? 409 : 500 },
  );
}

async function listAccounts() {
  return prisma.$queryRaw<AccountRow[]>(Prisma.sql`
    SELECT a."id", a."name", a."broker"::text AS "broker",
      a."accountType"::text AS "accountType", a."currency",
      a."initialFund"::text AS "initialFund", a."createdAt", a."updatedAt",
      COUNT(p."id")::int AS "positionCount"
    FROM "TradingAccount" a
    LEFT JOIN "Position" p ON p."tradingAccountId" = a."id"
    GROUP BY a."id"
    ORDER BY a."name" ASC, a."createdAt" ASC
  `);
}

async function listInstruments() {
  return prisma.$queryRaw<InstrumentRow[]>(Prisma.sql`
    SELECT i."id", i."symbol", i."name", i."instrumentType"::text AS "instrumentType",
      i."currency", i."isActive", i."createdAt", i."updatedAt",
      COUNT(p."id")::int AS "positionCount"
    FROM "TradingInstrument" i
    LEFT JOIN "Position" p ON p."tradingInstrumentId" = i."id"
    GROUP BY i."id"
    ORDER BY i."symbol" ASC, i."currency" ASC
  `);
}

export async function GET() {
  try {
    const [accounts, instruments] = await Promise.all([listAccounts(), listInstruments()]);
    return NextResponse.json({ accounts: accounts.map(serializeAccount), instruments: instruments.map(serializeInstrument) });
  } catch (error) {
    return errorResponse(error);
  }
}

async function parseRequest(request: Request) {
  try {
    const parsed = requestInput.safeParse(await request.json());
    if (!parsed.success) {
      return { error: NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 }) };
    }
    return { value: parsed.data };
  } catch {
    return { error: NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }) };
  }
}

async function createAccount(data: z.infer<typeof accountInput>) {
  const id = randomUUID();
  const now = new Date();
  const rows = await prisma.$queryRaw<AccountRow[]>(Prisma.sql`
    INSERT INTO "TradingAccount" ("id", "name", "broker", "accountType", "currency", "initialFund", "createdAt", "updatedAt")
    VALUES (${id}, ${data.name}, CAST(${data.broker} AS "TradingBroker"), CAST(${data.accountType} AS "TradingAccountType"), ${data.currency}, CAST(${data.initialFund} AS DECIMAL(20,8)), ${now}, ${now})
    RETURNING "id", "name", "broker"::text AS "broker", "accountType"::text AS "accountType", "currency", "initialFund"::text AS "initialFund", "createdAt", "updatedAt", 0::int AS "positionCount"
  `);
  return rows[0];
}

async function createInstrument(data: z.infer<typeof instrumentInput>) {
  const id = randomUUID();
  const now = new Date();
  const rows = await prisma.$queryRaw<InstrumentRow[]>(Prisma.sql`
    INSERT INTO "TradingInstrument" ("id", "symbol", "name", "instrumentType", "currency", "isActive", "createdAt", "updatedAt")
    VALUES (${id}, ${data.symbol.toUpperCase()}, ${data.name}, CAST(${data.instrumentType} AS "TradingInstrumentType"), ${data.currency}, ${data.isActive}, ${now}, ${now})
    RETURNING "id", "symbol", "name", "instrumentType"::text AS "instrumentType", "currency", "isActive", "createdAt", "updatedAt", 0::int AS "positionCount"
  `);
  return rows[0];
}

export async function POST(request: Request) {
  const parsed = await parseRequest(request);
  if (parsed.error) return parsed.error;

  try {
    if (parsed.value.resource === "account") {
      const record = await createAccount(parsed.value.data);
      return NextResponse.json({ record: serializeAccount(record) }, { status: 201 });
    }
    const record = await createInstrument(parsed.value.data);
    return NextResponse.json({ record: serializeInstrument(record) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const parsed = await parseRequest(request);
  if (parsed.error) return parsed.error;
  if (!parsed.value.id) {
    return NextResponse.json({ error: "An id is required when editing a record." }, { status: 400 });
  }

  try {
    const id = parsed.value.id;
    const now = new Date();

    if (parsed.value.resource === "account") {
      const existing = await prisma.$queryRaw<{ currency: string; positionCount: number }[]>(Prisma.sql`
        SELECT a."currency", COUNT(p."id")::int AS "positionCount"
        FROM "TradingAccount" a LEFT JOIN "Position" p ON p."tradingAccountId" = a."id"
        WHERE a."id" = ${id} GROUP BY a."id"
      `);
      if (!existing[0]) return NextResponse.json({ error: "Trading account not found." }, { status: 404 });
      if (existing[0].positionCount > 0 && existing[0].currency !== parsed.value.data.currency) {
        return NextResponse.json({ error: "An account currency cannot change while it has positions." }, { status: 409 });
      }
      const rows = await prisma.$queryRaw<AccountRow[]>(Prisma.sql`
        UPDATE "TradingAccount"
        SET "name" = ${parsed.value.data.name}, "broker" = CAST(${parsed.value.data.broker} AS "TradingBroker"), "accountType" = CAST(${parsed.value.data.accountType} AS "TradingAccountType"), "currency" = ${parsed.value.data.currency}, "initialFund" = CAST(${parsed.value.data.initialFund} AS DECIMAL(20,8)), "updatedAt" = ${now}
        WHERE "id" = ${id}
        RETURNING "id", "name", "broker"::text AS "broker", "accountType"::text AS "accountType", "currency", "initialFund"::text AS "initialFund", "createdAt", "updatedAt", ${existing[0].positionCount}::int AS "positionCount"
      `);
      return NextResponse.json({ record: serializeAccount(rows[0]) });
    }

    const existing = await prisma.$queryRaw<{ currency: string; positionCount: number }[]>(Prisma.sql`
      SELECT i."currency", COUNT(p."id")::int AS "positionCount"
      FROM "TradingInstrument" i LEFT JOIN "Position" p ON p."tradingInstrumentId" = i."id"
      WHERE i."id" = ${id} GROUP BY i."id"
    `);
    if (!existing[0]) return NextResponse.json({ error: "Trading instrument not found." }, { status: 404 });
    if (existing[0].positionCount > 0 && existing[0].currency !== parsed.value.data.currency) {
      return NextResponse.json({ error: "An instrument currency cannot change while it has positions." }, { status: 409 });
    }
    const rows = await prisma.$queryRaw<InstrumentRow[]>(Prisma.sql`
      UPDATE "TradingInstrument"
      SET "symbol" = ${parsed.value.data.symbol.toUpperCase()}, "name" = ${parsed.value.data.name}, "instrumentType" = CAST(${parsed.value.data.instrumentType} AS "TradingInstrumentType"), "currency" = ${parsed.value.data.currency}, "isActive" = ${parsed.value.data.isActive}, "updatedAt" = ${now}
      WHERE "id" = ${id}
      RETURNING "id", "symbol", "name", "instrumentType"::text AS "instrumentType", "currency", "isActive", "createdAt", "updatedAt", ${existing[0].positionCount}::int AS "positionCount"
    `);
    return NextResponse.json({ record: serializeInstrument(rows[0]) });
  } catch (error) {
    return errorResponse(error);
  }
}

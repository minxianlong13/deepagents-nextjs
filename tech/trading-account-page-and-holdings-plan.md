# Trading Account Page and Holdings MVP Plan

## Objective

Add a minimal trading-account module that allows the application to display one account, its base currency, initial fund, and current stock holdings.

This phase intentionally excludes:

- performance charts
- portfolio performance snapshots
- exchange fields
- trade and order history
- realized return calculations
- grid-strategy execution

The design should remain extensible for those features later without adding them to the first release.

## MVP user experience

Proposed route:

```text
/trading/accounts/[accountId]
```

The account page will contain:

### Account summary

- Account name
- Broker
- Account type
- Currency
- Initial fund
- Total holdings value
- Number of holdings

### Holdings table

Each holding will display:

- Symbol
- Instrument name
- Quantity
- Average cost
- Cost basis
- Current price
- Market value
- Unrealized profit/loss
- Unrealized return percentage

The page will not display a chart in this phase. Empty states should explain when an account has no holdings, and missing market prices should be shown as unavailable rather than treated as zero.

## Management page

The first management page is available at:

```text
/manage/trading
```

It provides separate forms and lists for:

- creating and editing trading accounts
- creating and editing stock or ETF instruments
- viewing the number of positions associated with each record
- activating or deactivating instruments

The page uses `/api/manage/trading` for reads and mutations. It does not provide deletion yet. Account or instrument currency changes are rejected once positions exist, preventing existing holdings from becoming inconsistent with their currency. The current endpoint uses parameterized Prisma raw SQL temporarily because the checked-in Prisma Client has not yet been regenerated for these models; it can be replaced with typed Prisma delegates once client generation is available.

## Phase 1 contract decisions

Phase 1 is complete with the following MVP decisions:

- Trading accounts are system-level records for the MVP. No `userId` column is stored, and no sentinel value such as `-1` is used.
- The initial broker values are `wealthsimple` and `ibkr`.
- The initial account type is `non_registered`, while the database representation should remain extensible for future account types.
- Account currency is a required ISO 4217-style code. The first supported value is `CAD`.
- Instrument currency is also stored and must match the account currency. No exchange field is included.
- Quantity, average cost, and current price use precise decimal values. This supports whole-share ETFs now and fractional quantities later.
- `currentPrice` is nullable because market-price ingestion is not part of this MVP.
- Cost basis, market value, unrealized return, and total holdings are derived values. They should be calculated by the domain/application layer rather than persisted as independently editable columns.
- Realized return is explicitly deferred because there are no trade records in this phase.
- No performance snapshots, charts, orders, or executions are part of the MVP.

These decisions are the input for Phase 2 schema work.

## Data model

### `TradingAccount`

Represents the account and its single operating currency.

```text
id
name
broker
accountType
currency
initialFund
createdAt
updatedAt
```

Rules:

- `currency` is required and applies to every position in the account.
- `initialFund` is stored as a PostgreSQL `NUMERIC`/Prisma `Decimal`.
- Broker and account type remain configurable values or enums; they are not hardcoded to one provider.

### `TradingInstrument`

Represents a stock or ETF that can be held.

```text
id
symbol
name
currency
isActive
createdAt
updatedAt
```

No exchange field is included. Instrument currency must match the account currency before a position can be created.

### `Position`

Represents the current holding of one instrument in one account.

```text
id
tradingAccountId
tradingInstrumentId
quantity
averageCost
currentPrice
createdAt
updatedAt
```

Constraints:

```text
unique(tradingAccountId, tradingInstrumentId)
```

All monetary values use `Decimal` and PostgreSQL `NUMERIC`; JavaScript floating-point values must not be used for calculations. `costBasis`, `marketValue`, and return fields are derived rather than stored independently.

Recommended calculations:

```text
costBasis = quantity × averageCost
marketValue = quantity × currentPrice
unrealizedReturn = marketValue - costBasis
unrealizedReturnPercent = unrealizedReturn ÷ costBasis × 100
```

If `currentPrice` is unavailable, `marketValue` and unrealized return should be nullable or calculated only at read time. They should not silently become zero.

## Total holdings calculation

For an account with valid current prices:

```text
total holdings value = sum(Position.marketValue)
```

This value should be calculated by the account read service from positions. It does not need a separate stored column or snapshot table in the MVP.

The account summary may also expose:

```text
total cost basis = sum(Position.costBasis)
total unrealized return = sum(Position.unrealizedReturn)
```

These are derived holding metrics, not realized returns. Realized return is deferred until trade records exist.

## Proposed module structure

```text
apps/web/lib/trading/
  domain/
    account.ts
    position.ts
    money.ts
    rules.ts
    types.ts
  application/
    get-trading-account.ts
    calculate-account-holdings.ts
  infrastructure/
    repositories/
      trading-account-repository.ts
      prisma-trading-account-repository.ts
  index.ts

apps/web/app/trading/accounts/[accountId]/
  page.tsx
```

The page should consume an application service rather than querying Prisma directly. Prisma-generated types should remain inside the infrastructure layer.

## Phased implementation plan

### Phase 1: Confirm the MVP contract — Complete

- Confirm account fields and supported broker/account-type values.
- Confirm that account ownership is intentionally omitted until a user model exists.
- Confirm precision and nullability rules for quantity and current price.
- Document that realized return and trade history are deferred.

Deliverable: finalized domain and database contract, recorded in the Phase 1 contract decisions section above.

### Phase 2: Add the Prisma schema — Complete

- Add `TradingAccount`.
- Add `TradingInstrument`.
- Add `Position`.
- Add account/instrument/position relations and indexes.
- Add Decimal fields using explicit PostgreSQL precision and scale.
- Add the account/instrument currency consistency rule to the domain layer; Prisma cannot fully enforce this cross-table rule with a normal relation.

Deliverable: updated `apps/web/prisma/schema.prisma` with the MVP trading models, enums, relations, indexes, and Decimal fields.

### Phase 3: Create and validate the migration — Applied

- Add an additive migration under `apps/web/prisma/migrations/`.
- Preserve the existing candidate-related schema changes in the worktree.
- Run Prisma formatting and validation when the local Prisma CLI/runtime is available.
- Generate the Prisma client after the migration is reviewed.
- Apply the migration to Neon through the normal deployment workflow.

Deliverable: `20261105130000_add_trading_account_holdings/migration.sql`, which creates only the MVP trading tables, enums, indexes, and foreign keys. It has been applied to Neon and recorded in Prisma migration history. The installed Prisma CLI still needs to be repaired before client generation can run normally.

### Phase 4: Implement domain calculations — Complete

- Add Decimal-safe money/value objects or calculation helpers.
- Implement cost basis, market value, unrealized return, and account total calculations.
- Reject positions whose instrument currency differs from the account currency.
- Reject negative quantity, negative cost, and invalid account/instrument associations.

Deliverable: unit-tested trading domain calculations in `apps/web/lib/trading/domain/`. Calculations use Prisma Decimal values; price-dependent amounts stay unavailable if any position lacks a price. Currency, association, and nonnegative value rules are validated before use.

### Phase 5: Implement repositories and read services — Complete

- Define repository interfaces for accounts, instruments, and positions.
- Implement Prisma-backed repositories.
- Add an account read service returning:
  - account metadata
  - positions
  - total cost basis
  - total holdings value
  - total unrealized return
- Keep Prisma types mapped to application/domain DTOs.

Deliverable: `getTradingAccount` in `apps/web/lib/trading/application/`, backed by injectable repository interfaces and Prisma raw-SQL repository adapters. Account and position values are mapped to application DTOs with decimal strings; derived totals are calculated through the domain layer.

### Phase 6: Build the management and account pages — Complete

- Add `/manage/trading` for account and instrument management.
- Add `/api/manage/trading` for validated create, list, and update operations.
- Add `/trading/accounts/[accountId]`.
- Build summary cards for initial fund and total holdings.
- Build the holdings table.
- Add loading, empty, unavailable-price, and not-found states.
- Do not add charting dependencies or performance visualizations.

Current deliverables:

- `/manage/trading` provides account and instrument create/edit forms.
- `/api/manage/trading` provides list, create, and update operations.
- Existing-position currency changes are rejected by the API.
- Management navigation is available from the home page and desktop/mobile navigation.
- `/trading/accounts/[accountId]` displays account summary and a no-chart holdings table through the Phase 5 read service.
- `/trading/accounts` lists available accounts and links to each account holdings page.
- Account management records link to their read-only holdings page.
- Loading, no-holdings, missing-price, and account-not-found states are included.

The Phase 6 management and account pages are complete.

### Phase 7: Test and verify

- Test Decimal calculations with representative Canadian-dollar values.
- Test total holdings across multiple positions.
- Test currency mismatch rejection.
- Test duplicate account/instrument positions.
- Test missing current-price behavior.
- Run Prisma validation, linting, TypeScript checks, and the relevant unit tests.

Deliverable: verified MVP with documented deferred features.

## Acceptance criteria

- A trading account can be created with one required currency.
- Multiple instruments can be held in the account.
- Each account/instrument pair has at most one current position.
- All money calculations use Decimal values.
- The account page shows initial fund and total holdings value.
- The holdings table shows current positions and derived valuation fields.
- No chart or performance snapshot is introduced.
- No trade or realized-return model is introduced in this phase.
- Existing candidate, RAG, MCP, and chat modules remain unchanged.

## Deferred extensions

Future phases can add these without redesigning the MVP tables:

- executed trades and realized return
- proposed orders
- market-price ingestion
- portfolio snapshots and charts
- grid strategies and capital buckets
- risk snapshots and drawdown monitoring
- broker synchronization

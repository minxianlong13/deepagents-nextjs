---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: api-reference
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [api, routes, server-actions, middleware, http-status, validation]
---

# API Reference

Path convention: `src/...` is relative to `packages/housing/app/`. Request sequence diagram:
[diagrams/api-request-flow.mmd](diagrams/api-request-flow.mmd).

The app exposes three kinds of entry points: **pages** (RSC, React Server Components),
**`GET` API routes** under `src/app/api/` for reads the browser fetches on demand, and **server
actions** in `src/app/events/housing/actions.ts` for every mutation. There are no
`POST`/`PUT`/`DELETE` API routes for housing data (Verified; rule in `CLAUDE.md`, "Server action
boundaries").

## Common route behaviour

**Verified** for every housing route below.

| Step | Behaviour | Status on failure |
|---|---|---|
| 1. Session | `getAuthContext()` → `isLoggedIn` | `401`, empty body |
| 2. Path param | `eventId` is `z.coerce.number().int().positive()` | `400` |
| 3. `evtstub` (linked-event routes) | `coreEventIdSchema` = `z.string().uuid()` (`src/lib/event-link-params.ts:10`) | `400` |
| 4. Guard | `checkLinkedPasskeyEventAccess` or `checkPasskeyEventAccess` | `401`/`403` (from `ServiceError`) |
| 5. Query params | Zod `safeParse()` | `400` |
| 6. Data module | returns a ViewModel → `NextResponse.json(...)` | see error mapping |

Error mapping (`handleRouteError`, `src/lib/route-utils.ts:82`): `ServiceError` with status
401/403/404/409 passes through; any other `ServiceError` → `502`; any other error (including a Zod
parse failure of an upstream response) → `500`. Upstream 401/403 are already clamped to 502 inside
the data layer (`toServiceError`, `src/lib/upstream-client.ts`).

## API routes

### `GET /api/events`

- **File:** `src/app/api/events/route.ts:35` · **Data:** `getEvents` (`src/server/data/events.ts:202`)
- **Guard:** session only. Results are already scoped to the caller's IMS participants.
- **Query** (`eventsQuerySchema`, `:16-33`):

| Param | Type | Default | Rule |
|---|---|---|---|
| `q` | string | — | free-text search |
| `page` | int ≥ 1 | 1 | |
| `pageSize` | int 1–100 | `DEFAULT_EVENT_PAGE_SIZE` (5) | |
| `startDate`, `endDate` | `YYYY-MM-DD` | — | each optional; `startDate ≤ endDate` (an inverted window would look like "no events") |
| `includeClosed` | `'true'` \| `'false'` | false | only literal strings accepted |

- **Response:** `EventsViewModel` (events + `PaginationMetadata`). `totalCount` is a lower bound
  (PRELIMINARY GROUP-130939).
- **Clients:** `useEventSearch` / `useEventSearchPages` (link modal, compare modal).

### `GET /api/events/{eventId}`

- **File:** `src/app/api/events/[eventId]/route.ts:11` · **Data:** `getEvent`
- **Guard:** `checkPasskeyEventAccess` (ownership).
- **Response:** `EventDetailViewModel`.
- **Clients:** **None found in the app** (Confidence: Medium; may be used externally — Unknown).

### `GET /api/events/{eventId}/hotels`

- **File:** `src/app/api/events/[eventId]/hotels/route.ts:29` · **Data:** `getHotels`
- **Guard:** `checkLinkedPasskeyEventAccess(evtstub, eventId)`.
- **Query:** `evtstub` (required, UUID), `page` (≥1, default 1), `pageSize` (1–12, default 12 =
  `HOTEL_LIST_PAGE_SIZE`). The cap is deliberate: each hotel on a page costs one location call
  because there is no bulk location endpoint (`:13-18`).
- **Response:** `HotelListViewModel`.
- **Client:** `useHotelPages`.

### `GET /api/events/{eventId}/booking-pace`

- **File:** `src/app/api/events/[eventId]/booking-pace/route.ts:12` · **Data:** `getBookingPace`
- **Guard:** `checkLinkedPasskeyEventAccess(evtstub, eventId)`. **Query:** `evtstub` (required).
- **Response:** `BookingPaceViewModel`; upstream 404 (no pace yet) passes through as `404`.
- **Clients:** **None found** — `BookingPaceSection` calls `getBookingPace` server-side
  (Confidence: Medium).

### `GET /api/events/{eventId}/booking-pace/compare`

- **File:** `src/app/api/events/[eventId]/booking-pace/compare/route.ts:21`
- **Guard:** `checkPasskeyEventAccess(eventId)` — **ownership**, and **no `evtstub`**, because the
  compared event is not linked to the core event, so link-derived access cannot apply (`:11-20`).
- **Response:** `BookingPaceViewModel`; `404` = no pace yet (client keeps the event selected
  without a line).
- **Client:** `useBookingPaceComparison` (up to `MAX_COMPARED_EVENTS = 2`). The compare modal only
  lists events with `isEventOwner` true so the guard does not reject them.

### `GET /api/events/{eventId}/room-nights-pickup` and `/room-night-summary`

- **Files:** `src/app/api/events/[eventId]/room-nights-pickup/route.ts:13`,
  `.../room-night-summary/route.ts:13` · **Data:** `getRoomNightsPickup`, `getRoomNightSummary`
  (`src/server/data/inventory.ts`)
- **Guard:** `checkLinkedPasskeyEventAccess(evtstub, eventId)`.
- **Query** (`inventoryQuerySchema`, `src/lib/inventory-query.ts:17`):

| Param | Repeatable | Rule |
|---|---|---|
| `evtstub` | no | required UUID |
| `subBlockGroupId` | no | positive int; `''` treated as absent |
| `attendeeTypeId` | yes | positive int |
| `hotelId`, `roomTypeId` | yes | positive ints; **must be the same count**, paired by index |

  Ids are validated numerically so garbage becomes a `400` here rather than upstream's misleading
  `404` (`inventory-query.ts:10-14`).
- **Response:** `RoomNightsPickupViewModel` / `RoomNightSummaryViewModel`.
- **Clients:** `useRoomNightsPickup`, `useRoomNightSummary` (via `useFilteredInventory`).

### Platform routes (from the CDF template)

| Route | File | Behaviour |
|---|---|---|
| `GET /api/ok` | `src/app/api/ok/route.ts:9` | Health check via `okApiRoute({ disableGraphQLHealthCheck: true })`; public |
| `GET /api/version-info` | `src/app/api/version-info/route.ts:7` | Build/version info via `versionInfoRoute()`; public |
| `GET /api/products/{product}/items` | `src/app/api/products/[product]/items/route.ts:12` | Planner product navigation. Only checks that an `Authorization` header **exists** (`:17-26`); translate is a TODO stub. See [known-issues-roadmap.md](known-issues-roadmap.md) |
| `POST /api/graphql` | `src/pages/api/graphql.ts` | Pages-router Apollo endpoint serving a mock user profile; unused by housing UI |

## Server actions

**File:** `src/app/events/housing/actions.ts` (`'use server'`). All return
`ActionResult<T> = { ok: true, data } | { ok: false, code }` (`src/lib/action-utils.ts:18`) and
never throw expected failures (Next.js strips thrown messages in production, `:5-12`). Every action
first checks the session (`UNAUTHORIZED`) and validates `coreEventId` with `coreEventIdSchema`
(`INVALID_INPUT`), then runs `checkCoreEventAccess`. Successful mutations call
`revalidatePath('/events/housing')`; a revalidation failure is logged, not returned (`:80-92`).

| Action | Line | Args | Extra guard | Returns | Notable failures |
|---|---|---|---|---|---|
| `linkPasskeyRoomBlock` | 118 | `coreEventId`, `passkeyEventId` (digits, no leading zero), `enableRegLinkIntegration` (strict boolean; UI always sends `false` today) | `checkPasskeyEventAccess` | `EventLinkViewModel` | `CONFLICT` when already linked; `FORBIDDEN` |
| `unlinkPasskeyRoomBlock` | 151 | `coreEventId` | ownership checked in data module (`requireOwnershipOfLinkedEvent`) | `UnlinkOutcome` (`'already-unlinked'` is a success) | `FORBIDDEN`; reg-link `CONFLICT` disabled (GROUP-130999) |
| `updatePasskeyRegLinkIntegration` | 179 | `coreEventId`, state ∈ {`NOT_REQUESTED`, `CONNECTED`} | ownership in data module | `EventLinkViewModel` | `NOT_FOUND` when unlinked/Record B missing. **No UI caller** (TODO `:175`) |
| `getPasskeyManageLink` | 221 | `coreEventId` | `checkPasskeyEventAccess` on the linked event | `{kind:'href', href}` or `{kind:'login-required', platformUserId, productId}` | `NOT_FOUND` when unlinked; no revalidation (nothing mutated) |
| `refreshPasskeyAccount` | 283 | none | session only | `null` | Invalidates tag `passkey-users-info:<own platformUserId>` and revalidates the page |

Action failure codes: `UNAUTHORIZED`, `INVALID_INPUT`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`UPSTREAM_ERROR`, `UNEXPECTED` (`action-utils.ts:14-15`). They mirror the route statuses through
the shared `resolveErrorOutcome()`.

**Why `getPasskeyManageLink` is an action, not a GET:** the magic link is single-use, so it must
be minted at click time and handed straight to the browser (`actions.ts:208-212`).

## Pages

| Path | File | Notes |
|---|---|---|
| `/events/housing?evtstub=<uuid>` | `src/app/events/housing/page.tsx` | Calls `assertCoreEventAccess`, then `getEventLink`; renders `UnlinkedLandingPage` or the linked page |
| `/` | — | Middleware redirects `/?evtstub=` to the housing route (`src/middleware.ts:75-80`) |
| `/login` | `src/app/login/` | Dev-only login used with `DEV_LOGIN` |
| `/error` | `src/app/error/` | Error page; excluded from the `evtstub` requirement |

## Middleware rules

**Verified** (`src/middleware.ts`).

- `PROTECTED_ROUTES = ['/api']`, `PUBLIC_API_ROUTES = ['/api/ok', '/api/version-info']`,
  `CORE_EVENT_ID_EXCLUDED_PATHS = ['/login', '/error']` (`:43-44`).
- Auth through `@cvent/nextjs` auth middleware (`:101-116`).
- A page request without `evtstub` goes to `/error` when `DEV_LOGIN` is set, otherwise to the
  planner event selection page (`:120-134`).
- Copies `evtstub` into the `x-core-event-id` request header (`:93`) and sets a CSP nonce in
  `x-nonce` (`:98`). API routes must read `evtstub` from the query string, not the header
  (`CLAUDE.md`).
- `runtime: 'nodejs'` and a matcher (`:149-151`).

Related: [architecture.md](architecture.md) · [data-model.md](data-model.md) ·
[business-workflows.md](business-workflows.md)

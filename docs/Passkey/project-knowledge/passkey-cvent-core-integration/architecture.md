---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: architecture
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [architecture, bff, nextjs, auth, bearer-token, caching, errors, access-guards]
---

# Architecture

Path convention: `src/...` is relative to `packages/housing/app/`. Diagrams:
[system-architecture.mmd](diagrams/system-architecture.mmd),
[api-request-flow.mmd](diagrams/api-request-flow.mmd),
[async-flows.mmd](diagrams/async-flows.mmd).

## Architectural style

**Verified.** A Next.js 15 App Router **BFF (Backend-for-Frontend)**. The server owns
authentication, upstream fetching, validation, aggregation and the client contract; the browser
receives **ViewModels** and only derives presentation (dates, labels, fallbacks) in components
(`CLAUDE.md`, "Architecture" and "UI").

**Why it exists this way (Verified from CLAUDE.md):** the UI talks to 13 upstream services with
three different credential types. Keeping all of that server-side means no credential reaches
the browser, every upstream response is validated once at a known boundary, and the UI gets a
stable contract that does not change when an upstream does.

## Layers

| # | Layer | Location | Responsibility | Why it is separate |
|---|---|---|---|---|
| 1 | Middleware | `src/middleware.ts` | CSP (Content Security Policy) nonce, session auth for pages and `/api/*`, `evtstub` requirement, locale header, copies `evtstub` to `x-core-event-id` | One place to reject unauthenticated or event-less requests before any rendering |
| 2 | Boundaries | `src/app/**/page.tsx`, `layout.tsx`, `src/app/api/**/route.ts`, `src/app/events/housing/actions.ts` | `isLoggedIn` check, Zod `safeParse` of inputs (400), access guard, call data module, map errors | Routes and server actions are the same boundary with different transports (`CLAUDE.md`, "Server action boundaries") |
| 3 | Guards and shared helpers | `src/lib/` | Access guards, token selection, error translation, pagination, cache TTLs | Shared by pages, routes and actions so policy is defined once |
| 4 | Composers | `src/server/data/*.ts` | Run several fetchers in parallel, map to a ViewModel, `ViewModel.parse()` | ViewModels are required whenever calls are combined or shapes differ |
| 5 | Fetchers | `src/data/<service>/*.ts` | One upstream call each; `UpstreamSchema.parse()`; translate failures with `toServiceError` | Upstream schemas mirror the wire format exactly; one file per call keeps contracts reviewable |
| 6 | Types | `src/types/upstream/`, `src/types/view-models/`, `src/types/internal/` | Zod schemas (upstream and ViewModel); internal plain types | The upstream file header records service, base-URL env var, path, auth and data modules |
| 7 | UI | `src/app/events/housing/<Section>/{server,client}/`, `src/components/`, `src/hooks/` | Server components start data work; client components render Carina UI; hooks call `GET /api/*` for on-demand reads | Section folders split server data loading from client interactivity |

### Request pipeline (Verified, `CLAUDE.md` "Architecture" and route code)

```
Request
  -> middleware (src/middleware.ts:73)
  -> route/page/action: isLoggedIn, Zod safeParse (400), access guard
  -> server-only composer (src/server/data/*)
  -> parallel fetchers (src/data/*) via per-service JsonClient
  -> UpstreamSchema.parse()  (failure = 500)
  -> named mapping function -> ViewModel.parse()
  -> RSC props or JSON response
  -> components derive presentation values
```

## Middleware

**Verified** (`src/middleware.ts`):

- Runs on the Node runtime with matcher `['/((?!api|favicon.ico|_next/|.*\\.png$).*)', '/api/:path*']` (`src/middleware.ts:149-151`).
- `/api/ok` and `/api/version-info` are public (`:43`). All other `/api/*` and all pages except
  `/login` and `/error` go through `authMiddleware` from `@cvent/nextjs` (`:48-60`, `:101-116`).
- Pages other than `/login`, `/error` require `evtstub`. Without it: in `DEV_LOGIN=true` the user is
  sent to `/error` with a log line; otherwise to the Cvent event selection page
  (`getEventDeniedRedirectUrl`, `src/lib/route-utils.ts:31`) (`src/middleware.ts:120-134`).
- `/?evtstub=…` redirects to `/events/housing?evtstub=…` (`:75-80`).
- Sets `x-core-event-id` (copy of `evtstub`, `:93`) and `x-nonce` (`:98`). The `/api` routes must
  read `evtstub` from the query string, never from this header (`CLAUDE.md`, "Passkey event access").

## Bearer tokens

**Verified** (`src/lib/auth-metadata.ts:85`, `:124-153`; `src/lib/bearer-token.ts`). Data modules ask
for credentials only through `requireIdentity(fields, { accessToken })`, which re-checks
`isLoggedIn` and throws `ServiceError(401)` if the session or a required identity field is missing.

| Kind | How it is obtained | Sent to | Why |
|---|---|---|---|
| `'server'` | Minted once per process from `API_KEY` against `AUTH_SERVICE`, metadata `{ service: 'passkey-housing' }` (`getServerBearerToken`, `bearer-token.ts:269`) | passkey-event, passkey-hotel, passkey-inventory, passkey-event-housing, passkey-room-type-data, passkey-integration | These authorize on the API key's scopes. An identical `Authorization` header for every planner lets Next's header-keyed fetch cache be shared across users (decided 2026-10-28) |
| `'cookie'` | The planner's own `cvent-auth` cookie token, read only inside `requireIdentity` | Cvent Event API (core-event), User API, my-cvent-service | These resolve the caller from token claims and accept planner scopes |
| `'decoratedServer'` | Minted from `API_KEY` with the session's verified `metadata.server` copied verbatim; one cached token per distinct payload (`getDecoratedServerBearerToken`, `bearer-token.ts:283`) | event-data only | event-data needs `event-integrations:read` (only the API key has it) **and** reads account/user from token metadata (decided 2026-10-29) |
| `API_KEY` header | `Authorization: API_KEY <key>` | IMS, passkey-authentication, passkey-reporting | These services cannot accept a bearer token |

Token cache behaviour (**Verified**, `src/lib/bearer-token.ts`): TTL 3600 s, re-mint at 80 % of
lifetime, decorated cache capped at `MAX_CACHED_TOKENS = 1000` (`:54`), the in-flight mint promise is
shared, and an unexpired previous token is kept if a refresh fails. `invalidateBearerToken`
(`:298`) drops a token when an upstream answers 401/403 (called from `toServiceError`). Mint failures
become 502. `auth.token` from `getAuthContext()` is a CSRF token, not a bearer token.

## Upstream client

**Verified** (`src/lib/upstream-client.ts`): one `JsonClient` per service (13 exports, `:58-70`).

- `preRequest: []` removes `withTraces()`, which stamps a fresh uuid header per request and would
  make every Next fetch-cache key unique (`:39-46`).
- Retries only on `GET` (`withIdempotentRetries`, `:24-30`), so mutations — including the link saga —
  are never replayed.
- `toServiceError` / `asServiceError` (`:100`, `:124`) convert a non-OK response into
  `ServiceError`, **clamping upstream 401/403 to 502** (an upstream auth failure is a server
  credential problem, not a user one) and optionally clamping more statuses (`alsoClamp`, e.g. 404
  on collection endpoints).

## Error model

**Verified.**

| Thrown | Route result (`handleRouteError`, `src/lib/route-utils.ts:92`) | Server-action result (`toActionError`, `src/lib/action-utils.ts:33`) |
|---|---|---|
| `ServiceError` 401/403/404/409 | Same status | `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `CONFLICT` |
| Any other `ServiceError` | 502 | `UPSTREAM_ERROR` |
| Anything else (incl. Zod parse failure) | 500 | `UNEXPECTED` |
| Invalid input (boundary `safeParse`) | 400 | `INVALID_INPUT` |

Both paths share `resolveErrorOutcome` (`route-utils.ts:82`). Server actions **return**
`ActionResult<T>` (`action-utils.ts:18`) instead of throwing because Next.js strips thrown error
messages in production (`CLAUDE.md`).

## Access guards

**Verified** (`src/lib/`). `ACCESS_DENIED_STATUSES = {401, 403, 404}` (`src/lib/errors.ts:5`).

| Guard | Used by | Rule | On denial |
|---|---|---|---|
| `checkCoreEventAccess(coreEventId)` (`checkCoreEventAccess.ts:21`) | API routes, actions | Cvent Event API `GET /v1/{id}/eventvisibility?id=me` with the cookie token; `unstable_cache` 1 h keyed on event + account + user stub + platform user (token is closed over, never in the key) | 401 unauthenticated, 403 denied |
| `assertCoreEventAccess` (`assertCoreEventAccess.ts:19`) | RSC page and layout | Wraps the check in React `cache` | Redirect to event selection (or `/login` in dev) |
| `checkPasskeyEventAccess(eventId)` (`checkPasskeyEventAccess.ts:30`) | `linkPasskeyRoomBlock` (`actions.ts:136`), `getPasskeyManageLink` (`actions.ts:243`), unlink/reg-link via `requireOwnershipOfLinkedEvent` (`src/server/data/event-link.ts:521`), `GET /api/events/[eventId]`, booking-pace compare | **Ownership**: `getEvent().isEventOwner` — `housingBillPartId` ∈ IMS participant ids | 403 |
| `checkLinkedPasskeyEventAccess(coreEventId, passkeyEventId)` (`checkLinkedPasskeyEventAccess.ts:28`) | Hotels, booking pace, room-night summary, room-nights pickup routes | Core guard, then `getLinkedPasskeyEventId(coreEventId) === passkeyEventId`; no IMS call | 403 |
| `checkTravelModuleSettings` (`checkTravelModuleSettings.ts:15`) | **No caller found** (Verified by grep, 2026-11-02) | Travel & housing modules (`EventTravel`, `HotelAccomodations`) must be on | 409 |
| `getRegistrationProviderRegLinkStatus` (`getRegistrationProviderRegLinkStatus.ts:16`) | **No caller found** (Verified by grep) — added in the GROUP-130999 commits on this branch | Linked guard, then passkey-integration registration-provider-info | — |

**Why 403 and not 404:** event ids are not secret, and 403 lets the UI say "request access" instead
of a misleading "not found" (`CLAUDE.md`).

## Caching

**Verified.** TTL constants in `src/lib/cache.ts:1-4`: 30 s, 15 min, 1 h, 12 h.

| Mechanism | Where | Purpose |
|---|---|---|
| Next fetch cache (`next: { revalidate }`) | Most `GET` fetchers | Shared across users for server-token services because the header is identical |
| `cache: 'no-store'` | event-data list, passkey-integration reads, reg-link provider info | Link state is read right after link/unlink; stale would show the wrong button |
| `unstable_cache` | `checkCoreEventAccess` | Share one visibility lookup between a page load and follow-up API calls |
| React `cache()` | `getEvent`, `getHotels`, `resolveCurrentIntegration`, `fetchHotels`, passkey-authentication fetchers | Per-request dedupe in RSC trees (does not dedupe inside route handlers — Inferred, Confidence: Medium) |
| Fetch tags | `passkeyUsersInfoTag` (`src/data/passkey-authentication/fetchPasskeyUsersInfo.ts:14`) | `refreshPasskeyAccount` drops it after the planner links an account |

## Rendering model

**Verified** (`src/app/events/housing/page.tsx`, `layout.tsx`): the layout runs
`assertCoreEventAccess`, `getLinkedPasskeyEventId` and `getCoreEvent` in parallel and provides
context; the page branches on `getEventLink`: unlinked → `UnlinkedLandingPage` + link section;
linked → `getEvent(passkeyEventId)` then title bar, room-block header, Insights data section and
hotel list. Each section's `server/` component starts its own data call; client components fetch
further pages/filters through hooks in `src/hooks/` against `GET /api/*`.

## Legacy / template parts

- `src/pages/api/graphql.ts` (Pages Router) with a mock user resolver; subscriptions code
  (`src/server/subscription.ts`) is unused. **Verified.**
- `src/app/api/products/[product]/items/route.ts`: planner-navigation product items endpoint
  from the template. See [known-issues-roadmap.md](known-issues-roadmap.md).

Related: [api-reference.md](api-reference.md) · [dependency-map.md](dependency-map.md) ·
[adr/README.md](adr/README.md)

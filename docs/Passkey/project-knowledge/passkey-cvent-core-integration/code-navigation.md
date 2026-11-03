---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: code-navigation
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [navigation, where-is, files, entry-points, lookup]
---

# Code Navigation ("Where is X?")

Path convention: `src/...` is relative to `packages/housing/app/`. Every path below was checked
against the tree at commit `61e748e`.

## Entry points

| Looking for | Go to |
|---|---|
| The housing page | `src/app/events/housing/page.tsx` |
| Server actions (link, unlink, reg-link, magic link, refresh account) | `src/app/events/housing/actions.ts` |
| Request middleware (auth, `evtstub` redirect, dev login) | `src/middleware.ts` |
| Root layout and providers | `src/app/layout.tsx`, `src/components/AppProviders.tsx` |
| Housing layout (core event context, nav) | `src/app/events/housing/layout.tsx` |
| Server start | `server.js` |
| APM + LaunchDarkly startup | `src/instrumentation.ts` |
| Dev login (local only) | `src/app/login/` |

## By concern

| Concern | Files |
|---|---|
| Session identity schema, `parseAuthMetadata` | `src/lib/auth-metadata.ts` |
| Token choice per service (`requireIdentity`) | `src/lib/auth-metadata.ts:124-129` |
| Server / decorated-server token minting | `src/lib/bearer-token.ts` |
| Upstream clients, 401/403 → 502 clamp | `src/lib/upstream-client.ts` |
| `ServiceError`, `ACCESS_DENIED_STATUSES` | `src/lib/errors.ts:5-7` |
| Route error mapping (`resolveErrorOutcome`, `handleRouteError`) | `src/lib/route-utils.ts:82`, `:92` |
| Server action result type, `toActionError` | `src/lib/action-utils.ts` |
| Cvent event guard | `src/lib/checkCoreEventAccess.ts`, `src/lib/assertCoreEventAccess.ts` |
| Passkey ownership guard | `src/lib/checkPasskeyEventAccess.ts` |
| Linked-event read guard | `src/lib/checkLinkedPasskeyEventAccess.ts` |
| Link/unlink logic, Record A/B, rollback | `src/server/data/event-link.ts` |
| Action argument schemas | `src/lib/event-link-params.ts` |
| Event search + ownership (`getEvent`, `getEvents`) | `src/server/data/events.ts` |
| `/api/events` query schema | `src/lib/event-search-params.ts` |
| Hotel list + distances + logos | `src/server/data/hotels.ts`, `src/lib/hotel-list.ts` |
| Hotel map locations | `src/server/data/event-map.ts`, `src/app/events/housing/HotelMap/` |
| Inventory (pickup, room night summary) | `src/server/data/inventory.ts`, `src/lib/inventory-query.ts` |
| Booking pace | `src/server/data/booking-pace.ts`, `src/lib/booking-pace-chart.ts` |
| Registrants booked / not booked | `src/server/data/registration-summary.ts` |
| Insights filters | `src/server/data/room-block-data-filters.ts` |
| Passkey account flyout | `src/server/data/passkey-user-profile.ts` |
| Magic link + account selection | `src/data/my-cvent/createPasskeyManageMagicLink.ts`, `selectOwnerAccount.ts`, `selectUserAccount.ts` |
| IMS participant lookup | `src/data/ims/fetchAccountMappingParticipantIds.ts` |
| Upstream Zod schemas | `src/types/upstream/*.ts` |
| ViewModel schemas | `src/types/view-models/index.ts` |
| Server-internal types | `src/types/internal/passkey-identity.ts` |
| Client fetch hooks | `src/hooks/` |
| Bounded concurrency helper | `src/lib/map-with-concurrency.ts` |
| Date formatting | `src/lib/format-event-date.ts`, `src/lib/format-numeric-date.ts` |
| Analytics events | `src/analytics/actions/` |
| Feature flags | `src/launchdarkly/` |
| Logger | `src/logging/Logger.ts` |
| Runtime config split | `src/config/getConfig.ts` |
| Routes constants | `src/navigation/routes.ts` |

## UI sections (`src/app/events/housing/`)

Each section has `server/` (starts reads, passes promises) and `client/` (renders).

| Section | Purpose |
|---|---|
| `UnlinkedLandingPage.tsx`, `LinkRoomBlock/` | Unlinked state and link modal |
| `LinkedLandingPage.tsx`, `LinkedLandingPageTitleBar/` | Linked state, title bar, account flyout |
| `RoomBlockHeaderSection/` | Header with unlink modal |
| `RoomBlockData/` | Insights card, filters, tabs |
| `RoomNightsPickup/`, `RoomNightSummary/`, `BookingPace/` | Insights tabs |
| `HotelList/`, `HotelMap/` | Hotel list and map |
| `PasskeyLogin/` | `@cvent/my-cvent-bridge-widget` login modal |

## API routes (`src/app/api/`)

`events/route.ts`, `events/[eventId]/route.ts`, `…/hotels`, `…/booking-pace`,
`…/booking-pace/compare`, `…/room-nights-pickup`, `…/room-night-summary`, `ok`, `version-info`,
`products/[product]/items`. Details: [api-reference.md](api-reference.md).

## Template leftovers

`src/app/apollo/`, `src/pages/api/graphql.ts`, `src/server/resolver.ts`,
`src/server/resolvers/userProfile.ts`, `src/server/subscription.ts` — see
[architecture.md#legacy--template-parts](architecture.md#legacy--template-parts).

## Infra and tests

| Looking for | Go to |
|---|---|
| Environments | `packages/housing/infra/bin/<env>.ts` |
| Runtime secrets wiring | `packages/housing/app/bin/shared/commonProps.ts` |
| Octopus pipelines | `packages/housing/app/bin/pipeline.ts`, `packages/housing/infra/bin/pipeline.ts` |
| Jest config | `jest` block in `packages/housing/app/package.json` |
| Integration test | `packages/housing/it/src/ok.test.ts` |
| E2E test | `packages/housing/e2e/src/UnlinkedLandingPage.spec.ts` |

Related: [directory-structure.md](directory-structure.md) · [dependency-map.md](dependency-map.md)

---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: dependency-map
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [dependencies, upstream-services, env-vars, auth, module-graph, caching]
---

# Dependency Map

Path convention: `src/...` is relative to `packages/housing/app/`. Diagram:
[diagrams/service-dependencies.mmd](diagrams/service-dependencies.mmd).

## Upstream services

**Verified.** There are 13 upstream clients, one `JsonClient` singleton per service
(`src/lib/upstream-client.ts:58-70`). Each file in `src/types/upstream/` opens with a header
naming the service, env var, path prefix and auth. File names are not always the service name
(`events.ts` → passkey-event, `hotels.ts` → passkey-hotel, `booking-pace.ts` → passkey-reporting,
`inventory.ts`, `event-housing.ts`, `room-type-data.ts`, `passkey-identity.ts` →
passkey-authentication); see [documentation-audit.md](documentation-audit.md).

| Service | Client | Base URL env var | Auth | Endpoints used | Cache (Next fetch `revalidate`) |
|---|---|---|---|---|---|
| core-event (Cvent Event API) | `coreEventClient` | `CVENT_EVENT_API_URL` | `cookie` token | `GET /v1/{id}/eventvisibility?id=me`; `GET /v1/{id}/EventRegistrationSummary`; `GET /v1/{id}/HotelRequestDetails` (paged, concurrency 4); `GET /v1/{id}/eventFeatureSetup`; `eventHotelRequestSetup` and `PATCH EventFeatureSetup` have no caller | 1 h visibility; 30 s registration/requests |
| event-data | `eventDataClient` | `CVENT_EVENT_DATA_SERVICE_URL` | `decoratedServer` token | `POST`/`GET /v1/events/{id}/integrations`; `DELETE /v1/events/{id}/integrations/{product}/{resourceId}` | `no-store` |
| IMS (Identity Mapping Service) | `imsClient` | `IMS_SERVICE_URL` | `API_KEY` header | `GET /v2/accountmapping/find?environment=…&accountId=…&accountType=CORE` | 15 min |
| User API | `userClient` | `CVENT_USER_API_URL` | `cookie` token | `GET /v1/Permissions/event/{id}` | 30 s |
| my-cvent-service | `myCventClient` | `MY_CVENT_SERVICE_URL` | `cookie` token | `GET /v1/parent-user`; `GET /v1/parent-user/{id}/user-accounts` (≤ 20 pages); `POST …/user-accounts/{accountId}/login` | — (login never retried) |
| passkey-authentication | `passkeyAuthenticationClient` | `PASSKEY_AUTHENTICATION_SERVICE_URL` | `API_KEY` header | `GET /v1/my_cvent/passkey_users_info?platformUserId=`; `GET /v1/users/identity?userId=` | 15 min (tag `passkey-users-info:<id>`); 12 h |
| passkey-reporting | `passkeyReportingClient` | `PASSKEY_REPORTING_SERVICE_URL` | `API_KEY` header | `GET /v1/pace/{id}` | 15 min |
| passkey-event | `passkeyEventClient` | `PASSKEY_EVENT_SERVICE_URL` | `server` token | `/v5/events/{id}/event-info`; `/v5/events/{id}/venues`; `/v1/events/{id}/hotels/{hotelId}/location`; `/v1/events/{id}/attendee-group-types`; `POST /v1/images/bulk-get/by-participant`; `/v2/events` search | 15 min; images 1 h; search 30 s |
| passkey-hotel | `passkeyHotelClient` | `PASSKEY_HOTEL_SERVICE_URL` | `server` token | `/v2/hotels`; `/v1/hotels` | 30 s; 15 min |
| passkey-integration | `passkeyIntegrationClient` | `PASSKEY_INTEGRATION_SERVICE_URL` | `server` token | `/passkey-integration/v5/events/{id}/platform-integrations[/{integrationId}]` (POST, GET, PATCH, DELETE); `/registration-provider-info` | `no-store` |
| passkey-inventory | `passkeyInventoryClient` | `PASSKEY_INVENTORY_SERVICE_URL` | `server` token | `/v1/inventory/event/{id}/search?skipPlannerSettings=true…` | 30 s |
| passkey-room-type-data | `passkeyRoomTypeDataClient` | `PASSKEY_ROOM_TYPE_DATA_SERVICE_URL` | `server` token | `/v1/events/{id}/room-type-info?hotelId=` | 15 min |
| passkey-event-housing | `passkeyEventHousingClient` | `PASSKEY_EVENT_HOUSING_SERVICE_URL` | `server` token | `/v1/events/{eventId}/hotels/{hotelId}/rooms/{roomId}` | 15 min |

Plus `AUTH_SERVICE`, used by `src/lib/bearer-token.ts` to mint the `server` and `decoratedServer`
tokens from `API_KEY`.

**Why three tokens:** see [architecture.md#bearer-tokens](architecture.md#bearer-tokens) and
[adr/ADR-0002-three-bearer-tokens.md](adr/ADR-0002-three-bearer-tokens.md).

## Composer → fetcher graph

**Verified** from imports (`grep @data/` in `src/server/data/*.ts`).

| Composer (`src/server/data/`) | Uses `src/data/…` |
|---|---|
| `event-link.ts` | event-data, ims, passkey-event, passkey-integration |
| `events.ts` | ims, passkey-event |
| `hotels.ts` | passkey-event, passkey-hotel |
| `event-map.ts` | passkey-event, passkey-hotel |
| `inventory.ts` | passkey-inventory |
| `booking-pace.ts` | passkey-event, passkey-reporting |
| `registration-summary.ts` | core-event, user |
| `room-block-data-filters.ts` | passkey-event, passkey-event-housing, passkey-hotel, passkey-room-type-data |
| `passkey-user-profile.ts` | my-cvent, passkey-authentication, passkey-event |

Guards (`src/lib/`):

| Guard | Depends on |
|---|---|
| `checkCoreEventAccess` | `@data/core-event` (visibility) |
| `assertCoreEventAccess` | `checkCoreEventAccess` |
| `checkPasskeyEventAccess` | `getEvent` (`@server/data/events`, which calls IMS + event-info) |
| `checkLinkedPasskeyEventAccess` | `checkCoreEventAccess` + `getLinkedPasskeyEventId` (`@server/data/event-link`) |

Note that guards in `src/lib` import from `src/server/data` — the dependency is not strictly
layered top-down (Verified; Inferred to be intentional since the guard needs the composed
`isEventOwner` rule, Confidence: Medium).

## Platform dependencies

| Dependency | Used for | Where |
|---|---|---|
| `@cvent/nextjs` | Auth middleware, `getAuthContext`, cookie token, server start, health routes | `src/middleware.ts`, `server.js`, `src/app/api/ok` |
| `@cvent/fetch` | `JsonClient`, `ResponseNotOk` | `src/lib/upstream-client.ts` |
| `@cvent/planner-navigation` | Planner shell nav and sitemaps | `src/components/TopNavigation.tsx`, `src/navigation/sitemaps` |
| `@cvent/my-cvent-bridge-widget` | Passkey login modal + its own server actions | `src/app/events/housing/PasskeyLogin/` |
| LaunchDarkly | Feature flags (global rebrand) | `src/launchdarkly/` |
| Google Maps | Hotel map tiles | `src/app/events/housing/HotelMap/` |
| Datadog | Logs, APM, RUM | `src/logging`, `src/instrumentation.ts` |

## Package dependencies inside the monorepo

`@cvent/housing` depends on `@cvent/housing-infra`, `-it`, `-e2e`, `-model` (`workspace:*`). The
runtime CDK entry points in `packages/housing/app/bin/` import infra definitions from
`@cvent/housing-infra/bin/<env>`, and the app pipeline depends on the infra pipeline stack.

Related: [technology-stack.md](technology-stack.md) · [architecture.md](architecture.md)

---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: data-model
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [data-model, zod, upstream-schema, viewmodel, event-link, entities]
---

# Data Model

Path convention: `src/...` is relative to `packages/housing/app/`. ER diagram:
[diagrams/entity-relationships.mmd](diagrams/entity-relationships.mmd).

## No local database

**Verified.** The app has no database, ORM or migrations. All persistent state lives in upstream
services. The data model is three kinds of TypeScript/Zod types:

| Kind | Folder | Rules (from `CLAUDE.md`) |
|---|---|---|
| Upstream schemas | `src/types/upstream/` (13 files, one per service) | Mirror the wire format; no `.transform()`, no invented fields; parsed with `.parse()` (failure → 500) |
| ViewModels | `src/types/view-models/index.ts` | Client contract; ids are strings; built by named mapping functions, then `.parse()`d |
| Internal types | `src/types/internal/passkey-identity.ts` | Plain types with numeric ids that never reach the client |

## Event link

**Verified** (`src/server/data/event-link.ts`). Linking a Cvent event to a Passkey event writes
**two records in two services**. This is the central entity of the app.

| Record | Service | Key | Fields used | Schema |
|---|---|---|---|---|
| **A — event integration** | event-data (`CVENT_EVENT_DATA_SERVICE_URL`) | (core event, `product='passkey'`, `resourceId=<passkeyEventId>`) | `id`, `eventId`, `product`, `resourceId`, `type='roomBlock'`, `configuredBy`, `configuredAt` | `EventIntegrationUpstream` (`src/types/upstream/event-data.ts:25`) |
| **B — platform integration** | passkey-integration (`PASSKEY_INTEGRATION_SERVICE_URL`) | (`passkeyEventId`, `integrationId = A.id`) | `linkedParticipantId` (= event's `housingBillPartId`), `accountMappingId` (from session), `regLinkIntegrationState`, `environmentName`, audit fields | `EventPlatformIntegrationUpstream` (`src/types/upstream/passkey-integration.ts:35`) |

- **Why two records:** event-data is the Cvent-side registry of what is attached to a Cvent event
  and is the only per-planner write check in the link flow; passkey-integration holds the
  Passkey-side configuration (owner participant, account mapping, RegLink state). Record B is keyed
  by A's id so the two can be joined (Verified from comments at `event-link.ts:296-303`; the
  "only per-planner write check" framing is from the code comments — Confidence: High).
- **Order:** create A, then B; if B fails, delete A and rethrow (`createLink`, `event-link.ts:304`).
  Unlink deletes A first, then B best-effort (`removeLinks`, `:363`;
  `deletePlatformIntegrationBestEffort`, `:337`).
- **Current link selection:** integrations with `product='passkey'` and type `roomBlock` are
  sorted newest first by `configuredAt`; if more than one exists, the newest wins and an error is
  logged (`selectCurrentIntegration`, `:237`).
- **Stand-in:** every event-data call uses `EVENT_DATA_CORE_EVENT_ID_STAND_IN` instead of the real
  core event id (`:79-88`, TEMPORARY GROUP-130619). As a result `EventLinkViewModel.cventEventId`
  (copied from A's `eventId`) is the stand-in id today (Inferred, Confidence: High).

### RegLink state

`RegLinkIntegrationStateUpstream = NOT_REQUESTED | PENDING | CONNECTED | FAILED`
(`passkey-integration.ts:32`). Link sets `CONNECTED` when the planner enables RegLink, otherwise
`NOT_REQUESTED` (`toRegLinkIntegrationState`, `event-link.ts:154`). Only `NOT_REQUESTED` and
`CONNECTED` are settable by the update action (`settableRegLinkIntegrationStateSchema`,
`src/lib/event-link-params.ts:27`). `CONNECTED`/`PENDING` are meant to block unlink
(`REG_LINK_STATES_BLOCKING_UNLINK`, `event-link.ts:91`) but the 409 is commented out
(`:373-377`).

## Identity entities

| Entity | Source | Key fields | Notes |
|---|---|---|---|
| Session metadata | `cvent-auth` session, parsed by `serverMetadataSchema` (`src/lib/auth-metadata.ts:23-28`) | `coreAccountId` (from `core.id`), `userStub`, `platformUserId`, `accountMappingId` | Only place that names the session shape |
| IMS (Identity Mapping Service) account mapping | `GET /v2/accountmapping/find?accountType=CORE` (`src/data/ims/fetchAccountMappingParticipantIds.ts`) | `accounts[]` with `id`, `type` | Only `PASSKEY_ORG` and `PASSKEY_HOTEL` ids become `participantIds` (`:17`); `200 []` or a CORE-only mapping gives `[]` |
| my-cvent parent user and user accounts | `src/types/upstream/my-cvent.ts:24-66` | `account.id` (= Passkey participant), `product.id` (= `PASSKEY_MANAGE_PRODUCT_ID`), `active`, `account.status` (`LINKED`/`NOT_LINKED`), `lastAccessed`, `lastModified` | Used to pick the account for the magic link |
| Passkey user identity | passkey-authentication `/v1/users/identity` (`src/types/upstream/passkey-identity.ts:34`) | userId, participantId, names, email | Mapped to internal `PasskeyUserIdentity` |

## Passkey domain entities (upstream)

| Entity | Schema (file:line) | Key fields |
|---|---|---|
| Passkey event detail | `EventDetailUpstream` (`src/types/upstream/events.ts:55`) | `id`, `name`, `startDate`, `endDate`, `address{city,state,country{name,alpha2Code}}`, `hd` (hotel-direct), `housingBillPartId`, optional lat/long |
| Event search result | `EventSearchResultUpstream` (`events.ts:132`) | `id` only — details are hydrated via event-info |
| Venue | `EventVenueUpstream` (`events.ts:97`) | `id`, `name`, `address`, lat/long, `default`, `visibility[]` |
| Attendee group type | `AttendeeGroupTypeUpstream` (`events.ts:34`) | `groupTypeId`, `groupTypeName` |
| Hotel | `HotelUpstream` (`src/types/upstream/hotels.ts:18`) | `hotelId` (number), `name`, address parts, amenities, lat/long |
| Hotel distance | `HotelLocationUpstream` (`events.ts:155`) | `distance`, `distanceUnit` (`NONE`, `BLOCK`, `YARD`, `MILE`, `METER`, `KILOMETER`) |
| Hotel image | `OwnedImageUpstream` (`events.ts:165`) | `url`, `participantId` |
| Room type info | `RoomTypeInfoUpstream` (`src/types/upstream/room-type-data.ts:18`) | hotel ↔ room-type pairing |
| Room details | `RoomDetailsUpstream` (`src/types/upstream/event-housing.ts:19`) | `name` only |
| Inventory night | `InventoryNightUpstream` (`src/types/upstream/inventory.ts:25`) | one row per date × hotel × room type: block, pickup, guaranteed, available |
| Event inventory summary | `EventInventoryUpstream` (`inventory.ts:39`) | totals; percentages omitted when contract nights are 0 |
| Booking pace | `BookingPaceUpstream` (`src/types/upstream/booking-pace.ts:21`) | `eventId`, optional `startDate`/`endDate`, `hotelIds`, `groupTypeIds`, `pace[]{date,pickup,pickupPercent,daysOff}` — **intentionally incomplete** (GROUP-130936) |

## Cvent core entities (upstream)

| Entity | Schema | Key fields |
|---|---|---|
| Event visibility | `CventEventVisibilityUpstream` (`src/types/upstream/core-event.ts:20`) | `IsVisible` |
| Travel module settings | `TravelModuleSettingsGetUpstream` (`core-event.ts:26`) | `TravelAndHousing.EventTravel`, `.HotelAccomodations` (upstream spelling) |
| Hotel request setup | `HotelRequestSetupUpstream` (`core-event.ts:47`) | PascalCase config; **no caller** |
| Registration summary | `EventRegistrationSummaryUpstream` (`core-event.ts:81`) | `RegisteredCount` and other counts |
| Hotel request details | `HotelRequestDetailsUpstream` (`core-event.ts:108`) | `Count` (paging total), `Value[]{InviteeStub}` |
| User event permissions | `EventUserPermissionsUpstream` (`src/types/upstream/user.ts:19`) | `Permissions.EVENT_REPORTS_TRAVEL` (0 = no access) |

## ViewModels

**Verified** (`src/types/view-models/index.ts`).

| ViewModel | Line | Produced by | Consumed by |
|---|---|---|---|
| `EventLinkStatusViewModel` = `{status:'unlinked'}` \| `{status:'linked', link: EventLinkViewModel}` | 104 | `getEventLink` | `page.tsx` |
| `EventLinkViewModel` | 93 | `mapEventLink` (`event-link.ts:254`) | Room block header, data section |
| `EventDetailViewModel` (+ `isEventOwner`, `isHotelDirect`) | 126 | `getEvent` (`src/server/data/events.ts:99`) | Title bar, header, guards |
| `EventViewModel` (+ `status` OPEN/PRE_OPEN/CLOSED), `EventsViewModel` | 145, 156 | `getEvents` (`events.ts:202`) | Link modal, compare modal, `GET /api/events` |
| `CoreEventViewModel` | 65 | `getCoreEvent` (placeholder) | Layout context, link recommendation |
| `HotelListViewModel` / `HotelListItemViewModel` (`distanceFromEvent`, `imageUrl`) | 211, 200 | `getHotels` | Hotel list |
| `EventMapViewModel` (`primary-venue` \| `venue` \| `hotel`) | 250, 223 | `getEventMapLocations` | Hotel map |
| `RoomNightsPickupViewModel` (nights + `InventoryTotalsViewModel`) | 305 | `getRoomNightsPickup` | Room Nights Pickup tab |
| `RoomNightSummaryViewModel` | 327 | `getRoomNightSummary` (`aggregateNightsByDate`) | Room Night Summary tab |
| `BookingPaceViewModel` | 40 | `getBookingPace` | Booking Pace tab |
| `RegistrationSummaryViewModel` (`registrantsBooked`, `registrantsNotBooked`, `canRunReports`) | 319 | `getRegistrationSummary` | Registrants box |
| `RoomBlockDataFiltersViewModel` (attendee types + hotels/rooms) | 360 | `getRoomBlockDataFilters` | Filters |
| `PasskeyUserProfileViewModel` (`profile` nullable = "Add account") | 375 | `getPasskeyUserProfile` | Account flyout |
| `PaginationMetadata` | `src/lib/pagination.ts:8` | `buildPagination` (`:16`) | Paged lists; `totalPages = 0` when `totalCount = 0` |

### Derivation rules worth knowing

- `registrantsBooked` = distinct `InviteeStub` count across all hotel-request pages;
  `registrantsNotBooked = max(0, RegisteredCount − booked)`; `canRunReports` fails closed if the
  permission call fails (`src/server/data/registration-summary.ts:50`, `:72`).
- Hotel `distanceUnit: NONE` → `distanceFromEvent: null`; location/logo failures degrade to `null`
  instead of failing the list (`src/server/data/hotels.ts`).
- Map coordinates of `0/0` are treated as unlocated (`src/server/data/event-map.ts`).
- `getEvents` `totalCount` is a lower bound (fan-out search, PRELIMINARY GROUP-130939).

Related: [api-reference.md](api-reference.md) · [business-workflows.md](business-workflows.md)

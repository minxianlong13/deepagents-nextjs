---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: business-workflows
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [workflows, link, unlink, room-block, magic-link, insights, reglink]
---

# Business Workflows

Path convention: `src/...` is relative to `packages/housing/app/`. Link/unlink diagram:
[diagrams/business-workflow-link.mmd](diagrams/business-workflow-link.mmd).

These workflows are reconstructed from code and code comments. Business wording such as "room
block" comes from the UI and comments; nothing here comes from a product spec (none was found in
the repo).

## 1. Open the housing page

**Verified** (`src/app/events/housing/page.tsx`).

1. The planner opens `/events/housing?evtstub=<core event UUID>` from the Cvent planner. Without
   `evtstub` the middleware redirects (see [api-reference.md#middleware-rules](api-reference.md#middleware-rules)).
2. `assertCoreEventAccess(coreEventId)` checks Cvent event visibility and redirects on denial
   (`page.tsx:27`).
3. `getEventLink(coreEventId)` reads Record A from event-data and, when linked, Record B from
   passkey-integration (`src/server/data/event-link.ts:450`). If event-data answers 401/403 for
   the event, it counts as **unlinked** — the core guard already decided access (`:424-443`).
4. **Unlinked:** render `UnlinkedLandingPage` with the Link Room Block modal.
   **Linked:** read the Passkey event detail (`getEvent`) and render the linked page. A failure here
   goes to the error boundary — no partial page (`page.tsx:41-52`).

## 2. Link a room block (Passkey event)

**Who:** a planner whose core account has an IMS mapping to the Passkey participant that owns the
event (decided 2026-10-09, `CLAUDE.md`).

1. **Recommendations.** On every unlinked page load, `LinkRoomBlockSection` starts a search for
   Passkey events matching the core event's name, location and dates
   (`src/app/events/housing/LinkRoomBlock/server/LinkRoomBlockSection.tsx`). Because
   `getCoreEvent` is a placeholder, the recommendations are based on placeholder data today
   (Inferred, Confidence: High — `src/data/core-event/getCoreEvent.ts:12-21`).
2. **Search.** Typed searches go to `GET /api/events` (debounced 300 ms in `useEventSearch`).
   Events are found by searching every IMS participant of the caller, then hydrating each id
   via event-info (`getEvents`, `src/server/data/events.ts:202`).
3. **Submit.** The client calls `linkPasskeyRoomBlock(coreEventId, passkeyEventId, false)`
   (`actions.ts:118`). The action checks session, validates arguments, runs
   `checkCoreEventAccess` and `checkPasskeyEventAccess` (ownership).
4. **Data module** `linkEvent` (`event-link.ts:489`):
   - In parallel: resolve link inputs (event detail + IMS participants; re-assert ownership) and
     list existing integrations. Any existing Passkey integration → `409 CONFLICT`.
   - `createLink` (`:304`): create Record A (event-data), then Record B (passkey-integration,
     `integrationId = A.id`, `linkedParticipantId = housingBillPartId`, `accountMappingId` from
     the session, reg-link state from the opt-in).
   - If Record B fails, Record A is deleted (`rollbackEventIntegration`, `:274`). If that rollback
     fails too, an orphan Record A is logged.
5. On success the action revalidates `/events/housing`, so the page re-renders as linked in the
   same round trip.

**Known gaps:** a failed link is not surfaced; the modal just stays open (Verified,
`src/app/events/housing/UnlinkedLandingPage.tsx:28-35`). The duplicate-link check and the create
are not atomic; the code accepts that race and tolerates duplicates (newest wins on read, unlink
clears all; Verified, `src/server/data/event-link.ts:40-44`). See
[known-issues-roadmap.md](known-issues-roadmap.md).

## 3. Unlink

1. Only shown as enabled when `passkeyEvent.isEventOwner` is true (header disables it otherwise).
2. `unlinkPasskeyRoomBlock(coreEventId)` (`actions.ts:151`) → `unlinkEvent` (`event-link.ts:530`):
   - event-data 404 for the event, or no Record A → `'already-unlinked'` (success; idempotent).
   - Ownership of the linked Passkey event is checked **before** anything is deleted
     (`requireOwnershipOfLinkedEvent`, `:516`). Reason, from the comment at `:556-561`:
     event-data's own write check knows only the Cvent event and would not stop a planner without a
     Passkey mapping.
   - `removeLinks` deletes every Record A, then each Record B best-effort. 404 counts as already
     deleted.
   - An active reg-link (`CONNECTED`/`PENDING`) was meant to block unlink with `409`; that check is
     commented out pending GROUP-130999 (`:373-377`).
3. **Switch** = unlink then link from the client; there is no switch action (`actions.ts:52-53`).

## 4. Read-only linked page (no IMS mapping)

**Verified.** A planner who can see the Cvent event but has no Passkey mapping (`participantIds`
empty) still sees the linked page. Reads go through `checkLinkedPasskeyEventAccess`, which needs
only Cvent event access plus the server's own link record. Writes (unlink, switch, magic link) are
hidden or disabled in the UI and rejected on the server (`FORBIDDEN`). The account flyout and the
switch modal's reads are skipped for non-owners (`page.tsx:56-77`).

## 5. Insights (room block data)

The **Insights** card (`RoomBlockDataSection`) has three tabs plus filters. Initial data is
fetched server-side and streamed; filter changes refetch through `GET` routes.

| Tab / box | Server data | Client refetch | Upstream |
|---|---|---|---|
| Filters (attendee types, hotels/rooms, sub-block) | `getRoomBlockDataFilters` | — | passkey-event attendee-group-types, passkey-hotel `/v1/hotels`, passkey-room-type-data, passkey-event-housing (one call per room) |
| Room Nights Pickup | `getRoomNightsPickup` | `useRoomNightsPickup` → `/room-nights-pickup` | passkey-inventory search |
| Registrants booked / not booked | `getRegistrationSummary` | — | core-event EventRegistrationSummary + HotelRequestDetails (paged) + User API permissions |
| Room Night Summary | `getRoomNightSummary` | `useRoomNightSummary` → `/room-night-summary` | passkey-inventory search, aggregated by date |
| Booking Pace | `getBookingPace` (+ `getEvents` for the compare list) | `useBookingPaceComparison` → `/booking-pace/compare` | passkey-reporting `/v1/pace` |

- **Registrants** (`src/server/data/registration-summary.ts`): booked = distinct invitees with a
  non-cancelled hotel request; not booked = registered − booked (floored at 0). `canRunReports`
  comes from the User API permission `EVENT_REPORTS_TRAVEL` and fails closed.
- **Booking pace compare:** up to 2 other events (`MAX_COMPARED_EVENTS`,
  `src/lib/booking-pace-chart.ts:10`), only events the caller owns. A chart needs at least 2 data
  points (`MINIMUM_NUM_DATA_POINTS_FOR_CHART`).

## 6. Hotels list and map

- **List:** `HotelListSection` renders the first page server-side (12 per page); further pages via
  `useHotelPages` → `GET /api/events/{id}/hotels?evtstub=`. Each hotel gets a distance from the
  event and a logo; a failure of either degrades to `null` instead of failing the list
  (`src/server/data/hotels.ts`).
- **Map:** `HotelMapSection` (rendered inside `HotelListSection`) calls `getEventMapLocations`
  (`src/server/data/event-map.ts:92`) for venues and hotels, fetching hotels 100 at a time and
  warning past 10 pages. Uses Google Maps (`@vis.gl/react-google-maps`).

## 7. Edit in Passkey (magic link) and the account flyout

1. The owner clicks the Passkey button; the client calls `getPasskeyManageLink(coreEventId)`
   (`actions.ts:221`).
2. The server reads the linked Passkey event id from its own link record, re-checks ownership, then
   `selectOwnerAccount` (`src/data/my-cvent/selectOwnerAccount.ts:69`) picks, from the planner's
   my-cvent user accounts, those belonging to the event's owner participant, keeps loginable ones
   (active and `LINKED`), and chooses the most recently used (`selectMostRecentAccount`,
   `src/data/my-cvent/selectUserAccount.ts:39`).
3. With an account: `POST .../login` on my-cvent returns a **single-use magic link**; the login
   `state` is base64 JSON `{targetEventId, accountId, username?}`, percent-encoded once to survive a
   double URL-decode in the Passkey servlet (`src/data/my-cvent/createPasskeyManageMagicLink.ts`).
   The client opens it in a new tab.
4. Without one (`no-parent-user`, `no-matching-accounts`, `no-owner-account`, `none-loginable`):
   `login-required` with `platformUserId` and the Passkey Manage product id, and the client opens
   `PasskeyLoginModal` (the `@cvent/my-cvent-bridge-widget` login).
5. After a successful widget login the client calls `refreshPasskeyAccount()`, which invalidates
   the caller's 15-minute `passkey_users_info` cache so the flyout stops showing "Add account".

The **account flyout** (`getPasskeyUserProfile`, `src/server/data/passkey-user-profile.ts:80`) uses
the same selection rule and shows the Passkey user's name/email/account, or `profile: null`
("Add account").

## 8. RegLink (Cvent Registration ↔ Passkey housing)

**Partial.** The state lives on Record B. Link always sends `enableRegLinkIntegration = false`
because the checkbox was removed pending an accessible design (`src/lib/event-link-params.ts:12-18`).
`updatePasskeyRegLinkIntegration` can set `NOT_REQUESTED`/`CONNECTED` but no UI calls it (TODO
GROUP-130999, `actions.ts:175`). `checkTravelModuleSettings` and
`getRegistrationProviderRegLinkStatus` exist with no caller. What turns `PENDING`/`FAILED` on is
outside this repo (Unknown).

Related: [data-model.md](data-model.md) · [api-reference.md](api-reference.md) ·
[architecture.md#access-guards](architecture.md#access-guards)

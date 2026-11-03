---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: known-issues-roadmap
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [known-issues, tech-debt, todo, roadmap, risks, tickets]
---

# Known Issues and Roadmap

Path convention: `src/...` is relative to `packages/housing/app/`.

No roadmap document exists in the repo. The roadmap below is only the work that **code comments
name** (TODOs and ticket ids). Ticket ids are Jira keys (`GROUP-…`) or beads ids as written in the
code; their status outside the repo is Unknown.

## Stand-ins and temporary code

| Issue | Where | Impact | Ticket |
|---|---|---|---|
| Every event-data call targets one **stand-in core event id** instead of the real one | `src/server/data/event-link.ts:81-89` | Link records for all Cvent events share one event-data event; the linked-event read guard is only as tight as that lookup | GROUP-130619, bead `vd7` |
| `getCoreEvent` returns a hard-coded placeholder event | `src/data/core-event/getCoreEvent.ts:5-22` | Link-modal recommendations are based on placeholder name, dates and location for every event | — (TODO) |
| `getEvents` search is a fan-out over `/v2/events` | `src/server/data/events.ts:189-200` | `totalCount` is a floor; no relevance ranking; requests grow as participants × words × statuses | GROUP-130939 (PRELIMINARY) |
| Booking-pace and some event contracts are intentionally incomplete | `src/types/upstream/booking-pace.ts:10`, `src/types/upstream/events.ts:17` | Do not fill with guessed fields | GROUP-130936 |

## Incomplete features

| Issue | Where | Ticket |
|---|---|---|
| Unlink is not blocked by an active reg-link (`CONNECTED`/`PENDING`); the 409 check is commented out | `src/server/data/event-link.ts:373-377` | GROUP-130999 |
| `updatePasskeyRegLinkIntegration` has no UI caller | `src/app/events/housing/actions.ts:175` | GROUP-130999 |
| RegLink opt-in checkbox removed; link always sends `false` | `src/lib/event-link-params.ts:12-18` | — |
| Passkey SSO login disabled in the login modal | `src/app/events/housing/PasskeyLogin/client/PasskeyLoginModal.tsx:49-50`, `:76` | GROUP-132845 |
| Login modal: no loading or "no access" state (mock lacks them) | `PasskeyLoginModal.tsx:52-56` | TODO(mock) |
| Account flyout: no loading or failure state | `src/app/events/housing/LinkedLandingPageTitleBar/client/PasskeyAccountFlyout.tsx:182` | TODO(mock) |
| Insights error alert copy is a placeholder | `src/app/events/housing/RoomBlockData/client/RoomBlockDataErrorAlert.tsx:14` | GROUP-131416 |
| Attendee type list not paginated; waiting on a V5 endpoint | `src/types/view-models/index.ts:16-19` | GROUP-132034 |
| Venues not filtered to `PLANNER_PORTAL` visibility | `src/data/passkey-event/fetchEventVenues.ts:15-16` | GROUP-133634 |
| Map pin label uses hard-coded hex instead of Carina tokens | `src/app/events/housing/HotelMap/client/EventMapPinLabel.tsx:96` | GROUP-133634 |
| my-cvent account lookup not narrowed by `platformUserId` | `src/data/my-cvent/resolveUserAccounts.ts:58-59` | — (TODO) |
| `ScreenProvider` wrapper to remove once Carina ships a fix | `src/components/ScreenProvider.tsx:41` | — (TODO) |

## Risks found by reading the code

These are **Inferred** from the code; none is reported in an issue the repo contains.

| Risk | Detail | Confidence |
|---|---|---|
| Duplicate-link race | event-data allows several integrations per event, so "one link per event" is a pre-create list check; "the residual race window is accepted". Reads then use the newest record and unlink clears them all (`src/server/data/event-link.ts:40-44`) | **Verified** (accepted trade-off) |
| A failed link is not surfaced | The modal stays open and re-enables; "it has no error states yet" (`src/app/events/housing/UnlinkedLandingPage.tsx:28-35`). Search errors *are* shown (`LinkRoomBlockModal.tsx:233-240`) | **Verified** |
| One upstream call per room for insights filters | `fetchRoomDetails` is called per room in `room-block-data-filters.ts` | High |
| `GET /api/events/[eventId]` calls `getEvent` twice | Once in `checkPasskeyEventAccess`, once for the response | High |
| `HotelRequestDetails` can time out | The comment records about 58 s for a 1000-row page on the slowest known event, against a 20 s client timeout; "such an event fails the whole read" until the page size drops to about 250 (`src/data/core-event/fetchHotelRequestDetails.ts:30-38`) | **Verified** |
| Products items route is weak | Checks only that an `Authorization` header exists; returns error messages; translate is a TODO (`src/app/api/products/[product]/items/route.ts:29`) | High |

## Unused or uncalled code

**Verified** (no callers outside tests): `checkTravelModuleSettings` (`src/lib/`),
`getRegistrationProviderRegLinkStatus` (`src/lib/`), `updateTravelModuleSettings` and
`fetchTravelHotelRequestSetup` (`src/data/core-event/`). No in-app client calls
`GET /api/events/[eventId]` or `GET /api/events/[eventId]/booking-pace`. Template leftovers: mock
GraphQL (`src/pages/api/graphql.ts`), Apollo client, Redis subscription (`src/server/subscription.ts`).
`src/data/cvent-event/` contains only an empty `__tests__/`.

## Testing and tooling gaps

- E2E spec is `test.skip`; IT covers only `/api/ok` ([testing-guide.md](testing-guide.md)).
- Local coverage summary is stale (2026-10-05, about 2.7%).
- pnpm version pins disagree (mise 10.32.1 vs `packageManager` 10.8.0).
- Jenkins and GitHub Actions both define the build ([deployment-operations.md#ci](deployment-operations.md#ci)).

Related: [documentation-audit.md](documentation-audit.md) · [technical-decisions.md](technical-decisions.md)

---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: overview
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [overview, housing, passkey, cvent-planner, room-block]
---

# Project Overview

Path convention: `src/...` is relative to `packages/housing/app/`. See [README](README.md#reference-conventions).

## What the application is

**Verified.** The repository ships one deployable web application, `@cvent/housing`
(`packages/housing/app/package.json`, version `0.0.47`). It is a Next.js App Router application
that acts as a **BFF (Backend-for-Frontend)**: the Node server authenticates the planner, calls a
set of Cvent core and Passkey backend services, validates every response with Zod, composes
**ViewModels** (client-facing data shapes), and renders a React UI from them
(`CLAUDE.md`, "Architecture").

It serves one product route, `/events/housing` (`src/navigation/routes.ts:2`), inside the Cvent
planner shell (planner navigation, `plannerApp: true` in
`packages/housing/infra/lib/commonProps.ts`). The AWS tags name the product
`passkey-for-planners-housing`, platform `passkey`, business unit `hospitality`
(`packages/housing/infra/lib/tags.ts`).

## Who uses it and why

**Verified from code; business framing Inferred (Confidence: Medium).**

- **Users:** Cvent event planners signed in to Cvent (session from the `cvent-auth` cookie, read
  through `@cvent/nextjs` auth middleware in `src/middleware.ts:101-117`).
- **Problem:** Hotel room blocks for an event are managed in **Passkey** (Cvent's hotel/housing
  platform), while the event itself lives in **Cvent core**. This app connects the two so a planner
  can see room-block data for their Cvent event without leaving the Cvent planner UI.

## What it does today

| Capability | Status | Where |
|---|---|---|
| Show an "unlinked" landing page with a Link Room Block modal that searches the caller's Passkey events | Built | `src/app/events/housing/UnlinkedLandingPage.tsx`, `LinkRoomBlock/` |
| Link a Passkey event (room block) to the Cvent event | Built | `linkPasskeyRoomBlock` in `src/app/events/housing/actions.ts:118` |
| Unlink it | Built (reg-link guard disabled) | `unlinkPasskeyRoomBlock` `actions.ts:151` |
| Linked page: title bar, room block header, Insights tabs (Room Nights Pickup, Room Night Summary, Booking Pace), hotel list, event map | Built | `src/app/events/housing/page.tsx` and section folders |
| Compare booking pace with up to 2 other events | Built | `src/lib/booking-pace-chart.ts:10`, `/api/events/[eventId]/booking-pace/compare` |
| Open the event in Passkey via a single-use magic link; account flyout with "Add account" | Built | `getPasskeyManageLink` `actions.ts:221`, `PasskeyAccountFlyout.tsx` |
| Enable/disable RegLink (registration ↔ housing integration) | **Partial**: server action exists, no UI calls it (TODO GROUP-130999, `actions.ts:175`) | `updatePasskeyRegLinkIntegration` `actions.ts:179` |
| Read the real Cvent event name/dates/location | **Not built**: `getCoreEvent` returns a hardcoded placeholder | `src/data/core-event/getCoreEvent.ts:12-21` |

## Access model in one paragraph

**Verified.** Every page requires the Cvent event id in the `evtstub` query param. Access to a
Cvent event is checked with the Cvent Event API visibility endpoint
(`src/lib/checkCoreEventAccess.ts:21`). **Writes** (link, unlink, reg-link) also require
**ownership**: the Passkey event's housing bill participant must be one of the Passkey
participants that IMS (Identity Mapping Service) maps to the planner's core account
(`src/lib/checkPasskeyEventAccess.ts:30`). **Reads** of an already-linked Passkey event only
require Cvent event access plus the server's own link record naming that Passkey event
(`src/lib/checkLinkedPasskeyEventAccess.ts:28`). See
[architecture.md#access-guards](architecture.md#access-guards).

## Scope boundaries

- The app does **not** own a database. All state lives in upstream services; the event link is two
  records in two services (see [data-model.md#event-link](data-model.md#event-link)).
- A GraphQL endpoint exists from the CDF (Cvent Development Framework) template
  (`src/pages/api/graphql.ts`) but serves a mock user profile and is not used by the housing UI
  (**Verified**: `src/server/resolvers/userProfile.ts`; no housing component imports Apollo hooks
  for housing data — Confidence: High).

## Related

- [architecture.md](architecture.md) · [business-workflows.md](business-workflows.md) ·
  [known-issues-roadmap.md](known-issues-roadmap.md) · [glossary.md](glossary.md)

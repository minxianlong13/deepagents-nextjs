---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: glossary
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [glossary, terms, acronyms, domain]
---

# Glossary

Terms as this repository uses them. Where a meaning comes only from context, it is marked
Inferred.

| Term | Meaning |
|---|---|
| **ADR** | Architecture Decision Record. A short note on one decision and why it was made; see [adr/](adr/README.md). |
| **APM** | Application Performance Monitoring; here Datadog `dd-trace` (`src/instrumentation.ts`). |
| **BFF** | Backend-for-Frontend. The Next.js server owns auth, upstream calls and the client contract (`CLAUDE.md`). |
| **CDF** | Cvent's app framework: CDK constructs (`@cvent/cdk-applications`), `@cvent/nextjs` and related packages. The expansion of the acronym is not stated in the repo (Unknown). |
| **CDK** | AWS Cloud Development Kit; infra is defined in TypeScript (`packages/housing/infra`). |
| **Composer** | Informal name in these docs for a module in `src/server/data/` that combines several fetchers into one ViewModel. |
| **Core / Cvent core** | The main Cvent event platform (Cvent Event API, User API, event-data, my-cvent), as opposed to Passkey. |
| **Core event / `coreEventId`** | The Cvent event (UUID) the housing page is opened for. |
| **Decorated server token** | A bearer token minted from `API_KEY` carrying the session's `metadata.server`; only for event-data. See [ADR-0002](adr/ADR-0002-three-bearer-tokens.md). |
| **`evtstub`** | Query parameter carrying the core event UUID (`/events/housing?evtstub=…`, and required on linked-event API routes). Validated by `coreEventIdSchema`. |
| **Fetcher** | Informal name for a function in `src/data/<service>/` that calls one upstream endpoint and parses it. |
| **`housingBillPartId`** | Field of Passkey event-info naming the participant billed for housing; the event's owner for access checks. |
| **IMS** | Identity Mapping Service. Maps a core account to Passkey participant ids (`/v2/accountmapping/find`). |
| **`isEventOwner`** | True when `housingBillPartId` is among the caller's IMS participant ids; computed by `getEvent()`. |
| **Link** | The pairing of a Cvent event with a Passkey event, stored as Record A + Record B. |
| **Linked-event read access** | Read permission derived from Cvent event access plus the link record (`checkLinkedPasskeyEventAccess`). |
| **Magic link** | Single-use URL from my-cvent that logs the planner into Passkey for an event (`createPasskeyManageMagicLink`). |
| **Ownership** | Write permission on a Passkey event (`checkPasskeyEventAccess`). |
| **Participant** | A Passkey account entity (organization) that owns events; ids come from IMS. Inferred, Confidence: Medium. |
| **Passkey** | Cvent's hotel room-block / housing management product, with its own services (`passkey-*`). |
| **Pickup** | Room nights actually booked against a block (Room Nights Pickup tab). Inferred from UI, Confidence: Medium. |
| **Planner** | The Cvent user who manages the event and uses this app. |
| **Record A** | The event-data integration record on the core event (`POST /v1/events/{id}/integrations`). |
| **Record B** | The passkey-integration platform-integration record, keyed by `integrationId = Record A id`. |
| **RegLink** | The Cvent Registration ↔ Passkey housing integration; state on Record B (`NOT_REQUESTED`, `PENDING`, `CONNECTED`, `FAILED`). |
| **Room block** | A set of hotel rooms reserved for an event; the UI's name for a Passkey event. |
| **RSC** | React Server Component. `page.tsx` and `server/` sections run on the server. |
| **Server action** | A Next.js `'use server'` function called from the client; this app's only mutation path. |
| **Server token** | One shared bearer token per process, minted from `API_KEY`, used for Passkey services. |
| **Cookie token** | The planner's own `cvent-auth` bearer token, used for core-event, User API, my-cvent. |
| **`ServiceError`** | Error carrying an HTTP status for the boundary to pass through or map (`src/lib/errors.ts:7`). |
| **Stand-in** | A temporary constant replacing a real value until an upstream is ready (event-data core event id; placeholder core event). |
| **ViewModel** | The stable, Zod-validated shape the server hands to the UI (`src/types/view-models/index.ts`). |
| **Upstream schema** | Zod schema mirroring one upstream response exactly (`src/types/upstream/`). |

Related: [README.md](README.md) · [data-model.md](data-model.md)

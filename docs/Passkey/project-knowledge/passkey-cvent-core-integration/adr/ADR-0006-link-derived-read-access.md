---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: adr
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [adr, access-control, ims, ownership]
---

# ADR-0006: Ownership gates writes; link-derived access gates reads

- **Status:** Accepted
- **Date:** 2026-10-09 (`CLAUDE.md`, "Passkey event access")

## Decision
- **Ownership** (`checkPasskeyEventAccess`, `src/lib/checkPasskeyEventAccess.ts`): the event's
  `housingBillPartId` is among the caller's IMS participant ids. Required for link, unlink,
  reg-link update, magic link and booking-pace compare.
- **Link-derived read access** (`checkLinkedPasskeyEventAccess`): Cvent event access plus the
  server's own link record names the Passkey event. No IMS call. Used by linked-event read routes,
  which take `evtstub` as a validated query param.
- Linking requires an IMS mapping. A planner without one sees a linked event read-only, with
  unlink disabled. There is no My Cvent fallback identity mapping.

## Consequences
- Teams without Passkey mappings can still view linked data.
- The read guard is only as tight as the event-data lookup, which uses a stand-in core event id
  until bead `vd7` / GROUP-130619 lands (`src/server/data/event-link.ts:81-89`).

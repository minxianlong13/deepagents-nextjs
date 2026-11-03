---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: adr
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [adr, event-link, saga, consistency]
---

# ADR-0005: The link is two upstream records, created A then B with rollback

- **Status:** Accepted (comments in `src/server/data/event-link.ts:40-60`, `:274-300`)
- **Date:** Not recorded

## Context
A link needs a record in event-data on the Cvent event (**Record A**) and a platform-integration
record in passkey-integration (**Record B**). There is no distributed transaction. Only event-data
enforces per-planner write rights; passkey-integration sees the shared server token.

## Decision
- **Link:** create A, then B (`integrationId = A.id`). If B fails, delete A
  (`rollbackEventIntegration`); if the rollback fails, log the orphan with `orphanContext`.
- **Unlink:** check Passkey ownership first, delete every A, then each B best-effort; 404 counts as
  deleted. Already-unlinked is a success.
- A is always touched before B, so a caller without event-data write rights fails before B.
  "Do not reorder those sagas."
- "One Passkey link per Cvent event" is enforced by a pre-create list check (409); "the residual
  race window is accepted". Reads use the newest record; unlink clears all.
- No switch operation: the client unlinks then links.

## Consequences
- Possible orphans are logged rather than prevented.
- Depends on non-GET calls never being retried; see [ADR-0009](ADR-0009-get-only-retries.md).

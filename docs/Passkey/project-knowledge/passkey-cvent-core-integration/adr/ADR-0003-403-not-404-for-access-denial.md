---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: adr
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [adr, access-control, http-status]
---

# ADR-0003: Access denial returns 403, not 404

- **Status:** Accepted (`CLAUDE.md`, "Cvent core event access guards")
- **Date:** Not recorded

## Context
Event ids travel in URLs and invitations, so they are not secret.

## Decision
Guards throw `ServiceError(403)` when the caller lacks access. `handleRouteError` and
`toActionError` pass 401/403/404/409 through (`src/lib/route-utils.ts:82-92`).

## Consequences
- The client can show actionable UI ("request access") instead of a misleading "not found".
- Event existence is not hidden; that is accepted because ids are not secret.
- Note: `ACCESS_DENIED_STATUSES` (`src/lib/errors.ts:5`) is {401, 403, 404}. It is the set of
  `ServiceError` statuses the guards *translate into* 403 (`src/lib/checkCoreEventAccess.ts:38`,
  `src/lib/checkPasskeyEventAccess.ts:38`); for example a Passkey event-info 404 becomes 403. It
  is separate from what the guard returns.

---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: adr
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [adr, errors, http-status, upstream]
---

# ADR-0007: Upstream 401/403 are clamped to 502

- **Status:** Accepted (`CLAUDE.md`, "Data modules"; `src/lib/upstream-client.ts:74-124`)
- **Date:** Not recorded

## Context
By the time a data module calls upstream, the route or action has already authenticated the
caller and run its guards.

## Decision
`toServiceError` maps upstream 401/403 to 502 and drops the cached bearer token that failed. An
`alsoClamp` option clamps extra statuses, for example 404 on search/collection endpoints whose
contract has no 404 (a bad base URL). Non-`ResponseNotOk` errors are rethrown and become 500.

## Consequences
- A broken API key or token shows as a gateway error, not as access denial to the planner.
- A real access denial is raised deliberately by the fetcher, not taken from an upstream 403: for
  example `fetchCoreEventVisibility` throws its own `ServiceError(403)` when `IsVisible` is false
  (`src/data/core-event/fetchCoreEventVisibility.ts:27-32`).

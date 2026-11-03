---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: adr
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [adr, auth, bearer-token, caching]
---

# ADR-0002: Three bearer tokens, chosen per upstream service

- **Status:** Accepted
- **Date:** shared server token decided 2026-10-28; decorated server token for event-data decided
  2026-10-29 (both dates in `CLAUDE.md`, "Identity in API routes")

## Context
Upstream services authorize differently. Passkey services authorize on the housing API key's
scopes and ignore token metadata. Cvent core services (core-event, User API, my-cvent) resolve the
caller from the token's claims. event-data needs a scope (`event-integrations:read`) the planner's
token never has, and reads the caller's account and user from token metadata.

## Decision
`requireIdentity(fields, { accessToken })` (`src/lib/auth-metadata.ts:124-129`) hands out one of:

| Kind | Minted from | Used for |
|---|---|---|
| `server` | `API_KEY` via `AUTH_SERVICE`, marker metadata only; one per process, re-minted at 80% of lifetime (`src/lib/bearer-token.ts`) | All Passkey services |
| `cookie` | The planner's `cvent-auth` cookie (read only inside `requireIdentity`) | core-event, User API, my-cvent |
| `decoratedServer` | `API_KEY`, carrying the session's verified `metadata.server` verbatim; one per distinct payload, capped at 1000 | event-data only |

Raw `API_KEY` only for IMS, passkey-authentication, passkey-reporting.

## Consequences
- With an identical `Authorization` header for every planner, Next's header-keyed fetch cache is
  shared across users for Passkey calls.
- event-data calls are `no-store`, so per-user tokens don't fragment the cache.
- Per-planner write authorization exists only at event-data; see [ADR-0005](ADR-0005-two-record-link-saga.md).
- Rotating `API_KEY` needs a restart (`catalog-info.yaml` annotation).

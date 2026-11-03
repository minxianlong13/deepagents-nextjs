---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: adr
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [adr, retries, idempotency, upstream]
---

# ADR-0009: Retry only GET requests

- **Status:** Accepted (`src/lib/upstream-client.ts:14-30`)
- **Date:** Not recorded

## Context
`@cvent/fetch`'s default retry predicate does not see the HTTP method, so it would replay a POST
on 429/502/503/504. A replayed create that had already committed returns 409, which the link saga
would misread.

## Decision
`withIdempotentRetries()` applies `withRetries()` only when the method is GET; other methods go
straight to `withOkayStatus()`. All methods still get a timeout.

## Consequences
- Writes can fail on a transient gateway error without retry; the saga handles that by rolling
  back ([ADR-0005](ADR-0005-two-record-link-saga.md)).
- my-cvent `login` (a POST) is never retried, so a magic link is never minted twice.

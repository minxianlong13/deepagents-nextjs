---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: adr
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [adr, caching, nextjs, fetch]
---

# ADR-0008: Drop trace middleware so the Next fetch cache can hit

- **Status:** Accepted (`src/lib/upstream-client.ts:43-54`)
- **Date:** Not recorded

## Context
`@cvent/fetch`'s default `withTraces()` stamps a fresh `HttpLogRequestId` on every request. Next
hashes request headers into its fetch cache key (only `traceparent`/`tracestate` are stripped).

## Decision
Every `JsonClient` is built with `preRequest: []`. The other default, `withHttpKeepAlive()`, is a
no-op, "so nothing else is lost".

## Consequences
- `next: { revalidate }` hints in data modules can hit the cache.
- Upstream calls no longer carry the per-request `HttpLogRequestId` header (Inferred impact on
  cross-service log correlation, Confidence: Medium).

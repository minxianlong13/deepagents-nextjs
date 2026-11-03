---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: adr
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [adr, bff, viewmodel, zod]
---

# ADR-0001: Next.js BFF with upstream schemas and ViewModels

- **Status:** Accepted (reconstructed from `CLAUDE.md`, "Architecture" and "Key rules")
- **Date:** Not recorded in the repo

## Context
The page combines data from up to 13 upstream services (`src/lib/upstream-client.ts:58-70`) whose
wire formats use numeric ids and shapes unsuited to the UI.

## Decision
The Next.js server is a Backend-for-Frontend. Each upstream response is `.parse()`d with a Zod
schema that mirrors the wire format exactly (no `.transform()`, no invented fields). When calls are
combined or the shape differs, an explicit named mapping function builds a **ViewModel**, which is
validated with its own schema (`src/types/view-models/index.ts`). Components receive whole
ViewModels and do their own formatting. Multi-call results are all-or-nothing.

## Consequences
- A parse failure is a server error (500), never a client error.
- The client contract is stable even when upstreams change.
- More code per feature: schema, fetcher, mapper, ViewModel schema, tests.

Evidence: `CLAUDE.md`; skills `viewmodel-contract`, `passkey-bff-shared-contracts`.

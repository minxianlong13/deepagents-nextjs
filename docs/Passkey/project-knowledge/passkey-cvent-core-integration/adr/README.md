---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: adr
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [adr, index]
---

# Architecture Decision Records

Each ADR records one decision **that the repository itself explains**, in `CLAUDE.md` or in code
comments. None of these are invented. Dates appear only where the repo states them. Status
"Accepted" means the code implements the decision today.

| ADR | Decision | Date in repo |
|---|---|---|
| [ADR-0001](ADR-0001-bff-viewmodel-contract.md) | Next.js BFF with upstream schemas and ViewModels | — |
| [ADR-0002](ADR-0002-three-bearer-tokens.md) | Three bearer tokens chosen per upstream service | 2026-10-28, 2026-10-29 |
| [ADR-0003](ADR-0003-403-not-404-for-access-denial.md) | Access denial returns 403, not 404 | — |
| [ADR-0004](ADR-0004-server-actions-for-mutations.md) | Server actions for mutations; GET routes for client reads | — |
| [ADR-0005](ADR-0005-two-record-link-saga.md) | Two-record link saga with rollback | — |
| [ADR-0006](ADR-0006-link-derived-read-access.md) | Ownership gates writes; link-derived access gates reads | 2026-10-09 |
| [ADR-0007](ADR-0007-clamp-upstream-auth-errors-to-502.md) | Upstream 401/403 clamped to 502 | — |
| [ADR-0008](ADR-0008-stable-fetch-cache-key.md) | `preRequest: []` for a stable fetch cache key | — |
| [ADR-0009](ADR-0009-get-only-retries.md) | Retry only GET requests | — |

Summary and smaller decisions: [../technical-decisions.md](../technical-decisions.md).

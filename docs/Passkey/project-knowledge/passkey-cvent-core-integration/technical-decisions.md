---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: technical-decisions
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [decisions, rationale, trade-offs, adr]
---

# Technical Decisions

Path convention: `src/...` is relative to `packages/housing/app/`. Major decisions have full ADRs
in [adr/](adr/README.md). Every decision below is **Verified**: the reason is written in
`CLAUDE.md` or in a code comment at the cited location. Nothing here is inferred unless marked.

## Major decisions (ADRs)

| Decision | Why (as stated in the repo) | ADR |
|---|---|---|
| Next.js BFF; upstream schemas mirror the wire; ViewModels for the UI | Stable client contract; parse failures are server errors | [0001](adr/ADR-0001-bff-viewmodel-contract.md) |
| Three bearer tokens per service | Each upstream authorizes differently; a shared server token shares the fetch cache | [0002](adr/ADR-0002-three-bearer-tokens.md) |
| 403, not 404, on denial | Event ids are not secret; 403 enables actionable UI | [0003](adr/ADR-0003-403-not-404-for-access-denial.md) |
| Server actions for mutations, GET routes for reads | Same boundary rules; returned errors survive production | [0004](adr/ADR-0004-server-actions-for-mutations.md) |
| Two-record link saga, A then B, with rollback | No transaction across event-data and passkey-integration; only A checks planner write rights | [0005](adr/ADR-0005-two-record-link-saga.md) |
| Ownership for writes, link-derived access for reads | Planners without a Passkey mapping can still read linked data | [0006](adr/ADR-0006-link-derived-read-access.md) |
| Upstream 401/403 → 502 | A broken credential must not look like access denial | [0007](adr/ADR-0007-clamp-upstream-auth-errors-to-502.md) |
| `preRequest: []` on every client | Trace header would make every fetch-cache key unique | [0008](adr/ADR-0008-stable-fetch-cache-key.md) |
| Retry only GET | A replayed POST breaks the link saga | [0009](adr/ADR-0009-get-only-retries.md) |

## Smaller decisions

| Decision | Where | Reason given |
|---|---|---|
| Two `getAuthContext()` calls per request (route and data module) are intentional | `CLAUDE.md` | Auth gate and identity read are separate responsibilities; the cost is trivial |
| `unstable_cache` for core visibility is created per call | `src/lib/checkCoreEventAccess.ts:27-32` | The access token is closed over so it never becomes part of the cache key; the key uses identity fields |
| `assertCoreEventAccess` wraps `checkCoreEventAccess` | `CLAUDE.md` | One identity extraction and one cache key; page and API call share a visibility lookup |
| event-data 401/403 on read means "unlinked" | `src/server/data/event-link.ts:424-443` | The core guard already decided access |
| Ownership checked before unlink deletes anything | `src/server/data/event-link.ts:556-561` | event-data's write check knows only the Cvent event |
| Reg-link update writes Record B only | `src/server/data/event-link.ts:53-58` | Accepted for GROUP-131319; still runs the Passkey ownership guard |
| Hotel list page size capped at 12 | `src/lib/hotel-list.ts` (`HOTEL_LIST_PAGE_SIZE`) | Bounds the per-hotel location fan-out |
| `HotelRequestDetails` pages of 1000, 4 in flight after the first | `src/data/core-event/fetchHotelRequestDetails.ts:30-45` | 1000 is the size production Reporting already uses; concurrency 4 "bounds the burst on Event SOA" |
| Magic-link state percent-encoded once | `src/data/my-cvent/createPasskeyManageMagicLink.ts` | The Passkey servlet decodes twice |
| RegLink opt-in checkbox removed | `src/lib/event-link-params.ts:12-18` | Waiting on an accessible implementation |
| `compress: false` in Next config | `packages/housing/app/next.config.mjs` | CloudFront compresses |
| `evtstub` from the query string, not `x-core-event-id` | `CLAUDE.md` | The query param is the validated input; the header is a middleware copy |
| No `/api/ims` route | `CLAUDE.md` | IMS data is fetched server-side by the route that needs it |

## Decisions with no recorded reason

- Two CI systems (Jenkins and GitHub Actions) define the same build: reason **Unknown**.
- The `cvent-event` data folder exists but is empty: reason **Unknown**.

Related: [architecture.md](architecture.md) · [known-issues-roadmap.md](known-issues-roadmap.md)

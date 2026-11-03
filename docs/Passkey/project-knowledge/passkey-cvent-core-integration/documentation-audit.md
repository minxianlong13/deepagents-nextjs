---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: documentation-audit
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [audit, discrepancies, documentation-quality, stale-comments]
---

# Documentation Audit

Path convention: `src/...` is relative to `packages/housing/app/`. This audit compares the
repository's existing documentation (`CLAUDE.md`, `AGENTS.md`, READMEs, code comments) with the
code at commit `61e748e`. Every finding was checked against the source.

No document marked "Confidential / For internal Use Only" was found.

## Existing documentation sources

| Source | Quality | Notes |
|---|---|---|
| `CLAUDE.md` | High; the most precise architecture description | Rules match the code in almost every case checked |
| `AGENTS.md` | High, but a subset of `CLAUDE.md` | See D1 |
| Root `README.md` | Medium | Useful "Local Development" flow; template sections remain (D7) |
| `packages/housing/app/README.md` | Medium | HTTPS setup is useful; template sections remain (D7) |
| Code comments | High | Long rationale comments on most non-obvious code; a few are stale (D3-D5) |
| `openwiki/` | Not audited | Generated daily; the repo says not to hand-edit it |
| Product specs / runbooks | **Not found** | Business rules are reconstructed from code |

## Discrepancies

| # | Documentation says | Code does | Evidence | Severity |
|---|---|---|---|---|
| D1 | `AGENTS.md` and `CLAUDE.md` are meant to give the same guidance | `AGENTS.md` lacks the "UI work" and "Stacked PRs" sections and the UI-testing bullet (`data-cvent-id`, `ThemeProvider`) | `diff` of section headings. Both files have uncommitted local edits in this working copy | Medium |
| D2 | `CLAUDE.md`: upstream type files are "one file per upstream service, named for the service, mirroring `src/data/<service>/`" | Several files use other names: `events.ts` (passkey-event), `hotels.ts` (passkey-hotel), `booking-pace.ts` (passkey-reporting), `inventory.ts`, `event-housing.ts`, `room-type-data.ts`, `passkey-identity.ts` (passkey-authentication) | `src/types/upstream/` file headers | Low |
| D3 | `getCoreEvent` comment: "see `DEFAULT_EVTSTUB`" | No `DEFAULT_EVTSTUB` exists; the constant is `DEFAULT_CORE_EVENT_ID` in `layout.tsx:10` and `LoginForm.tsx:13` | `src/data/core-event/getCoreEvent.ts:8` | Low |
| D4 | `createEventIntegration` docstring: event-data authorizes with "the planner's bearer token" | The only caller passes the **decorated server token** (`src/server/data/event-link.ts:310-313`, `tokens.decoratedServer`; `CLAUDE.md`, decided 2026-10-29) | `src/data/event-data/createEventIntegration.ts:10-11` | Medium; a misleading security comment |
| D5 | `types/upstream/event-data.ts` header: core-event "is used only for the event visibility check" | core-event also serves `EventRegistrationSummary`, `HotelRequestDetails`, `eventFeatureSetup` (and two uncalled endpoints) | `src/types/upstream/event-data.ts:10-11`; `src/data/core-event/` | Low |
| D6 | Root `package.json` `packageManager: pnpm@10.8.0` | `mise.toml` pins pnpm 10.32.1 | Both files | Low |
| D7 | READMEs describe the template | Template placeholder sections remain alongside real content | `README.md`, `packages/housing/app/README.md` | Low |
| D8 | `layout.tsx` falls back to `DEFAULT_CORE_EVENT_ID` when `evtstub` is missing | The middleware already redirects requests without `evtstub`, and `getCoreEvent` ignores its argument, so the fallback has no effect | `src/app/events/housing/layout.tsx:27`, `src/middleware.ts`, `getCoreEvent.ts` | Low (Inferred, Confidence: High) |
| D9 | `CLAUDE.md`: use `bd` / `bd remember` for tracking | No `.beads/` directory at the repository root in this checkout | `ls` | Unknown impact; bd may store data elsewhere (Inferred, Confidence: Low) |
| D10 | A coverage report exists | `.coverage/coverage-summary.json` dated 2026-10-05 shows about 2.7%, inconsistent with Jest thresholds (statements 90) | `packages/housing/app/.coverage/` | Low; stale artifact |

## Claims checked and confirmed

- Three bearer tokens and their service assignments (`src/lib/auth-metadata.ts`, `src/lib/bearer-token.ts`).
- 401/403 → 502 clamp and `alsoClamp` (`src/lib/upstream-client.ts:74-124`).
- `ACCESS_DENIED_STATUSES` defined once (`src/lib/errors.ts:5`) and reused by every guard.
- Linked-event routes read `evtstub` from the query and call `checkLinkedPasskeyEventAccess`.
- Unlink checks ownership via `checkPasskeyEventAccess` before deleting (`event-link.ts:516-522`).
- Server actions return `ActionResult` and revalidate only on success.
- `encodeURIComponent` on path segments; `URLSearchParams` for query values (sampled fetchers).

## Gaps this knowledge base fills

- Environments and pipelines (not described in any existing doc).
- A single list of upstream endpoints, tokens and cache TTLs ([dependency-map.md](dependency-map.md)).
- An index of TODOs and tickets ([known-issues-roadmap.md](known-issues-roadmap.md)).
- ADRs for decisions that were only in comments ([adr/](adr/README.md)).

## Recommended doc fixes (not applied, since this task only writes `project-knowledge/`)

1. Sync `AGENTS.md` with `CLAUDE.md` (D1).
2. Fix the comments in D3, D4 and D5.
3. Either rename the upstream type files or reword the `CLAUDE.md` rule (D2).
4. Align the pnpm versions (D6).

Related: [known-issues-roadmap.md](known-issues-roadmap.md) · [README.md](README.md)

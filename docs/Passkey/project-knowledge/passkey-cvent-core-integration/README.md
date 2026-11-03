---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: index
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [index, rag, navigation, housing, passkey, bff]
---

# Project Knowledge Base: Passkey Cvent Core Integration

This folder is a retrieval-oriented (RAG, Retrieval-Augmented Generation) knowledge base for the
`passkey-cvent-core-integration` repository. It was generated on 2026-11-02 from the source on
branch `feature/GROUP-130999` (head `61e748e`). Source code and tests are authoritative; when this
folder and the code disagree, trust the code and fix the doc.

## Reference conventions

- **Source paths** written as `src/...` are relative to `packages/housing/app/`. Every other path
  is relative to the repository root (for example `packages/housing/infra/lib/commonProps.ts`).
- **`file:line`** citations point at the line where a symbol is declared as of commit `61e748e`.
  Line numbers drift; search for the symbol name if a line no longer matches.
- **Verified** means the claim was checked against source. **Inferred** means it is a reasoned
  reading of the code or comments that was not proven by running anything.
- **Confidence** (High / Medium / Low) is given for claims that are inferred or uncertain.
- **Unknown** or **Not found** means the repository does not contain the information.

## Documents

| File | What it answers |
|---|---|
| [project-overview.md](project-overview.md) | What the app is, who uses it, what it does today |
| [architecture.md](architecture.md) | Layers, request flow, auth tokens, caching, error model |
| [technology-stack.md](technology-stack.md) | Frameworks, libraries and versions |
| [directory-structure.md](directory-structure.md) | Monorepo layout and what each folder holds |
| [data-model.md](data-model.md) | Upstream Zod schemas, ViewModels, the two-record event link |
| [api-reference.md](api-reference.md) | Every API route, server action and middleware rule |
| [business-workflows.md](business-workflows.md) | Link, unlink, manage-in-Passkey, insights, event search |
| [technical-decisions.md](technical-decisions.md) | Summary of decisions and their reasons (index of [adr/](adr/)) |
| [dependency-map.md](dependency-map.md) | Upstream services, env vars, auth per service, internal module graph |
| [code-navigation.md](code-navigation.md) | "Where is X?" lookup table |
| [development-guide.md](development-guide.md) | Local setup, env vars, conventions for adding code |
| [testing-guide.md](testing-guide.md) | Jest, Playwright, integration tests, coverage thresholds |
| [deployment-operations.md](deployment-operations.md) | CDK stacks, environments, CI pipelines, secrets sourcing, logging |
| [known-issues-roadmap.md](known-issues-roadmap.md) | Stand-ins, TODOs, risks and open tickets |
| [glossary.md](glossary.md) | Domain and acronym definitions |
| [documentation-audit.md](documentation-audit.md) | How this was verified, discrepancies found, gaps |

### Architecture Decision Records (ADRs)

See [adr/README.md](adr/README.md). Each ADR records a decision that is stated in the repo
(code comments, `CLAUDE.md`/`AGENTS.md`, or commit messages) — none are invented.

### Diagrams

Standalone Mermaid sources live in [diagrams/](diagrams/):

| File | Diagram |
|---|---|
| [diagrams/system-architecture.mmd](diagrams/system-architecture.mmd) | Browser → middleware → Next.js layers → upstream services |
| [diagrams/component-relationships.mmd](diagrams/component-relationships.mmd) | Page, sections, hooks, routes, data modules |
| [diagrams/entity-relationships.mmd](diagrams/entity-relationships.mmd) | Core event, event-data integration, platform integration, Passkey event, IMS |
| [diagrams/business-workflow-link.mmd](diagrams/business-workflow-link.mmd) | Link / unlink saga |
| [diagrams/api-request-flow.mmd](diagrams/api-request-flow.mmd) | API route request/response sequence |
| [diagrams/service-dependencies.mmd](diagrams/service-dependencies.mmd) | Upstream services and token kind per service |
| [diagrams/async-flows.mmd](diagrams/async-flows.mmd) | Bearer-token minting/refresh and client-side fetch hooks |

## Fast answers

- **What is it?** A Next.js 15 App Router BFF (Backend-for-Frontend) that shows a Cvent planner the
  Passkey room block linked to their Cvent event, and lets the event owner link/unlink one.
- **Where does a request go?** `src/middleware.ts` → page/route/action → `src/lib/` guard →
  `src/server/data/` composer → `src/data/<service>/` fetcher → upstream service.
- **Which token goes where?** See [architecture.md#bearer-tokens](architecture.md#bearer-tokens).
- **Biggest known gap?** Every event-data call targets one hardcoded stand-in core event id
  (GROUP-130619). See [known-issues-roadmap.md](known-issues-roadmap.md).

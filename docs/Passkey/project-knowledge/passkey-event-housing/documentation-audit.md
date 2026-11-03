---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: audit
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [audit, quality, verification, gaps, rag]
---

# Documentation Audit

This page records how the knowledge base was produced, what was checked, and which questions the repository could not answer. Read it to judge how far to trust the other documents.

## Scope and method

- **Source of truth:** the source code, POMs, MyBatis XML, configs, Jenkinsfile, Dockerfile and Karate features in this repository at `1.8.2-SNAPSHOT` (last release `1.8.1`). The existing [AGENTS.md](../AGENTS.md), root [README.md](../README.md) and [openwiki/](../openwiki/) were used only as leads, and every claim was re-checked against source.
- **Labels:** facts read directly from code carry file:line citations. Where intent had to be reconstructed it is marked **Inferred**, and anything the repository does not answer is marked **Unknown**. Confidence tags (High, Medium, Low) mark where the evidence is weaker.
- **Write boundary:** only files under `project-knowledge/` were created or changed. Application code, schemas, build files and runtime configuration were not touched, and `openwiki/` was not edited.
- **Endpoint inventory:** 49 endpoints are reachable at runtime. They come from the 9 resources registered in `PasskeyEventHousingServiceApplication`. The callbacks resource exists in source but is not registered, so it is not counted.

## Validation performed

| Check | Method | Result |
|---|---|---|
| Frontmatter | Script checked every `.md` for `project_id`, `project_name`, `document_type`, `version`, `generated_at`, `source_repository`, `tags` | All 25 Markdown files pass |
| Relative links and anchors | Script resolved every Markdown link target and `#anchor` against files and headings / `<a id>` tags | All resolve (re-run after this file and the dashboard row were added) |
| Citation spot-checks | Re-opened cited files at the cited lines while writing; two wrong line numbers were corrected (template.yaml 31→32, `HotelDetailsService.getHotels` 80→81) | Corrected; remaining citations not exhaustively re-verified (**Confidence: Medium** for any single line number) |
| Mermaid syntax | Manual review of all 9 `.mmd` files: header lines, quoting, removal of `;` and `{}` inside sequence messages | Reviewed by hand. **Not rendered:** running `mermaid-cli` via `npx` was blocked in this environment, so a parse error could still exist |
| Cross-document consistency | Endpoint count (49) matched between [api-reference.md](api-reference.md) and the dashboard; the D3 entry in [known-issues-roadmap.md](known-issues-roadmap.md) corrected from "~60" to 49 | Consistent |
| Secret exclusion | Took the credential-like values from `configs/dev.yaml` (keys matching password/secret/key/token), then searched every file under `project-knowledge/` for each value. Also ran a pattern scan for key/password/token assignments | No value appears. The values were never printed or written down |
| Sensitive markers | Searched for "Confidential / For internal Use Only" | Not found in the repository |

## Sensitive-data handling

- `configs/dev.yaml` contains literal credentials. The documents mention that they exist ([known-issues-roadmap.md](known-issues-roadmap.md), S1) but never repeat a value. Rotating them and moving them to the platform secret store is recommended.
- Individual creator email addresses listed in the root README were left out on purpose. Ownership is given at team level (Metrestick, `#passkey-metre-stick`).
- No personal, payroll or customer data was found or generated.

## Known gaps and Unknowns

| Topic | Status | Where noted |
|---|---|---|
| Consuming services / callers of this API | Unknown: not in repo or catalog | [project-overview.md](project-overview.md), [dependency-map.md](dependency-map.md) |
| Database DDL, column types, constraints, indexes, schema owner | Unknown: no DDL in repo; ER diagram inferred from mapper SQL (Medium) | [data-model.md](data-model.md) |
| When `res-master-script.sql` is applied | Unknown | [data-model.md](data-model.md) |
| Exact transitive versions from `maven-parent` 57.0.0 | Unknown without resolving the parent POM | [technology-stack.md](technology-stack.md) |
| Source of the README's `-Pcoverage` profile | Unknown (maybe the parent POM) | [development-guide.md](development-guide.md) |
| Promotion beyond alpha; meaning of ct/ts/it env names | Unknown. pr = production and sg = staging are inferred (Medium) | [deployment-operations.md](deployment-operations.md) |
| Datadog dashboard contents, alerts, SLOs, runbooks | Unknown | [deployment-operations.md](deployment-operations.md) |
| Handler for `/{env}/ok` | Unknown: platform-provided, inferred | [api-reference.md](api-reference.md) |
| Karate test-data cleanup strategy | Unknown | [testing-guide.md](testing-guide.md) |
| ADR dates and original rationale | Unknown: ADRs reconstructed from code, status "Accepted (inferred)" | [adr/README.md](adr/README.md) |
| Business requirements behind GroupLink mapping IDs and image numbering | Partly Inferred; intent not documented in code | [business-workflows.md](business-workflows.md), [glossary.md](glossary.md) |
| Runtime metrics, traffic and performance data | Not available, so none are stated | — |

## Items needing human review

- The findings in [known-issues-roadmap.md](known-issues-roadmap.md) come from reading code and have not been reproduced at runtime. The ones most worth confirming are: the empty-`Optional` crash in the exception mappers, `approveBlocks` filtering only by `GROUPTYPEID`, and GroupLink setup not being atomic.
- The "Suggested follow-ups" there are recommendations, not agreed roadmap items.
- "Passkey" product context in [glossary.md](glossary.md) relies on general product knowledge (Medium confidence).

## Artifacts produced

- 16 core documents (including [README.md](README.md)), [adr/](adr/README.md) (index + 7 ADRs) and this audit.
- 9 Mermaid diagrams in [diagrams/](diagrams/).
- [architecture-dashboard.html](architecture-dashboard.html) is the source of a private claude.ai Artifact. Its diagrams are copied from `diagrams/*.mmd` when the page is built, and its endpoint table matches [api-reference.md](api-reference.md). Republish it after editing the docs, otherwise the published page will drift from them.

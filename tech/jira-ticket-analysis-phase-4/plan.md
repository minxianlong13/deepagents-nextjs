# Phase 4: Evidence Collection Implementation Plan

Date: 2026-10-28

Status: Implemented and locally verified with synthetic data. Credentialed integration and release sign-off remain pending; see [Implementation Evidence](#implementation-evidence).

Source: [Workflow refinement plan](../jira-ticket-analysis-refinement-plan.md#phase-4--strengthen-evidence-collection).

## Recommendation

Proceed with Phase 4 before repository reconnaissance. Implement a small, typed evidence registry and explicit search outcomes first, then citation validation, bounded refined search, conflict assessment, and UI presentation. Prompt changes alone cannot make citations reliable.

Preserve the current four UI-controlled steps (`jira`, `contract`, `slack`, `analysis`). Each request runs only the selected step and reuses previously completed results. Do not restore an all-in-one runner or add persistence.

## Pre-Implementation Evaluation

| Area               | Current evidence                                                                                                                                             | Gap and consequence                                                                                                                                                                                                     | Priority |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Jira provenance    | `lib/agents/get_jira_ticket_agent.ts` preserves the MCP output; `ticket_contract_agent.ts` has field-level source/status strings.                            | Individual confirmed facts and final recommendations lack resolvable source IDs. MCP wrappers must be unwrapped consistently before locating fields.                                                                    | P0       |
| Slack outcomes     | `lib/workflow/ticket_analysis.ts#searchSlackReference` returns an `available` boolean and catches every search failure.                                      | Skipped search, timeout, auth failure, zero results, and parsing failure cannot be distinguished reliably. Generic fallback loses the reason research is limited.                                                       | P0       |
| Slack provenance   | MCP normalization retains message text, author, channel, time, permalink, and sometimes raw results. The web agent generates its own findings.               | Generated findings are not validated against captured messages. In `apps/mcp/lib/slack.mjs#normalizeSlackSearchResult`, a nonempty unparsed response can yield an empty results array; this is not proof of no matches. | P0       |
| Documentation      | `lib/tools/rag_search.ts#documentSearch` retrieves four dense matches and returns temporary `/retrieved/` paths.                                             | There is no captured query/result envelope, stable evidence identity, or explicit empty/failure state. Search/read and result publication to `StateBackend` need a verified round trip.                                 | P0       |
| Final analysis     | `rootCause.evidence`, `hypotheses`, and solution fields in `ticket_analysis_agent.ts` are strings; documentation entries are source/relevance pairs.         | Schema validation proves output shape, not that an assertion has supporting evidence or that a citation exists.                                                                                                         | P0       |
| Refined search     | Slack prompt and runner require exactly one search with identical keywords. Documentation prompt requests one to three searches without programmatic limits. | Slack refinement is forbidden by the current contract; documentation search budgets are instructions rather than enforced limits.                                                                                       | P1       |
| Conflicts and gaps | Contract has open questions/readiness; analysis prompt asks the model to describe contradictions.                                                            | No structured conflict, affected claim, or additional-evidence requirement is presented or validated.                                                                                                                   | P1       |
| UI/API             | Browser stores step results and sends them back; server validates Zod shapes.                                                                                | No source browser, query history, citation coverage, or distinct research outcomes. Payload validation does not authenticate source contents.                                                                           | P1       |

The acceptance criteria are appropriate, but "confirmed" must mean supported by a recorded source, not proven production truth. Slack opinions and documentation can be stale. Agreement between two sources does not by itself confirm causation.

## Scope and Constraints

- Reuse Zod, existing model factories, MCP connection handling, Pinecone retrieval, and the current step API. No new dependency is required by this plan.
- Keep original Jira and Slack payloads alongside bounded evidence excerpts. Do not ask an LLM to copy raw output or mint authoritative citations.
- Keep prompts in `lib/skill/jira_analysis.ts`; runners belong in their existing agent modules and orchestration stays in the workflow.
- Do not change model routing, embedding model/dimensions, chunking, vector indexes, or indexed data in this phase.
- Repository scanning, concrete code-location verification, execution, ticket-type routing, deployment, and persistence belong to later phases.
- Do not add automated test files under this planning task. The validation scenarios below are implementation acceptance checks; adding a persistent test suite requires agreement, consistent with the earlier request to remove it.
- No migration constitution, topology, or architecture artifacts were supplied for this incremental feature. The existing refinement document and inspected source are the planning inputs. No migration transformation guidelines apply.

## Requirements

These IDs map the existing Phase 4 outcomes and acceptance criteria; they are not additional product requirements.

| ID      | Requirement                                                                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-401 | Important facts, root-cause assessments, hypotheses, and recommendations resolve to captured Jira, Slack, or documentation evidence, or carry an explicit inference/unverified label. |
| REQ-402 | Supported, inferred, and opinion-based claims are distinguishable; unavailable sources remain explicit research limitations.                                                          |
| REQ-403 | Successful search, empty search, skipped search, partial result, failure, and timeout are distinct and visible.                                                                       |
| REQ-404 | Insufficient Slack/documentation results support a bounded, observable refined search without rerunning completed earlier steps.                                                      |
| REQ-405 | Conflicting claims identify their sources and effect on confidence, without inventing a resolution.                                                                                   |
| REQ-406 | Final output exposes root-cause support, research limitations, and the additional evidence needed to proceed.                                                                         |

## Data Contract

Schemas and validation/normalization helpers live in `apps/web/lib/workflow/ticket_evidence.ts`. Agents, tools, API, and UI reuse its exported types. Ticket documentation research uses the run-local bounded-excerpt alternative described in P1.3.

### Evidence Items

Each item has an `id`, `sourceType` (`jira`, `slack`, or `documentation`), a canonical source locator, a bounded excerpt, retrieval time, and available provenance metadata. URLs are optional: do not fabricate one when only a document path or Jira field locator exists.

- Jira locator: ticket key plus a field path such as `fields.description` or a comment ID; retain the fetched `updated` value when present. The MCP wrapper uses `structuredContent` or JSON text; it is not already the raw issue object. Preserve the existing wrapper separately.
- Slack locator: actual permalink or channel ID plus message timestamp; missing identifiers use a stable content-based fallback, explicitly marked as such. Keep author/channel/time nullable. Capture the original normalized message, not merely the agent's rewritten finding.
- Documentation locator: original `metadata.source` plus a content hash and optional heading/chunk location. A temporary `/retrieved/` path is a reading location, not the canonical source. Missing source metadata becomes an explicit unknown-source item that cannot support a source-linked claim.
- Derive IDs deterministically from the locator plus content hash so repeated searches deduplicate identical excerpts and changed content remains distinguishable. Make citations local to the supplied evidence bundle; IDs are not credentials or signatures.
- Reserve `repository` as a future extension, but do not claim repository evidence is available until Phase 5 implements it.

### Search Attempts and Source Outcomes

Each attempt records source, exact query/keywords, attempt number, `refinementOf`, sanitized reason for refinement, result IDs, result count, timing, truncation/pagination indicators, and outcome.

Outcomes: `success`, `empty`, `partial`, `failed`, `timed_out`, `skipped`. A successful call with no relevant returned items is empty only when the upstream response was understood. Unparsed nonempty output is partial or failed with a parsing limitation; raw results remain available for diagnosis without logging them.

Keep acquisition failures separate from semantic conflicts: a source can return successful results that conflict with Jira. Failure metadata uses controlled codes (`auth_required`, `rate_limited`, `unavailable`, `parse_error`, `unknown`); preserve raw errors only in an appropriate restricted diagnostic channel, not the API/UI. A timeout is a local observation, not proof the upstream search stopped.

### Claims, Conflicts, and Research Gaps

- Important claims carry `id`, `text`, `classification` (`source_supported`, `inferred`, `opinion`, `unverified`), `evidenceIds`, and an explanation. Inferences identify their supporting premises or explain the missing evidence. Opinions can cite a source without becoming facts.
- Apply these to contract confirmed facts, final root cause/hypotheses, recommendations, and implementation steps. Classify validation steps as proposed checks, not observed outcomes. Keep existing ticket-understanding provenance semantics compatible and add evidence references rather than treating old free-text source labels as verified links.
- A conflict includes the competing claim descriptions, evidence IDs for each side, affected field/conclusion, confidence impact, unresolved/resolved status, and a resolution only if new evidence supports it. LLM-proposed conflicts remain assessments, not deterministic proof.
- A research gap names missing evidence, its impact, and the next question/search/artifact needed. Do not invent owners or alter Phase 1 readiness silently. Expose a separate `evidenceSufficiency` assessment so research readiness and implementation readiness are not conflated.

## Implementation Steps and Tasks

### P1.1 - Define and Validate Evidence Contracts

Requirements: REQ-401, REQ-402, REQ-403, REQ-405, REQ-406.

- [x] T001 [Plan:P1.1] Add shared evidence item, claim, search attempt, conflict, limitation, and research-gap schemas/helpers in `apps/web/lib/workflow/ticket_evidence.ts`; define bounded payload sizes and deterministic ID/deduplication behavior.
- [x] T002 [Plan:P1.1] Add pure citation checks in that module: reject unknown IDs, unsupported `source_supported` claims, and unsupported resolved conflicts; report inference-only coverage and unverified claims without manufacturing certainty.

Completion: captured evidence is schema-valid; a claim referencing an absent ID cannot pass final-output validation. A valid ID proves traceability, not that the source entails the claim; semantic assessment still requires review.

### P1.2 - Capture Jira and Slack Evidence at Retrieval Boundaries

Requirements: REQ-401, REQ-402, REQ-403.

- [x] T003 [Plan:P1.2] Normalize the actual Jira MCP response in `apps/web/lib/agents/get_jira_ticket_agent.ts`, attach field/comment evidence IDs, and preserve the original response. Add links using observed Jira base/source data only; correct the MCP tool's REST URL to a human browse URL in `apps/mcp/tools/jira.mjs` without changing the fetch endpoint or dropping an installation context path.
- [x] T004 [Plan:P1.2] Extend `apps/mcp/lib/slack.mjs#normalizeSlackSearchResult` and, if required, `apps/mcp/tools/slack.mjs` with additive parse-status/partial-result metadata. Preserve existing `slack-search/v1` fields for other consumers. Explicitly distinguish upstream zero messages from unsupported/unparsed nonempty responses.
- [x] T005 [Plan:P1.2] Update `apps/web/lib/tools/slack_search_messages.ts` to capture structured search outcomes, exact arguments, observed messages, timing, and sanitized failures; bound MCP requests with the installed SDK's supported timeout/cancellation options. Validate returned message evidence before the summarizing agent consumes it.
- [x] T006 [Plan:P1.2] Update `apps/web/lib/agents/slack_search_agent.ts` and `apps/web/lib/workflow/ticket_analysis.ts` to retain normalized source evidence and search attempts in Slack step results. Replace the boolean-only outcome contract; stop silently collapsing distinct errors into empty findings. Keep a failure result usable by the next UI-controlled step.

Completion: success, genuine empty, parse failure, auth/unavailable, timeout, skipped keywords, and partial results are distinguishable from the serialized Slack step result. Raw MCP text is not logged or returned as a public error message.

### P1.3 - Capture Documentation Searches and Reading Provenance

Requirements: REQ-401, REQ-403, REQ-404.

- [x] T007 [Plan:P1.3] Extract a reusable retrieval operation from `apps/web/lib/tools/rag_search.ts#documentSearch` that returns documents plus source locators, evidence IDs, and search outcomes. Preserve the public `document_search` tool name and the existing file-path contract used by `apps/web/lib/agents/rag_agent.ts`; any envelope additions must remain compatible with that reader.
- [x] T008 [Plan:P1.3] In `apps/web/lib/agents/ticket_analysis_agent.ts`, use a per-run retrieval wrapper/context that captures the actual search attempts and permitted evidence IDs before the model returns. Verify the installed `StateBackend.uploadFiles`/read semantics with a real upload/read round trip; fix await/state wiring if required. The chunk reader must receive the same run-local backend context and return evidence IDs, not invent paths or sources. Do not rely on model-authored `relatedDocumentation` as proof a search ran.

Completion: repeated retrieval of one chunk deduplicates it, parallel analyses do not read each other's retrieved files, and failed/empty searches still produce a research limitation. If the backend cannot guarantee per-run isolation, return bounded excerpts through the run-scoped tool instead; do not broaden into a filesystem redesign.

### P1.4 - Add Bounded Refined Searches

Requirements: REQ-403, REQ-404, REQ-406.

- [x] T009 [Plan:P1.4] Update `apps/web/lib/agents/slack_search_agent.ts`, its tool, and `SLACK_SEARCH_AGENT_PROMPT` in `apps/web/lib/skill/jira_analysis.ts` to support at most two attempts inside the selected Slack step: the original keyword search and one substantively different refinement. Replace the current exactly-one/identical-arguments trace check with budgeted query validation. Refine only after empty, partial, or justified insufficient relevance; preserve the first result and do not retry auth failure blindly.
- [x] T010 [Plan:P1.4] In `apps/web/lib/agents/ticket_analysis_agent.ts`, enforce at most three documentation attempts per analysis request, including refinements; record why an alternative query was needed. Reject ticket-key-only queries and deduplicate equivalent searches. Per-source limits are owned by runners/tools, not just prompts.

Proposed initial budget: Slack at most two calls with eight messages each and 1,000-character context limits; documentation at most three calls with four chunks each. Deduplicate and apply a configured evidence-size cap before synthesis, marking truncation as partial. Preserve existing per-call defaults unless runtime evidence justifies tuning them. Avoid extra refinement/planning LLM agents.

Completion: a failed refinement does not erase useful first-search findings; total attempts cannot exceed the configured budget. These refinements stay within the user-selected step and do not rerun Jira/contract. User-initiated retry may rerun that selected step explicitly; it is not an automatic loop.

### P1.5 - Link Analysis Claims and Assess Conflicts

Requirements: REQ-401, REQ-402, REQ-405, REQ-406.

- [x] T011 [Plan:P1.5] Extend `apps/web/lib/agents/ticket_contract_agent.ts` and `ticket_analysis_agent.ts` output schemas with evidence references on major facts, root-cause evidence/hypotheses, recommendations, and implementation steps. Add conflicts, limitations, research gaps, and separate evidence-sufficiency output. Preserve existing ticket type, acceptance criteria, field provenance, and readiness baseline rather than reinterpret it automatically.
- [x] T012 [Plan:P1.5] Centralize updated analyst/chunk-reader instructions in `apps/web/lib/skill/jira_analysis.ts`. Require cited premises, opinion/inference labels, unresolved conflicting sources, and the evidence missing before a definitive fix. Ensure the code-agent handoff repeats critical limitations and does not present an unverified hypothesis as a confirmed root cause.
- [x] T013 [Plan:P1.5] Validate structured final claims against the actual per-run Jira/Slack/documentation evidence registry in `apps/web/lib/agents/ticket_analysis_agent.ts`. Permit at most one bounded output-repair pass for citation/schema issues, reusing the captured evidence without new tool calls; if repair fails, return an explicit validation failure, not a purported complete report. Research failures alone may still yield an honestly provisional analysis.

Completion: no major claim appears as source-supported without a valid citation; a missing/failed source is visible; a conflict can lower confidence without rewriting the original ticket contract. Arbitrary URLs in generated prose are not automatically trusted.

### P1.6 - Integrate API and Evidence UI

Requirements: REQ-401, REQ-402, REQ-403, REQ-404, REQ-405, REQ-406.

- [x] T014 [Plan:P1.6] Update result/input parsing in `apps/web/lib/workflow/ticket_analysis.ts` and `apps/web/app/api/ticket-analysis/route.ts` to carry shared evidence contracts. Validate ticket-key consistency across submitted prior results and retain their captured source IDs. Return 400 for invalid client payloads rather than a generic upstream failure; keep sanitized 502/source-status handling where appropriate. Apply explicit accepted payload/evidence bounds.
- [x] T015 [Plan:P1.6] Update `apps/web/app/ticket-analysis/page.tsx` to show status per source, search queries/attempts, citation anchors, excerpt/provenance details, confidence/classification, conflicts, and missing evidence. Use safe HTTP(S) links for external sources and plain locators for local docs. Separate "no results" from "search failed" and "results conflict." Keep earlier completed results on selected-step failure; replacing a retried upstream step invalidates its downstream results only.
- [x] T016 [Plan:P1.6] Update `README.md` and `tech/jira-ticket-analysis-refinement-plan.md` with the final data behavior, limits, dependency prerequisites, and Phase 4 completion evidence after implementation. Record any unverified integration scenarios explicitly.

Completion: a user can trace root-cause support to an original source and see what evidence is still needed. The four explicit steps and browser-only state remain intact. Users should restart the Jira step after an incompatible schema rollout; Phase 4 does not add historic payload migration or persistent sessions.

## Validation and Release Gates

No live credentials or external services are needed to review this plan. During implementation, use fixed mocked tool/model responses and run-level dependency injection rather than live ticket contents for most checks. Persistent test files are optional and deferred pending agreement; record the executed checks and outcomes regardless.

1. Evidence normalization: real MCP wrapper shapes, Jira field paths/comments, absent fields, Slack structured/text responses, missing permalinks, nonempty unparsed Slack output, duplicate messages, and documentation without source metadata.
2. Research outcomes: valid no-results, unavailable, auth required, rate-limited, malformed response, local timeout, partial/truncated output, and no keywords. Confirm no secrets or raw ticket text appear in error logs.
3. Bounded refinement: empty first search then useful refinement, useful first search then failed refinement, repeated-query rejection, and hard limits for Slack/documentation/repair attempts. Exact keyword order alone must not reject an otherwise valid refined search.
4. Citation checks: valid IDs, unknown IDs, no evidence on a claimed fact, opinions mislabeled as confirmed, inference-only hypotheses, and proposed checks distinguished from executed validation. Check that copied source IDs do not falsely imply source entailment.
5. Conflict handling: opposing Jira/Slack/doc statements, different timestamps/versions, disagreement with workflow contract, no automatic "resolved" state without supporting evidence, and explicit additional evidence needed.
6. Retrieval round trip: successful `document_search` upload and reader access, source/hash mapping, no-results behavior, two simultaneous analyses, bounded excerpts, and no contamination from a previous run.
7. Four-step API/UI: each selected step runs once, completed results are reused, partial research permits provisional analysis, invalid prior schemas/ticket-key mismatch yield 400, invalid final citations yield explicit failure, and upstream retries clear only dependent outputs.
8. Presentation: desktop/mobile citation expansion, source status, conflicts, missing evidence, safe external links, and accessible keyboard operation. Validate the existing RAG Chat path still reads documentation after shared tool changes.

Required commands once implementation lands:

```bash
pnpm --filter @deepagents/web exec tsc --noEmit
pnpm --filter @deepagents/web exec eslint lib/workflow/ticket_evidence.ts lib/workflow/ticket_analysis.ts lib/agents/get_jira_ticket_agent.ts lib/agents/slack_search_agent.ts lib/agents/ticket_contract_agent.ts lib/agents/ticket_analysis_agent.ts lib/tools/slack_search_messages.ts lib/tools/rag_search.ts lib/skill/jira_analysis.ts app/api/ticket-analysis/route.ts app/ticket-analysis/page.tsx
node --check apps/mcp/lib/slack.mjs
node --check apps/mcp/tools/slack.mjs
node --check apps/mcp/tools/jira.mjs
git diff --check
```

Credentialed integration gates: one real ticket through all four steps; Slack authorization/failure/no-match cases; Pinecone/OpenAI embeddings retrieval and chunk reading; related Jira/Slack/doc references checked manually against their originals. Do not send customer-sensitive fixture content to external models without the existing authorization. No database changes, bulk ingestion, destructive cleanup, commit, push, or deployment is part of these gates.

## Risks and Decisions

- **Source authenticity:** prior step results travel through the browser. IDs and Zod checks establish internal consistency, not tamper-proof provenance. Treat carried evidence as client-supplied reference data and never as an authorization decision. Server-signed payloads or persisted source records require a separate security decision; Phase 4 must not claim independent re-verification of those sources.
- **Source meaning:** deterministic checks can validate references, excerpts, and IDs, but not prove a diagnosis. Keep confidence labels and human review; no claim that automated citation validation guarantees correctness.
- **Search relevance:** Pinecone returns nearest neighbors even when the query has no useful answer. Do not label every returned chunk relevant or adopt an uncalibrated similarity threshold as truth. Record relevance assessments and research gaps explicitly.
- **Framework behavior:** shared `StateBackend` and tool-message parsing need execution checks; do not assume attaching a backend makes uploaded content available across runs/subagents. Prefer the smaller fallback described in P1.3 if state routing is not sound.
- **Rollout:** result schemas change together across runners, API, UI, and current browser state. Restart in-progress workflows instead of silently assigning evidence to legacy unlabeled values.
- **Cost/latency:** refined searches and one repair pass add work. Set budgets before implementing loops; tune timeouts against actual OAuth and retrieval behavior. No latency/cost targets are asserted without measurements.
- **Documentation freshness:** preserve observed publication/update timestamps when present; retrieval time alone is not proof of document freshness.

## Requirement Mapping

| Requirement | Plan Items                   | Planned Implementation Evidence                                                                    |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| REQ-401     | P1.1, P1.2, P1.3, P1.5, P1.6 | Shared evidence schemas, captured-source registry, claim citation validator, UI anchors.           |
| REQ-402     | P1.1, P1.2, P1.5, P1.6       | Claim classification, Jira provenance, opinion/inference labels, missing-evidence presentation.    |
| REQ-403     | P1.1, P1.2, P1.3, P1.4, P1.6 | Parsed search-outcome envelopes, sanitized failures, query history, source status UI.              |
| REQ-404     | P1.3, P1.4, P1.6             | Captured retrieval attempts, enforceable budgets, refined-query trace, selected-step semantics.    |
| REQ-405     | P1.1, P1.5, P1.6             | Conflict schema, validated source references, unresolved-conflict UI and confidence impact.        |
| REQ-406     | P1.1, P1.4, P1.5, P1.6       | Evidence sufficiency, research gaps, root-cause support, limited handoff, user-visible boundaries. |

## Delivery Order

Implement P1.1 -> P1.2 -> P1.3 -> P1.4 -> P1.5 -> P1.6. Keep the final API/UI schema transition coordinated; do not ship a new agent shape while its consumer still expects the old one. Mark Phase 4 complete only after the outcome distinctions, real source traceability, bounded refinement, conflict visibility, and unknown-evidence checks are demonstrated. This plan maps six requirements to six plan items and sixteen tasks.

## Implementation Evidence

All sixteen task deliverables are implemented. Checked tasks describe code delivery and local verification, not credentialed release approval. Detailed mappings are in [batch-report.yaml](batch-report.yaml) and [tasks-to-impl.yaml](checkpoints/tasks-to-impl.yaml).

- Passed the required TypeScript, focused ESLint (including the new evidence component), MCP syntax, and whitespace commands.
- Executed offline assertions for wrapper normalization, stable IDs/deduplication, Slack empty versus unparsed/partial results, source metadata, sanitized auth/rate-limit/unavailable/timeout failures, evidence retention after failed refinement, duplicate-query rejection, and hard search budgets. Used a virtual clock to exercise the actual documentation timeout branch.
- Executed citation/contract assertions for absent IDs, missing source support, exact output text, confirmed-fact classification, unsupported resolutions, preserved contract, valid output without repair, one successful repair, and repeated invalid output failing after one repair.
- Verified the installed StateBackend with a real graph-context upload/read round trip and simultaneous-run file isolation. Standalone backend access without graph runtime is invalid; ticket analysis uses run-local excerpts instead. The existing RAG Chat tool keeps file paths and awaits uploads.
- Probed the running API: 400 for malformed/oversize JSON, missing step/key, mismatched tickets and invalid carried states; 200 for skipped Slack without external calls.
- Exercised all four UI steps using synthetic intercepted responses at 1440x1000 and 390x844. Checked citation anchors, unsafe-link rejection, conflict/gap presentation, keyboard expansion, no horizontal overflow, failed-retry preservation, downstream invalidation and changed-key guard. Reviewed desktop/mobile screenshots; removed interception and synthetic state afterward.

Still unverified: a real ticket end to end; live model structured-output/semantic quality; Slack OAuth and actual upstream formats; Pinecone/OpenAI embedding retrieval; RAG Chat with live documents; and manual comparison against original Jira/Slack/documentation. These credentialed gates remain required before release sign-off. No external model/retrieval calls or persistent automated test files were needed for the local checks. Production build was not run; the development app starts and serves the tested route.

Operational limits: 40 evidence items, 4,000 characters per excerpt, 64,000 serialized evidence characters, and 2,000,000 accepted request bytes. Raw carried payloads count toward the request cap. Slack tool calls time out at 45 seconds; connection/OAuth establishment is separate. Documentation times out locally at 30 seconds; upstream cancellation is not guaranteed. Source IDs establish consistency, not authenticity or entailment.

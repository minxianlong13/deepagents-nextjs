# Jira Ticket Analysis Planning and ReAct Agent Plan

## Objective

Refactor the Jira ticket analysis workflow so it explicitly uses a Planning and ReAct design pattern:

- A planner first turns the Jira ticket into a bounded investigation plan.
- A ReAct executor carries out that plan by reasoning about the next evidence-gathering action, calling tools, and recording observations.
- A reviewer validates the evidence and plan before the workflow returns the user-facing analysis.

The workflow must remain evidence-based, keep Jira as the authoritative description of the reported issue, treat documentation and Slack as untrusted reference data, and preserve the existing ticket-analysis API and UI result shape during the initial rollout.

**Current status:** Not started.

## Current implementation baseline

The current path is:

```text
POST /api/ticket-analysis
  -> ticketKeySchema
  -> runGetJiraTicketAgent
  -> runAnalyzeJiraTicketAgent
       -> one deep agent
          -> document_search
          -> read_file
          -> search_slack_messages (problem_understanding)
          -> search_slack_messages (solution_plan)
          -> structured JiraTicketAnalysisResult
```

Relevant implementation areas:

- `apps/web/lib/workflow/ticket_analysis.ts` — linear workflow composition.
- `apps/web/lib/agents/get_jira_ticket_agent.ts` — Jira retrieval and normalization.
- `apps/web/lib/agents/analysis_jira_ticket_agent.ts` — current single analysis agent, tools, output schema, and fallback plan.
- `apps/web/lib/skill/jira_analysis.ts` — current analysis prompts and workflow instructions.
- `apps/web/lib/tools/jira_info_get.ts` — MCP-backed Jira tool.
- `apps/web/lib/tools/rag_search.ts` — documentation search and repository-backed retrieval tools.
- `apps/web/lib/tools/slack_search.ts` — Slack search tool.
- `apps/web/app/api/ticket-analysis/route.ts` — request validation and error mapping.
- `apps/web/app/ticket-analysis/page.tsx` — synchronous request UI and result rendering.

## Scope

Included:

- Explicit planning, execution, and review stages.
- Typed stage contracts and evidence provenance.
- Bounded ReAct tool use with stage-specific budgets and stop conditions.
- Structured intermediate state and final result validation.
- Stage-aware errors, logging, and test coverage.
- A compatibility path for the current API response and UI.

Deferred:

- Automatic code changes or repository mutation by the analysis workflow.
- Jira ticket updates, comments, transitions, or status changes.
- Fully streamed progress in the first release.
- Long-running persisted workflows and resume-after-failure behavior.
- Parallel multi-agent research unless measurements show it is needed.

## Design principles

- Jira fields define the reported problem; external evidence can clarify but cannot override them.
- Planning produces proposed work only. The workflow never claims that implementation or validation has happened.
- The ReAct loop may select tools, but tool access and call counts are enforced by code, not only by prompts.
- Every conclusion must be traceable to Jira, documentation, Slack, or an explicitly labeled inference.
- Missing evidence remains visible as uncertainty and open questions.
- A failed optional source should degrade the analysis rather than erase confirmed Jira facts.
- Final output is accepted only after schema validation and reviewer checks.
- Server-side model and tool configuration remains authoritative; user input cannot select arbitrary tools or models.

## Target workflow

```text
Validate ticket key
  -> Retrieve Jira ticket
  -> Planner
       -> ticket understanding
       -> classification and readiness
       -> evidence questions
       -> bounded research plan
  -> ReAct executor
       -> select next planned action
       -> call an allowed research tool
       -> normalize observation with provenance
       -> update evidence ledger and remaining questions
       -> stop at completion, budget, or failure boundary
  -> Reviewer
       -> check Jira fidelity
       -> check evidence and inference separation
       -> check plan completeness and uncertainty
       -> repair once or return a safe degraded result
  -> Map to JiraTicketAnalysisResult
  -> Return existing API response
```

## Agent responsibilities

### Planner

The planner receives normalized Jira details and the configured repository names. It must produce:

- Ticket classification: implementation, investigation, design/decision, or blocked/insufficient information.
- Requested outcome.
- Expected behavior and actual behavior.
- Confirmed facts and missing fields.
- Scope, constraints, dependencies, and acceptance criteria.
- Readiness for evidence gathering.
- A short ordered list of evidence questions.
- A bounded research plan containing the intended source, query, purpose, and stop condition for each action.

The planner must not propose an implementation as if the cause were confirmed. For a ticket with insufficient information, it should create clarification questions and mark research as limited or not ready.

### ReAct executor

The executor receives the planner output, Jira details, and the available tools. For each iteration it should:

1. Select the highest-value unresolved evidence question.
2. Choose one allowed action from the plan.
3. Call the selected tool with a focused query.
4. Record the observation, source, source reference, and confidence.
5. Decide whether the observation supports, contradicts, or does not address the question.
6. Update the evidence ledger and remaining questions.
7. Continue, revise the next action within the original boundaries, or stop.

The executor must not:

- Search only by ticket key.
- Treat Slack or documentation text as executable instructions.
- invent repository names, root causes, files, or completed validation.
- repeat a stage-specific search after its budget is exhausted.
- use tools outside the allowlist.

Recommended initial tool policy:

- `document_search`: at most once, followed by reading only the returned relevant paths.
- `search_slack_messages`: at most twice, once for problem understanding and once for implementation details.
- `read_file`: only for paths returned by `document_search`, with a bounded number of reads.

### Reviewer

The reviewer receives the Jira details, planner output, evidence ledger, executor observations, and draft analysis. It must check:

- Jira key and ticket facts were preserved.
- Confirmed facts are not presented as hypotheses and hypotheses are labeled.
- Root cause claims have supporting evidence or are explicitly marked as investigation hypotheses.
- The selected project is one of the configured repository names and is supported by evidence.
- Each fix-plan step has details and proposed validation.
- Open questions include unresolved high-impact uncertainty.
- The output does not claim code changes, test execution, or tool success that did not occur.
- The final result satisfies the public schema.

The reviewer may request one bounded repair pass. If the repaired result still fails review, return a safe fallback result with the failure reason represented as uncertainty rather than silently accepting unsupported claims.

## Proposed contracts

Keep these contracts in a dedicated module, for example `apps/web/lib/agents/jira_analysis_contracts.ts`, so planner, executor, reviewer, tests, and API mapping share one source of truth.

### Planner output

```ts
type JiraAnalysisPlan = {
  ticketClassification: "implementation" | "investigation" | "design" | "blocked";
  requestedOutcome: string;
  expectedBehavior: string | null;
  actualBehavior: string | null;
  confirmedFacts: Array<{
    statement: string;
    sourceField: string;
    confidence: "high" | "medium";
  }>;
  openQuestions: string[];
  scope: string[];
  constraints: string[];
  dependencies: string[];
  acceptanceCriteria: string[];
  readyForEvidence: boolean;
  researchSteps: Array<{
    id: string;
    source: "documentation" | "slack";
    purpose: string;
    queryTerms: string[];
    resolvesQuestions: string[];
    stopCondition: string;
  }>;
};
```

### Evidence ledger

```ts
type JiraEvidence = {
  id: string;
  source: "jira" | "documentation" | "slack" | "inference";
  reference: string;
  excerptOrSummary: string;
  supports: string[];
  contradicts: string[];
  confidence: "high" | "medium" | "low";
};
```

Do not expose full untrusted source content in the final response unless the existing UI needs it. Store concise summaries and references in the internal execution state, and apply size limits to all fields.

### Execution state

```ts
type JiraAnalysisExecution = {
  ticket: JiraTicketDetails;
  plan: JiraAnalysisPlan;
  evidence: JiraEvidence[];
  completedStepIds: string[];
  remainingQuestions: string[];
  toolCalls: Array<{
    tool: "document_search" | "read_file" | "search_slack_messages";
    purpose: string;
    status: "succeeded" | "failed" | "skipped";
  }>;
  limits: {
    maxIterations: number;
    maxToolCalls: number;
    maxRepairPasses: number;
  };
};
```

### Final result

Initially preserve `JiraTicketAnalysisResult` and its current fields:

- `ticketKey`
- `originalJiraOutput`
- `problemSummary`
- `keywords`
- `projectName`
- `fixPlan.summary`
- `fixPlan.steps[]`

Add internal provenance and execution metadata first. Expose optional metadata only after deciding that the UI and API consumers need it, for example:

```ts
type JiraAnalysisMetadata = {
  workflowVersion: string;
  ticketClassification: string;
  readiness: "ready" | "needs_clarification" | "degraded";
  evidenceSummary: Array<{
    source: "jira" | "documentation" | "slack" | "inference";
    reference: string;
    confidence: "high" | "medium" | "low";
  }>;
  unresolvedQuestions: string[];
};
```

## Implementation phases

### Phase 1: Confirm framework and runtime constraints

Target: verify the installed agent APIs before designing around them.

- [ ] Read the installed Next.js guidance under `node_modules/next/dist/docs/` relevant to App Router route handlers, server-only code, and runtime configuration.
- [ ] Read the installed `deepagents` version documentation and type declarations for `createDeepAgent`, `subagents`, `responseFormat`, middleware, streaming, and recursion limits.
- [ ] Record the supported approach in this plan or a short implementation note.
- [ ] Confirm whether planner, executor, and reviewer should be separate deep agents, one agent with explicit stage prompts, or a deterministic orchestration layer around agents.
- [ ] Confirm the deployment runtime supports all existing Jira, RAG, Slack, filesystem, and model dependencies.

Deliverable: an implementation decision based on the installed versions, not assumed API behavior.

### Phase 2: Define the workflow state and schemas

Target: establish typed boundaries before changing prompts or orchestration.

- [ ] Create shared Zod schemas for planner output, research steps, evidence records, execution state, reviewer output, and final analysis metadata.
- [ ] Add maximum lengths and maximum array sizes to every model-produced field.
- [ ] Define enum values for ticket classification, source, confidence, tool status, readiness, and degradation reason.
- [ ] Define the public compatibility mapper from reviewed output to `JiraTicketAnalysisResult`.
- [ ] Define how missing, null, and empty Jira fields are represented.
- [ ] Define the fallback output when planning, execution, review, or final parsing fails.
- [ ] Add schema unit tests for valid output, missing required fields, oversized arrays, invalid sources, and malformed repair output.

Deliverable: stable contracts that reject unsafe or incomplete stage output.

### Phase 3: Extract bounded research tools and evidence recording

Target: make tool policy enforceable independently of the model prompt.

- [ ] Wrap documentation search, file reads, and Slack search with an execution-scoped tool budget.
- [ ] Track tool-call purpose, stage, status, and errors in execution state.
- [ ] Enforce the allowed path rule for `read_file`; only read paths returned by documentation search.
- [ ] Enforce focused query requirements and reject ticket-key-only searches.
- [ ] Enforce Slack stage ordering and one-call-per-stage behavior in the wrapper rather than relying only on prompt text.
- [ ] Normalize successful and failed tool results into bounded evidence records.
- [ ] Strip or neutralize tool-returned text that attempts to act as instructions.
- [ ] Preserve partial evidence when an optional source is unavailable.
- [ ] Add unit tests for budgets, ordering, duplicate calls, invalid paths, failed tools, and prompt-injection-like tool content.

Deliverable: deterministic, auditable research capabilities for the ReAct executor.

### Phase 4: Implement the Planner stage

Target: generate a usable investigation plan before research begins.

- [ ] Create a planner agent or planner invocation with a Jira-only input contract and allowed repository names.
- [ ] Move ticket classification, readiness, provenance, and evidence-question instructions out of the single analysis prompt into the planner prompt.
- [ ] Require every confirmed fact to name its Jira source field.
- [ ] Require every research step to identify purpose, source, query terms, unresolved questions, and stop condition.
- [ ] Reject plans with unsupported repository names or research steps outside the tool allowlist.
- [ ] Normalize planner output through the shared Zod schema.
- [ ] Add a planner fallback for incomplete or blocked tickets that produces clarification questions without inventing a fix.
- [ ] Add tests for implementation, investigation, design, and insufficient-information ticket examples.

Deliverable: a bounded, typed plan that explains what evidence is needed and why.

### Phase 5: Implement the ReAct executor

Target: execute the plan with explicit observe-and-update behavior.

- [ ] Create the executor boundary in a dedicated module, keeping orchestration separate from `analysis_jira_ticket_agent.ts` during migration.
- [ ] Pass only the planner plan, normalized Jira data, current evidence, and unresolved questions into each executor decision.
- [ ] Require each iteration to select one planned action or explicitly stop.
- [ ] Execute tools through the budgeted wrappers from Phase 3.
- [ ] Convert observations into evidence records with source references and confidence.
- [ ] Mark research steps complete only when their stop condition is met or the step has failed permanently.
- [ ] Allow the executor to refine a query within the same planned purpose, but do not allow it to expand scope without recording a new open question.
- [ ] Stop when all high-value questions are resolved, the plan has no executable steps, a tool failure is non-recoverable, or the iteration/tool budget is reached.
- [ ] Add a deterministic fallback when the executor returns no usable evidence.
- [ ] Add tests for successful research, irrelevant evidence, contradictory evidence, tool failure, budget exhaustion, and early stopping.

Deliverable: a bounded ReAct loop with an evidence ledger and explicit uncertainty.

### Phase 6: Implement the Reviewer stage

Target: prevent unsupported or internally inconsistent final analyses.

- [ ] Create a reviewer agent or reviewer invocation with no mutation-capable tools.
- [ ] Provide Jira details, planner output, evidence, tool statuses, and the draft analysis as separate labeled inputs.
- [ ] Require the reviewer to classify each important conclusion as confirmed, supported inference, unsupported inference, or unresolved.
- [ ] Require the reviewer to identify missing validation and preserve open questions.
- [ ] Require the reviewer to verify project names against `apps/web/config/repos.json`.
- [ ] Define a single bounded repair pass for schema or evidence-quality failures.
- [ ] Reject any final result that claims implementation, test execution, or successful research not present in execution state.
- [ ] Map approved output to the existing result schema and apply the existing fallback fix plan when no steps are usable.
- [ ] Add tests for unsupported root cause claims, missing questions, invalid projects, empty plans, and successful repair.

Deliverable: reviewed output that is safe to show as a proposed analysis.

### Phase 7: Compose the workflow and preserve API compatibility

Target: replace the linear analysis call without breaking existing consumers.

- [ ] Update `apps/web/lib/workflow/ticket_analysis.ts` to compose retrieval, planning, ReAct execution, review, and compatibility mapping.
- [ ] Keep ticket-key normalization and validation unchanged unless a contract test requires a change.
- [ ] Preserve `JiraTicketAgentError` for Jira retrieval failures.
- [ ] Add stage-aware internal errors while keeping stable user-safe API messages.
- [ ] Preserve the existing `POST /api/ticket-analysis` request body and response envelope.
- [ ] Keep `originalJiraOutput` unchanged for the current UI.
- [ ] Decide whether optional metadata is returned immediately or kept server-side for later UI work.
- [ ] Add a workflow version identifier to logs and optional metadata so old and new runs can be compared.
- [ ] Add route tests for invalid JSON, invalid ticket keys, Jira 404, retrieval failure, planner failure, research degradation, reviewer failure, and successful analysis.

Deliverable: the new design runs behind the current API contract.

### Phase 8: Add observability and operational controls

Target: make multi-stage failures diagnosable without leaking sensitive content.

- [ ] Log a correlation ID for each analysis request.
- [ ] Log stage start, stage completion, duration, status, and bounded error codes.
- [ ] Record model ID, workflow version, tool-call counts, recursion/iteration counts, and degradation status.
- [ ] Do not log Jira descriptions, Slack message bodies, retrieved document contents, credentials, or raw prompts by default.
- [ ] Add metrics for planner failures, tool failures by source, reviewer repairs, fallback results, latency, and token usage where available.
- [ ] Add configurable limits for max iterations, max tool calls, max repair passes, and request timeout.
- [ ] Add feature-flag or environment configuration to select the legacy linear path during rollout.
- [ ] Document the operational meaning of degraded, blocked, and failed results.

Deliverable: operators can identify where a run failed and safely control cost and latency.

### Phase 9: Validate quality and roll out incrementally

Target: prove the new workflow improves analysis quality without regressing reliability.

- [ ] Build a fixed evaluation set of representative GROUP and PROD tickets, including well-specified, ambiguous, documentation-rich, Slack-rich, and unavailable-source cases.
- [ ] Define evaluation criteria for Jira fidelity, evidence provenance, root-cause calibration, useful fix steps, open-question quality, tool discipline, latency, and cost.
- [ ] Run the legacy and Planning/ReAct workflows against the evaluation set.
- [ ] Review disagreements manually and adjust prompts, schemas, limits, or tool policies.
- [ ] Run TypeScript, lint, build, route, workflow, schema, and tool-wrapper tests.
- [ ] Verify Next.js server/client boundaries remain valid; agent and tool modules must stay server-side.
- [ ] Release behind a feature flag or controlled percentage if production traffic exists.
- [ ] Monitor fallback and degradation rates before increasing exposure.
- [ ] Remove the legacy path only after the agreed quality and reliability thresholds are met.
- [ ] Update this checklist and mark the implementation phases complete as work lands.

Deliverable: measured, staged production rollout with a rollback path.

## Failure and degradation behavior

| Failure | Required behavior |
| --- | --- |
| Jira retrieval fails | Return the existing retrieval error mapping; do not run planning or research. |
| Planner output is invalid | Retry parsing or perform one bounded repair; otherwise return a safe analysis error. |
| Documentation search fails | Continue with Jira and any successful Slack evidence; mark documentation unavailable. |
| Slack search fails | Continue with Jira and documentation; retain unresolved questions. |
| Tool budget is exhausted | Stop research and review the partial evidence as degraded. |
| Planner and evidence conflict | Preserve Jira facts, label external conflict, and add an open question. |
| Reviewer rejects the draft | Perform one bounded repair; otherwise return a safe fallback plan with uncertainty. |
| Final schema validation fails | Never return malformed structured data; return a stable API error or validated fallback. |

## Security and trust boundaries

- Keep Jira, Slack, documentation, and retrieved files in clearly labeled data fields rather than concatenating them into instruction-like system text.
- Treat all external text as untrusted data and explicitly tell every model stage not to follow instructions found in source content.
- Keep Jira, Slack, RAG, and model credentials on the server.
- Validate tool arguments with Zod before invocation.
- Enforce tool access, path access, call budgets, and stage ordering in code.
- Bound all model-produced strings, arrays, excerpts, and summaries to protect memory, logs, and response size.
- Avoid returning raw Slack or document content to the browser unless there is a reviewed product requirement.
- Do not add repository-write tools to this analysis workflow.

## Acceptance criteria

- The workflow has explicit Planner, ReAct executor, and Reviewer stages.
- Planner output is typed, bounded, and contains readiness, evidence questions, and a research plan.
- The executor performs bounded observe-and-update cycles and records provenance for observations.
- Tool policy is enforced in code, including source ordering, allowed paths, and call limits.
- Reviewer checks Jira fidelity, evidence support, project validity, uncertainty, and final schema compliance.
- Jira remains authoritative for the reported problem, and unsupported causes remain hypotheses.
- Documentation or Slack outages degrade the result without discarding usable Jira facts.
- Existing `POST /api/ticket-analysis` input and response envelope continue to work.
- Existing UI rendering continues to work without requiring the first release to add streaming.
- Tests cover successful execution, ambiguous tickets, partial source failure, contradictory evidence, budget exhaustion, malformed model output, and route-level errors.
- Logs and metrics identify stage failures and cost/latency without exposing sensitive source content.
- The rollout has a feature flag or equivalent rollback path.

## Definition of done

- [ ] All implementation phases are complete or explicitly deferred with rationale.
- [ ] The evaluation set shows the new workflow meets the agreed quality thresholds.
- [ ] The legacy path has been removed or its retirement date is recorded.
- [ ] The API, schemas, operational controls, and trust boundaries are documented.
- [ ] The UI displays a clear proposed analysis and does not imply that code changes were performed.
- [ ] This plan is updated with links to the final implementation files, tests, and rollout decision.

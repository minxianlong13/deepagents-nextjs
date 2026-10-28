# Jira Ticket Analysis Workflow Refinement Plan

## Current Jira-only workflow

The ticket-analysis page accepts one Jira key and makes one API request. The workflow invokes `get_jira_ticket` directly, sends the retrieved issue details to the model for a concise problem explanation, and displays that explanation with the returned fields. The active flow does not invoke ticket-contract, Slack-search, or ticket-evidence code. It does not persist results across refreshes.

Earlier phases below describe the previous multi-step design and are retained as project history. They are not the current runtime behavior.

## Refinement phases

- **Phase 1 — Define the workflow contract** — **Complete**
  - Target: Define ticket types, required fields, evidence rules, and readiness criteria.
- **Phase 2 — Improve ticket understanding** — **Complete**
  - Target: Extract a precise problem statement with field-level provenance.
- **Phase 3 — Add UI-controlled step orchestration** — **Historical; replaced by Jira-only request**
  - Target: Run one step per request and show each result before continuing.
- **Phase 4 — Strengthen evidence collection** — **Historical; not used by the active ticket-analysis workflow**
  - Target: Make Jira, Slack, documentation, and research limitations explicit and source-linked.
- **Phase 5 — Add repository reconnaissance**
  - Target: Map the ticket to concrete repositories, files, symbols, data flows, and tests.
- **Phase 6 — Separate implementation and investigation paths**
  - Target: Produce an appropriate plan for code changes, investigation, design, or blocked work.
- **Phase 7 — Generate executable step prompts**
  - Target: Give the code agent small, ordered prompts with scope, permissions, references, and completion criteria.
- **Phase 8 — Add execution checkpoints**
  - Target: Require findings, changed files, tests, blockers, and completion status after every agent step.
- **Phase 9 — Validate and prepare handoff**
  - Target: Check acceptance criteria and produce a concise review-ready result.

## Completed work

### Phase 1 — Define the workflow contract

- Added the ticket classifications: implementation, investigation, design or decision, and blocked or insufficient information.
- Added confirmed facts, open questions, acceptance criteria, constraints, dependencies, and readiness.
- Added a dedicated ticket-contract agent before Slack and documentation research.

### Phase 2 — Improve ticket understanding

- Added requested outcome, expected behavior, actual behavior, and scope.
- Added field-level provenance with source, confidence status, and explanatory notes.
- Represented missing scalar values explicitly and added them to open questions.
- Displayed the expanded understanding in the UI.

### Phase 3 — Add UI-controlled step orchestration

- Added the explicit step API: `jira`, `contract`, `slack`, and `analysis`.
- Added a UI Next-step control and progress display.
- Passed completed results into the next request and validated them server-side.
- Removed the all-in-one `runAnalyzeTicketWorkflow` path.
- Kept page-refresh persistence out of scope by design.

## Phase 4 — Historical evidence workflow

The earlier evidence workflow and its implementation artifacts remain documented in the [Phase 4 implementation plan](jira-ticket-analysis-phase-4/plan.md). The current Jira analysis route no longer uses that evidence pipeline or its Slack/contract stages.

### Implementation evidence

- Added a shared bounded source registry, deterministic IDs, classifications, search outcomes, conflict/gap schemas, and citation checks. Original Jira and Slack payloads remain available.
- Captured actual retrieval results before synthesis, enforced two Slack/three documentation searches, and limited final-output repair to one tool-free pass. Ticket research uses run-local excerpts without changing RAG Chat's file contract.
- Added source/citation browsing, query histories, research limitations, safe external links, and explicit upstream reruns. Preserved the reviewed contract and browser-only four-step orchestration.
- Passed TypeScript, focused ESLint, MCP syntax, whitespace, offline normalization/refinement/citation/timeout assertions, backend graph upload/read with simultaneous-run isolation, runtime API probes, and mocked four-step browser checks at desktop/mobile sizes.
- A real ticket through all four steps, live Slack authorization/failure/no-match behavior, Pinecone/OpenAI retrieval, and RAG Chat with live documentation remain credentialed release gates. Local checks do not prove model quality or source entailment. No persistent automated test files were added.

### Target

Every important technical conclusion should be traceable to Jira, Slack, or documentation evidence, or explicitly labeled as inferred/unverified, with limitations visible to the user. Repository evidence remains Phase 5 work.

### Implemented outcomes

- Add source references to individual facts, hypotheses, root-cause evidence, and recommendations.
- Distinguish confirmed, inferred, opinion-based, and unavailable evidence.
- Show Slack search failures as limitations rather than silently treating them as empty context.
- Support a refined search when the first documentation or Slack search is insufficient.
- Detect and display conflicts between Jira, Slack, documentation, and later repository findings.

### Acceptance criteria

- No major conclusion appears without a source or an explicit inference label.
- Search failure, empty result, and conflicting result are different states.
- The final analysis shows which evidence supports the root-cause assessment.
- The user can identify what additional evidence is needed before continuing.

## Phase 5 — Add repository reconnaissance

### Target

Connect the ticket and evidence to the actual codebase before recommending implementation changes.

### Planned outcomes

- Identify the selected repository and relevant files.
- Locate entry points, symbols, data flow, configuration, and existing tests.
- Record repository findings separately from documentation findings.
- Provide concrete files or areas for the code agent to inspect.

### Acceptance criteria

- Implementation recommendations reference real repository locations.
- Investigation tickets identify concrete commands, files, logs, or experiments.
- The workflow reports when repository access or mapping is unavailable.

## Phase 6 — Separate implementation and investigation paths

### Target

Ensure the workflow does not force every Jira ticket into a code-change plan.

### Planned outcomes

- Implementation path: proposed files, changes, tests, and risks.
- Investigation path: questions, evidence to collect, experiments, and decision criteria.
- Design path: options, trade-offs, recommendation, and approval questions.
- Blocked path: missing information, owner, and condition required to continue.

## Phase 7 — Generate executable step prompts

### Target

Turn the analysis into small prompts that a code agent can execute safely.

Each prompt should contain:

- Goal and scope
- Allowed action
- Relevant files and references
- Exact instruction
- Expected output
- Completion criteria
- Next decision

## Phase 8 — Add execution checkpoints

### Target

Keep code-agent execution controlled and observable.

After every execution step, require:

- Findings
- Files changed
- Tests run and not run
- Blockers
- Remaining risks
- Step completion status

The agent must stop and request clarification when a critical assumption is disproved.

## Phase 9 — Validate and prepare handoff

### Target

Prove the result against Jira acceptance criteria and make it ready for review.

The final result should include:

- Root cause or investigation conclusion
- Solution or recommendation
- Acceptance-criteria status
- Files changed
- Tests run
- Unverified behavior
- Remaining risks
- Suggested Jira or pull-request summary

## Validation baseline

- TypeScript validation must pass.
- ESLint must introduce no new errors.
- Runtime Jira, Slack, model, and documentation integration requires configured external credentials and should be tested separately.

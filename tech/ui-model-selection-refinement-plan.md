# UI Model Selection Refinement Plan

## Objective

Allow users to select an approved AI model from the UI and have the selected model used by the requested workflow, while keeping model access safe, explicit, and easy to extend.

## Scope

- Model selector in the UI
- Shared model catalog
- Request-level model selection
- Agent and workflow integration
- Access and capability validation
- Usage and error feedback

## Recommended model catalog

The UI should display friendly names while the server uses stable model IDs.

| UI label | Model ID | Recommended use |
| --- | --- | --- |
| GPT-6 Luna | `gpt-6-luna` | Complex analysis and general workflows |
| Claude Sonnet | `claude-sonnet-4-6` | High-quality reasoning and structured analysis |
| Claude Haiku | `claude-haiku-4-5-20251001` | Fast, lower-cost summaries and extraction |

The catalog must be an allowlist. The UI must never be allowed to submit an arbitrary model ID directly to a provider.

## User experience

- Add a model selector near the workflow start controls.
- Show a friendly model name and short capability description.
- Provide a default model per workflow.
- Preserve the selection while the user remains on the page.
- Show the selected model in workflow results and error messages.
- Disable models that are unavailable or not permitted for the current user or project.
- Do not expose provider credentials or internal configuration in the browser.

## Model selection rules

- The server is the source of truth for available models.
- Every request must validate the selected model against the server-side allowlist.
- If no model is selected, use the workflow default.
- If a selected model is unavailable, return a clear error or fall back only when the user has opted into fallback behavior.
- Structured workflows must use a model capability that supports tool calling and structured output.
- Embedding models must be selected separately from chat models.
- Changing a chat model must not silently change the embedding model or require re-indexing.

## Phased implementation plan

### Phase 1: Define the model contract

Target: establish a stable model catalog and workflow defaults.

- Define model IDs, display names, providers, capabilities, and status.
- Define workflow defaults for Jira, RAG, search, Slack, and resume workflows.
- Define which models support tools, structured output, and deterministic execution.
- Decide whether model selection is per request, per session, or saved per user.

Deliverable: model catalog and capability matrix.

### Phase 2: Add the model catalog service

Target: centralize model configuration on the server.

- Create one server-side catalog used by the UI and agents.
- Add an allowlist for approved model IDs.
- Add provider and capability metadata.
- Add availability checks without exposing secrets.
- Add environment-based enable/disable controls.

Deliverable: one trusted source for model selection.

### Phase 3: Add the UI selector

Target: let users choose a permitted model before running a workflow.

- Add a reusable model selector component.
- Load options from the server catalog.
- Display model descriptions and limitations.
- Store the current selection in page state.
- Add accessible labels and keyboard support.

Deliverable: users can select an approved model before execution.

### Phase 4: Pass the selection through the workflow

Target: use the selected model for the current execution.

- Add a validated `modelId` request field.
- Pass the model ID through the API route and workflow entry point.
- Resolve the model through the server catalog.
- Construct the appropriate provider model at the server boundary.
- Keep Anthropic and OpenAI factories available behind the same interface.

Deliverable: each workflow execution uses the selected model.

### Phase 5: Add workflow-specific validation

Target: prevent incompatible model selections.

- Reject models without required tool-calling support.
- Reject models that cannot produce the requested structured output.
- Apply temperature and reasoning settings according to model capabilities.
- Keep deterministic settings for contract extraction and technical analysis.
- Return a user-friendly explanation when a model cannot run a workflow.

Deliverable: model selection cannot break workflow contracts.

### Phase 6: Add usage visibility and fallback behavior

Target: make model behavior understandable and operationally safe.

- Display the selected model in completed results.
- Record model ID, workflow, latency, token usage, and failure status server-side.
- Add optional fallback models for provider outages.
- Clearly indicate when a fallback model was used.
- Add project or user limits if model cost differs significantly.

Deliverable: users and administrators can understand model usage and failures.

### Phase 7: Test and roll out

Target: release model selection safely.

- Test every allowlisted model with every supported workflow.
- Test invalid, missing, and disabled model IDs.
- Test provider failures and fallback behavior.
- Test structured-output and tool-calling compatibility.
- Add regression tests for existing default behavior.
- Release behind a feature flag if the current model behavior must remain unchanged initially.

Deliverable: tested and controlled model selection in production.

## Request contract starter

```ts
type ModelSelection = {
  modelId?: string;
};
```

The server should resolve the final model configuration from `modelId`, workflow name, user permissions, and project settings. The client should not send provider-specific options such as API keys, base URLs, or arbitrary generation parameters.

## Acceptance criteria

- Users can select an approved model before starting a workflow.
- The selected model is used for that execution.
- The server rejects arbitrary or unavailable model IDs.
- Each workflow has a safe default model.
- Tool-calling and structured-output requirements are validated.
- Anthropic and OpenAI models can coexist behind one model interface.
- The selected model is visible in the result or execution details.
- Model usage and failures are recorded for troubleshooting and cost management.
- Existing workflows continue to work when the user makes no selection.

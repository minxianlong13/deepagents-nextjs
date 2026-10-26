# Remote Document Upload Checkbox Refinement Plan

## Objective

Add a UI checkbox that lets the user decide whether remote documents should be uploaded to the knowledge base when the selected documentation contains remote documents.

## Recommended UI behavior

- Label: **Include remote documents in knowledge base**
- Place the checkbox beside the knowledge-base initialization controls.
- Default: unchecked, to preserve the current local-document-only behavior.
- Show helper text explaining that remote documents use their JSON metadata to fetch content.
- Disable or hide the checkbox when the selected folder contains no remote documents.
- If remote documents are present, show a short summary such as: `Remote documents detected: 3`.
- Preserve the selection while the user remains on the page.

## Functional rules

- When unchecked, index only eligible local documents.
- When checked, include remote documents in the indexing operation.
- Do not upload remote documents if their metadata is invalid or the remote fetch fails.
- Report skipped, failed, and successfully indexed remote documents separately.
- Do not duplicate documents that are already indexed and unchanged.
- Keep the option scoped to the current indexing action; do not silently change project-wide configuration.

## Implementation phases

### Phase 1: Define the contract

Target: agree on the option’s meaning and data shape.

- Define the request field, for example `includeRemoteDocs: boolean`.
- Define how the selected folder is scanned for remote metadata.
- Define the response counts for local, remote, skipped, and failed documents.
- Define validation and error behavior.

Deliverable: documented request/response contract.

### Phase 2: Add UI state and discovery

Target: show the checkbox only when it is relevant.

- Add checkbox state with a default of `false`.
- Detect whether the selected docs contain remote documents.
- Display the detected remote document count.
- Add accessible label, description, and disabled state.

Deliverable: users can clearly choose whether to include remote documents.

### Phase 3: Connect the indexing action

Target: send the user’s choice to the server.

- Include the checkbox value in the initialization request.
- Keep local indexing behavior unchanged when the value is `false`.
- Include remote documents only when the value is `true`.
- Show progress and a final result summary.

Deliverable: the checkbox controls the current indexing operation.

### Phase 4: Add server-side handling

Target: enforce the option safely on the server.

- Validate the boolean request field.
- Filter remote documents based on the option.
- Fetch and validate remote metadata only when needed.
- Return separate remote-document results.
- Preserve idempotent indexing behavior.

Deliverable: server behavior matches the UI choice and cannot be bypassed by malformed input.

### Phase 5: Test and refine

Target: make the behavior reliable and understandable.

- Test local-only indexing.
- Test indexing with remote documents enabled.
- Test folders with no remote documents.
- Test invalid metadata and remote fetch failures.
- Test repeated indexing and unchanged documents.
- Test keyboard navigation and screen-reader labeling.

Deliverable: automated coverage and clear user feedback.

## Acceptance criteria

- The checkbox is visible and understandable when remote documents are detected.
- It defaults to unchecked.
- Unchecked indexing does not fetch or upload remote documents.
- Checked indexing includes valid remote documents.
- Invalid or failed remote documents are reported without failing the entire operation.
- The result clearly separates local and remote document outcomes.
- Existing local-document indexing behavior remains unchanged.

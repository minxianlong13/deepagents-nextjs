# RAG Search Improvement Plan

## Objective

Make the knowledge-base search (wiki pages, help docs and ingested webpages in Pinecone) reliable enough for daily development work: usable from code agents such as Claude Code through MCP, and accurate enough that agents can trust what it returns.

**Current status:** Items 1–7 and 16 are complete, and item 10 is in progress. Heading-based chunks are live in the `documents-v2` namespace. The next item is 8, the `get_document` tool.

## Architecture

- **Indexing** stays in the web app: `indexKnowledgeBase` in `apps/web/lib/tools/rag_search.ts`. It reads `./docs`, chunks documents with `apps/web/lib/rag/markdown_chunker.ts`, embeds them and writes to Pinecone.
  - Run it from `/manage/rag` (limited to 300 seconds) or with `pnpm index:kb [folder]` in `apps/web`. A full re-index takes about 10 minutes.
- **Search** runs on the MCP server as the `document_search` tool:
  - `apps/mcp/tools/document-search.mjs` defines the tool and applies the score threshold.
  - `apps/mcp/lib/document-search.mjs` embeds the query and queries Pinecone.
- **Agents** in the web app call MCP through the `documentSearch` wrapper in `rag_search.ts`. It saves chunks under `/retrieved/` for the chunk-analyst subagent. Both the RAG agent and the Jira analysis agent use it.
- **Code agents** connect through `.mcp.json` at the repo root.

Indexing and search must agree on these values. If one changes, change both sides and re-index:

| Setting | Value |
|---|---|
| Pinecone index | `aoe-langchain-docs` (`RAG_PINECONE_INDEX` on the MCP server) |
| Document namespace | `documents-v2` (`RAG_DOCUMENT_NAMESPACE`, on both sides) |
| Manifest namespace | `rag-manifest-v2` (`RAG_MANIFEST_NAMESPACE`, web app only) |
| Embedding model | `text-embedding-3-small`, 1024 dimensions |
| Chunk text metadata key | `text` (LangChain `PineconeStore` default) |

The previous fixed-size index (`documents` and `rag-manifest` namespaces) was deleted on 2026-11-22. Rolling back to fixed-size chunks would require a re-index.

For future chunking changes:

- **Small tweak:** bump `CHUNKER_VERSION` in `rag_search.ts` and run `pnpm index:kb`. Every source is re-chunked in place.
- **Change to compare first:** index into new namespaces (for example `RAG_DOCUMENT_NAMESPACE=documents-v3 RAG_MANIFEST_NAMESPACE=rag-manifest-v3 pnpm index:kb`), then run `pnpm eval` against both and switch only if the new one wins.

### Configuration

| Variable | Where | Purpose |
|---|---|---|
| `OPENAI_API_KEY`, `PINECONE_API_KEY` | MCP server | Query embedding and Pinecone access |
| `MCP_AUTH_TOKEN` | MCP server, web app, shell | Bearer token for `/mcp`; auth is enforced only when set on the server |
| `RAG_MIN_SCORE` | MCP server | Default minimum similarity score (0.45 if unset) |
| `RAG_DOCUMENT_NAMESPACE` | MCP server, web app | Document namespace (defaults to `documents-v2`) |
| `RAG_MANIFEST_NAMESPACE` | Web app | Manifest namespace (defaults to `rag-manifest-v2`) |
| `DEEPAGENTS_MCP_URL` | Shell | MCP URL used by `.mcp.json` (defaults to `http://127.0.0.1:8787/mcp`) |

Quick check: `pnpm test docs <query>` in `apps/mcp`. Full evaluation: `pnpm eval` in `apps/mcp` (see item 6).

## Status

| # | Priority | Task | Status |
|---|---|---|---|
| 1 | P0 | Expose `document_search` as an MCP tool returning chunks inline | Complete |
| 2 | P0 | Register the server in `.mcp.json` for code agents | Complete |
| 3 | P0 | Bearer-token auth on `/mcp` | Complete |
| 4 | P0 | Fix the MCP Dockerfile and deploy with the token | Complete |
| 5 | P1 | Drop weak matches with a score threshold | Complete |
| 6 | P1 | Evaluation set of real questions | Complete |
| 7 | P1 | Chunk by markdown headings | Complete |
| 8 | P1 | `get_document` tool for full pages and neighbouring chunks | Not started |
| 9 | P1 | `AGENTS.md` rule on when to use `document_search` | Not started |
| 10 | P2 | Richer metadata and search filters | In progress |
| 11 | P2 | Deduplicate results by content | Not started |
| 12 | P2 | Reranker | Not started |
| 13 | P2 | Remove deleted sources from the index | Not started |
| 14 | P2 | Clean remote HTML before embedding | Not started |
| 15 | P3 | Log queries, scores and empty results | Not started |
| 16 | P3 | Retry on rate limits instead of a fixed sleep | Complete |
| 17 | P3 | Re-index on a schedule | Not started |

Status values: Not started, In progress, Complete, Dropped. Update both this table and the item's section heading.

## Completed

### 1. `document_search` MCP tool — Complete

Search moved from the web app to the MCP server, so any MCP client can use it.

- Input: `query`, optional `topK` (default 4, maximum 10) and `minScore` (see item 5).
- Output: `structuredContent.results`, each with `id`, `score`, `source`, `text` and `metadata`.
- The web `documentSearch` wrapper calls the MCP tool and still writes `/retrieved/<batch>/chunk_N.md` files, now including the score.
- The RAG agent filters the raw MCP `document_search` out of its MCP tool list, so the wrapper is the only tool with that name.
- Query embeddings use direct `fetch` calls to the OpenAI embeddings API; Pinecone access uses `@pinecone-database/pinecone`.

### 2. `.mcp.json` registration — Complete

`.mcp.json` registers the server for Claude Code. It reads `DEEPAGENTS_MCP_URL` and `MCP_AUTH_TOKEN` from the environment, so no secret is committed.

### 3. Bearer-token auth — Complete

When `MCP_AUTH_TOKEN` is set, `/mcp` requires `Authorization: Bearer <token>` and returns 401 otherwise, using a constant-time comparison. The health check and the Slack OAuth callback stay open. Without the token the server logs a warning and accepts all requests, for local development only.

The web app (`apps/web/lib/mcp/client.ts`) and the test client (`apps/mcp/client.mjs`) add the header from `MCP_AUTH_TOKEN` automatically.

Generate a token with `openssl rand -hex 32`. To rotate it, update the MCP server, the web app, the shell and Cloud Run together.

### 4. Dockerfile fix and deployment — Complete

The image copied only `server.mjs` and `client.mjs`, so the container could not start because `lib/`, `tools/` and `config/` were missing. All of them are now copied. The service is deployed with the token stored in Secret Manager.

### 5. Score threshold — Complete

Chunks scoring below `minScore` are dropped. The default of 0.45 comes from scores measured on the live index:

| Query type | Example | Top scores |
|---|---|---|
| Relevant | "how do I map a registration event to a passkey event" | 0.71–0.74 |
| Relevant | "passkey registration integration" | 0.67–0.68 |
| Vague | "wiki page content" | about 0.44 |
| Off-topic | "kubernetes pod OOMKilled" | 0.38–0.40 |
| Off-topic | "chocolate cake recipe" | 0.18–0.19 |

- Per-call override with `minScore`; server default with `RAG_MIN_SCORE`.
- The response also includes `minScore`, `filteredOut` and `bestScore`.
- An empty result returns "No relevant documentation found" text. The web wrapper tells the agent to continue without documentation evidence and saves no files.

**Follow-up:** checked against the evaluation set in item 6. 0.45 stays the default; see the threshold sweep there.

### 6. Evaluation set — Complete

- **Questions:** `apps/mcp/eval/document-search.eval.json` holds 30 questions: 26 answerable (10 help articles, 8 ADRs, 2 repository docs, 4 wiki pages, 2 remote LangChain docs) and 4 the knowledge base should not answer.
  - Each answerable question lists `expectedSources`: substrings matched against the result's `source`, where any match counts as a hit.
  - The questions are phrased as a developer or support person would ask them, not copied from page titles.
  - They were written from the docs, not collected from real users. Add real questions as they come up; they are the best test.
- **Runner:** `apps/mcp/eval/run.mjs` calls `searchDocuments` directly and does not need the MCP server running.
  - `pnpm eval` uses the default threshold.
  - `pnpm eval -- --min-score 0.5` tries another threshold.
  - `pnpm eval -- --json out.json` also writes per-question results.
- **Metrics:**
  - Hit@1 and Hit@4: a correct source is ranked first, or in the top 4 the tool returns.
  - MRR@10: mean reciprocal rank of the first correct source in the top 10.
  - Tool hit: a correct chunk is in the top 4 and clears `minScore`, which is what an agent actually receives.
  - Negatives empty: off-topic questions that correctly return nothing.

#### Baseline: fixed-size chunks (`documents` namespace, minScore 0.45)

These numbers use the current labels. The run on 2026-11-22 scored Hit@1 20/26 and MRR 0.862 before the label fixes listed below.

| Metric | Result |
|---|---|
| Hit@1 | 21/26 (81%) |
| Hit@4 | 26/26 (100%) |
| MRR@10 | 0.891 |
| Tool hit | 26/26 (100%) |
| Negatives empty | 3/4 (75%) |

Notes from the baseline:

- **Weakest category:** ADR questions are the hardest. Correct scores are 0.50–0.60 versus 0.62–0.81 for help articles, and three ADR questions rank the correct file 2nd or 3rd.
- **Near-miss negative:** `negative-stripe` scores 0.488 against `passkey-repo-payment/docs/DEPLOYMENT.md`. It is a plausible near-miss and the one negative that fails.

#### Label fixes

Labels were widened when inspection showed the top result genuinely answered the question. Both indexes were re-scored with the same labels.

- `adr-link-rollback`: added `wiki-1191973962` (section 6, "Linkage as a two-record model") and the integration's `data-model.md`. The fixed-size index first ranked ADR-0005 10th, behind these two.
- `repo-clamav`: widened from `passkey-repo-clamav/docs` to any file in the repo (its `SKILL.md` ranks highly), plus `wiki-414551042`, a page about integrating ClamAV malware scanning.
- `repo-screenshot`: widened from `passkey-repo-screenshot-service/docs` to any file in the repo, because its `SKILL.md` ranks first.

When adding questions, accept every document that genuinely answers them, not only the most obvious one.

#### Threshold sweep (fixed-size chunks)

| minScore | Tool hit | Negatives empty |
|---|---|---|
| 0.40 | 26/26 | 2/4 |
| 0.45 (default) | 26/26 | 3/4 |
| 0.50 | 26/26 | 4/4 |
| 0.52 | 25/26 | 4/4 |

### 7. Chunk by markdown headings — Complete

`apps/web/lib/rag/markdown_chunker.ts` replaces the 1000-character fixed-size splitter (200 overlap), which cut through headings, tables and code blocks.

- **Splitting:**
  - Markdown is split on headings; headings inside code fences are ignored.
  - Sections under 400 characters merge into the following section.
  - Sections over 1500 characters are split with the markdown-aware recursive splitter, using 150 overlap.
  - Non-markdown files (`.mmd`, `.html`) use plain recursive splitting.
- **Context prefix:** every chunk starts with `Title:`, `Source:` and, when known, `Section: A > B` lines, so the embedding carries the document context.
  - **Title:** the frontmatter `title`, else a single H1, else a label built from the path. A frontmatter `project_name` is appended to the title.
  - **Several H1s:** in exported wiki pages they are top-level sections, so they go into the heading path instead.
- **Metadata:** chunks store `title` and `section` (see item 10).
- **Versioning:** `CHUNKER_VERSION` is part of each source's manifest hash. Bumping it re-indexes every source, even unchanged ones.
- **Tests:** `pnpm test:rag` in `apps/web` (7 tests).
- **Re-index:** the corpus was indexed into new namespaces, `documents-v2` and `rag-manifest-v2`. That produced 775 sources and 11,272 chunks (median 706 characters) in 578 seconds. The old namespaces were deleted after the comparison below.

#### Results (minScore 0.45)

| Metric | Fixed-size (`documents`) | Headings (`documents-v2`) |
|---|---|---|
| Hit@1 | 21/26 (81%) | **22/26 (85%)** |
| Hit@4 | 26/26 | 26/26 |
| MRR@10 | 0.891 | **0.923** |
| Tool hit | 26/26 | 26/26 |
| Negatives empty | 3/4 | 3/4 |

- **Improved:** the cancellation-cascade, bearer-token and link-rollback questions now rank the right document first. ADR scores also rose, for example ADR-0003 from 0.523 to 0.555.
- **Ranks:** every question that does not rank first now ranks second; two ranked third before.
- **Remaining weak spot:** `adr-no-di` dropped to rank 2. Another repo's "Design Patterns > Dependency Injection" section edges out the ADR by 0.003, because generic boilerplate sections now carry matching heading paths. The reranker (item 12) is the likely fix.
- **Near-miss negative:** `negative-stripe` fell from 0.488 to 0.461 but still passes 0.45.

#### Threshold sweep (headings)

| minScore | Tool hit | Negatives empty |
|---|---|---|
| 0.40 | 26/26 | 2/4 |
| 0.45 (default) | 26/26 | 3/4 |
| 0.50 | 26/26 | 4/4 |
| 0.52 | 25/26 | 4/4 |

The default stays 0.45. 0.50 again scores best, but the weakest correct hit is 0.502 (`repo-screenshot`), too close to the edge. Revisit the threshold after item 12, since a reranker changes the score scale.

### 16. Retry on rate limits — Complete

The fixed 10-second sleep after every 8 chunks is gone. Chunks are sent in batches of 96, relying on the built-in retry with backoff in `OpenAIEmbeddings` and `PineconeStore`. A full re-index went from an estimated 3.5 hours to 578 seconds with no rate-limit errors.

## Next

### 8. `get_document` tool — Not started

Lets an agent expand a good hit instead of searching again.

- Fetch a full source document, or neighbouring chunks by ID. Chunk IDs are already `<manifestId>-<index>`, so neighbours are `index ± 1`.
- Cap the response size.

### 9. `AGENTS.md` rule — Not started

Add a short rule telling code agents to use `document_search` for product behaviour, domain concepts and internal conventions before assuming, and to read the code directly for anything in the repository.

### 10. Richer metadata and filters — In progress

Done in item 7: chunks store `title` and `section` and return them in `metadata`.

Remaining:

- Add document type (wiki, help, webpage, repository docs), product and last-updated date at index time.
- Expose optional filters on `document_search`, such as document type and product.
- **Wiki titles:** the wiki MCP tool saves files as `wiki-<id>.md` without the page title, so wiki chunks fall back to labels like "Passkey: wiki 1191973962". Have the wiki tool write the title (for example as frontmatter `title:`); the chunker already reads it.

### 11. Deduplicate results — Not started

Different files in `docs/webpage` contain identical text and take up result slots. Two `setting-up-the-passkey-integration-in-registration-*.md` files both appear in results, and so do `the-complete-guide-to-integrating-registration-events-with-passkey-030f6b12defb.md` and `-908acd375b5f.md`, each pair with identical scores.

- Deduplicate by content hash at index time, or by text in the tool response.

### 12. Reranker — Not started

Pure embedding search is weak on exact terms such as error codes and config keys.

- Retrieve about 20 chunks and rerank to the best 5, using Pinecone's reranking or hybrid search.
- Re-tune the threshold afterwards, because reranker scores use a different scale.

### 13. Remove deleted sources — Not started

`indexKnowledgeBase` re-indexes changed sources through the manifest hash, but a file removed from `docs/` stays in Pinecone forever. The old index had 778 sources against 775 current ones. Those 3 stale sources were cleared when it was deleted, and the gap will reopen as files are removed from `docs/`.

- On each run, compare manifest entries with the current sources and delete the chunks of sources that are gone.

### 14. Clean remote HTML — Not started

`loadRemoteDocuments` embeds raw `response.text()`, markup included.

- Reuse the Readability and Turndown pipeline from the MCP webpage tool to convert pages to markdown first.

### 15. Query logging — Not started

Log the query, best score, result count and whether the result was empty. Low-score and empty queries show which docs are missing.

### 17. Scheduled re-indexing — Not started

Re-index on a schedule so the index stays in step with the wiki, as the OpenWiki workflow already does.

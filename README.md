# DeepAgents Monorepo

This repository is now a pnpm workspace with two sub-projects:

- `apps/web`: Next.js application
- `apps/mcp`: MCP HTTP server and standalone client example

## Workspace Setup

Use Node.js 24.16.0 (pinned in `.tool-versions`) and pnpm 11.2.2. With asdf, install the project runtime before installing dependencies:

```bash
asdf install
pnpm install
```

## Run the Web App (Next.js)

```bash
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000).

## Jira Ticket Analysis

Open [http://localhost:3000/ticket-analysis](http://localhost:3000/ticket-analysis) and enter a `GROUP-12345` or `PROD-12345` key. The Jira agent retrieves the issue through MCP and returns the original Jira tool output with a concise problem summary, Slack search keywords, and a matching repo when supported by the ticket context.

The workflow uses the configured MCP server in `.vscode/mcp.json`. Start it with `pnpm mcp:server`. Jira access must be configured for that MCP server; set `JIRA_ACCEPTANCE_CRITERIA_FIELD` to the Jira custom-field ID if acceptance criteria are stored in a project-specific field. The allowed repo names for the agent are listed in `apps/web/config/repos.json` and must have matching roots in `apps/mcp/config/repositories.json`.

## Run the MCP Server

```bash
pnpm mcp:server
```

Default endpoint:

```text
http://127.0.0.1:8787/mcp
```

## Run the MCP Standalone Client

From `apps/mcp`, list the tools exposed by the local server:

```bash
pnpm test list
```

Select one tool to call. Jira and Wiki accept positional IDs or JSON arguments; Slack accepts search keywords or JSON arguments; webpage ingestion accepts a URL or JSON arguments:

```bash
pnpm test jira GROUP-132015
pnpm test wiki 1106609325
pnpm test slack XSS acknowledgement email
pnpm test search_slack_messages '{"keywords":["XSS"],"response_format":"concise"}'
pnpm test webpage https://developer.mozilla.org/en-US/docs/Web/JavaScript
pnpm test ingest_webpage '{"url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript"}'
```

The client reads `MCP_SERVER_URL` if set; otherwise it defaults to `http://127.0.0.1:8787/mcp`. Jira, Wiki, and webpage inputs can be configured with `JIRA_ISSUE_KEY`, `WIKI_CONTENT_ID`, and `WEBPAGE_URL` when calling those tools without positional arguments. Slack search needs a `query`, at least one keyword, or a `filters` value. On the first Slack search, the local proxy opens the Cvent OAuth sign-in page and receives the authorization callback at `http://localhost:8787/slack/oauth/callback`. The local OAuth client and tokens are kept in memory and are lost when the MCP server process exits.

Slack search returns normalized JSON as text in `content` and as structured data in `structuredContent`, using schema `slack-search/v1`:

```json
{
  "schema": "slack-search/v1",
  "query": {
    "query": null,
    "keywords": ["XSS"],
    "filters": null,
    "naturalLanguage": "XSS"
  },
  "total": 1,
  "results": [
    {
      "rank": 1,
      "channel": { "name": "#passkey-sec", "id": "CGDRE9X1N" },
      "author": {
        "name": "Sourav Gusain",
        "id": "U06C4H482LS",
        "isBot": false
      },
      "time": "2026-09-21 02:40:58 EDT",
      "messageTs": "1789972858.892699",
      "permalink": "https://cvent.slack.com/archives/CGDRE9X1N/p1789972858892699",
      "replyCount": 2,
      "text": "X-XSS-Protection header is still present.",
      "contextBefore": null,
      "contextAfter": null
    }
  ],
  "pagination": { "info": null, "nextCursor": null }
}
```

If you see `404 Page not found` when calling MCP tools, your `MCP_SERVER_URL` is likely invalid or points to a stopped deployment. For local dev, run `pnpm mcp:server` and use `MCP_SERVER_URL=http://127.0.0.1:8787/mcp`.

## Wiki MCP Tool

The RAG configuration accepts `.` for the entire `./docs` folder, or a subfolder relative to `./docs`. Selecting `.` indexes local files plus all remote JSON metadata. Local subfolders index their files directly, while selecting `remote` or a subfolder under `docs/remote` reads JSON metadata files and fetches each URL listed in their `sources` arrays. Only the selected scope is indexed.

The MCP server exposes `get_wiki_content`, which accepts a parent Confluence content ID and calls:

```text
GET /rest/api/content/{contentId}/child/page?limit=100
```

It fetches and exports the parent page first, then collects every child page ID from `results`, fetches each child using `GET /rest/api/content/{childId}?expand=body.storage,version,space,ancestors`, extracts only `body.storage.value`, returns the combined content in parent-first order, and writes one file per page as `wiki-{id}.md`. Set `WIKI_OUTPUT_DIR` to control the output directory; otherwise the server's working directory is used.

For a Confluence/Data Center personal access token, configure:

```bash
WIKI_BASE_URL=https://wiki.cvent.com
WIKI_AUTH_TYPE=bearer
WIKI_BEARER_TOKEN=your-token
```

For an installation that permits Basic authentication, use a username and password instead:

```bash
WIKI_AUTH_TYPE=basic
WIKI_USERNAME=your-username
WIKI_PASSWORD=your-password
```

Credentials are read only by the MCP server and are never accepted as tool arguments or included in the Markdown output. The tool calls the content endpoint with `Accept: application/json`.

To test this tool through the standalone client, run `pnpm test wiki 1106609325` from `apps/mcp`.

## Webpage MCP Tool

The MCP server exposes `ingest_webpage`, which accepts a public HTTP or HTTPS URL, renders it in Chromium with Playwright (including JavaScript-driven pages), extracts the main content, and converts it to Markdown. Markdown is returned as text in `content`; `structuredContent` also includes the final URL and page title. Local or private-network hosts, non-HTML responses, rendered pages larger than 5 MB, and redirects beyond the limit are rejected.

For local runs, install the Playwright Chromium browser once from `apps/mcp`:

```bash
pnpm exec playwright install chromium
```

The MCP Docker image uses the matching Playwright base image with Chromium included. To test the tool through the standalone client, run from `apps/mcp`:

```bash
pnpm test webpage https://developer.mozilla.org/en-US/docs/Web/JavaScript
```

You can also pass the input as JSON with `pnpm test ingest_webpage '{"url":"https://example.com/article"}'`, or set `WEBPAGE_URL` to use it when no URL argument is provided.

## OpenWiki MCP Tool

The `query_openwiki` tool proxies read-only retrieval to an OpenWiki MCP subprocess. It launches `openwiki mcp --host my-rag-server`, calls `openwiki_search` or `openwiki_read`, and returns the upstream content, structured data, and errors unchanged. Each request closes its client and subprocess afterward. Pass a configured `repo` name; `apps/mcp/config/repositories.json` maps names to repository roots.

Install OpenWiki v0.7.2 or another version exposing both retrieval tools on the MCP server's PATH. Set `OPENWIKI_COMMAND` to an executable path if needed, or `OPENWIKI_MCP_HOST` to override the stable lowercase host identifier. The absolute repository root must be accessible to the MCP process and contain a generated `openwiki/` directory. For containers, install OpenWiki and mount the repository; a host-only path is not accessible automatically.

From `apps/mcp`, with the MCP server running:

```bash
pnpm test openwiki '{"action":"search","repo":"deepagents-nextjs","query":"How does the MCP server work?","limit":5}'
pnpm test openwiki '{"action":"read","repo":"deepagents-nextjs","page":"openwiki/quickstart.md","sections":["choose-the-right-guide-before-changing-code"]}'
```

For search, optional `paths` boost related results and `workspace` selects a workspace. For read, use the exact page and heading anchors from search refs and include `wiki` when a result identifies a linked wiki. Search requires Node's SQLite build to support FTS5; a build without it causes an upstream search error even when reads work.

OpenWiki uses the project's Node 24 runtime, so no separate Node executable override is needed. Global npm packages are separate for each asdf Node installation; install OpenWiki under the project runtime from the repository root:

```bash
npm install --global openwiki@0.7.2
asdf reshim nodejs
```

## Test MCP via Next.js Route

```bash
curl -X POST http://localhost:3000/api/mcp/example \
  -H "content-type: application/json" \
  -d '{"name":"DeepAgents"}'
```

## Build and Lint

```bash
pnpm build:web
pnpm lint:web
```

## MCP Container Build

From the repository root:

```bash
docker build -f apps/mcp/Dockerfile apps/mcp -t deepagents-mcp
docker run --rm -p 8080:8080 deepagents-mcp
```

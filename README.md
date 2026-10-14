# DeepAgents Monorepo

This repository is now a pnpm workspace with two sub-projects:

- `apps/web`: Next.js application
- `apps/mcp`: MCP HTTP server and standalone client example

## Workspace Setup

```bash
pnpm install
```

## Run the Web App (Next.js)

```bash
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000).

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

Select one tool to call. Jira and Wiki accept positional IDs or JSON arguments; Slack accepts search keywords or JSON arguments:

```bash
pnpm test jira GROUP-132015
pnpm test wiki 1106609325
pnpm test slack XSS acknowledgement email
pnpm test search_slack_messages '{"keywords":["XSS"],"response_format":"concise"}'
```

The client reads `MCP_SERVER_URL` if set; otherwise it defaults to `http://127.0.0.1:8787/mcp`. Jira and Wiki inputs can be configured with `JIRA_ISSUE_KEY` and `WIKI_CONTENT_ID` when calling those tools without positional arguments. Slack search needs a `query`, at least one keyword, or a `filters` value. On the first Slack search, the local proxy opens the Cvent OAuth sign-in page and receives the authorization callback at `http://localhost:8787/slack/oauth/callback`. The local OAuth client and tokens are kept in memory and are lost when the MCP server process exits.

Slack search preserves the upstream text response and also returns parsed JSON in `structuredContent`, using schema `slack-search/v1`:

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

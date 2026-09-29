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

```bash
pnpm mcp:example
```

The client reads `MCP_SERVER_URL` if set; otherwise it defaults to `http://127.0.0.1:8787/mcp`.

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

The standalone MCP client also exercises this tool using parent content ID `1106609325` when running `pnpm mcp:example`.

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

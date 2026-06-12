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

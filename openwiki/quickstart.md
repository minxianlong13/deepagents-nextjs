---
type: quickstart guide
title: DeepAgents Monorepo Quickstart
description: Start the DeepAgents web application or standalone MCP HTTP service locally, then use this page to route implementation work to the focused architecture, workflow, integration, persistence, and operations guides.
tags: [quickstart, pnpm, nextjs, mcp, local-development]
verified:
  - by: openwiki/0.5.1
    at: 2026-10-04T23:14:27.814Z
sources:
  - id: openwiki-source-eb3821bb9aee7834a67f9434
    resource: repo://.vscode/mcp.json
  - id: openwiki-source-fc7e436199b5880cf1f1d57e
    resource: repo://apps/mcp/client.mjs
  - id: openwiki-source-5a7bd08d89a7c6a7eb257212
    resource: repo://apps/mcp/Dockerfile
  - id: openwiki-source-a44028c625925bd070121aec
    resource: repo://apps/mcp/package.json
  - id: openwiki-source-c0b8329e06f270530381b14f
    resource: repo://apps/mcp/server.mjs
  - id: openwiki-source-37186b9bfb98e1af333ad420
    resource: repo://apps/web/.env.example
  - id: openwiki-source-2c1b77796bb7e56dee2cfa38
    resource: repo://apps/web/app/api/manage/rag/route.ts
  - id: openwiki-source-30ec11911e4eaa44a6e89064
    resource: repo://apps/web/app/api/resume/tailor/route.ts
  - id: openwiki-source-1544c370b9afe36d8a92bc4c
    resource: repo://apps/web/app/layout.tsx
  - id: openwiki-source-db2a4235b6383af8df0b191d
    resource: repo://apps/web/app/page.tsx
  - id: openwiki-source-e32542a78e054f7899532a48
    resource: repo://apps/web/lib/mcp/client.ts
  - id: openwiki-source-99de51df25f29bfc72caf823
    resource: repo://apps/web/package.json
  - id: openwiki-source-ebdb7074fb09ec2c711dbd06
    resource: repo://apps/web/prisma.config.ts
  - id: openwiki-source-04c49ce1b72c82b2c2e53192
    resource: repo://apps/web/prisma/migrations/20260916120000_add_resume_pgvector/migration.sql
  - id: openwiki-source-6d16708c8510e4b6929b57af
    resource: repo://docker-compose.pgvector.yml
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-40275cb92c3610938f16ade3
    resource: repo://pnpm-workspace.yaml
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "openwiki/0.5.1", at: "2026-10-04T23:14:27.814Z" }
---

# DeepAgents Monorepo Quickstart

DeepAgents is a pnpm workspace with **two independently runnable applications**:

- **`apps/web`** — the Next.js product UI and its route handlers. It exposes web search chat (`/search`), RAG chat (`/rag`), resume tailoring (`/resume`), and RAG administration (`/manage/rag`).
- **`apps/mcp`** — a standalone, stateless Streamable HTTP MCP service. Its `POST /mcp` endpoint registers Jira, Slack, and Confluence/wiki tools; it can be started separately or selected by the web application through MCP configuration.

Do not assume that starting the web app starts MCP: they are separate processes. Database-backed web flows also need PostgreSQL/pgvector and the committed Prisma migrations.

## Choose the right guide before changing code

| If the task concerns… | Start here | Then inspect |
| --- | --- | --- |
| Workspace layout, deployable boundaries, or external services | [System Overview and Runtime Boundaries](/openwiki/architecture/system-overview.md) | `apps/web`, `apps/mcp` |
| Search chat request handling, agent fallback, or saved conversation history | [Web Search Conversations and Chat History](/openwiki/workflows/search-conversations.md) | `apps/web/app/api/chat/` |
| RAG source selection, indexing, Pinecone retrieval, or the RAG agent | [Knowledge-Base Indexing and Grounded RAG](/openwiki/workflows/rag-knowledge-base.md) | `apps/web/app/manage/rag/`, `apps/web/lib/` |
| MCP server behavior, client configuration, Jira, Slack, or Confluence export | [MCP Gateway, Client Configuration, and External Connectors](/openwiki/integrations/mcp-service-and-connectors.md) | `apps/mcp/`, `apps/web/lib/mcp/` |
| Resume-tailoring validation, model prompting, or factuality safeguards | [Resume Tailoring Workflow](/openwiki/workflows/resume-tailoring.md) | `apps/web/app/resume/`, `apps/web/app/api/resume/` |
| PostgreSQL schema, pgvector, Prisma migrations, or ownership of stored records | [Persistence, Vector Stores, and Data Ownership](/openwiki/concepts/persistence-and-schema.md) | `apps/web/prisma/` |
| Environment variables, containers, deployment, or validation limits | [Configuration, Deployment, and Validation](/openwiki/operations/configuration-deployment-and-validation.md) | `.env` files, Docker files, package scripts |

## Minimum local web startup

Use pnpm 11 (the repository pins `pnpm@11.2.2`) and install dependencies from the repository root:

```bash
pnpm install
```

For chat-history persistence and to apply the schema that includes pgvector, start the supplied local database, set the web app's `DATABASE_URL`, and apply migrations from the web package:

```bash
docker compose -f docker-compose.pgvector.yml up -d
cp apps/web/.env.example apps/web/.env
cd apps/web && pnpm exec prisma migrate deploy
```

The example URL targets the compose service on host port `5433`; the container creates the `deepagents` database and retains its data in the `deepagents-pgvector-data` volume. The web app needs additional provider configuration for features that call models, search, vector retrieval, or MCP; keep credentials out of source control and use the [operations guide](/openwiki/operations/configuration-deployment-and-validation.md) to identify the owner of each variable.

Return to the repository root and start Next.js:

```bash
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000). A quick smoke check is to load `/search`, `/rag`, `/resume`, and `/manage/rag`; exercise a configured external integration only when its required credentials and backing service are available.

## Start and validate the MCP service

Start this service in a second terminal at the repository root:

```bash
pnpm mcp:server
```

By default it listens at `http://127.0.0.1:8787/mcp` (the server binds `0.0.0.0`; the local client and checked-in web MCP config use the loopback URL). `PORT` takes precedence for container platforms, followed by `MCP_PORT`; `MCP_HOST` can change the bind address. `GET /` is the health endpoint, while MCP requests must use `POST /mcp`.

```bash
curl http://127.0.0.1:8787/
cd apps/mcp && pnpm test list
```

The first command should return `{"status":"healthy"}`. The second uses the standalone Streamable HTTP client to connect to `MCP_SERVER_URL` (or its default local URL) and list tools. It is the narrowest live check that the MCP service accepts a client connection. Calling Jira or wiki requires their respective configured credentials; Slack calls additionally require keywords or a filter and proxy to the configured Slack MCP service.

The web app's MCP client reads `MCP_CONFIG_PATH` first, then `.vscode/mcp.json` relative to its working directory and the repository root. That checked-in config points to the same local `/mcp` endpoint. The client selects `MCP_SERVER_NAME` when supplied, otherwise the first configured server, and supports HTTP MCP transports only. Consequently, start `pnpm mcp:server` before trying **Fetch wiki files** in `/manage/rag` unless the configuration deliberately points at another reachable MCP server.

## Focused validation entry points

Use the narrowest command that covers the change:

```bash
pnpm lint:web
pnpm build:web
```

The workspace defines no repository-level automated test runner: `apps/mcp`'s `test` script is the interactive standalone client, not a unit-test suite. For an MCP tool change, keep the service running and use `cd apps/mcp && pnpm test list` before a credentialed tool call. For a web UI or route change, run lint/build and smoke the affected page or API flow locally. See the [operations guide](/openwiki/operations/configuration-deployment-and-validation.md) for deployment-related checks and known limits.

## Deployment handoff

The MCP image is built independently from `apps/mcp` and defaults to port `8080` in its runtime image. Build and run it from the repository root with:

```bash
docker build -f apps/mcp/Dockerfile apps/mcp -t deepagents-mcp
docker run --rm -p 8080:8080 deepagents-mcp
```

Validate the container with `curl http://127.0.0.1:8080/`. Treat this as an MCP-service check, not a complete deployment validation: external connector credentials and the web application's provider configuration remain deployment-specific.

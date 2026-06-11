FROM node:20-alpine

WORKDIR /app

# Pin pnpm to a Node 20 compatible release.
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY mcp ./mcp

ENV NODE_ENV=production
ENV MCP_PORT=8787
ENV MCP_HOST=0.0.0.0

EXPOSE 8787

CMD ["node", "mcp/server.mjs"]

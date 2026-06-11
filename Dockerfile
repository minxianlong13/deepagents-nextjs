FROM node:20-alpine

WORKDIR /app

# Pin pnpm to a Node 20 compatible release.
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY mcp ./mcp

ENV NODE_ENV=production
ENV PORT=8080
ENV MCP_HOST=0.0.0.0

EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "mcp/server.mjs"]

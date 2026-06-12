FROM node:20-alpine AS deps

WORKDIR /app

# Keep pnpm version aligned with the workspace toolchain.
RUN corepack enable && corepack prepare pnpm@11.2.2 --activate

# Copy dependency manifest first to maximize layer cache hits.
COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    MCP_HOST=0.0.0.0

# Run as non-root for better container security.
USER node

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node server.mjs example-client.mjs package.json ./

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 8080) + '/', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.mjs"]

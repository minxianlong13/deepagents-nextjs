# Technical Details

## Technology Stack
- **Framework**: Next.js (Pages Router) on CDF (Cvent Development Framework)
- **Language**: TypeScript 4.9
- **Build Tool**: pnpm + Nx 20.7 (monorepo orchestration)
- **Runtime**: Node.js (asdf-managed)
- **Cache**: Redis (ioredis)
- **API**: Apollo Server (GraphQL) + Apollo Client
- **UI Library**: Carina UI (`@cvent/carina` 1.145.3)
- **Styling**: Tailwind CSS + Emotion
- **Testing**: Jest + React Testing Library + MSW (mocks)
- **Storybook**: v6.5 for component development
- **Linting**: ESLint (Airbnb config) + Prettier (`@cvent/prettier-config`)
- **Feature Flags**: LaunchDarkly (`@launchdarkly/node-server-sdk`)
- **Monitoring**: Datadog (RUM, APM, Logs via `dd-trace`, `@datadog/browser-rum`)
- **Analytics**: Cvent Analytics (`@cvent/analytics`) + Google Analytics (GA4) + Gainsight
- **GraphQL Codegen**: `@graphql-codegen/cli` with TypeScript plugins
- **CDK**: AWS CDK v2 for infrastructure

## Key Dependencies
- `@cvent/cdf` 1.72.33 — CDF framework
- `@cvent/carina` 1.145.3 — Carina UI component library
- `@cvent/auth-client` 4.1.0 — Auth client
- `@cvent/feature-flags` 2.7.21 — Feature flag client
- `@cvent/planner-navigation` 3.0.39 — Planner navigation
- `@cvent/nextjs` 1.6.0 — Cvent Next.js utilities
- `@cvent/hogan-client` 2.1.2 — Hogan template config
- `@cvent/logging` 1.0.40 — Logging
- `@cvent/fetch` 1.0.31 — HTTP fetch wrapper
- `@apollo/client` 3.11.0 — Apollo GraphQL client
- `@cvent/apollo-server` 2.2.16 — Apollo server wrapper
- `graphql` 16.8.1 — GraphQL core
- `graphql-redis-subscriptions` 2.6.0 — Redis-backed GQL subscriptions

## Configuration
Environment variables are managed via Hogan templates (`.env.template`). Key config categories:
- **Service URLs**: ~30 backend service endpoints (passkey-*, auth-service, reporting-service, etc.)
- **Auth**: `CVENT_AUTH_SERVICE`, `PASSKEY_AUTH_URL`, `PASSKEY_PERM_URL`
- **Cache**: `IS_DISTRIBUTED_CACHE_ENABLED`, `DEFAULT_SERVER_CACHE_TTL`, `DEFAULT_NOTIFICATIONS_CACHE_TTL`
- **Datadog**: `DD_APP_ID`, `DD_CLIENT_TOKEN`, `DD_SAMPLE_RATE`
- **Feature Flags**: `EXPERIMENTS_SERVICE_ENDPOINT`, `EXPERIMENTS_ENV_KEY`
- **Analytics**: `DATA_PLATFORM_WRITE_KEY`, `GOOGLE_ANALYTICS`, `CVENT_ANALYTICS_SERVICE`
- **Environment**: `ENVIRONMENT_KEY`, `ENVIRONMENT_TYPE`, `ALLOWED_ORIGIN_DOMAINS`

## Monitoring & Logging
- **Datadog APM**: `dd-trace` for server-side tracing (service name: `passkey-rdk2`)
- **Datadog RUM**: Browser-side real user monitoring
- **Datadog Logs**: `@datadog/browser-logs` for client-side logging
- **SonarQube**: Code quality analysis (project key: `passkey-rdk2`)
- **Log Level**: WARN (default), INFO (deployed), DEBUG (CI)

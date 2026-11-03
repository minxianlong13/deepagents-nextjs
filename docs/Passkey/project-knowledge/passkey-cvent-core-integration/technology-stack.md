---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: technology-stack
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [technology, versions, nextjs, react, zod, nx, pnpm, cdf, carina, aws-cdk]
---

# Technology Stack

**Verified.** "Declared" is the range in `package.json`; "Installed" is what `node_modules`
resolved to on 2026-11-02 (where readable). Most dependencies are declared once in the **root**
`package.json` `devDependencies` (CDF monorepo convention); the app package
`packages/housing/app/package.json` declares only its few extra runtime dependencies.

## Runtime and tooling

| Tool | Version | Source | Notes |
|---|---|---|---|
| Node.js | 22.19.0 | `mise.toml` | |
| pnpm | 10.32.1 (mise) / `pnpm@10.8.0` (`packageManager`) | `mise.toml`, root `package.json` | **Discrepancy:** the two pins differ (see [documentation-audit.md](documentation-audit.md)) |
| Nx | 21.6.11 | root `package.json` | Task runner; root scripts run `nx affected` |
| TypeScript | 5.9.3 | root `package.json` | |
| CDF (Cvent Development Framework) | 2.36.0 | `@cvent/cdf` pinned | Generated the repo skeleton; `cdf.config.mjs` in each package |

## Application framework

| Library | Declared | Installed | Role |
|---|---|---|---|
| `next` | ^15.5.18 | 15.5.24 | App Router, RSC, server actions, middleware, `output: 'standalone'` |
| `react`, `react-dom` | ^19.2.6 | 19.2.8 | UI |
| `zod` | ^3.25.0 (app) | 3.25.76 | Upstream schemas, ViewModels, input validation |
| `http-status-codes` | ^2.3.0 (app) | — | `StatusCodes` constants (required by repo rules) |
| `server-only` | ^0.0.1 (app) | — | Guards every data module from client bundling |
| `next-intl` | ^4.8.2 | not resolved | Localization (`locales/en-US.json`, `fr-FR.json`) |
| `@cvent/nextjs` | ^3.9.2 | not resolved | Auth middleware, `getAuthContext`, `nextServer`, `okApiRoute`, `versionInfoRoute` |
| `@cvent/fetch` | ^2.5.1 | not resolved | `JsonClient` behind `src/lib/upstream-client.ts` |
| `@cvent/logging` | ^2.2.2 | not resolved | `src/logging/Logger.ts` |
| `@cvent/app-config` | ^3.1.29 | not resolved | Runtime config (`src/config/getConfig.ts`) |
| `@cvent/planner-navigation` | ^4.29.0 | not resolved | Planner shell navigation, product nav route |
| `@launchdarkly/node-server-sdk` | ^9.7.4 | — | Feature flags (`src/launchdarkly/`) |
| `dd-trace` | ^5.63.0 | 5.123.0 | Datadog APM, marked external in `next.config.mjs` |
| `@datadog/browser-rum`, `-logs` | ^5.21.0 | — | Browser monitoring |

"not resolved" means `require('<pkg>/package.json')` is blocked by the package's `exports` map; the
version is Unknown beyond the declared range.

## UI

| Library | Declared | Installed | Role |
|---|---|---|---|
| `@cvent/carina` | ^2.166.0 | 2.184.1 | Cvent design system components |
| `@cvent/carina-charts` | ^2.63.2 (app) | 2.63.2 | Booking pace and room-night charts |
| `@cvent/my-cvent-bridge-widget` | ^0.7.1 (app) | not resolved | Passkey login modal and its server actions |
| `@vis.gl/react-google-maps` | ^1.10.1 (app) | not resolved | Hotel map |
| `tailwindcss` | ^3.4.16 | 3.4.19 | Styling (`tailwind.config.js`) |
| `@emotion/react` | ^11.13.0 | — | Used by Carina |

## Template leftovers (present, not used by housing features)

`@apollo/client` (installed 3.14.1), `@cvent/apollo-server`, `graphql`, `graphql-ws`,
`graphql-redis-subscriptions`, `ioredis` — the CDF template's GraphQL stack. The housing UI uses
REST through `JsonClient`; the GraphQL route serves a mock resolver (Verified:
`src/server/resolvers/userProfile.ts`, `src/server/subscription.ts`).

## Testing

| Tool | Declared | Installed | Used for |
|---|---|---|---|
| `jest` | ^30.1.3 | 30.4.2 | Unit tests (jsdom), `@swc/jest` transform |
| `@testing-library/react` | ^16.0.0 | — | Component tests (`data-cvent-id` test ids) |
| `msw`, `jest-fetch-mock` | ^2.0.12, ^3.0.3 | — | HTTP mocking |
| `@playwright/test` | ^1.46.0 | 1.62.1 | e2e (`packages/housing/e2e`) |
| `@axe-core/playwright`, `lighthouse` | ^4.9.0, ^12.6.1 | — | Accessibility / performance tooling |

## Infrastructure and delivery

| Tool | Declared | Installed | Role |
|---|---|---|---|
| `aws-cdk-lib` | ^2.267.0 | 2.271.0 | Stacks |
| `@cvent/cdk-applications` | ^1.57.1 | — | `InfraApp`, `RuntimeApp` (Fargate web app) |
| `@cvent/octopusdeploy-cdk` | ^4.7.5 | — | Octopus Deploy pipelines |
| `@cvent/environments` | ^1.50.142 | — | Account ids, Octopus environment ids |
| Jenkins (`Jenkinsfile`) and GitHub Actions | — | — | CI; see [deployment-operations.md](deployment-operations.md) |

Related: [dependency-map.md](dependency-map.md) · [development-guide.md](development-guide.md)

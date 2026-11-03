---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: directory-structure
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [directory-structure, monorepo, nx, packages, layout]
---

# Directory Structure

**Verified** by listing the tree at commit `61e748e`. Generated or local-only folders
(`node_modules`, `dist`, `cdk.out`, `.next`, `.coverage`) are omitted.

## Repository root

```
.
├── CLAUDE.md / AGENTS.md     # Architecture rules for humans and agents (near-identical; CLAUDE.md adds UI + stacked-PR sections)
├── Jenkinsfile               # Jenkins buildPipeline
├── .github/workflows/        # build-pipeline.yml, openwiki-update.yml
├── openwiki/                 # Generated wiki (do not hand-edit)
├── project-knowledge/        # This knowledge base
├── nx.json, pnpm-workspace.yaml, package.json, mise.toml, cdf.config.mjs, renovate.json
└── packages/housing/
    ├── app/     # @cvent/housing — the Next.js application (+ its runtime CDK entry points)
    ├── infra/   # @cvent/housing-infra — infrastructure CDK app and shared tags/props
    ├── it/      # @cvent/housing-it — integration tests (Jest against a deployed URL)
    ├── e2e/     # @cvent/housing-e2e — Playwright tests
    ├── model/   # @cvent/housing-model — GraphQL schema/operations (template)
    └── catalog-info.yaml     # Backstage component "housing", owner cherry-pickers
```

## `packages/housing/app/`

| Path | Contents |
|---|---|
| `bin/` | **Runtime** CDK entry points per environment (`ci`, `ct50`, `ld50`, `pr50`, `pr51`, `sandbox`, `sg50`, `pipeline`) and `bin/shared/commonProps.ts` (secret *names*). Each imports the matching `infrastructure` from `@cvent/housing-infra/bin/<env>` |
| `cdk.json` | CDK config for the runtime app |
| `server.js` | Production entry: `@cvent/nextjs/server/nextServer` `start` |
| `next.config.mjs` | Standalone output, compression off, localization plugin |
| `locales/` | `en-US.json`, `fr-FR.json` |
| `plan.json` | Analytics tracking plan (events such as `bridgePage.auth`) |
| `docs/analytics/` | Analytics docs |
| `scripts/setup-local-https.sh` | Local HTTPS setup for `dev:https` |

### `packages/housing/app/src/`

| Folder | Role | Layer |
|---|---|---|
| `middleware.ts` | Auth, `evtstub` enforcement, headers | Edge of the app |
| `app/` | App Router: `layout.tsx`, `login/`, `error/`, `api/` routes, `events/housing/` page | Boundaries |
| `app/events/housing/` | `page.tsx`, `actions.ts` (server actions), `UnlinkedLandingPage.tsx`, `LinkedLandingPage.tsx`, and one folder per section | Page + UI |
| `app/events/housing/<Section>/` | `server/` (async RSC wrapper that starts reads) and `client/` (`'use client'` components). Sections: `BookingPace`, `HotelList`, `HotelMap`, `LinkRoomBlock`, `LinkedLandingPageTitleBar`, `PasskeyLogin`, `RoomBlockData`, `RoomBlockHeaderSection`, `RoomNightSummary`, `RoomNightsPickup` | UI |
| `lib/` | Guards (`check*Access`, `assertCoreEventAccess`), `route-utils`, `action-utils`, `errors`, `upstream-client`, `bearer-token`, `auth-metadata`, query schemas, chart and formatting helpers | Shared server helpers |
| `server/data/` | Composers that build ViewModels (`event-link`, `events`, `hotels`, `inventory`, `booking-pace`, `event-map`, `registration-summary`, `room-block-data-filters`, `passkey-user-profile`) | Data composition |
| `server/resolver.ts`, `resolvers/`, `subscription.ts` | GraphQL template code (mock) | Unused |
| `data/<service>/` | One folder per upstream service with single-purpose fetchers | Upstream access |
| `types/upstream/` | 13 upstream Zod schema files, one per service | Contracts |
| `types/view-models/index.ts` | All ViewModel schemas | Contracts |
| `types/internal/` | Server-only plain types | Contracts |
| `hooks/` | Client hooks calling `GET /api/*` | Client data |
| `components/` | App-wide providers and shells (`AppProviders`, `ThemeProvider`, `CoreEventContextProvider`, `PasskeyEventIdProvider`, `ErrorBoundary`, `TopNavigation`, …) | UI |
| `config/getConfig.ts` | Public vs server runtime config | Config |
| `launchdarkly/` | LaunchDarkly client and flags (`getGlobalRebrand`) | Config |
| `navigation/` | `routes.ts` (`HOUSING_ROUTE`) and planner sitemaps | Navigation |
| `logging/Logger.ts` | Logger wrapper | Observability |
| `analytics/`, `i18n/`, `utils/` | Analytics actions, locale loading, error redirect | Misc |
| `pages/api/graphql.ts` | Pages-router GraphQL endpoint (template) | Unused |

**Oddity:** `src/data/cvent-event/` contains only an empty `__tests__/` folder (Verified, not
tracked content). Probably left behind by a rename to `core-event/` (Inferred, Confidence: Medium).

## `packages/housing/infra/`

| Path | Contents |
|---|---|
| `lib/commonProps.ts` | `appName: 'housing'`, application type `WebApplication`, `fargate`, `public`, `plannerApp: true` |
| `lib/tags.ts` | `businessUnit: hospitality`, `platform: passkey`, `product: passkey-for-planners-housing` |
| `lib/Application.ts` | `InfraApp` subclass |
| `bin/<env>.ts` | Pod, stage, AWS account and region per environment (see [deployment-operations.md](deployment-operations.md)) |
| `bin/pipeline.ts` | Octopus "Housing Infra" pipeline |

## Tests

- Unit tests sit beside the code in `__tests__/` folders (167 files). Fixtures in
  `src/app/events/housing/__fixtures__/`.
- `packages/housing/it/src/ok.test.ts` — the only integration test.
- `packages/housing/e2e/src/UnlinkedLandingPage.spec.ts` and `helpers/login.ts`.

Related: [code-navigation.md](code-navigation.md) · [architecture.md](architecture.md)

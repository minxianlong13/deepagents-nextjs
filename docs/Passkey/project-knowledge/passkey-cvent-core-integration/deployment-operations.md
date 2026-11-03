---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: deployment-operations
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [deployment, operations, aws, cdk, octopus, jenkins, github-actions, datadog, secrets]
---

# Deployment and Operations

Paths here are relative to the repository root. No secret **values** appear in the repo or in this
document; only the names and parameter-store paths of secrets are listed.

## Deployment model

**Verified.** The app is deployed as a Cvent CDF **Fargate web application** (AWS ECS Fargate)
built with `@cvent/cdk-applications`. There are two CDK apps:

| CDK app | Location | Defines |
|---|---|---|
| Infrastructure (`InfraApp`) | `packages/housing/infra/bin/<env>.ts`, `lib/commonProps.ts`, `lib/Application.ts` | App name `housing`, type `WebApplication`, compute `fargate`, visibility `public`, `plannerApp: true`, tags; pod, stage, AWS account/region per environment |
| Runtime (`RuntimeApp`) | `packages/housing/app/bin/<env>.ts`, `bin/shared/commonProps.ts` | Container runtime: secrets, integration-test and e2e-test packages. Imports the infra definition from `@cvent/housing-infra/bin/<env>` |

Next.js is built with `output: 'standalone'` and started by `packages/housing/app/server.js`
(`@cvent/nextjs/server/nextServer`). `compress: false` because CloudFront compresses
(`packages/housing/app/next.config.mjs`). Server source maps are enabled (`node --enable-source-maps`).

## Environments

**Verified** (`packages/housing/infra/bin/*.ts`).

| Target | Stage | AWS account | Region | Status |
|---|---|---|---|---|
| `ci` | development | core-passkey-dev | us-east-1 | active |
| `sg50` | development | core-passkey-dev | us-east-1 | active |
| `ld50` | development | core-passkey-dev | us-east-1 | active |
| `ct50` | integration | core-passkey-intg | us-east-1 | active |
| `pr50` | production | core-passkey-prod | us-east-1 | active |
| `pr51` | production | core-passkey-prod | us-west-2 | **passive** |
| `sandbox` (target name `dev`) | sandbox | cvent-sandbox | us-east-1 | active |

All use pod `na1`. The meaning of "passive" for `pr51` (for example a standby region) is defined
by `@cvent/cdk-applications`, not this repo (Inferred, Confidence: Medium).

## Release pipelines (Octopus Deploy)

**Verified** (`packages/housing/app/bin/pipeline.ts`, `packages/housing/infra/bin/pipeline.ts`).
Both live in the `cvent-management` account, project group **Passkey**, Slack
`passkey-cherrypickers`.

| Pipeline | Stack | Development phase | Production phase | Notes |
|---|---|---|---|---|
| **Housing** (runtime) | `housing-pipeline` | **automatic** to `sg50`, `ld50` | optional (manual) to `pr50`, `pr51` | `useHogan: true`; depends on `housing-infra-pipeline` |
| **Housing Infra** | `housing-infra-pipeline` | optional to `sg50`, `ld50` | optional to `pr50`, `pr51` | |

`ct50` and `ci` are not in either pipeline's phases (Verified); how they are deployed is Unknown
(likely CI-driven for `ci` — Inferred, Confidence: Low).

## CI

**Verified.** Two CI definitions exist side by side:

| CI | File | Key settings |
|---|---|---|
| Jenkins | `Jenkinsfile` | `buildPipeline` from `pipeline-utils`; agent `ecs-arm-xlarge`; trunk `main`; `enableNxVerifyDeploy`; release from `main`; Slack on `main` failures to `passkey-cherrypickers-notifications`; Mend scanning; Playwright HTML report `packages/housing/app/playwright-report` |
| GitHub Actions | `.github/workflows/build-pipeline.yml` | Reusable `cvent-internal/github-actions` build-pipeline workflow; runs on PRs to `main`, pushes to `main`, merge queue, manual dispatch; ARM xlarge runner; 360 min timeout; same Slack/report settings |
| GitHub Actions | `.github/workflows/openwiki-update.yml` | Daily at 08:00 UTC (`cron: "0 8 * * *"`): regenerates `openwiki/` |

Whether Jenkins or GitHub Actions is the system of record is Unknown — they mirror each other
(Inferred: a migration in progress, Confidence: Low).

Root scripts use `nx affected` (build, test, lint, verify, deploy). Versioning uses Changesets
(`@changesets/cli`; commits such as `RELEASING: Releasing 1 package(s)`).

## Secrets and configuration

**Verified.** Names only.

| Secret | Source | Used by |
|---|---|---|
| `API_KEY` | parameter store `/housing/API_KEY` | Server: bearer-token minting, IMS, passkey-authentication, passkey-reporting; also IT and e2e tests |
| `GOOGLE_MAPS_API_KEY` | parameter store `/housing/GOOGLE_MAPS_API_KEY` | **Client** (in `publicRuntimeConfig`) for the hotel map |
| `GOOGLE_MAPS_MAP_ID` | parameter store `/housing/GOOGLE_MAPS_MAP_ID` | Client |
| `LAUNCHDARKLY_PROJECT_SDK_KEY` | parameter store, per stage | `src/instrumentation.ts` |
| `LAUNCHDARKLY_SHARED_SDK_KEY` | secrets manager, per stage | `src/instrumentation.ts` |

`src/config/getConfig.ts` splits config: `publicRuntimeConfig` (Datadog ids, `LOG_LEVEL`
default `warn`, `LOGIN_URL`, analytics, `CORE_PLANNER_BASE_URL`, Google Maps values) is serialized
into the page in a `CDF_CONFIG` script tag; `serverRuntimeConfig` holds only `API_KEY`. Service
base URLs are read from `process.env` server-side. The full variable list is in
`packages/housing/app/.env.template`; see [development-guide.md](development-guide.md).

`catalog-info.yaml` annotates `framework.cvent.com/api-key-change-effect: restart` — rotating the
API key requires a restart (Verified annotation; consistent with the per-process token cache in
`src/lib/bearer-token.ts`).

## Observability

| Concern | Implementation |
|---|---|
| Logging | `src/logging/Logger.ts` wraps `@cvent/logging` with Datadog options; level from `LOG_LEVEL`; silent during `next build` |
| APM (Application Performance Monitoring) | `dd-trace` initialized in `src/instrumentation.ts` via `@cvent/app-config/instrumentation` |
| Browser | `@datadog/browser-rum` / `-logs` (`DD_APP_ID`, `DD_CLIENT_TOKEN`, `DD_ENV`, `DD_SERVICE`, `DD_VERSION`) |
| Service name | Datadog `housing`, SonarQube `housing`, Octopus `housing` (`catalog-info.yaml`) |
| Health | `GET /api/ok` (public); `GET /api/version-info` |
| Feature flags | LaunchDarkly, initialized at startup (`src/instrumentation.ts`) |

**Useful log signals** (Verified from code): orphan Record A/B (`orphanContext` in
`src/server/data/event-link.ts`), "more than one Passkey integration", IMS missing mapping
(ERROR), Passkey account selection reasons (`selectOwnerAccount`), hotel map page-count warning.

## Ownership

Backstage owner **cherry-pickers** (`packages/housing/catalog-info.yaml`); `CODEOWNERS` at the root.

Related: [technology-stack.md](technology-stack.md) · [known-issues-roadmap.md](known-issues-roadmap.md)

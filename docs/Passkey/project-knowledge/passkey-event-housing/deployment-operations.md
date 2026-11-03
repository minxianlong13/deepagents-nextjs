---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: deployment-operations
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [deployment, operations, jenkins, config, monitoring, environments]
---

# Deployment & Operations

## Pipeline

[Jenkinsfile](../Jenkinsfile) uses the shared `dropwizardPipeline` (pipeline-utils):

- Changesets-driven versioning; **release from `master`**.
- Builds on master deploy to **alpha**. Promotion to higher environments is handled outside this repo (**Unknown** mechanism).
- Checkmarx SAST on master (team path Passkey).
- Slack notifications to `#passkey-api` (start / success / failure).
- [build.sh](../build.sh): `mvn clean deploy -Prelease,jenkins,default` then `mvn clean install -Pcoverage`. [build-release.sh](../build-release.sh): Maven release prepare/perform. [build-it.sh](../build-it.sh): ITs against `$ENVIRONMENT`.
- GitHub Actions: only the nightly OpenWiki refresh — no build/test.

## Runtime packaging

- Fat jar + `*-configs` assembly (release profile). Deployed on Cvent's AWS container platform with base image `cvent-aws-java-base-21` ([base.properties](../passkey-event-housing-service/configs/base.properties)).
- [Dockerfile](../Dockerfile) is **legacy**: JRE 11 runtime image, runs `configs/dev.yaml`, does not pre-copy shared/data-access POMs. Not referenced by the Jenkinsfile (Confidence Medium) — do not use for production.

## Environments & sizing

| File | Settings (non-secret) |
|---|---|
| base.properties | `hard_memory_limit=800`, `max_memory_percentage=45`, `internet_facing=false`, `dynamic_config=true`, `e2e_ssl=true`, `graviton_enabled=false` |
| pr50.properties, sg50.properties | min 2 / max 8 instances, autoscaling **on**, CPU target 70% |
| pr51.properties | min 2 / max 8, autoscaling **off** |
| ct50.properties | `hard_memory_limit=800` |
| alpha, ci, it50, ts50 | no overrides |

Environment names are inferred to mean pr = production, sg = staging (Confidence Medium); ct/ts/it meanings **Unknown**.

Database `multiEnvConfig` keys in template.yaml: dev, ci, alpha, it50, S400, staging, sg50, T2, integration, production. Pool: min 1 / max 50 connections, 30 s wait, `READ_COMMITTED`.

## Configuration

[template.yaml](../passkey-event-housing-service/configs/template.yaml) is rendered with hogan `{{...}}` placeholders from Cvent shared config (endpoints, bucket names, secrets). Key settings:

| Setting | Value / source |
|---|---|
| Ports | 7000 app, 7001 admin; h2 on 7443/7444 |
| `rootPath` | `/{{environment.name}}/*` |
| Downstream endpoints | `eventService`, `inventoryService`, `fileUploaderService`, `authConfig.authServiceEndpoint` |
| S3 | `groupmaxContentBucketName`, `groupmaxContentBucketUrlPrefix`, `groupmaxContentBucketTag` |
| `defaultPkUser` | service user name used for admin associations |
| Logging | JSON console, level WARN; access log JSON **including request and response bodies** |

Secrets (DB passwords, API key) are injected via placeholders in template.yaml; their values are not documented here.

## Observability

- Logs: JSON with MDC (`eventId`, `hotelId`, `userId`… via `LogContextFeature`).
- Metrics: Dropwizard `@Timed` on 6 methods in `EventResource` only.
- Dashboards: Datadog link in [catalog-info.yaml](../catalog-info.yaml) (contents **Unknown**).
- Health: `/healthcheck` on 7001 always healthy — it does **not** detect DB or downstream outages.

## Runbook notes

No runbook exists in the repo. Practical starting points:

| Symptom | Check |
|---|---|
| 5xx with `NoSuchElementException` | Message-only exception hit the mapper bug ([known-issues-roadmap.md](known-issues-roadmap.md)) |
| Image upload 500 | S3 permissions / bucket config; PFU reachability or Bearer token |
| Wrong GroupLink transfer dates | Time zone passed by caller; conversion to America/New_York |
| Requests failing on locale | passkey-event service availability (default locale lookup on most reads) |
| Partial GroupLink setup | Non-atomic writes; re-run setup (MERGE-based) |

Ownership: Metrestick (`#passkey-metre-stick`), secondary Meeseeksbox (`#passkey-meeseeks-box`) per README.

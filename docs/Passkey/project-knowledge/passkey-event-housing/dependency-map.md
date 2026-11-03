---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: dependency-map
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [dependencies, modules, downstream, clients, maven]
---

# Dependency Map

Diagram: [diagrams/service-dependencies.mmd](diagrams/service-dependencies.mmd).

## Internal Maven modules (verified from module POMs)

| Module | Depends on | Consumed by |
|---|---|---|
| `passkey-event-housing-api` | — | all other modules |
| `passkey-event-housing-shared` | api | data-access, service, java-client |
| `passkey-event-housing-data-access` | api, shared | service |
| `passkey-event-housing-service` | api, data-access, shared | — (deployable) |
| `passkey-event-housing-java-client` | api, shared | integration-test; external Passkey services (names **Unknown**) |
| `passkey-event-housing-integration-test` | api, java-client | — |

Note: the AGENTS.md shorthand `api ← shared` is reversed from the POMs: **shared depends on api**.

## Runtime downstream services

All are built in [ClientCreator.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/util/ClientCreator.java) with Retrofit2 + `RetryInterceptor` (retry policy defined in the Cvent library, details **Unknown**).

| Downstream | Client(s) | Config key | Auth | Used for | Wrapper |
|---|---|---|---|---|---|
| passkey-event service | `PasskeyEventClient`, `PasskeyAdminEventClient`, `PasskeyMessagesClient`, `PasskeyImagesClient` | `eventService.endpoint` | service API key | default locale, WebInfo creation, messages, block room images | `EventProvider`, `MessageProvider`, `ImageProvider` |
| passkey-inventory service | `PasskeyInventoryClient` | `inventoryService.endpoint` | service API key | block → event/hotel/room-type lookup | `InventoryProvider` |
| passkey-file-uploader (PFU) | `PasskeyFileUploaderClient` | `fileUploaderService.endpoint` | caller's Bearer token per call | download uploaded file | `PfuFileProvider` |
| auth-service | `CventAuthFeature` (auth-service-core) | `authConfig.authServiceEndpoint` | — | validate inbound API keys / bearer tokens | — |

Failure behaviour: `ClientUtil.getOrFail` throws on unsuccessful responses, failing the request; there is no fallback or circuit breaker in this repo (Confidence High).

## Data stores

| Store | Access | Notes |
|---|---|---|
| Oracle (multi-environment, Pangaea `multiEnvConfig`) | MyBatis via `AbstractDao` and raw `SqlSessionFactory` | Many schemas (e.g. `XFER`, `BRIDGE`, `GUI`, `EVENTINFO`) — see [data-model.md](data-model.md) |
| AWS S3 bucket `groupmax-content` (name from shared config) | AWS SDK v2 `S3Client`, region US_EAST_1 | Image bytes; key prefix from `groupmaxContentBucketUrlPrefix` |
| Couchbase | `dropwizard-couchbase` | Only for unused callback code |

## Catalog declarations

[catalog-info.yaml](../catalog-info.yaml): `dependsOn` passkey-event-service and passkey-inventory-service; `consumesApis` auth-service. PFU and S3 are used in code but **not declared** in the catalog.

## Unused declared dependencies

`passkey-hotel-java-client` 1.0.45 and `passkey-subblock-data-java-client` 1.0.18 — no imports in main source (Confidence High).

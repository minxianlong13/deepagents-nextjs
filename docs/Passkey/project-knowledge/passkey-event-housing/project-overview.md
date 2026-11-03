---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: overview
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [overview, scope, ownership, domain]
---

# Project Overview

## Purpose

The Passkey Event Housing Service exposes REST APIs for **event housing data**: the hotels attached to a Passkey event, their rooms (room types), room blocks, room categories, images, GroupLink (hotel reservation-system integration) setup, and registration-provider connections.

- README description: "Information about hotels and rooms on a event" ([README.md](../README.md)).
- Backstage: component `passkey-event-housing-service`, system `passkey-for-planners-housing`, business unit `hospitality`, lifecycle `active` ([catalog-info.yaml](../catalog-info.yaml)).
- Registered in the Passkey `GUI.APPLICATION` table as application id `1001` "Event Housing Service" ([res-master-script.sql](../passkey-event-housing-data-access/src/main/resources/res-master-script.sql)).

## Ownership

| Role | Team | Slack | Source |
|---|---|---|---|
| Primary | Metrestick | `#passkey-metre-stick` | [README.md](../README.md) |
| Secondary | Meeseeksbox | `#passkey-meeseeks-box` | [README.md](../README.md) |
| Backstage owner | `metre-stick` | — | [catalog-info.yaml](../catalog-info.yaml) |

Code owners: `@cvent-internal/metre-stick` plus named individuals ([CODEOWNERS](../CODEOWNERS)).

## Functional scope (verified from registered resources)

| Capability | Resource | Summary |
|---|---|---|
| Event hotels & rooms (read) | `EventResource` | Hotels for an event, hotel details, rooms, room details, block-based room view, commerce shut-off date |
| Block summaries | `BlockResource`, `EventResource` | Block summary by block ids or by event |
| Registration connections | `ConnectionResource`, `AdminResource` | Link an event to a registration provider (partner) via API access code; admin participant association |
| GroupLink setup | `GroupLinkResource` | Configure hotel reservation-system transfer definitions and code mappings, approve event/blocks |
| Room block transfer state | `RoomBlockTransferStateResource` | Persist approach/provider/rate per event+hotel |
| Room categories | `RoomCategoryResource`, `EventRoomCategoryResource` | CRUD categories, assigned rooms, beds, amenities |
| Images | `ImagesResource` | Upload (direct or via PFU), copy, reorder, list, delete images stored in S3 |

Full endpoint list: [api-reference.md](api-reference.md).

## Out of scope / not present

- **Callbacks**: `CallbackResource` and `CallbackService` exist in source but are **not registered** in `PasskeyEventHousingServiceApplication.run()`. Verified ([PasskeyEventHousingServiceApplication.java:158-173](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/PasskeyEventHousingServiceApplication.java#L158-L173)).
- No asynchronous messaging, schedulers or background jobs. Verified (no queue/scheduler classes found).
- The service does not own schema DDL; it reads/writes shared Passkey Oracle schemas.

## Consumers

- Java consumers via the published `passkey-event-housing-java-client` (Retrofit2). See [dependency-map.md](dependency-map.md).
- Exact list of consuming services: **Unknown** (not recorded in repo).

## Key facts

| Fact | Value | Source |
|---|---|---|
| Current version | 1.8.2-SNAPSHOT (released 1.8.1) | [pom.xml](../pom.xml), [package.json](../package.json) |
| Language | Java 21 (api & java-client target 11) | [pom.xml](../pom.xml) |
| Framework | Dropwizard via Cvent `CventApplication` | [PasskeyEventHousingServiceApplication.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/PasskeyEventHousingServiceApplication.java) |
| Data stores | Oracle (MyBatis), AWS S3 | [data-model.md](data-model.md) |
| API base path | `/{env}/passkey-event-housing/v1` | [ApiConstants.java](../passkey-event-housing-shared/src/main/java/com/cvent/passkey/eventhousing/constants/ApiConstants.java), `rootPath` in [template.yaml](../passkey-event-housing-service/configs/template.yaml) |
| Ports | 7000 app / 7001 admin (HTTP); 7443 / 7444 (h2) in template | [template.yaml](../passkey-event-housing-service/configs/template.yaml) |

---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: technical-decisions
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [decisions, architecture, rationale, adr]
---

# Technical Decisions

No ADRs or design docs exist in the repository. The decisions below are **reconstructed from code** and recorded as ADRs with status *Accepted (inferred)*. Rationale is stated only where the code or comments express it; otherwise it is marked **Inferred**.

| # | Decision | Evidence | Rationale source |
|---|---|---|---|
| [001](adr/001-manual-wiring-no-di.md) | Manual object wiring in `run()`, no DI framework | `PasskeyEventHousingServiceApplication.run()` | Inferred |
| [002](adr/002-mybatis-oracle-xml-mappers.md) | MyBatis XML mappers on Oracle; `MERGE` for upserts | mapper XML files | Inferred |
| [003](adr/003-threadlocal-transaction-manager.md) | ThreadLocal `TransactionManager` + `executeInSameDbSession` | `TransactionManager`, `AbstractDao`, `AbstractService` | Code comment in `ImageService.deleteImageById` ("prevent gaps on failure") |
| [004](adr/004-immutables-and-java11-client.md) | Immutables interfaces for API models; api + java-client compiled for Java 11 | module POMs | Inferred (consumer compatibility) |
| [005](adr/005-pfu-bearer-token-forwarding.md) | Forward caller Bearer token to PFU; no `@Authority` on `/images/pfu` | `ClientCreator` comment, `ImageService` | Code comment |
| [006](adr/006-s3-image-storage-md5-dedupe.md) | Image bytes in S3 keyed by MD5, metadata in Oracle | `ImageService`, `ImageUtil` | Inferred |
| [007](adr/007-karate-its-against-deployed-envs.md) | Karate integration tests run against deployed environments | integration-test module, `build-it.sh` | Inferred |

## Other notable choices (not ADR-worthy)

- **Transfer window in America/New_York** — explicit code comment: ResDesk stores transfer dates anchored to its server zone ([GroupLinkService.java:103-112](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/GroupLinkService.java#L103-L112)).
- **`FAIL_ON_UNKNOWN_PROPERTIES` disabled** globally on the ObjectMapper (ClientCreator), so new downstream fields don't break deserialisation.
- **Pascal-case mapper** (`withPascalMapper`) for downstream clients — downstream services use PascalCase JSON (Confidence Medium).
- **"ClientCreator" exists to satisfy a Checkstyle "Class Fan-Out Complexity" rule** (class javadoc).

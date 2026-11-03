---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: known-issues-roadmap
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [known-issues, risks, tech-debt, security, bugs, roadmap]
---

# Known Issues & Roadmap

Findings from code inspection, not from an issue tracker. No roadmap document exists in the repo; the "Suggested follow-ups" are recommendations, **not** committed plans.

## Security

| # | Issue | Evidence | Severity | Confidence |
|---|---|---|---|---|
| S1 | **Committed credentials**: `configs/dev.yaml` contains literal DB user/password values for several environments and an auth API key. Values are intentionally not reproduced here. | [dev.yaml](../passkey-event-housing-service/configs/dev.yaml) | High | High |
| S2 | Access log includes `requestContent` and `responseContent` → request/response bodies (potentially personal data) in logs | [template.yaml:32](../passkey-event-housing-service/configs/template.yaml#L32) | Medium | High |
| S3 | `ImagesResource` returns `e.getMessage()` in plain-text 500 bodies (internal detail leakage) | [ImagesResource.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/ImagesResource.java) | Low | High |
| S4 | `/images/pfu` has no local auth; missing/malformed `Authorization` header → 500, not 401 | ImagesResource + [ADR-005](adr/005-pfu-bearer-token-forwarding.md) | Low | High |

## Correctness

| # | Issue | Evidence | Confidence |
|---|---|---|---|
| C1 | Exception mappers call `Optional.get()` on an empty Optional when an exception has no error code → `NoSuchElementException` instead of the intended error response | [EventHousingExceptionMapper.java:26-31](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/exceptions/EventHousingExceptionMapper.java#L26-L31), [DaoExceptionMapper.java:26-31](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/exceptions/DaoExceptionMapper.java#L26-L31) | High |
| C2 | GroupLink setup is not atomic (each DAO write auto-commits) | [GroupLinkDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/GroupLinkDataAccess.java) | High |
| C3 | Room-category delete and image cleanup are separate commits; AdminService participant loop stops on first failure without rollback | [RoomCategoryService.java:212-218](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/RoomCategoryService.java#L212-L218), [AdminService.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/AdminService.java) | High |
| C4 | `approveBlocks` updates `EVENTPROFILE.BLOCK` filtered only by `GROUPTYPEID` (no event/hotel predicate). Safe only if group-type ids are unique to one event/hotel — needs review | [GroupLinkMapper.xml:211-215](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/GroupLinkMapper.xml#L211-L215) | Medium |
| C5 | Image-number race: next number computed by reading the partition, then inserting; concurrent uploads can get the same number | [ImageService.java:312-316](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/ImageService.java#L312-L316) | Medium |
| C6 | Error-code enum HTTP statuses disagree with what exceptions send (`INVALID_API_ACCESS_CODE`, `INVALID_PARTNER`: enum 404, sent 400) | [RegistrationErrorCodeType.java](../passkey-event-housing-shared/src/main/java/com/cvent/passkey/eventhousing/constants/RegistrationErrorCodeType.java) | High |
| C7 | Health check always returns healthy | [PasskeyEventHousingHealthCheck.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/health/PasskeyEventHousingHealthCheck.java) | High |

## Performance

| # | Issue | Confidence |
|---|---|---|
| P1 | N+1 queries when enriching room categories (per-category lookups) | Medium |
| P2 | Remote default-locale call to passkey-event service on most reads when `locale` is not supplied | High |

## Dead code & drift

| # | Item | Confidence |
|---|---|---|
| D1 | `CallbackResource` / `CallbackService` / Couchbase DAO not registered → unreachable; Couchbase dependency only serves this | High |
| D2 | `passkey-hotel-java-client`, `passkey-subblock-data-java-client` declared but unused | High |
| D3 | RAML spec covers 5 paths of the 49 registered endpoints | High |
| D4 | `ImagesResource` javadoc mentions a non-existent `PUT /commit` | High |
| D5 | README says Java 17 SDK and documents a Clover `-Pcoverage` report; code is Java 21 and the profile is not in repo POMs | High |
| D6 | Legacy Dockerfile (JRE 11) and dropkick scaffold scripts | High |
| D7 | DB pool `applicationName: "passkey-bridge-service"` — looks copied from another service; affects DB session identification | High |
| D8 | Hard-coded values: S3 region US_EAST_1; ResDesk zone America/New_York (intentional, documented in code) | High |
| D9 | `@Timed` metrics only on `EventResource` | High |
| D10 | No DDL in repo; schema changes are owned elsewhere (**Unknown** where) | High |

## Suggested follow-ups (recommendations only)

1. Rotate and remove credentials from `dev.yaml`; load from environment/secret store (S1).
2. Fix C1 by mapping absent error codes to a default (e.g. `INNER_SERVER_ERROR`).
3. Drop request/response bodies from the access log or redact (S2).
4. Wrap GroupLink setup in `executeInSameDbSession` after migrating `GroupLinkDataAccess` to `AbstractDao.dbCall` (C2).
5. Add DB connectivity to the health check (C7).
6. Remove or register callback code; remove unused dependencies (D1, D2).
7. Regenerate the API spec from code (D3).

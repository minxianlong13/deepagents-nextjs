---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: testing-guide
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [testing, unit-tests, integration-tests, karate, coverage]
---

# Testing Guide

## Unit tests

| Module | `*Test.java` files | Style |
|---|---|---|
| passkey-event-housing-service | 28 | JUnit 5 + Mockito; Dropwizard resource tests |
| passkey-event-housing-data-access | 13 | JUnit 5 + Mockito mocks of `SqlSessionFactory`/mappers (no embedded DB found) |

```bash
mvn test                      # all modules
mvn -pl passkey-event-housing-service test -Dtest=ImageServiceTest
```

Coverage gate: JaCoCo 70% (service), 68% (data-access), enforced in `test` phase. Sonar gates only the service module.

## Integration tests (Karate)

Module: [passkey-event-housing-integration-test](../passkey-event-housing-integration-test/). They call a **deployed** environment (ADR-007).

```bash
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify        # same as build-it.sh with ENVIRONMENT=dev
mvn -Prun-it -Denv.IT_ENVIRONMENT=dev verify -Dkarate.tags=@some-tag
```

- Runner `PasskeyEventHousingKarateTestIT.testParallel`: all features under `classpath:com/cvent/passkey/eventhousing/`, tag filter `~@ignore` plus optional `-Dkarate.tags`, 5 threads, JUnit XML + Cucumber JSON output.
- A second, `@Disabled` test runs only `@create-grouplink-setup`.
- `PasskeyEventHousingTestIT` / `BaseClientTestIT` test via the Java client; `DBUtil` (commons-dbutils) reads/writes the environment DB.
- Environments listed in [test_configs/environments.txt](../passkey-event-housing-integration-test/test_configs/environments.txt): dev, ci, alpha, ts50. Config: `karate-config-<env>.js`, `<env>.test.yaml`.
- Single feature in IntelliJ: VM options `-Dkarate.env=dev -Dkarate.config.dir=test_configs`.

### Feature coverage

| Area | Features |
|---|---|
| Hotels / rooms | `get_housing_event_hotels/*`, `get_housing_event_hotel_rooms/*`, `get_housing_event_hotel_rooms_with_blockid/*` |
| Blocks | `block/getBlocksSummary`, `getEventBlocksSummary`, `getEventBlocksWithLocale`, `roomBlockTransferState` |
| Connections | `connections/connections` |
| GroupLink | `create-grouplink-positive`, `create-grouplink-negative`, `get-pre-code-events` |
| Images | `images/images_E2E` |
| Room categories | `room_categories/*` (E2E, negative, beds/amenities, copy-event) |
| Shared setup | `common/*.feature` (event, hotel, participant, GroupLink DB setup, images, room categories) |

`POST /admin/codes/event/{eventId}` is exercised only as setup in `common/connections-common.feature`; `PUT /admin/connections/{eventId}` and `POST /images/pfu` have no feature coverage (grep, Confidence High).

## Test data

ITs create their own events/hotels through `common/` features and DB helpers; cleanup strategy is **Unknown**.

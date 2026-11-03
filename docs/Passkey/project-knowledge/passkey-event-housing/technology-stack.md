---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: technology-stack
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [java, dropwizard, mybatis, oracle, aws, retrofit, karate, maven]
---

# Technology Stack

All versions verified in POM files / `.tool-versions` unless marked otherwise.

## Language & runtime

| Item | Version | Source |
|---|---|---|
| Java (service, data-access, shared, integration-test) | 21 (`java.version` in root POM) | [pom.xml](../pom.xml) |
| Java (api, java-client) | 11 — keeps the published client consumable by Java 11 services | [passkey-event-housing-api/pom.xml](../passkey-event-housing-api/pom.xml), [passkey-event-housing-java-client/pom.xml](../passkey-event-housing-java-client/pom.xml) |
| JDK (local tooling) | Amazon Corretto 21.0.4.7.1 | [.tool-versions](../.tool-versions) |
| Container base | `cvent-aws-java-base-21` | [base.properties](../passkey-event-housing-service/configs/base.properties) |
| Maven | 3.9.4 | [.tool-versions](../.tool-versions) |
| Node / pnpm (release tooling only) | 24.16.0 / 7.33.1 | [.tool-versions](../.tool-versions) |

## Frameworks & libraries

| Area | Library | Version | Notes |
|---|---|---|---|
| Parent POM | `com.cvent:maven-parent` | 57.0.0 | Supplies most managed versions (Dropwizard, Jersey, Retrofit, Immutables) — exact transitive versions **Unknown** from repo alone |
| Web framework | Dropwizard (Cvent `common-dropwizard`, `CventApplication`) | managed | JAX-RS / Jersey (Jakarta) |
| HTTP/2 | `dropwizard-http2` | managed | h2 connectors on 7443/7444 in template config |
| Multipart | `jersey-media-multipart` | 3.1.10 | Image upload |
| Auth | `auth-service-core` | 16.0.2 | `CventAuthFeature`, `@Authority` |
| Persistence | Cvent `dropwizard-mybatis`, `pangaea` (multi-env config) | managed | MyBatis XML mappers |
| JDBC | `ojdbc8` | 18.3.0.0 | Oracle |
| NoSQL | `dropwizard-couchbase` | 9.14.0 | Only used by unused callback DAO |
| Model generation | Immutables (`value`) | managed | `@Value.Immutable` interfaces |
| HTTP clients | Retrofit2 via Cvent `Retrofit2ClientProvider` | managed | `ClientCreator` |
| Downstream clients | `passkey-event-java-client` 1.12.4, `passkey-inventory-java-client` 1.0.67, `passkey-file-uploader-sb-java-client` 0.0.13 | | |
| Declared, no imports found | `passkey-hotel-java-client` 1.0.45, `passkey-subblock-data-java-client` 1.0.18 | | Confidence High that they are unused in main source |
| Shared Passkey lib | `passkey-microservices-common` | 1.4.2 | Error types (`com.cvent.passkey.error`) |
| Filter DSL | Cvent `criteria.predicate` (`MyBatisSQLPredicateConverter`) | managed | Room filter |
| AWS | AWS SDK v2 `s3` | managed | `S3Client`, region `US_EAST_1` hard-coded |
| Observability | `dropwizard-json-logging`, Cvent `dropwizard.observability` | managed | JSON logs, MDC |

## Testing

| Tool | Use |
|---|---|
| JUnit 5 + `junit-vintage-engine`, Mockito (`mockito-core`, `mockito-junit-jupiter`) | Unit tests |
| `dropwizard-testing`, `dropwizard-unit-tests` | Resource tests |
| Karate (`karate-core`, `karate-junit5`, `karate-utils`) + `cucumber-reporting` | Integration tests against deployed envs |
| `commons-dbutils` + `ojdbc8` | DB helpers in ITs |
| JaCoCo | Coverage gate (70% service, 68% data-access) |
| Checkstyle | Enforced (inherited) |

## Build / release / CI

| Tool | Use | Source |
|---|---|---|
| Maven multi-module (`${revision}` = 1.8.2-SNAPSHOT) | Build | [pom.xml](../pom.xml) |
| maven-shade / assembly / jar plugins | Fat jar + `configs` assembly (release profile) | [service pom.xml](../passkey-event-housing-service/pom.xml) |
| Changesets (`@changesets/cli`, `@cvent/builder-changesets`) | Versioning & changelog | [package.json](../package.json), [.changeset/](../.changeset/) |
| Jenkins `dropwizardPipeline` (pipeline-utils) | CI/CD, Checkmarx SAST, Slack | [Jenkinsfile](../Jenkinsfile) |
| GitHub Actions | Nightly OpenWiki regeneration only | [.github/workflows/openwiki-update.yml](../.github/workflows/openwiki-update.yml) |
| Backstage TechDocs (mkdocs) | Docs site (`docs/index.md` is a stub) | [mkdocs.yaml](../mkdocs.yaml) |
| RAML 1.0 | API spec — partial/stale (5 resource paths) | [api.raml](../passkey-event-housing-api/src/main/resources/api/api.raml) |

---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: development-guide
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [development, build, local-setup, run, checkstyle]
---

# Development Guide

## Prerequisites

- JDK 21 (Amazon Corretto 21.0.4.7.1 per [.tool-versions](../.tool-versions)), Maven 3.9.4.
- Access to Cvent's internal Nexus repository (Cvent parent POM and libraries) — README points to an internal wiki page for Maven setup.
- Node 24 / pnpm 7 only for changesets release tooling.
- Network access to a dev Oracle DB and dev downstream services to run the app (Inferred from `dev.yaml` contents).

## Build

```bash
mvn package -Prelease                 # fat jar + configs assembly
mvn package -Prelease -Dcheckstyle.skip=true   # skip Checkstyle locally
```

Unit tests and the JaCoCo gate (70% service, 68% data-access instruction coverage) run in the `test` phase.

## Run locally

```bash
cd passkey-event-housing-service
java -jar target/passkey-event-housing-service-*.jar server configs/dev.yaml
```

- App port 7000, admin port 7001 (health check `/healthcheck` on admin).
- Base URL locally: `http://localhost:7000/dev/passkey-event-housing/v1/...` (env segment from `rootPath`; Confidence Medium for the `dev` value).
- IntelliJ: main class `com.cvent.passkeyeventhousing.PasskeyEventHousingServiceApplication`, args `server passkey-event-housing-service/configs/dev.yaml`. The README says "Java 17 SDK" — **outdated**; use 21.
- **Do not add real credentials to `dev.yaml`.** It already contains committed values that should be rotated and externalised (see [known-issues-roadmap.md](known-issues-roadmap.md)).

## Coding conventions (verified in code / AGENTS.md)

- API models: `@Value.Immutable` interfaces in the api module; build via `ImmutableXxx.builder()`.
- No DI: wire new objects in `PasskeyEventHousingServiceApplication.run()`.
- Errors: throw an `EventHousingBaseException` subclass with a `RegistrationErrorCodeType`; avoid message-only constructors until the mapper `Optional.get()` bug is fixed.
- SQL in mapper XML; Oracle `MERGE` for upserts; chunk IN lists at 1000.
- api/java-client must stay Java 11 compatible.
- Checkstyle is enforced (rules inherited from the Cvent parent POM).

## Versioning & changelog

Changesets: add a changeset under [.changeset/](../.changeset/) for user-visible changes; Jenkins releases from `master` and updates [CHANGELOG.md](../CHANGELOG.md). PR checklist: [pull_request.md](../pull_request.md).

## Coverage report

README documents `mvn clean install -Pcoverage` → `target/site/clover/index.html`. No `coverage` profile is defined in this repo's POMs; it may come from the Cvent parent POM (**Unknown**). JaCoCo is the enforced gate.

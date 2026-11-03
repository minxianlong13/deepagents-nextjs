---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: adr
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [adr, immutables, api-models, java-client, java11]
---

# ADR-004: Immutables API models and a Java 11 client

- **Status:** Accepted (inferred from code — no original ADR exists)
- **Date:** Unknown
- **Confidence:** High

## Context

Other Passkey services call this service and need typed models. Some consumers may run on Java 11 (Inferred from compiler target).

## Decision

API models are `@Value.Immutable` interfaces in `passkey-event-housing-api`; generated `ImmutableXxx` builders are used everywhere. The api and java-client modules compile for Java 11 while the service uses Java 21. A Retrofit2 `PasskeyEventHousingClient` (plus admin/images/room-category/transfer-state clients) is published.

## Consequences

- Thread-safe, null-checked value objects; builders in tests and code.
- Java 21 language features cannot be used in api/java-client.
- The client must be released in step with API changes.

## Evidence

- [passkey-event-housing-api/pom.xml](../../passkey-event-housing-api/pom.xml), [passkey-event-housing-java-client/pom.xml](../../passkey-event-housing-java-client/pom.xml)
- [model package](../../passkey-event-housing-api/src/main/java/com/cvent/passkeyeventhousing/model/)

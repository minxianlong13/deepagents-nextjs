---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: adr
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [adr, wiring, dependency-injection, bootstrap]
---

# ADR-001: Manual object wiring without a DI framework

- **Status:** Accepted (inferred from code — no original ADR exists)
- **Date:** Unknown
- **Confidence:** High

## Context

Dropwizard does not mandate a DI container. The service has roughly a dozen DAOs, services, providers and resources.

## Decision

All DAOs, providers, services, exception mappers and resources are constructed explicitly in `PasskeyEventHousingServiceApplication.run()` and registered with Jersey. Downstream HTTP clients are built in `ClientCreator`.

## Consequences

- Wiring is easy to read in one place; no reflection or annotation magic.
- Every new dependency requires editing the constructor call in `run()`.
- Forgetting to register a resource silently disables it — this is what happened to `CallbackResource` (see [known-issues-roadmap.md](../known-issues-roadmap.md)).

## Evidence

- [PasskeyEventHousingServiceApplication.java](../../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/PasskeyEventHousingServiceApplication.java) (DAOs ~114–125, services ~127–155, resources ~158–173)
- [ClientCreator.java](../../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/util/ClientCreator.java)
- AGENTS.md "Service Wiring" section

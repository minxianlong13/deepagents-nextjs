---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: adr
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [adr, testing, karate, integration-tests]
---

# ADR-007: Karate integration tests against deployed environments

- **Status:** Accepted (inferred from code — no original ADR exists)
- **Date:** Unknown
- **Confidence:** High

## Context

The service depends on a shared Oracle schema and several downstream services that are hard to emulate locally.

## Decision

Integration tests live in `passkey-event-housing-integration-test` (Karate features + Java client tests) and run with `-Prun-it -Denv.IT_ENVIRONMENT=<env>` against a deployed environment (e.g. dev, alpha).

## Consequences

- Tests exercise the real schema and downstreams.
- Results depend on environment data/state; tests cannot run fully offline.
- DB helpers (`DBUtil`, commons-dbutils) need environment DB access.

## Evidence

- [build-it.sh](../../build-it.sh)
- [integration-test module](../../passkey-event-housing-integration-test/)
- [testing-guide.md](../testing-guide.md)

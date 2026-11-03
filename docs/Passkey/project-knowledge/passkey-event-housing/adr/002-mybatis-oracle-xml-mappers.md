---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: adr
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [adr, mybatis, oracle, sql, persistence]
---

# ADR-002: MyBatis XML mappers on the shared Oracle database

- **Status:** Accepted (inferred from code — no original ADR exists)
- **Date:** Unknown
- **Confidence:** High

## Context

The service reads and writes tables owned by the wider Passkey platform (GroupLink, bridge, GUI, event-info schemas) in an existing Oracle database. Schema ownership lies outside this repo (no DDL present).

## Decision

Use MyBatis with SQL in XML files next to mapper interfaces. Upserts use Oracle `MERGE`; some writes use PL/SQL blocks. IN-lists are chunked at 1000 (`AbstractDao.IN_CLAUSE_MAX_SIZE`).

## Consequences

- Full control of hand-written Oracle SQL against a legacy schema.
- SQL is not checked at compile time; errors surface at runtime or in ITs.
- Tight coupling to the shared schema — changes by other teams can break this service (Inferred).

## Evidence

- [mapper XML directory](../../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/)
- [AbstractDao.java](../../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/AbstractDao.java)

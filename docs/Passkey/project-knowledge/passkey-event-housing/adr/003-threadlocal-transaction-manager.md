---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: adr
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [adr, transactions, mybatis, threadlocal]
---

# ADR-003: ThreadLocal transaction manager for multi-DAO operations

- **Status:** Accepted (inferred from code — no original ADR exists)
- **Date:** Unknown
- **Confidence:** High

## Context

Individual DAO calls open auto-commit sessions. A few operations need several statements to share a session, e.g. image delete + renumber.

## Decision

`TransactionManager` stores an active `SqlSession` in a `ThreadLocal`; `within()` opens a non-auto-commit session and commits or rolls back. `AbstractDao.dbCall` reuses the ambient session; `AbstractService.executeInSameDbSession` is the service-level entry point.

## Consequences

- Used in `RoomDetailsService`, `HotelDetailsService` and `ImageService.deleteImageById` (comment: delete + renumber "in a single DB session to prevent gaps on failure").
- **Not** used by four DAOs that take a raw `SqlSessionFactory`: `GroupLinkDataAccess` and `RoomCategoriesDataAccess`/`AdminDataAccess` commit per call; `ConnectionDataAccess` manages its own explicit transaction. GroupLink setup is therefore not atomic.
- Relies on request-per-thread execution; async code would lose the session (Inferred).

## Evidence

- [TransactionManager.java](../../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/transaction/TransactionManager.java)
- [AbstractDao.java](../../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/AbstractDao.java)
- [AbstractService.java](../../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/AbstractService.java)
- [ImageService.java:186-190](../../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/ImageService.java#L186-L190)

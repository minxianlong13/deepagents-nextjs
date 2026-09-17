---
name: "passkey-repo-reservation-orchestrator-client"
description: "Provides a Java client library that simplifies integration with Passkey's reservation orchestrator API. Offers type-safe interfaces for creating, modifying, and canceling hotel reservations through both single and batch operations, with built-in monitoring and error handling. Use when working with: the passkey-reservation-orch-client repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-reservation-orch-client`
- **Type**: Java Client Library
- **Owner**: Passkey Team (`#passkey`)
- **DB**: None (Client library)
- **Registry ID**: Not specified

## What This Service Does
Provides a Java client library that simplifies integration with Passkey's reservation orchestrator API. Offers type-safe interfaces for creating, modifying, and canceling hotel reservations through both single and batch operations, with built-in monitoring and error handling.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| Reservation | Hotel booking record with dates, room details, guest info, and payment |
| Guest | Individual staying at hotel with personal information and preferences |
| Room | Physical accommodation unit with specific characteristics and amenities |
| Room Night | Single night's stay used for pricing and availability calculations |
| Batch Operation | Collection of multiple reservation operations processed together |
| Guarantee Type | Method of securing reservation (payment authorization, deposit) |
| Add-on | Additional services like breakfast, parking, or spa services |
| Commerce Transaction | Financial operations including payments, refunds, authorizations |
| Group Booking | Multi-room reservation for events, conferences, or group travel |
| Orchestration | Coordination of complex reservation workflows across systems |

## Architecture at a Glance
```
src/main/java/com/passkey/reservation/client/
├── ReservationClient.java       # Single reservation operations
├── BatchReservationClient.java  # Bulk operation processing
├── CommerceClient.java          # Payment and commerce operations
├── BaseClient.java              # HTTP communication and auth
├── model/                       # Domain models and DTOs
└── exception/                   # Client-specific exceptions
```

## API Surface
| Client Class | Key Operations |
|--------------|----------------|
| ReservationClient | create(), modify(), cancel(), get() - Single reservations |
| BatchReservationClient | createBatch(), monitor() - Bulk operations |
| CommerceClient | processPayment(), authorize(), refund() - Financial operations |
| GroupBookingClient | createGroup(), modifyGroup() - Group reservations |

## Key Business Rules
- Single operations provide immediate feedback with monitoring capabilities
- Batch operations process multiple reservations efficiently with status tracking
- All operations support asynchronous monitoring until completion
- Type safety is enforced through immutable domain models
- Commerce integration handles payment processing and guarantee types
- Group bookings support multi-room reservations for events
- Robust error handling provides detailed exception information

## Service Dependencies
| Service | Purpose |
|---------|---------|
| Reservation Orchestrator API | Backend API for reservation processing |
| Passkey Authentication | API key-based authentication |
| Commerce Services | Payment processing and financial operations |
| Hotel Services | Hotel inventory and availability data |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full client API docs with examples
- `docs/ARCHITECTURE.md` — Detailed client structure, design patterns
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships
- `docs/TECHNICAL_DETAILS.md` — Dependencies, build config, testing
- `docs/DEPLOYMENT.md` — Library publishing and integration
- `docs/DEVELOPMENT.md` — Local setup, testing, contribution guidelines

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-reservation-orch-client` to browse:
- `src/main/java/com/passkey/reservation/client/` — Client implementations
- `src/main/java/com/passkey/reservation/model/` — Domain models and DTOs
- `src/test/java/` — Unit and integration tests
- `pom.xml` — Maven configuration and dependencies
- `catalog-info.yaml` — Backstage service metadata

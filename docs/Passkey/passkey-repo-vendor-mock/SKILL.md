---
name: "passkey-repo-vendor-mock-service"
description: "The Passkey Vendor Mock Service provides comprehensive testing harness that mocks various hotel vendor systems for Passkey integration testing. It simulates 15+ major hotel technology vendors including Amadeus, Opera, Hilton, Marriott, and IHG, enabling controlled testing scenarios with predictable responses for outbound GL integrations and reservation transfers. Use when working with: the passkey-vendor-mock repository; Vendor Mock, Magic Keywords, Callback Message, Response Control, OAuth2 Mock."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-vendor-mock`
- **Type**: Java 25 Dropwizard Service
- **Owner**: Passkey API Team (meeseeksbox) (`#passkey-api`)
- **DB**: In-memory storage for callbacks
- **Registry ID**: passkey-vendor-mock-service

## What This Service Does
The Passkey Vendor Mock Service provides comprehensive testing harness that mocks various hotel vendor systems for Passkey integration testing. It simulates 15+ major hotel technology vendors including Amadeus, Opera, Hilton, Marriott, and IHG, enabling controlled testing scenarios with predictable responses for outbound GL integrations and reservation transfers.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Vendor Mock** | Simulated hotel PMS/CRS system for testing |
| **Magic Keywords** | Special request payload keywords controlling response behavior |
| **Callback Message** | Asynchronous response simulation from vendor systems |
| **Response Control** | System for managing mock response types and behaviors |
| **OAuth2 Mock** | Simulated authentication endpoints for vendor systems |
| **Async Transfer** | Asynchronous reservation transfer simulation |
| **Sync Transfer** | Synchronous reservation transfer simulation |
| **Error Simulation** | Controlled error scenario testing capabilities |
| **Delay Simulation** | Configurable response latency for realistic testing |
| **PMS Integration** | Property Management System mock implementations |
| **CRS Integration** | Central Reservation System mock implementations |
| **HTNG Protocol** | Hotel Technology Next Generation messaging simulation |

## Architecture at a Glance
```
passkey-vendor-mock/
└── passkey-vendor-mock-service/     # Main service implementation
    ├── src/main/java/               # Java source code
    │   ├── resources/              # JAX-RS REST endpoints
    │   ├── services/               # Business logic services
    │   └── models/                 # Data models and DTOs
    └── src/test/java/              # Unit tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Amadeus CRS** | `/v1/amadeus` | OAuth2, reservation transfers |
| **Opera Systems** | `/v1/sync/opera`, `/v1/async/opera` | OHIP/OXI transfers |
| **Hilton** | `/v1/sync/hilton` | Reservation and DC transfers |
| **Marriott** | `/v1/sync/marriott` | Reservation transfer system |
| **IHG** | `/v1/sync/ihg` | InterContinental Hotels Group |
| **DerbySoft** | `/v1/sync/derbysoft` | Group and individual reservations |
| **Choice Hotels** | `/v1/sync/choice` | Hotel content and reservations |
| **Disney** | `/v1/sync/disney` | Custom reservation system with OAuth2 |
| **Health Check** | `/health` | Service health monitoring |

## Key Business Rules
- Magic keywords in request payloads control response behavior and types
- `RESPONSE success` returns successful responses for testing positive scenarios
- `RESPONSE error` returns error responses with configurable reason codes
- `RESPONSE delayResult=n` simulates network latency by delaying responses
- OAuth2 endpoints provide mock authentication tokens for vendor systems requiring auth
- Callback parameters are stored in-memory and retrievable for async testing scenarios
- Error simulation supports various HTTP status codes (400, 401, 500) for comprehensive testing
- Async operations support both immediate and delayed callback message delivery

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **passkey-api** | Core Passkey API service integration |
| **passkey-core-mapper** | Data mapping utilities |
| **passkey-inbound** | Inbound message processing |
| **Datadog APM** | Application performance monitoring |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-vendor-mock` to browse:
- `passkey-vendor-mock-service/src/main/java/` — Core service implementation
- `passkey-vendor-mock-service/src/main/resources/` — Configuration files
- `pom.xml` — Maven build configuration
- `Dockerfile` — Container configuration
- `catalog-info.yaml` — Backstage service metadata

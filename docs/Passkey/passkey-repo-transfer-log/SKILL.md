---
name: "passkey-repo-transfer-log-service"
description: "The Passkey Transfer Log Service manages the complete lifecycle of hotel reservation transfers, including transfer definitions, reservation searches, state management, and transfer history tracking. It serves as the central hub for transfer-related operations enabling configuration management, processing, and comprehensive audit trails. Use when working with: the passkey-transfer-log repository; Transfer Definition, Transfer State, Transfer History, Reservation Transfer, Folio Transfer."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-transfer-log`
- **Type**: Java 21 Dropwizard Multi-Module
- **Owner**: meeseeksbox team (`#passkey-api`)
- **DB**: Oracle Database
- **Registry ID**: passkey-transfer-log-service

## What This Service Does
The Passkey Transfer Log Service manages the complete lifecycle of hotel reservation transfers, including transfer definitions, reservation searches, state management, and transfer history tracking. It serves as the central hub for transfer-related operations enabling configuration management, processing, and comprehensive audit trails.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Transfer Definition** | Configuration settings for transfers by event and hotel |
| **Transfer State** | Current status and progress of reservation transfers |
| **Transfer History** | Complete audit trail of transfer operations |
| **Reservation Transfer** | Process of moving reservation data between systems |
| **Folio Transfer** | Specific transfer operations for guest folios |
| **Transfer Results** | Outcome and status information from transfer operations |
| **Mapping Rules** | Configuration for data transformation during transfers |
| **External Reservations** | Reservation data from external systems |
| **Transfer Log Entry** | Individual record of transfer activity |
| **State Management** | Tracking and updating transfer progress |

## Architecture at a Glance
```
passkey-transfer-log/
├── passkey-transfer-log-api/           # REST API definitions
├── passkey-transfer-log-service/       # Core service implementation
├── passkey-transfer-log-data-access/   # Database access layer
├── passkey-transfer-log-java-client/   # Java client library
└── passkey-transfer-log-integration-test/ # Karate API tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Transfer Definitions** | `/transfer-definitions` | Create, update, query transfer settings |
| **Reservations** | `/reservations` | Search and manage reservation transfers |
| **Transfer Log** | `/transfer-log` | Core transfer logging operations |
| **Transfer History** | `/transfer-history` | Historical transfer data access |
| **Transfer Results** | `/v2/transfer-results` | Transfer outcome management |
| **Mapping Rules** | `/mapping-rules` | Transfer mapping configurations |
| **External Reservations** | `/external-reservations` | External reservation data |

## Key Business Rules
- Transfer definitions must be configured per event and hotel combination
- All transfer operations generate audit log entries for compliance tracking
- Transfer states follow a defined lifecycle (pending, processing, completed, failed)
- Folio transfers require specific authorization and validation rules
- Transfer results include detailed success/failure information and error codes
- Mapping rules define data transformation logic for different vendor systems
- External reservation data must be validated before processing transfers
- Transfer history is maintained indefinitely for audit and troubleshooting purposes

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **auth-service** | Authentication and authorization |
| **passkey-microservices-common** | Shared Passkey utilities and components |
| **passkey-notifications** | Notification services |
| **Oracle Database** | Persistent data storage |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-transfer-log` to browse:
- `passkey-transfer-log-service/src/main/java/` — Core service implementation
- `passkey-transfer-log-api/src/main/java/` — API definitions and models
- `passkey-transfer-log-data-access/src/main/java/` — Database access layer
- `passkey-transfer-log-integration-test/src/test/java/` — Karate API tests
- `pom.xml` — Maven build configuration
- `catalog-info.yaml` — Backstage service metadata

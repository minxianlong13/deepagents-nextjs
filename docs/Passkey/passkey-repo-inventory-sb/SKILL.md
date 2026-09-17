---
name: "passkey-repo-inventory-spring-boot-service"
description: "Modernized Spring Boot version of inventory management for the Passkey platform. Provides REST APIs for managing hotel room blocks, inventory operations, and block information retrieval as part of the Passkey Unified Architecture initiative. Use when working with: the passkey-inventory-sb repository; Block, Block ID, Entity, Inventory, Locale ID."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-inventory-sb`
- **Type**: Spring Boot Multi-Module (Java 17)
- **Owner**: meeseeksbox team (`#passkey-api`)
- **DB**: Oracle (via MyBatis)
- **Registry ID**: passkey-inventory-springboot

## What This Service Does
Modernized Spring Boot version of inventory management for the Passkey platform. Provides REST APIs for managing hotel room blocks, inventory operations, and block information retrieval as part of the Passkey Unified Architecture initiative.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Block** | Allocation linking Event + Hotel + Attendee Group + Room Type with negotiated rates |
| **Block ID** | Unique identifier for hotel room block in inventory system |
| **Entity** | Generic business object representing inventory items or configurations |
| **Inventory** | Collection of available hotel rooms, blocks, and bookable resources |
| **Locale ID** | Language/regional settings identifier (en-US, fr-FR) |
| **Passkey** | Cvent's hotel booking platform for group reservations |
| **Room Block** | Allocation linking Event + Hotel + Attendee Group + Room Type with negotiated rates |
| **Room Type** | Classification of rooms by features, size, amenities (Standard, Suite) |
| **BlockInfo** | Comprehensive information about room block including availability |

## Architecture at a Glance
```
passkey-inventory-sb/
├── packages/
│   └── passkey-inventory/
│       ├── service/                  # Main Spring Boot application
│       ├── model/                    # Domain models and entities
│       ├── java-client/              # Client library
│       └── integration-test/         # Integration test suite
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Entity Operations** | `/passkey-inventory/v1/entity` | Generic entity management |
| **Block Operations** | `/passkey-inventory/v1/blocks` | Room block management |
| **Health** | `/actuator/health` | Service health and readiness |

## Key Business Rules
- Blocks link Event + Hotel + Attendee Group + Room Type with negotiated rates
- Six-pool inventory system: Block → Hotel Pool → Room Pool → Overbook → Waitlist → Primary Pool
- Three-level inventory tracking: Daily per block, Per event-hotel-room, Hotel base
- Inventory controls: R2FS (Release to Free Sell), Sell-Only-From-Primary, Pull From Higher Pool
- Block information includes total rooms, available rooms, and blocked rooms
- Room types classify accommodations by features and pricing
- Locale settings determine data presentation format
- Block status tracks current state of room allocations
- Rate information provides pricing details for blocks
- Timestamps track block creation and modification history
- MyBatis ORM handles Oracle database interactions

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **Passkey Reservation Service** | Reservation processing integration |
| **Passkey Payment Service** | Payment processing operations |
| **Passkey Commerce Service** | E-commerce functionality |
| **Oracle Database** | Data persistence via MyBatis |
| **Cvent OAuth** | Authentication and authorization |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-inventory-sb` to browse:
- `packages/passkey-inventory/service/src/main/java/` — Main Spring Boot service
- `packages/passkey-inventory/model/src/main/java/` — Domain models and entities
- `packages/passkey-inventory/java-client/src/main/java/` — Client library
- `packages/passkey-inventory/integration-test/` — Integration test suite
- `catalog-info.yaml` — Backstage service metadata

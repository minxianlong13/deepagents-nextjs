---
name: "passkey-repo-reglink-service"
description: "Serves as the central orchestration hub for linking event registrations to hotel reservations. Manages bridges, room blocks, housing events, and coordinates between multiple Passkey microservices to provide unified registration and accommodation management capabilities. Use when working with: the passkey-reglink repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-reglink`
- **Type**: Java 21 Dropwizard Multi-Module Service
- **Owner**: Passkey Team (`#passkey`)
- **DB**: Oracle (via other services)
- **Registry ID**: Not specified

## What This Service Does
Serves as the central orchestration hub for linking event registrations to hotel reservations. Manages bridges, room blocks, housing events, and coordinates between multiple Passkey microservices to provide unified registration and accommodation management capabilities.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| Bridge | Connection entity linking event registrations to hotel reservations |
| Bridge Registration Number | Unique identifier for tracking registration-reservation connections |
| Reglink | Core concept representing linkage between registration and hotel systems |
| Housing Event | Event configuration enabling self-service hotel booking for attendees |
| Room Block | Pre-negotiated hotel room allocation for events at special rates |
| Group Reservation | Multi-room reservation request requiring approval workflows |
| Housing Library | Repository of standardized templates and hotel configurations |
| Event | Business gathering requiring accommodation coordination |
| Reservation | Individual hotel booking linked to event registrations |

## Architecture at a Glance
```
passkey-reglink/
├── passkey-reglink-service/     # Main Dropwizard application
├── passkey-reglink-api/         # API contracts and DTOs
├── passkey-reglink-client/      # Client library for consumers
├── passkey-reglink-common/      # Shared utilities and models
├── passkey-reglink-integration/ # External service integration
├── passkey-reglink-test/        # Integration tests
└── passkey-reglink-models/      # Domain models and entities
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Bridge Management | `/bridges` | CRUD - Link/unlink registrations to reservations |
| Event Availability | `/events/{id}/availability` | GET - Hotel availability for events |
| Group Reservations | `/group-reservations` | CRUD - Multi-room reservation requests |
| Room Blocks | `/room-blocks` | CRUD - Manage pre-negotiated room allocations |
| Housing Events | `/housing-events` | CRUD - Self-service booking configurations |
| Hotel Details | `/hotels` | GET - Hotel and room information |
| Library Services | `/library` | GET - Templates and standardized data |
| Individual Reservations | `/reservations` | CRUD - Single room bookings |

## Key Business Rules
- Bridges maintain the connection between event registrations and hotel reservations
- Group reservations require special approval workflows and handling
- Room blocks must be managed with status tracking and availability updates
- Housing events enable self-service booking for event attendees
- All operations coordinate with multiple Passkey microservices for data consistency
- Registration numbers must be unique and trackable across the system

## Service Dependencies
| Service | Purpose |
|---------|---------|
| passkey-bridge | Core bridge entity management |
| passkey-reservation | Hotel reservation processing |
| passkey-hotel | Hotel inventory and availability |
| passkey-event | Event management and configuration |
| passkey-housing-library | Template and standardized data repository |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-reglink` to browse:
- `passkey-reglink-service/src/main/java/` — Main application and REST resources
- `passkey-reglink-api/src/main/java/` — API contracts and DTOs
- `passkey-reglink-client/src/main/java/` — Client library implementation
- `passkey-reglink-service/configs/` — Environment configurations
- `catalog-info.yaml` — Backstage service metadata

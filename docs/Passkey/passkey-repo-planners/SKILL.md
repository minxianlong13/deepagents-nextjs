---
name: "passkey-repo-planners-service"
description: "Manages planner data and associations within the Cvent Passkey for Hotels platform. Provides comprehensive planner management capabilities including CRUD operations, event associations, and search functionality with different permission levels. Use when working with: the passkey-planners repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-planners`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Cherry Pickers team (`#cherry-pickers`)
- **DB**: Oracle
- **Registry ID**: passkey-planners-service

## What This Service Does
Manages planner data and associations within the Cvent Passkey for Hotels platform. Provides comprehensive planner management capabilities including CRUD operations, event associations, and search functionality with different permission levels.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| Planner | User who organizes and manages event housing within Passkey. NOT tied to specific hotels - tied to events or sub-block groups |
| Event Association | Relationship between a planner and specific events with per-event permissions (Room List: NO_ACCESS/VIEW_ONLY/FULL_ACCESS, Dashboard: NO_ACCESS/FULL_ACCESS) |
| Event-Level Planner | Full access to all aspects of an event - all hotels, all attendee groups, all sub-block groups |
| SBG-Level Planner | Restricted access to only specific sub-block groups they're assigned to |
| Sub-Block Group (SBG) | Subdivision used for planner access control. Multiple attendee groups can share the same SBG ID |
| Planner Search | Advanced search functionality with flexible field selection |
| Admin Operations | Administrative endpoints for planner lifecycle management |

## Architecture at a Glance
```
passkey-planners/
├── passkey-planners-api/           # API models and contracts
├── passkey-planners-service/       # Main Dropwizard service
├── passkey-planners-data-access/   # Database access layer
├── passkey-planners-java-client/   # Client library for integration
├── passkey-planners-shared/        # Shared utilities
└── passkey-planners-integration-test/ # Integration test suite
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Planner Management | `/passkey-planners/v1/planners` | CRUD operations, search |
| Event Associations | `/passkey-planners/v1/planners/{id}/events` | Associate/disassociate planners with events |
| Admin Operations | `/passkey-planners/v1/admin` | Administrative planner management |
| Health Checks | `/passkey-planners/v1/health` | Service health monitoring |

## Key Business Rules
- Planners can be associated with multiple events with different permission levels
- Event-level planners have full access to all aspects of an event (all hotels, all attendee groups, all sub-block groups)
- SBG-level planners are restricted to only specific sub-block groups they're assigned to
- Planners are NOT tied to specific hotels - they're tied to events or sub-block groups
- Each planner-event association defines Room List Access (100=ALLOW_REQUEST_UPDATES, 101=ALLOW_DIRECT_UPDATES) and Dashboard Access (0=READ_ONLY, 1=FULL)
- Email addresses must be unique across all planners and are stored in lowercase
- Planner search supports flexible field selection and filtering
- Admin operations require elevated permissions
- Planner-event associations maintain audit trails
- Client library provides type-safe integration for other services

## Service Dependencies
| Service | Purpose |
|---------|---------|
| Auth Service | Authentication and authorization |
| Passkey Create Event | Event creation and management integration |
| Passkey Microservices Common | Shared utilities and components |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-planners` to browse:
- `passkey-planners-service/src/main/java/com/cvent/passkey/planners/resources/` — JAX-RS REST endpoints
- `passkey-planners-service/src/main/java/com/cvent/passkey/planners/service/` — Business logic services
- `passkey-planners-data-access/src/main/java/com/cvent/passkey/planners/dao/` — Data access layer
- `passkey-planners-api/src/main/java/com/cvent/passkey/planners/api/` — API models and contracts
- `catalog-info.yaml` — Backstage service metadata

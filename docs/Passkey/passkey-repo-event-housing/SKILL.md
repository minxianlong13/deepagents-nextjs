---
name: "passkey-repo-event-housing-service"
description: "A core microservice that manages event housing operations within Cvent's Passkey platform. Provides comprehensive APIs for handling hotel information, room blocks, room categories, and housing-related data for events. Use when working with: the passkey-event-housing repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-event-housing`
- **Type**: Java 21 Dropwizard Microservice
- **Owner**: Metrestick Team (`#passkey-metre-stick`)
- **DB**: Oracle Database
- **Registry ID**: 1fac8cc4-6914-4e0b-a594-fe74051b9da7

## What This Service Does
A core microservice that manages event housing operations within Cvent's Passkey platform. Provides comprehensive APIs for handling hotel information, room blocks, room categories, and housing-related data for events.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Event Housing | Comprehensive management of accommodation arrangements for event attendees |
| Room Block | An allocation of hotel rooms linking Event + Hotel + Attendee Group Type + Room Type at negotiated rates |
| Attendee Group Type | Categories of attendees within an event (VIP, general, staff, speakers) with unique access codes |
| Room Category | Classification of hotel room types based on amenities and characteristics (Standard King, Deluxe Double) |
| Group Link | Specialized booking URL for event attendee reservations |
| WebInfo | Hotel-specific event configuration controlling visibility, ranking, dates, distance from venue, HQ flag, and marketing message |
| Housing Library | Reusable library of hotel and housing configurations for event management |
| Room Block Transfer | Process of moving room allocations between different systems |
| Property Image | Visual content associated with housing properties |
| Cut-off Date | Deadline for making reservations within allocated room blocks |
| Group Rate | Special pricing negotiated for event attendees |

## Architecture at a Glance
```
passkey-event-housing/
├── passkey-event-housing-service/      # Main Dropwizard application
├── passkey-event-housing-api/          # Data models and API specifications
├── passkey-event-housing-data-access/  # Database operations
├── passkey-event-housing-java-client/  # Client library
├── passkey-event-housing-shared/       # Shared utilities
└── passkey-event-housing-integration-test/ # End-to-end tests
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Event Housing | `/{env}/passkey-event-housing/v1/events/{id}/housing` | CRUD operations for housing data |
| Room Blocks | `/{env}/passkey-event-housing/v1/room-blocks` | Room block management |
| Room Categories | `/{env}/passkey-event-housing/v1/room-categories` | Room category operations |
| Images | `/{env}/passkey-event-housing/v1/images` | Property image management |
| Admin Operations | `/{env}/passkey-event-housing/admin` | Administrative endpoints |
| Callbacks | `/{env}/passkey-event-housing/callbacks` | External provider callbacks |
| Group Links | `/{env}/passkey-event-housing/v1/group-links` | Group booking link management |

## Key Business Rules
- Room blocks must have pre-negotiated rates and cut-off dates
- Room categories define accommodation types and amenities
- Group links enable attendee access to reserved room blocks
- Housing providers handle external booking system integrations
- Property images enhance accommodation presentation
- Room block transfers require proper validation and tracking
- Administrative operations support data management and monitoring
- Callback handling ensures integration with third-party systems
- Event housing data must maintain consistency across operations

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-event-service | Event management operations |
| passkey-inventory-service | Inventory and availability management |
| auth-service | Authentication and authorization |
| Oracle Database | Primary data persistence |
| External Housing Providers | Third-party booking system integration |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-event-housing` to browse:
- `passkey-event-housing-service/src/main/java/` — Main Dropwizard application
- `passkey-event-housing-api/src/main/java/` — Data models and API specs
- `passkey-event-housing-data-access/src/main/java/` — Database operations
- `passkey-event-housing-java-client/src/main/java/` — Client library
- `passkey-event-housing-service/configs/` — Environment configurations
- `catalog-info.yaml` — Backstage service metadata

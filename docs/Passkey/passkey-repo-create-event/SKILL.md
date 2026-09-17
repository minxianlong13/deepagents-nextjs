---
name: "passkey-repo-create-event-service"
description: "A Java-based Dropwizard microservice that handles event creation operations within the Passkey platform. Provides centralized event management capabilities including creating, copying, and canceling Passkey events for the hospitality industry. Use when working with: the passkey-create-event repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-create-event`
- **Type**: Java 17 Dropwizard Microservice
- **Owner**: cherry-pickers Team (`#passkey-cherry-pickers`)
- **DB**: Oracle Database
- **Registry ID**: 1a85aeff-f470-4742-bcdf-bace6a5f1eca

## What This Service Does
A Java-based Dropwizard microservice that handles event creation operations within the Passkey platform. Provides centralized event management capabilities including creating, copying, and canceling Passkey events for the hospitality industry.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Event | Central organizing unit for hospitality booking opportunities |
| Bundle | Predefined template with standardized event configurations |
| GML (Group Meeting List) | Specialized event type for group meetings and corporate events |
| Affiliate | Partner organization with specific branding and operational requirements |
| Participant | Individual attending an event and potentially making reservations |
| Event Planner | Primary contact responsible for managing and coordinating events |
| Commerce | Payment and financial processing aspects of events |
| Guarantee Plan | Financial arrangement defining room reservation guarantees |
| Room Block | Reserved hotel room allocation for event participants |

## Architecture at a Glance
```
passkey-create-event/
├── passkey-create-event-service/      # Main Dropwizard application
├── passkey-create-event-api/          # Data models and API specifications
├── passkey-create-event-data-access/  # Database operations
├── passkey-create-event-java-client/  # Client library
├── passkey-create-event-shared/       # Shared utilities
└── passkey-create-event-integration-test/ # End-to-end tests
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Event Creation | `/{env}/passkey-create-event/v1/events` | POST (create), POST (copy) |
| Event Management | `/{env}/passkey-create-event/v1/events/{id}` | DELETE (cancel) |
| Admin Operations | `/{env}/passkey-create-event/admin` | Administrative endpoints |
| Affiliate Operations | `/{env}/passkey-create-event/affiliate` | Affiliate-specific operations |
| Health Check | `/healthcheck` | Service health monitoring |

## Key Business Rules
- Events require comprehensive validation before creation
- Bundle templates enable consistent event configurations
- Event copying allows modifications while preserving core settings
- Event cancellation requires proper cleanup and notifications
- Affiliate events have specialized branding and operational requirements
- Commerce settings define payment processing and financial arrangements
- Guarantee plans manage room reservation risk and payment requirements
- Room blocks must be properly allocated and managed
- Integration with multiple Passkey services for complete functionality

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-business-text-service | Business text and localization |
| passkey-event-housing-service | Housing management for events |
| passkey-event-service | Core event operations |
| passkey-inventory-service | Inventory management |
| auth-service | Authentication and authorization |
| Oracle Database | Primary data persistence |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-create-event` to browse:
- `passkey-create-event-service/src/main/java/` — Main Dropwizard application
- `passkey-create-event-api/src/main/java/` — Data models and API specs
- `passkey-create-event-data-access/src/main/java/` — Database operations
- `passkey-create-event-java-client/src/main/java/` — Client library
- `passkey-create-event-service/configs/` — Environment configurations
- `catalog-info.yaml` — Backstage service metadata

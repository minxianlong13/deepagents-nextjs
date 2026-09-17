---
name: "passkey-repo-create-hotel-service"
description: "A Java-based Dropwizard microservice that handles hotel creation operations within the Cvent Passkey platform. Provides APIs for creating and managing hotel entities with comprehensive settings, validation, and integration with other Passkey services. Use when working with: the passkey-create-hotel repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-create-hotel`
- **Type**: Java 17 Dropwizard Microservice
- **Owner**: cherry-pickers Team (`#cherry-pickers`)
- **DB**: Oracle Database
- **Registry ID**: 2354d9e5-a5d1-4937-b05c-5fdb748c81d0

## What This Service Does
A Java-based Dropwizard microservice that handles hotel creation operations within the Cvent Passkey platform. Provides APIs for creating and managing hotel entities with comprehensive settings, validation, and integration with other Passkey services.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Hotel | Primary lodging establishment entity with comprehensive configuration |
| Participant | User/entity with permissions to create and manage hotels |
| Hotel Settings | Comprehensive configuration data for hotel creation |
| Accommodation Type | Classification system for lodging establishments |
| Room Block Transfer | Process of transferring room inventory between systems |
| Group Booking | Booking mechanism for multiple rooms with special handling |
| Rewards Program | Loyalty programs associated with hotels |
| Credit Card Acceptance | Configuration of accepted payment methods |
| Passkey Timestamp | System timestamp for record creation/modification |
| Star Rating | Quality rating system (1-5) for hotels |
| Transfer Provider | External service for room block transfers |
| Business Text Service | External service for localized content |

## Architecture at a Glance
```
passkey-create-hotel/
├── passkey-create-hotel-service/      # Main Dropwizard application
├── passkey-create-hotel-api/          # Data models and OpenAPI specs
├── passkey-create-hotel-data-access/  # Database operations
├── passkey-create-hotel-java-client/  # Client library
├── passkey-create-hotel-shared/       # Shared utilities
└── passkey-create-hotel-integration-test/ # End-to-end tests
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Hotel Creation | `/{env}/passkey-create-hotel/v1/hotels` | POST (create hotel) |
| Admin Operations | `/{env}/passkey-create-hotel/admin` | Administrative endpoints |
| OpenAPI Docs | `/{env}/passkey-create-hotel/openapi` | JSON/YAML documentation |
| Health Check | `/healthcheck` | Service health monitoring |

## Key Business Rules
- Hotels require comprehensive settings including location and policies
- Accommodation type determines available features and booking behaviors
- Room block transfers support configurable automation levels
- Group booking thresholds and handling rules are configurable
- Credit card acceptance must be specified for payment processing
- Star ratings follow 1-5 scale for quality indication
- Integration with passkey-hotel-service for core hotel management
- Business text service integration for localized content
- API key authentication required for service access

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-hotel-service | Core hotel management operations |
| passkey-business-text-service | Localized text and translations |
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
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-create-hotel` to browse:
- `passkey-create-hotel-service/src/main/java/` — Main Dropwizard application
- `passkey-create-hotel-api/src/main/java/` — Data models and OpenAPI specs
- `passkey-create-hotel-data-access/src/main/java/` — Database operations
- `passkey-create-hotel-java-client/src/main/java/` — Client library
- `passkey-create-hotel-service/configs/` — Environment configurations
- `catalog-info.yaml` — Backstage service metadata

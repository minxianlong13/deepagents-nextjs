---
name: "passkey-repo-addons-service"
description: "Manages add-on associations for reservations created using the Reservation Orchestrator. Handles both marketable add-ons (available for purchase) and reservation add-ons (associated with specific reservations) with comprehensive lifecycle management. Use when working with: the passkey-addons repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-addons`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Maurya Team (`#passkey-maurya`)
- **DB**: Oracle Database
- **Registry ID**: 011619b7-4008-48ff-a1dd-cae00f9cf2a5

## What This Service Does
Manages add-on associations for reservations created using the Reservation Orchestrator. Handles both marketable add-ons (available for purchase) and reservation add-ons (associated with specific reservations) with comprehensive lifecycle management.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Marketable Add-ons | Add-ons available for purchase by customers |
| Reservation Add-ons | Add-ons associated with specific reservations |
| Add-on Associations | Links between add-ons and reservations |
| Add-on Lifecycle | Complete process of create, update, cancel, and track add-ons |
| Hotel Add-ons | Additional services or amenities offered by hotels |
| Add-on Management | Administrative operations for add-on configuration |
| Add-on Status | Current state of add-on (active, cancelled, pending) |
| Add-on Validation | Verification of add-on availability and compatibility |
| Add-on Pricing | Cost calculation for add-on services |
| Reservation Integration | Connection between add-ons and hotel reservations |

## Architecture at a Glance
```
passkey-addons/
├── passkey-addons-api/           # API contracts and specifications
├── passkey-addons-service/       # Main service implementation
├── passkey-addons-data-access/   # Data access layer
└── passkey-addons-shared/        # Shared utilities and models

Reservation Orchestrator → Addons Service → Add-on Management → Oracle Database
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Marketable Add-ons | `/passkey-addons/v1/marketable` | Create and retrieve purchasable add-ons |
| Reservation Add-ons | `/passkey-addons/v1/reservations/{id}/addons` | Link add-ons to specific reservations |
| Add-on Management | `/passkey-addons/v1/addons` | Update, cancel, and track add-on status |
| Add-on Lifecycle | `/passkey-addons/v1/lifecycle` | Manage complete add-on lifecycle |
| Version 2 APIs | `/passkey-addons/v2` | Enhanced add-on features |
| Admin Operations | `/passkey-addons/v1/admin` | Administrative add-on management |

## Key Business Rules
- Marketable add-ons must be available for purchase before association
- Reservation add-ons can only be linked to valid, existing reservations
- Add-on lifecycle includes create, update, cancel, and status tracking
- Add-on associations require proper validation and error handling
- Both v1 and v2 API versions are supported for backward compatibility
- Add-on pricing must be calculated accurately based on current rates
- Add-on status changes must be tracked and auditable
- Integration with Reservation Orchestrator ensures consistency
- Add-on availability must be verified before association

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-reservation-saga | Reservation workflow orchestration |
| auth-service | Authentication and authorization |
| passkey-business-text-service | Localized text content |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-addons` to browse:
- `passkey-addons-service/src/main/java/com/cvent/passkey/addons/resources/` — REST endpoints
- `passkey-addons-data-access/src/main/java/com/cvent/passkey/addons/dao/` — Data access layer
- `passkey-addons-shared/src/main/java/com/cvent/passkey/addons/model/` — Domain models
- `catalog-info.yaml` — Backstage service metadata

---
name: "passkey-repo-integrations"
description: "Provides hotel booking integrations and group link functionality through two primary services: API service for inbound hotel integrations and GroupLink service for group booking workflows. Handles connections between Passkey and various hotel systems, payment processing, and data transformation. Use when working with: the passkey-integrations repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-integrations`
- **Type**: Java 17 WildFly Monorepo (Dual Services)
- **Owner**: meeseeksbox team (`#meeseeksbox`)
- **DB**: Oracle
- **Registry ID**: passkey-integrations

## What This Service Does
Provides hotel booking integrations and group link functionality through two primary services: API service for inbound hotel integrations and GroupLink service for group booking workflows. Handles connections between Passkey and various hotel systems, payment processing, and data transformation.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| Hotel Integration | Connection between Passkey and hotel property management systems |
| Group Booking | Reservation workflow for multiple rooms/guests under single event |
| GroupLink (GL) | Service managing group booking workflows and hotel communications |
| API Service | Inbound API service handling hotel integration requests |
| Third-party Integration | External system connections (Amadeus, PBB Gateway, vendors) |
| Data Transformation | XML/JSON conversion between different hotel system formats |
| RBX (Room Block Transfer) | Two-way reservation sync integration with hotel PMS systems |
| Vendor System | External hotel PMS (Property Management System) integrated with Passkey |
| Vendor Mock | Local development support for external vendor services |

## Architecture at a Glance
```
passkey-integrations/
├── packages/passkey-api/           # API Service (inbound hotel integrations)
│   ├── app/API-war/               # Web application layer
│   └── app/API-ejb/               # Business logic layer
├── packages/passkey-gl/           # GroupLink Service (group bookings)
│   ├── app/GL-war/                # Web application layer
│   └── app/GL-ejb/                # Business logic layer
└── packages/passkey-common/       # Shared utilities and models
```

## API Surface
| Service | Base Path | Key Operations |
|---------|-----------|----------------|
| API Service | `/passkey-api/` | Hotel integration endpoints, Amadeus integration |
| GroupLink Service | `/passkey-gl/` | Group booking workflows, transfer processing |
| Connectivity | `/connectivity.jsp` | System connectivity testing |
| Version Info | `/version.jsp` | Service version information |

## Key Business Rules
- Dual service architecture with separate API and GroupLink services
- Multi-format support for various hotel system protocols
- Payment integration through multiple gateways
- Feature flag support via LaunchDarkly for controlled rollouts
- Automated email handling for booking confirmations
- Vendor mock support for local development
- Environment-specific configurations for multiple deployment targets

## Service Dependencies
| Service | Purpose |
|---------|---------|
| passkey-authentication-service | User authentication and authorization |
| passkey-vendor-service | Vendor system integrations |
| passkey-transfer-log-service | Transfer logging and audit trails |
| passkey-sputnik | Internal service communication |
| passkey-acknowledgment-service | Booking acknowledgment processing |
| passkey-event-service | Event processing and notifications |
| LaunchDarkly | Feature flag management |
| Amadeus | Travel industry API integration |
| PBB Gateway | Payment processing |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-integrations` to browse:
- `packages/passkey-api/app/API-war/src/main/java/` — API service endpoints and web layer
- `packages/passkey-gl/app/GL-war/src/main/java/` — GroupLink service endpoints and web layer
- `packages/passkey-common/src/main/java/` — Shared utilities and models
- `packages/passkey-api/app/API-ejb/src/main/java/` — API service business logic
- `packages/passkey-gl/app/GL-ejb/src/main/java/` — GroupLink service business logic
- `catalog-info.yaml` — Backstage service metadata

---
name: "passkey-repo-core-mapper-service"
description: "Provides data mapping and transformation capabilities between Passkey's internal data structures and external vendor-specific formats. Acts as a translation layer enabling seamless integration with hotel property management systems (Hilton, OHIP, Shiji) and other third-party services. Use when working with: the passkey-core-mapper repository; Core Mapping, Vendor Integration, Reservation Orchestration, Mapping Rules, Validation Context."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-core-mapper`
- **Type**: Java 21 Dropwizard Multi-Module
- **Owner**: meeseeksbox team (`#passkey-api`)
- **DB**: None (Stateless mapping service)
- **Registry ID**: passkey-core-mapper-service

## What This Service Does
Provides data mapping and transformation capabilities between Passkey's internal data structures and external vendor-specific formats. Acts as a translation layer enabling seamless integration with hotel property management systems (Hilton, OHIP, Shiji) and other third-party services.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Core Mapping** | Fundamental data transformation between Passkey and vendor formats |
| **Vendor Integration** | Connection with external hotel property management systems |
| **Reservation Orchestration** | Coordination of reservation data across systems |
| **Mapping Rules** | Configurable business logic for data transformation |
| **Validation Context** | Rules ensuring data integrity during mapping |
| **Property Management System** | External hotel management software (Hilton, OHIP, Shiji) |
| **Transformation Pipeline** | Sequence of operations converting data formats |
| **Mapping Context** | Metadata influencing mapping operations |
| **Addon Services** | Additional services associated with reservations |

## Architecture at a Glance
```
passkey-core-mapper/
├── passkey-core-mapper-api/           # API definitions and models
├── passkey-core-mapper-service/       # Main Dropwizard service
├── passkey-core-mapper-java-client/   # Java client library
└── passkey-core-mapper-integration-test/ # Karate integration tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Mapping Operations** | `/mapping` | Transform data between formats |
| **Vendor Specific** | `/vendor/{vendorId}` | Vendor-specific transformations |
| **Validation** | `/validate` | Data validation operations |
| **Health Check** | `/healthcheck` | Service health monitoring |
| **Admin** | `:8081/` | Admin portal and metrics |

## Key Business Rules
- All mapping operations must preserve data integrity and business logic
- Vendor-specific transformations follow each PMS's data requirements
- Validation occurs at multiple stages of the transformation pipeline
- Mapping rules are configurable and can be updated without code changes
- Bidirectional mapping ensures data consistency across systems
- Error handling preserves original data for troubleshooting
- Transformation pipelines support extensibility for new vendors
- Context-aware mapping adapts to different scenarios and requirements
- Addon services maintain associations through mapping operations

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **passkey-addons-service** | Addon-related data and functionality |
| **passkey-hotel-service** | Hotel information and management |
| **payments-wallet-service** | Payment processing capabilities |
| **auth-service** | Authentication and authorization |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full REST API docs with endpoints, parameters, examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-core-mapper` to browse:
- `passkey-core-mapper-service/src/main/java/` — Main service implementation
- `passkey-core-mapper-api/src/main/java/` — API definitions and models
- `passkey-core-mapper-java-client/src/main/java/` — Java client library
- `passkey-core-mapper-integration-test/src/test/` — Karate integration tests
- `catalog-info.yaml` — Backstage service metadata

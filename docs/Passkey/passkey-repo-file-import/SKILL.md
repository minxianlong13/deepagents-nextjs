---
name: "passkey-repo-file-import-service"
description: "Integrates with Cvent's file-import-service to handle reservation data imports for Passkey. Maps external confirmation numbers to Passkey acknowledgment numbers and validates imported reservation data according to business rules. Use when working with: the passkey-file-import repository; ACK Number, External Confirmation Number, Reservation ID, Participant ID, Schema Name."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-file-import`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: cherry-pickers team (`#cherry-pickers`)
- **DB**: None (integrates with external services)
- **Registry ID**: passkey-file-import-service

## What This Service Does
Integrates with Cvent's file-import-service to handle reservation data imports for Passkey. Maps external confirmation numbers to Passkey acknowledgment numbers and validates imported reservation data according to business rules.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **ACK Number** | Passkey Acknowledgment Number - unique identifier for reservations |
| **External Confirmation Number** | Confirmation number from external systems (2-40 chars) |
| **Reservation ID** | Internal database identifier for reservation records |
| **Participant ID** | Identifier for the user/entity owning reservations |
| **Schema Name** | Import type identifier (e.g., "rezhub-reservation") |
| **Import Batch** | Collection of records processed together (default: 100) |
| **RezHub** | Cvent's reservation management system |

## Architecture at a Glance
```
passkey-file-import/
├── passkey-file-import-api/          # API definitions and models
├── passkey-file-import-service/      # Main Dropwizard service
├── passkey-file-import-java-client/  # Java client library
├── passkey-file-import-integration-test/ # Integration tests
└── passkey-file-import-load-test/    # Load testing
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **File Import** | `/{env}/passkey-file-import` | Process reservation imports |
| **OpenAPI** | `/{env}/passkey-file-import/openapi` | API documentation |

## Key Business Rules
- External confirmation numbers must be 2-40 characters
- ACK numbers must exist in Passkey reservation service
- Imports processed in configurable batches (default: 100 records)
- Each record tracked with status: SUCCESS, SKIPPED, FAILED
- Schema validation required for all imports
- Participant ID derived from account mapping ID
- RezHub integration handles confirmation number mapping

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **file-import-service** | Core Cvent file import functionality |
| **passkey-reservation-service** | Reservation validation and data |
| **passkey-resdesk** | RezHub integration for processing |
| **auth-service** | Authentication and authorization |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-file-import` to browse:
- `passkey-file-import-service/src/main/java/` — Main service implementation
- `passkey-file-import-api/src/main/java/` — API models and contracts
- `passkey-file-import-java-client/src/main/java/` — Client library
- `pom.xml` — Maven configuration and dependencies
- `catalog-info.yaml` — Backstage service metadata

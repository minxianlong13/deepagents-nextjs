---
name: "passkey-repo-hotel-service"
description: "Manages hotel entities and related data for Cvent's Passkey for Hotels platform. Provides centralized hotel profile management, tax structure configuration, organization relationships, and participant data management through RESTful APIs. Use when working with: the passkey-hotel repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-hotel`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Cherry Pickers Team (`#cherry-pickers`)
- **DB**: Oracle Database
- **Registry ID**: 918ebe8a-101a-4736-bec2-aed8881fb312

## What This Service Does
Manages hotel entities and related data for Cvent's Passkey for Hotels platform. Provides centralized hotel profile management, tax structure configuration, organization relationships, and participant data management through RESTful APIs.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Hotel | Primary entity representing a hotel property with comprehensive information and configuration |
| HotelTax | Tax structures configured at hotel-level (default) or event-level (overrides hotel defaults) |
| Organization | Business entity that manages multiple hotel properties |
| Sister Property | Related hotels under the same organization |
| Participant | System-level entity representing organizations (hotels, event organizers, vendors) - NOT individual people |
| Special Request | Hotel-specific or organization-specific request codes |
| Block Request | Group booking request for multiple rooms |
| Amenity | Hotel facilities and services offered to guests |
| Children Settings | Configuration for how children affect rates and occupancy |
| Room Block Transfer | Configuration for transferring room blocks between properties |
| Flip To | Integration feature for hotel management systems |
| Split Folio | Billing configuration for dividing charges across multiple accounts |

## Architecture at a Glance
```
passkey-hotel/
├── passkey-hotel-api/           # OpenAPI specifications and contracts
├── passkey-hotel-service/       # Main service with REST resources
├── passkey-hotel-data-access/   # MyBatis data access layer
├── passkey-hotel-shared/        # Shared utilities and common code
├── passkey-hotel-java-client/   # Client library for consumers
└── passkey-hotel-integration-test/ # Cucumber integration tests
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Hotel Management | `/passkey-hotel/v1/hotels` | CRUD, search, bulk operations |
| Tax Structures | `/passkey-hotel/v1/hotels/*/taxes` | Tax configuration management |
| Admin Operations | `/passkey-hotel/v1/admin` | Cache, testing, system management |
| Organization | `/passkey-hotel/v1/orgs` | Organization and sister property data |
| Participants | `/passkey-hotel/v1/participants` | Participant search and retrieval |
| Special Requests | `/passkey-hotel/v1/special-requests` | Request code management |
| Reservation Processing | `/passkey-hotel/v1/reservation-processing` | Reservation data |
| Version 2 APIs | `/passkey-hotel/v2` | Enhanced search capabilities |

## Key Business Rules
- Hotel profiles require comprehensive location and contact information
- Tax structures can be configured at hotel-level (defaults) or event-level (overrides)
- Children settings affect room rates and occupancy calculations
- Sister properties share organizational relationships and configurations
- Special request codes are hotel-specific or organization-specific
- Room block transfers require proper configuration between properties
- API versioning supports backward compatibility (v1, v2)
- All operations require proper authentication and authorization
- Bulk operations are optimized for performance with caching strategies

## Service Dependencies

| Service | Purpose |
|---------|---------|
| auth-service | Authentication and authorization |
| Oracle Database | Data persistence and storage |
| Datadog | Monitoring and observability |
| Jenkins | CI/CD pipeline automation |
| Backstage | Service catalog and documentation |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-hotel` to browse:
- `passkey-hotel-service/src/main/java/com/cvent/passkey/hotel/resources/` — REST endpoints
- `passkey-hotel-data-access/src/main/java/com/cvent/passkey/hotel/dao/` — Data access layer
- `passkey-hotel-shared/src/main/java/com/cvent/passkey/hotel/model/` — Domain models
- `passkey-hotel-api/src/main/resources/` — OpenAPI specifications
- `catalog-info.yaml` — Backstage service metadata

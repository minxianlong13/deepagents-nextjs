---
name: "passkey-repo-housing-library-service"
description: "Provides access to hotels and organizations library within the Passkey ecosystem. Manages housing-related data including room categories, event templates, images, and participant settings for hotel bookings and event management as a centralized library for housing-related resources. Use when working with: the passkey-housing-library repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-housing-library`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Steakholders Team (`#passkey-steak-holders`)
- **DB**: Oracle Database
- **Registry ID**: e4dddc2d-d6d0-4e19-9038-0fb279ea3a22

## What This Service Does
Provides access to hotels and organizations library within the Passkey ecosystem. Manages housing-related data including room categories, event templates, images, and participant settings for hotel bookings and event management as a centralized library for housing-related resources.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Room Categories | Classification system for different types of hotel rooms |
| Event Templates | Standardized templates for different event types |
| Image Library | Storage and metadata management for hotel/room images |
| Participant Settings | Configuration management for participant profiles |
| Bundle Hotels | Management of hotel bundles for events |
| Housing Library | Centralized repository for housing-related resources |
| Room Types | Specific room configurations within categories |
| Event Management | Organization and configuration of events |
| Image Metadata | Descriptive information associated with hotel images |
| Profile Configuration | Settings and preferences for participant profiles |

## Architecture at a Glance
```
passkey-housing-library/
├── passkey-housing-library-api/           # API contracts and specifications
├── passkey-housing-library-service/       # Main service with REST resources
├── passkey-housing-library-data-access/   # Data access layer
└── passkey-housing-library-shared/        # Shared utilities and models

JAX-RS REST API → Service Layer → Data Access Layer → Oracle Database
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Room Management | `/passkey-housing-library/v1/rooms` | Room category and type management |
| Event Templates | `/passkey-housing-library/v1/templates` | Event template storage and retrieval |
| Image Library | `/passkey-housing-library/v1/images` | Image upload, storage, metadata management |
| Participant Settings | `/passkey-housing-library/v1/participants` | Profile settings configuration |
| Bundle Hotels | `/passkey-housing-library/v1/bundles` | Hotel bundle management |
| Admin Operations | `/passkey-housing-library/v1/admin` | System management and monitoring |

## Key Business Rules
- Room categories provide classification system for different hotel room types
- Event templates standardize configuration for different event types
- Image library manages upload, storage, and metadata for hotel/room images
- Participant settings enable configuration of participant profiles
- Bundle hotels allow management of hotel collections for events
- All operations require proper authentication and authorization
- Image uploads must include proper metadata and validation
- Event templates must follow standardized format requirements
- Room categories must align with hotel inventory systems

## Service Dependencies

| Service | Purpose |
|---------|---------|
| auth-service | Authentication and authorization |
| passkey-reservation | Hotel reservation management |
| passkey-payment | Payment processing for bookings |
| passkey-inventory | Hotel inventory management |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-housing-library` to browse:
- `passkey-housing-library-service/src/main/java/com/cvent/passkey/housing/resources/` — REST endpoints
- `passkey-housing-library-data-access/src/main/java/com/cvent/passkey/housing/dao/` — Data access layer
- `passkey-housing-library-shared/src/main/java/com/cvent/passkey/housing/model/` — Domain models
- `catalog-info.yaml` — Backstage service metadata

---
name: "passkey-repo-hotel-importer"
description: "A Spring Boot microservice that populates Passkey with external hotels' data from various hotel providers. Acts as a bridge between external hotel data sources and the Passkey platform, enabling seamless integration of hotel information, room details, and media assets. Use when working with: the passkey-hotel-importer repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-hotel-importer`
- **Type**: Spring Boot 3.x Microservice
- **Owner**: Passkey Team (`#passkey`)
- **DB**: Oracle Database + S3
- **Registry ID**: passkey-hotel-importer

## What This Service Does
A Spring Boot microservice that populates Passkey with external hotels' data from various hotel providers. Acts as a bridge between external hotel data sources and the Passkey platform, enabling seamless integration of hotel information, room details, and media assets.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Hotel Provider | External companies providing hotel data (e.g., Choice Hotels) |
| Hotel Import | Process of importing complete hotel information from external sources |
| Room Synchronization | Importing and updating room types, configurations, and availability |
| Media Processing | Import and processing of hotel images with S3 storage |
| Assignment Management | Assigning and unassigning hotels to venues within Passkey |
| Import Strategy | Pluggable approach for handling different data source formats |
| Data Consistency | Maintaining synchronized data across different providers |
| Provider Mapping | Translation between external data formats and Passkey models |

## Architecture at a Glance
```
passkey-hotel-importer/
├── service/          # Main Spring Boot application
├── java-client/      # Client library for service consumption
├── infra/           # Infrastructure as code (CDK)
├── it/              # Integration tests
└── parent/          # Maven parent configuration
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Hotel Import | `/api/v1/hotels` | POST (import), PUT (update) |
| Room Management | `/api/v1/rooms` | POST (sync), GET (retrieve) |
| Media Import | `/api/v1/media` | POST (import images) |
| Assignment Operations | `/api/v1/assignments` | POST (assign), DELETE (unassign) |
| Admin Operations | `/admin` | Administrative endpoints (ADMIN role required) |
| Health Check | `/healthcheck` | Service health monitoring |

## Key Business Rules
- Multi-provider support with extensible architecture
- Strategy pattern enables different import approaches per provider
- Hotel data must be validated before import into Passkey
- Room synchronization maintains availability and configuration consistency
- Media processing includes S3 storage integration for images
- Assignment management controls hotel-venue relationships
- Admin-only endpoints require ADMIN role for security
- Data consistency maintained across different hotel providers
- Import operations support both full and incremental updates

## Service Dependencies

| Service | Purpose |
|---------|---------|
| External Hotel Providers | Source data for hotel information (Choice Hotels, etc.) |
| Oracle Database | Primary data storage for imported hotel data |
| S3 | Media storage for hotel images and assets |
| Auth Service | Authentication and authorization |
| DataDog | Monitoring and observability |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-hotel-importer` to browse:
- `packages/passkey-hotel-importer/service/src/main/java/` — Spring Boot application code
- `packages/passkey-hotel-importer/service/src/main/resources/` — Configuration files
- `packages/passkey-hotel-importer/java-client/` — Client library implementation
- `packages/passkey-hotel-importer/infra/` — CDK infrastructure code
- `catalog-info.yaml` — Backstage service metadata

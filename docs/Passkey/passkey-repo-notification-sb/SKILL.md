---
name: "passkey-repo-notification-service-spring-boot"
description: "A Spring Boot-based notification service that handles notification-related operations within the Cvent Passkey ecosystem. Provides RESTful APIs for entity management with OAuth2 security and database integration. Use when working with: the passkey-notification-sb repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-notification-sb`
- **Type**: Spring Boot 3.x Microservice
- **Owner**: Passkey Team (`#passkey`)
- **DB**: Oracle Database
- **Registry ID**: passkey-notification-sb

## What This Service Does
A Spring Boot-based notification service that handles notification-related operations within the Cvent Passkey ecosystem. Provides RESTful APIs for entity management with OAuth2 security and database integration.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Entity | Primary domain object representing notification entities |
| ComplexEntity | Nested entity containing additional notification data |
| ResponseEntity | Output model for API responses |
| OAuth2 Scope | Security permissions (ADMIN, READ_ONLY) |
| Health Check | Service monitoring endpoints |

## Architecture at a Glance
```
passkey-notification-sb/
├── service/           # Main Spring Boot application
├── java-client/       # Client library for service consumption
├── consumer/          # Message consumer components
├── infra/            # Infrastructure as code (CDK)
├── it/               # Integration tests
└── parent/           # Maven parent configuration
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Entity Management | `/dev/passkey-notification-sb/v1/entity` | POST (create), GET (retrieve) |
| Health & Monitoring | `/tasks` | GET /ok, GET /config |

## Key Business Rules
- All API endpoints require OAuth2 authentication
- ADMIN scope required for write operations (POST, PUT, DELETE)
- READ_ONLY scope sufficient for read operations (GET)
- Entity ID must be non-null and non-empty
- Complex entities are required for all entity operations
- Service runs on port 7000 with management on port 7001

## Service Dependencies

| Service | Purpose |
|---------|---------|
| Oracle Database | Primary data storage |
| Cvent OAuth2 | Authentication and authorization |
| Spring Boot Actuator | Health monitoring and metrics |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-notification-sb` to browse:
- `packages/passkey-notification-sb/service/src/main/java/` — Spring Boot application code
- `packages/passkey-notification-sb/service/src/main/resources/` — Configuration files
- `packages/passkey-notification-sb/java-client/` — Client library implementation
- `packages/passkey-notification-sb/infra/` — CDK infrastructure code
- `catalog-info.yaml` — Backstage service metadata

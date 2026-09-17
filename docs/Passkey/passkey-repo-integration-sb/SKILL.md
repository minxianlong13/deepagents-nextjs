---
name: "passkey-repo-integration-spring-boot-service"
description: "Manages integration between Passkey and hotel systems by providing standardized REST APIs for user operations, authentication bridges, and secure communication channels. Serves as the primary interface for external hotel management system connectivity. Use when working with: the passkey-integration-sb repository; Passkey, Hotel Integration, Default User, OAuth Token, Scope."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-integration-sb`
- **Type**: Spring Boot Multi-Module (Java 17)
- **Owner**: Meeseeksbox team (`#passkey-api`)
- **DB**: Oracle (via MyBatis)
- **Registry ID**: passkey-integration-springboot

## What This Service Does
Manages integration between Passkey and hotel systems by providing standardized REST APIs for user operations, authentication bridges, and secure communication channels. Serves as the primary interface for external hotel management system connectivity.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Passkey** | Event management platform for registrations and attendee experiences |
| **Hotel Integration** | Connection between Passkey and hotel management systems |
| **Default User** | System-defined fallback identity for hotel integration operations |
| **OAuth Token** | Security token for authentication following OAuth 2.0 standard |
| **Scope** | Permission level defining authorized operations (READ_ONLY) |
| **Integration Service** | Bridge microservice between Passkey and external systems |
| **Hotel Management System (HMS)** | External hotel software (PMS, CRS) for reservations |
| **Service Discovery** | Mechanism for services to locate and communicate |
| **Health Check** | Automated monitoring endpoints for operational status |

## Architecture at a Glance
```
passkey-integration-sb/
├── packages/
│   └── passkey-integration/
│       ├── service/                  # Main Spring Boot application
│       ├── model/                    # Domain models and entities
│       ├── java-client/              # Client library
│       └── integration-test/         # Integration test suite
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **User Management** | `/passkey-integration/v1/user` | Default user operations |
| **Health** | `/health` | Service health checks |
| **Actuator** | `/actuator/health` | Spring Boot health endpoints |

## Key Business Rules
- Every hotel integration operation requires associated user context
- Default user serves as fallback identity when no specific user provided
- OAuth tokens contain scope information determining authorized operations
- READ_ONLY scope currently supported for user information retrieval
- Service registers itself for discovery by other Passkey components
- Health checks monitor database connectivity and system resources
- MyBatis ORM handles Oracle database interactions
- Environment-specific configuration via YAML files

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **Passkey Core Services** | Main Passkey platform integration |
| **Hotel Management Systems** | External hotel booking platforms |
| **Cvent OAuth Service** | Authentication and authorization |
| **Cvent Observability Platform** | Monitoring and logging |
| **Oracle Database** | Data persistence via MyBatis |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-integration-sb` to browse:
- `packages/passkey-integration/service/src/main/java/` — Main Spring Boot service
- `packages/passkey-integration/model/src/main/java/` — Domain models and entities
- `packages/passkey-integration/java-client/src/main/java/` — Client library
- `packages/passkey-integration/integration-test/` — Integration test suite
- `catalog-info.yaml` — Backstage service metadata

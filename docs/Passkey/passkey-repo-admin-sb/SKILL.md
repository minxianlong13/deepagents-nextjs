---
name: "passkey-repo-admin-service-spring-boot"
description: "The Passkey Admin Service provides centralized administrative operations for the Passkey platform, including contact and user management, email type configuration, analytics data processing, and GDPR compliance operations. It serves as the backend API for administrative functions across the Passkey ecosystem. Use when working with: the passkey-admin-sb repository; Contact Management, User Administration, Email Type Management, Analytics Integration, GDPR Compliance."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-admin-sb`
- **Type**: Java 17 Spring Boot Microservice
- **Owner**: Maurya (`#passkey-maurya-alerts`)
- **DB**: Oracle Database
- **Registry ID**: 96ca2392-7aaf-5e38-b9c8-168dd3753a97

## What This Service Does
The Passkey Admin Service provides centralized administrative operations for the Passkey platform, including contact and user management, email type configuration, analytics data processing, and GDPR compliance operations. It serves as the backend API for administrative functions across the Passkey ecosystem.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Contact Management** | Create, update, delete, and retrieve contact information |
| **User Administration** | Manage platform users and their identities |
| **Email Type Management** | Configure and manage email types and their associations |
| **Analytics Integration** | Process and manage analytics data |
| **GDPR Compliance** | Handle data privacy and compliance requirements |
| **Health Monitoring** | Built-in health checks and observability |
| **OAuth Security** | OAuth-based authentication and authorization |
| **Administrative Operations** | Centralized admin functions for the platform |

## Architecture at a Glance
```
passkey-admin-sb/
├── packages/passkey-admin-service/
│   ├── service/                    # Main Spring Boot application
│   │   ├── src/main/java/         # Java source code
│   │   ├── src/main/resources/    # Configuration files
│   │   └── pom.xml               # Maven dependencies
│   └── it/                       # Integration tests
├── configs/                      # Environment configurations
│   ├── dev.yaml                 # Development environment
│   ├── ct50.yaml               # Customer testing
│   └── pr50.yaml               # Production environment
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Contact Management** | `/passkey-admin/v1/contacts` | CRUD operations for contact information |
| **User Administration** | `/passkey-admin/v1/users` | User management and identity operations |
| **Email Types** | `/passkey-admin/v1/email-types` | Email type configuration and associations |
| **Analytics** | `/passkey-admin/v1/analytics` | Analytics data processing and retrieval |
| **GDPR Operations** | `/passkey-admin/v1/gdpr` | Data privacy and compliance endpoints |
| **Health Check** | `/actuator/health` | Service health monitoring |

## Key Business Rules
- All administrative operations require proper OAuth authentication and authorization
- Contact information must be validated before creation or updates
- User identity management follows platform security standards
- Email type associations must maintain referential integrity
- Analytics data processing follows data retention policies
- GDPR operations must comply with data privacy regulations
- Health checks provide real-time service status monitoring

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **Login Service** | Authentication and user identity management |
| **Passkey Core Services** | Integration with other passkey microservices |
| **Analytics Platform** | Data processing and reporting |
| **GDPR Service** | Data privacy compliance |
| **Oracle Database** | Primary data storage |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-admin-sb` to browse:
- `packages/passkey-admin-service/service/src/main/java/` — Java source code and controllers
- `packages/passkey-admin-service/service/src/main/resources/` — Configuration files
- `packages/passkey-admin-service/service/pom.xml` — Maven dependencies
- `packages/passkey-admin-service/it/` — Integration tests
- `catalog-info.yaml` — Backstage service metadata

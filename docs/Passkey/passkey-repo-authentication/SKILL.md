---
name: "passkey-repo-authentication-service"
description: "Token-generating microservice for authenticating Passkey users, allowing them to access authorized Passkey services. Serves as the central authentication hub utilizing core Cvent Auth service for authentication and authorization with JWT token generation and validation. Use when working with: the passkey-authentication repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-authentication`
- **Type**: Java 21 Dropwizard Multi-Module
- **Owner**: Meeseeksbox Team (`#passkey-meeseeks-box`)
- **DB**: Oracle Database
- **Registry ID**: 1590692d-65aa-4790-bbdc-8cc1020a6a00

## What This Service Does
Token-generating microservice for authenticating Passkey users, allowing them to access authorized Passkey services. Serves as the central authentication hub utilizing core Cvent Auth service for authentication and authorization with JWT token generation and validation.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| JWT Management | Create and validate JWT tokens for secure service-to-service communication |
| Session Management | Manage user sessions across Passkey services |
| SSO Integration | Single Sign-On support with external identity providers |
| Admin Authentication | Specialized authentication flows for administrative users |
| MyCvent Integration | Integration with Cvent's user management system |
| Event Bridge Support | Handle authentication events through AWS EventBridge |
| Login Link Generation | Create secure login links for users |
| Token Validation | Verify and validate JWT tokens for service access |
| Identity Mapping | Map user identities across different systems |
| Authentication Events | Track and process authentication-related events |

## Architecture at a Glance
```
passkey-authentication/
├── passkey-authentication-api/           # API contracts and specifications
├── passkey-authentication-service/       # Main service implementation
├── passkey-authentication-data-access/   # Data access layer
└── passkey-authentication-shared/        # Shared utilities and models

Users → Authentication Service → JWT Tokens → Passkey Services
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| JWT Management | `/passkey-authentication/v1/tokens` | Create and validate JWT tokens |
| Session Management | `/passkey-authentication/v1/sessions` | Manage user sessions |
| SSO Integration | `/passkey-authentication/v1/sso` | Single Sign-On operations |
| Admin Authentication | `/passkey-authentication/v1/admin` | Administrative authentication flows |
| Login Links | `/passkey-authentication/v1/login-links` | Generate secure login links |
| Token Validation | `/passkey-authentication/v1/validate` | Verify JWT tokens |

## Key Business Rules
- JWT tokens provide secure service-to-service communication
- Session management maintains user state across Passkey services
- SSO integration supports external identity providers
- Admin authentication uses specialized flows for administrative users
- MyCvent integration connects with Cvent's user management system
- Event Bridge handles authentication events through AWS EventBridge
- Login links provide secure user access without password entry
- Token validation ensures only authorized access to services
- Identity mapping coordinates user identities across systems
- All authentication operations require proper audit trails

## Service Dependencies

| Service | Purpose |
|---------|---------|
| auth-service | Core Cvent authentication service |
| identity-mapping-service | User identity mapping |
| login-service | Cvent login service |
| experiments-service | Feature flag management |
| AWS EventBridge | Authentication event processing |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-authentication` to browse:
- `passkey-authentication-service/src/main/java/com/cvent/passkey/authentication/resources/` — REST endpoints
- `passkey-authentication-data-access/src/main/java/com/cvent/passkey/authentication/dao/` — Data access layer
- `passkey-authentication-shared/src/main/java/com/cvent/passkey/authentication/model/` — Domain models
- `catalog-info.yaml` — Backstage service metadata

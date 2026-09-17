---
name: "passkey-repo-permission-service"
description: "Manages permissions and navigation for the Passkey platform within Cvent's hospitality ecosystem. Provides centralized permission management and global navigation services with context-aware authorization based on specific business contexts and user roles. Use when working with: the passkey-permission repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-permission`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Cherry Pickers Team (`#cherry-pickers`)
- **DB**: Oracle Database
- **Registry ID**: Not specified in docs

## What This Service Does
Manages permissions and navigation for the Passkey platform within Cvent's hospitality ecosystem. Provides centralized permission management and global navigation services with context-aware authorization based on specific business contexts and user roles.

**Dual Permission System**: The service operates two coexisting permission systems:
- **Legacy Database-Driven System**: Stores permissions in Oracle database via passkey-permission-data-access module for basic permission lookups
- **Modern Code-Driven Strategy Pattern System**: Defines contextual permissions in code using strategy pattern for advanced context-specific logic

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Permission Management | Centralized system for managing user permissions across contexts |
| Context-Aware Authorization | Permissions delivered based on specific business contexts and roles |
| Legacy Database System | Older Oracle database-driven permission storage via data-access module |
| Strategy Pattern System | Modern code-driven contextual permissions using ContextStrategy interface |
| Context Strategy | Code-based permission implementations for specific contexts (event, hotel, reservation, etc.) |
| Global Navigation | Dynamic navigation menus for Resdesk application based on permissions |
| Multi-Context Permissions | Support for permissions across users, events, hotels, participants |
| Module Privileges | Specific permissions granted to users for different modules |
| Navigation Menu | Dynamic menu generation for frontend applications |
| Access Control | Scalable permission models for growing platform needs |
| User Roles | Role-based permission assignments for different user types |
| Business Context | Specific contexts like events, hotels, or participants |
| Permission Caching | Performance optimization through built-in caching layer |

## Architecture at a Glance
```
passkey-permission/
├── passkey-permission-api/           # API contracts and specifications
├── passkey-permission-service/       # Main service with REST resources
├── passkey-permission-data-access/   # Data access layer
└── passkey-permission-shared/        # Shared utilities and models

User Requests → Permission Service → Context Evaluation → Navigation Generation
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Permission Management | `/passkey-permission/v1/permissions` | List module privileges for users |
| Context Permissions | `/passkey-permission/v1/permissions/context/{contextType}` | Context-specific permissions |
| Global Navigation | `/passkey-permission/v1/navigations/global` | Global navigation menu generation |
| User Roles | `/passkey-permission/v1/roles` | Role-based permission management |
| Admin Operations | `/passkey-permission/v1/admin` | Administrative permission management |

## Key Business Rules
- Permissions are managed centrally across all Passkey applications
- Context-aware authorization delivers permissions based on business contexts
- Multi-context support includes users, events, hotels, and participants
- Global navigation menus are dynamically generated based on user permissions
- Caching layer optimizes performance for frequent permission queries
- Authentication integration ensures secure access to permission data
- Role-based permissions provide scalable access control models
- Permission changes are reflected immediately across all integrated applications
- Navigation menus adapt to user roles and available permissions

## Service Dependencies

| Service | Purpose |
|---------|---------|
| auth-service | Authentication and authorization |
| passkey-microservices-common | Shared utilities and configurations |
| Resdesk Application | Navigation menu integration |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-permission` to browse:
- `passkey-permission-service/src/main/java/com/cvent/passkey/permission/resources/` — REST endpoints
- `passkey-permission-data-access/src/main/java/com/cvent/passkey/permission/dao/` — Data access layer
- `passkey-permission-shared/src/main/java/com/cvent/passkey/permission/model/` — Domain models
- `catalog-info.yaml` — Backstage service metadata

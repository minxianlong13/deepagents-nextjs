---
name: "passkey-repo-user-service"
description: "Manages passkey user preferences and miscellaneous server-side user state within the Cvent Passkey for Hotels platform. Handles user details, preferences, favorites, and participant information for hotel booking systems with centralized user state management. Use when working with: the passkey-user repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-user`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Not specified in docs
- **DB**: Oracle Database
- **Registry ID**: Not specified in docs

## What This Service Does
Manages passkey user preferences and miscellaneous server-side user state within the Cvent Passkey for Hotels platform. Handles user details, preferences, favorites, and participant information for hotel booking systems with centralized user state management.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| User Details | Comprehensive user information including preferences and login history |
| User Preferences | Date/time formats, notification settings, and display preferences |
| Favorites Management | User-saved favorite hotels and properties |
| Participant Management | Participant-specific data and relationships |
| User Configuration | User-specific settings and configuration options |
| Login History | Record of user authentication and access patterns |
| Notification Settings | User preferences for receiving notifications |
| Display Preferences | User interface customization options |
| Booking History | Record of user's hotel booking activities |
| User State | Server-side storage of user-specific information |

## Architecture at a Glance
```
passkey-user/
├── passkey-user-api/              # API models and contracts
├── passkey-user-data-access/      # Data access layer
├── passkey-user-service/          # Main service implementation
├── passkey-user-java-client/      # Java client library
├── passkey-user-integration-test/ # Integration tests
└── passkey-user-load-test/        # Performance tests

User Requests → User Service → User State Management → Oracle Database
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| User Details | `/passkey-user/v1/users` | Store and retrieve user information |
| Favorites | `/passkey-user/v1/favorites` | Manage favorite hotels and properties |
| Participants | `/passkey-user/v1/participants` | Handle participant-specific data |
| Preferences | `/passkey-user/v1/preferences` | Manage user preferences and settings |
| Admin Operations | `/passkey-user/v1/admin` | Administrative user management |
| Reporting | `/passkey-user/v1/reports` | User information queries for reporting |

## Key Business Rules
- User details include comprehensive information with preferences and login history
- Favorites allow users to save and manage preferred hotels and properties
- Participant management handles specific data and relationships
- User preferences manage date/time formats, notifications, and display settings
- Administrative interface provides user management operations
- Reporting integration supports user information queries
- All user data must be properly secured and comply with privacy regulations
- User state is centrally managed across all Passkey services
- Configuration changes are reflected immediately across user sessions

## Service Dependencies

| Service | Purpose |
|---------|---------|
| auth-service | Authentication and authorization |
| passkey-reservation-service | User booking information |
| passkey-commerce-service | User transaction data |
| reporting-framework | User analytics and reporting |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-user` to browse:
- `passkey-user-service/src/main/java/com/cvent/passkey/user/resources/` — REST endpoints
- `passkey-user-data-access/src/main/java/com/cvent/passkey/user/dao/` — Data access layer
- `passkey-user-java-client/src/main/java/com/cvent/passkey/user/client/` — Java client library
- `catalog-info.yaml` — Backstage service metadata

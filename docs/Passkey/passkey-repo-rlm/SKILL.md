---
name: "passkey-repo-room-list-manager-rlm"
description: "Enables users to upload spreadsheets containing room and guest details for bulk processing of hotel reservations. Combines Java/WildFly backend with TypeScript/Next.js frontend to provide seamless bulk reservation management with rate limiting and malware scanning capabilities. Use when working with: the passkey-rlm repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-rlm`
- **Type**: Java 17/WildFly + TypeScript/Next.js Hybrid
- **Owner**: Steakholders Team (`#passkey-steak-holders`)
- **DB**: Oracle Database
- **Registry ID**: Not specified in docs

## What This Service Does
Enables users to upload spreadsheets containing room and guest details for bulk processing of hotel reservations. Combines Java/WildFly backend with TypeScript/Next.js frontend to provide seamless bulk reservation management with rate limiting and malware scanning capabilities.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Room List | Spreadsheet containing room assignments and guest details for bulk processing |
| Bulk Reservation | Multiple reservations created, modified, or cancelled simultaneously |
| Rate Limiting | Built-in constraints to prevent system overload during bulk operations |
| Malware Scanning | ClamAV integration for uploaded file security validation |
| Spreadsheet Processing | Upload and parse Excel/CSV files with room and guest data |
| Guest Information | Details about guests including names, preferences, and requirements |
| Room Assignment | Mapping of guests to specific rooms within hotel inventory |
| Processing Status | Real-time updates on bulk operation progress and results |
| Legacy Integration | Compatibility with existing Passkey infrastructure |
| Multi-environment | Configurable deployment across dev, staging, and production |

## Architecture at a Glance
```
passkey-rlm/
├── Core Module/              # Domain models, business logic, utilities
├── EJB Module/              # Enterprise Java Beans for business services
├── Web Module/              # JSP/Servlet web layer and REST endpoints
├── EAR Module/              # Enterprise Application Archive packaging
└── Frontend/                # Next.js application for modern UI

Hybrid: Java/WildFly Backend + TypeScript/Next.js Frontend → Oracle DB
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| File Upload | `/passkey-rlm/v1/upload` | Spreadsheet upload, malware scanning |
| Bulk Processing | `/passkey-rlm/v1/process` | Bulk reservation operations |
| Room Lists | `/passkey-rlm/v1/room-lists` | Room list management, validation |
| Status Tracking | `/passkey-rlm/v1/status` | Real-time processing updates |
| Admin Operations | `/passkey-rlm/v1/admin` | System management, configuration |

## Key Business Rules
- Spreadsheets must contain valid room and guest data for processing
- Rate limiting prevents system overload during bulk operations
- All uploaded files undergo ClamAV malware scanning before processing
- Bulk operations can create, modify, or cancel multiple reservations simultaneously
- Real-time processing status updates keep users informed of progress
- Guest information validation ensures data quality before reservation creation
- Room assignments must align with available hotel inventory
- Legacy integration maintains compatibility with existing Passkey infrastructure
- Multi-environment support enables proper testing and deployment workflows

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-authentication-service | User authentication and authorization |
| passkey-clamav-service | File malware scanning |
| passkey-inventory-service | Room inventory management |
| passkey-reservation-saga | Reservation orchestration |
| commerce | Payment processing |
| payments-wallet-service | Payment wallet management |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-rlm` to browse:
- `core/src/main/java/com/cvent/passkey/rlm/` — Core domain models and business logic
- `ejb/src/main/java/com/cvent/passkey/rlm/` — Enterprise Java Beans services
- `web/src/main/java/com/cvent/passkey/rlm/` — REST endpoints and web layer
- `frontend/` — TypeScript/Next.js application
- `catalog-info.yaml` — Backstage service metadata

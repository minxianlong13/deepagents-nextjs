---
name: "passkey-repo-acknowledgment-service"
description: "Handles reservation acknowledgment functionality for hotel bookings, providing REST APIs to send confirmation notifications for both individual reservations and group bookings. It manages the acknowledgment workflow ensuring proper delivery to guests and secondary contacts. Use when working with: the passkey-acknowledgment repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-acknowledgment`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Cherry Pickers (`#cherry-pickers`)
- **DB**: Oracle Database
- **Registry ID**: passkey-acknowledgment-service

## What This Service Does
Handles reservation acknowledgment functionality for hotel bookings, providing REST APIs to send confirmation notifications for both individual reservations and group bookings. It manages the acknowledgment workflow ensuring proper delivery to guests and secondary contacts.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| **Acknowledgment** | Confirmation notification sent to guests when a hotel reservation is made, modified, or cancelled |
| **Master Acknowledgment** | Consolidated acknowledgment for group bookings covering multiple reservations under single master number |
| **Primary Contact** | Main guest associated with reservation who receives acknowledgment notifications by default |
| **Secondary Contact** | Additional email addresses receiving copies of acknowledgments (coordinators, assistants) |
| **Reservation Status** | Numeric code indicating current state of reservation (confirmed, pending, cancelled, modified) |
| **Acknowledgment Preference** | User/account settings controlling whether acknowledgment notifications should be sent automatically |
| **Required Tag** | Classification tag that must be present for acknowledgment processing to proceed |
| **Acknowledgment Task** | Background processing job handling actual delivery of notifications through email channels |

## Architecture at a Glance
```
passkey-acknowledgment/
├── passkey-acknowledgment-api/           # API models and contracts
├── passkey-acknowledgment-service/       # Main Dropwizard service (Resource/Service layers)
├── passkey-acknowledgment-data-access/   # Database layer (DAO/Mapper)
├── passkey-acknowledgment-java-client/   # Java client library
└── passkey-acknowledgment-integration-test/ # Integration tests
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Single Acknowledgment** | `/singleReservationAcknowledgement` | POST - Send acknowledgment for individual reservation |
| **Group Acknowledgment** | `/multiReservationAcknowledgement` | POST - Send acknowledgment for multiple reservations |
| **OpenAPI Docs** | `/openapi.json`, `/openapi.yaml` | GET - API documentation |

## Key Business Rules
- Acknowledgments only sent for reservations in valid states (confirmed, modified, not cancelled)
- If `checkSenAckPreference` enabled, system validates guest hasn't opted out of notifications
- Master acknowledgment numbers must be unique within system to prevent conflicts
- All reservations in group acknowledgment must belong to same booking group/organization
- Multiple acknowledgment requests for same reservation within short window are deduplicated
- Email addresses in secondary contact lists must pass basic format validation
- When `sendSingleAcks` is true for group bookings, individual acknowledgments created while maintaining master link

## Service Dependencies

| Service | Purpose |
|---------|---------|
| **Auth Service** | Authentication and authorization for API access |
| **Passkey Reservation** | Source of reservation data and status information |
| **Email/Notification Services** | Downstream delivery of acknowledgment notifications |
| **Passkey Commerce** | Related commerce operations and booking context |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-acknowledgment` to browse:
- `passkey-acknowledgment-service/src/main/java/com/cvent/passkey/acknowledgment/resources/` — REST endpoints
- `passkey-acknowledgment-service/src/main/java/com/cvent/passkey/acknowledgment/service/` — Business logic
- `passkey-acknowledgment-data-access/src/main/java/` — Database access layer
- `passkey-acknowledgment-api/src/main/java/com/cvent/passkey/acknowledgment/model/` — API models
- `catalog-info.yaml` — Backstage service metadata

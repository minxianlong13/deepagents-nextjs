---
name: "passkey-repo-event-data-service"
description: "A Java-based Dropwizard microservice that serves as the central data management layer for event-related operations in the Passkey ecosystem. Handles event request data, room lists, and group meeting lists with DynamoDB persistence and external service integration. Use when working with: the passkey-event-data repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-event-data`
- **Type**: Java 17 Dropwizard Microservice
- **Owner**: metre-stick Team (`#metre-stick`)
- **DB**: DynamoDB
- **Registry ID**: passkey-event-data

## What This Service Does
A Java-based Dropwizard microservice that serves as the central data management layer for event-related operations in the Passkey ecosystem. Handles event request data, room lists, and group meeting lists with DynamoDB persistence and external service integration.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Event Request | Formal request to process event-related data (room lists or group meeting lists) |
| Participant | The base entity for any organization or entity in Passkey (NOT a person attending an event). Types: Event Organizer, Hotel, Sister Property Org, Vendor/Sponsor, Passkey itself |
| Room List | Collection of hotel room inventory data for event planning |
| GML (Group Meeting List) | Specialized event request handling group meeting data |
| File ID | Unique identifier for uploaded files serving as source data |
| GL Code | Group List code for categorizing group events |
| Request Type | Enumeration (ROOM_LIST, GML) categorizing event requests |
| Status | Current processing state of an event request |
| Reglink Service | External service providing event metadata and registration links |

## Architecture at a Glance
```
passkey-event-data/
├── service/          # Main Dropwizard application
├── model/            # Data models and DTOs
├── java-client/      # Client library for external consumers
├── parent/           # Maven parent configuration
└── it/              # Integration tests
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Event Requests | `/api/v1/event-requests` | CRUD operations for event request data |
| Health Check | `/healthcheck` | Service health status monitoring |
| Admin | `/admin` | Administrative endpoints |

## Key Business Rules
- Event requests must be associated with a valid participant ID
- Room list requests require a valid file ID for source data
- GML requests are identified by GL Code and UUID combination
- All requests track lifecycle from submission to completion/failure
- Status transitions follow defined workflow patterns
- Metadata provides additional context for request processing
- Integration with reglink service for event validation and enrichment

## Service Dependencies

| Service | Purpose |
|---------|---------|
| DynamoDB | Primary NoSQL data storage with caching |
| Auth Service | Authentication and authorization |
| Reglink Service | Event metadata and registration links |
| S3 | File storage for uploaded data |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-event-data` to browse:
- `packages/passkey-event-data/service/src/main/java/` — Dropwizard application code
- `packages/passkey-event-data/service/configs/` — Environment configuration files
- `packages/passkey-event-data/model/src/main/java/` — Data models and DTOs
- `packages/passkey-event-data/java-client/` — Client library implementation
- `packages/passkey-event-data/infra/` — Infrastructure as code
- `catalog-info.yaml` — Backstage service metadata

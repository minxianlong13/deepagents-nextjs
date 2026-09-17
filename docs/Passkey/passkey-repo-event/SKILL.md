---
name: "passkey-repo-event-service"
description: "Manages the **Event** aggregate and its derivatives: attendee groups, hotel blocks, guarantee plans, web booking config, and merchant accounts. This is the central source of truth for event data in Passkey for Hotels. Use when working with: the passkey-event repository."
---

## Service Identity

- **Repo**: `cvent-internal/passkey-event`
- **Type**: Java 17 Dropwizard microservice (multi-module Maven)
- **Owner**: Cherry Pickers (`#passkey-cherrypickers`)
- **DB**: Oracle (via MyBatis)
- **Registry ID**: d7193c62-e081-4f5c-827f-479cded7354f

## What This Service Does

Manages the **Event** aggregate and its derivatives: attendee groups, hotel blocks, guarantee plans, web booking config, and merchant accounts. This is the central source of truth for event data in Passkey for Hotels.

## Key Domain Concepts

| Term | Meaning |
|------|---------|
| Event | A housing event (conference, convention, trade show) requiring hotel room blocks |
| Block | Reserved allocation of hotel rooms for an event at negotiated rates |
| Attendee Group Type (Sub-Block) | Category of attendees with specific booking rules and access codes |
| Guarantee Plan | Payment/guarantee requirements: Guest Credit Card, Guest Other Payment, or Master Guarantee |
| Group Code | 20-char globally unique access code allowing attendees to book under a group type |
| City-Wide Event | Event spanning multiple hotels vs. single-hotel |
| Cutoff Date | Last date reservations are accepted |
| Shoulder Nights | Extra nights before/after main event dates |
| WebInfo | Hotel-specific event configuration (visibility, ranking, dates, HQ flag, marketing) |

## Architecture at a Glance

```
passkey-event/
├── passkey-event-api/              # OpenAPI specs and contracts
├── passkey-event-service/          # Main app (REST resources, services)
├── passkey-event-data-access/      # MyBatis mappers, DAOs
├── passkey-event-shared/           # Shared models and utilities
├── passkey-event-java-client/      # Client library for consumers
└── passkey-event-integration-test/ # Karate integration tests
```

Entry point: `com.cvent.passkeyevent.PasskeyEventServiceApplication` (extends `CventApplication`)

## API Surface (80+ endpoints)

| Area | Base Path | Key Operations |
|------|-----------|----------------|
| Events | `/passkey-event/v1/events` | CRUD, search, summaries, planner ops |
| Events V2 | `/passkey-event/v2/events` | Enhanced search with filtering |
| Blocks | `/passkey-event/v1/events/blocks` | Block CRUD, inventory, block requests |
| Guarantee Rules | `/passkey-event/v1/events/{eventId}/guarantee-plans` | Rule CRUD, calculate, settings |
| Admin | `/passkey-event/v1/admin` | Cache mgmt, profiles, merchant accounts, status |
| Credit Cards | `/passkey-event/v1/accepted-credit-cards` | Accepted card types by participant |

Auth: API Key (`apiKey` header) and/or Bearer Token.

## Key Business Rules

- Event status lifecycle: PRE_OPEN → OPEN → NEAR_CUTOFF → CLOSED/CANCELLED
- Bookings only between open and shutoff dates; cutoff date enforced
- Group type names unique per event; access codes auto-generated (20 chars, globally unique)
- Each group type must link to a valid guarantee plan
- Deleting events cascades with integrity checks; some entities soft-deleted

## Service Dependencies

- **auth-service** — authentication/authorization
- **passkey-book** — booking integration

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, package organization, design patterns
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, DTOs, business rules, service layer
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build profiles, code quality config
- `docs/DEPLOYMENT.md` — Docker setup, CI/CD pipeline, environment configs
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-event` to browse:
- `pom.xml` — Current dependencies and versions
- `passkey-event-service/src/main/java/com/cvent/passkeyevent/resources/` — REST resource classes
- `passkey-event-service/src/main/java/com/cvent/passkeyevent/services/` — Business logic
- `passkey-event-data-access/src/main/java/` — MyBatis mappers and DAOs
- `passkey-event-api/` — OpenAPI specs (`openapi.json`, `openapi.yaml`)
- `catalog-info.yaml` — Backstage service metadata

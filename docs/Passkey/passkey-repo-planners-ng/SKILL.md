---
name: "passkey-repo-planner-portal"
description: "Provides a comprehensive web-based dashboard for event planners to create and manage hotel reservations, monitor inventory, generate reports, and coordinate housing logistics for their events. Serves as the primary interface for planners in the Passkey ecosystem. Use when working with: the passkey-planners-ng repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-planners-ng`
- **Type**: Java 17 Spring Web Application (WildFly)
- **Owner**: Passkey Team (`#passkey`)
- **DB**: Oracle
- **Registry ID**: Not specified

## What This Service Does
Provides a comprehensive web-based dashboard for event planners to create and manage hotel reservations, monitor inventory, generate reports, and coordinate housing logistics for their events. Serves as the primary interface for planners in the Passkey ecosystem.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| Event | Gathering requiring hotel accommodations with specific dates and locations |
| Planner | Event organizer managing hotel reservations and housing logistics. Two types: Event-Level (full access to all hotels/groups) and SBG-Level (restricted to assigned sub-block groups) |
| Reservation | Hotel room booking associated with a specific event |
| Room Block | Group of hotel rooms reserved for an event at negotiated rates |
| Inventory | Available hotel rooms and room types for specific dates |
| Pick-up | Actual rooms booked vs reserved room block (success metric) |
| Rate | Hotel room pricing with potential event discounts |
| Sub-Block Group (SBG) | Subdivision used for planner access control - multiple attendee groups can share the same SBG ID |
| Attendee | Individual attending an event who may require hotel accommodations (not to be confused with Participants, which are system-level organization entities) |
| Housing | Overall accommodation management for an event |
| Dashboard | Main interface showing metrics and quick access functions |

## Architecture at a Glance
```
src/main/java/com/passkey/portal/
├── web/controller/          # Spring MVC controllers
├── service/                 # Business logic layer
├── dao/                     # Data access objects
├── model/                   # Domain entities
└── config/                  # Spring configuration
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Dashboard | `/portal` | GET - Main planner dashboard |
| Events | `/events` | CRUD - Event management |
| Reservations | `/reservations` | CRUD - Hotel booking management |
| Reports | `/reports` | GET - Analytics and reporting |
| Inventory | `/inventory` | GET - Room availability |
| File Upload | `/upload` | POST - Secure file upload with malware scanning |

## Key Business Rules
- Event planners can create and modify hotel reservations for their events
- Room blocks must be managed to ensure availability and pricing
- All file uploads are scanned for malware before processing
- Pick-up rates are tracked to measure event success
- Real-time inventory updates prevent overbooking
- Reports provide insights into event performance and financial summaries

## Service Dependencies
| Service | Purpose |
|---------|---------|
| passkey-authentication | User authentication and authorization |
| passkey-hotel | Hotel inventory and availability data |
| passkey-reservation | Reservation processing and management |
| passkey-reporting | Report generation and analytics |
| passkey-clamav | Malware scanning for file uploads |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-planners-ng` to browse:
- `src/main/java/com/passkey/portal/web/controller/` — Spring MVC controllers
- `src/main/java/com/passkey/portal/service/` — Business logic services
- `src/main/java/com/passkey/portal/dao/` — Data access layer
- `src/main/webapp/` — JSP views and frontend assets
- `catalog-info.yaml` — Backstage service metadata

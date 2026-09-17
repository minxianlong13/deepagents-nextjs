---
name: "passkey-repo-event-spring-boot-service"
description: "The Passkey Event Spring Boot Service serves as the backend for event management within the Passkey ecosystem, providing event information retrieval and management, marketing items management, event configuration and settings management, and integration with Cvent's authentication and authorization systems. Use when working with: the passkey-event-sb repository; Event Management, Marketing Items, Multi-locale Support, FlipTo Settings, Attendee Management."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-event-sb`
- **Type**: Java 17+ Spring Boot Microservice
- **Owner**: cherry-pickers (`#passkey-cherrypickers`)
- **DB**: Oracle Database with MyBatis ORM
- **Registry ID**: 4d143d28-e8ee-5861-9f70-1e36549bc263

## What This Service Does
The Passkey Event Spring Boot Service serves as the backend for event management within the Passkey ecosystem, providing event information retrieval and management, marketing items management, event configuration and settings management, and integration with Cvent's authentication and authorization systems.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Event Management** | Comprehensive event data retrieval and status management |
| **Marketing Items** | Promotional materials and content associated with events |
| **Multi-locale Support** | Event information available in multiple locales (defaults to en_US) |
| **FlipTo Settings** | Configuration management for event settings |
| **Attendee Management** | Closed Sub-Block Group (SBG) attendee management |
| **Merchant Account** | Payment processing account information for events |
| **Consent Management** | Privacy and consent handling for events |
| **Sub-Block Group (SBG)** | Subdivision used for planner access control; multiple attendee groups can share the same SBG ID |

## Architecture at a Glance
```
passkey-event-sb/
├── packages/passkey-event-sb/
│   ├── service/                     # Main Spring Boot application
│   │   ├── src/main/java/          # Java source code
│   │   ├── src/main/resources/     # Configuration files
│   │   └── configs/                # Environment configurations
│   └── it/                         # Integration tests
├── docs/                           # Documentation
└── .run/                          # IDE run configurations
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Event Status** | `/passkey-event/v5/events/{id}` | Get event status information |
| **Event Information** | `/passkey-event/v5/events/{eventId}/event-info` | Get comprehensive event information |
| **Marketing Items** | `/passkey-event/v5/events/{eventId}/marketing-items` | Get marketing items for an event |
| **FlipTo Settings** | `/passkey-event/v5/events/{eventId}/flip-to-settings` | Get FlipTo configuration settings |
| **Attendee Management** | `/passkey-event/v5/events/{eventId}/closed-sbg-attendees` | Get closed SBG attendees |
| **Merchant Account** | `/passkey-event/v5/events/{eventId}/merchant-account` | Get merchant account information |
| **Consent Management** | `/passkey-event/v5/events/{eventId}/consents` | Get consent information |

## Key Business Rules
- Event information supports multi-locale with en_US as default locale
- Marketing items are associated with specific events and managed per event
- FlipTo settings provide configuration management for event-specific settings
- Closed SBG attendee management handles sub-block group organization
- Merchant account integration supports payment processing for events
- Consent management ensures privacy compliance for event data
- Legacy support maintains backward compatibility with existing event systems
- OAuth integration provides secure authentication and authorization

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **Cvent Auth Service** | Authentication and authorization |
| **Oracle Database** | Primary data storage with MyBatis ORM |
| **Cvent Common Libraries** | Shared utilities and frameworks |
| **Cvent Observability Stack** | Monitoring and logging |
| **passkey-reservation** | Reservation management integration |
| **passkey-payment** | Payment processing integration |
| **passkey-housing-library** | Housing management utilities |
| **passkey-permission** | Permission and authorization management |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-event-sb` to browse:
- `packages/passkey-event-sb/service/src/main/java/` — Java source code and controllers
- `packages/passkey-event-sb/service/src/main/resources/` — Configuration files
- `packages/passkey-event-sb/service/configs/` — Environment configurations
- `packages/passkey-event-sb/it/` — Integration tests
- `catalog-info.yaml` — Backstage service metadata

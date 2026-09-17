---
name: "passkey-repo-hotel-spring-boot-service"
description: "Modern Spring Boot implementation consolidating hotel-related operations for the Passkey platform. Provides hotel management, e-commerce rules, pricing logic, event-hotel associations, and attendee type management while bridging with legacy Passkey services. Use when working with: the passkey-hotel-sb repository; Attendee Type, E-Commerce Rules, Event, Hotel, Passkey."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-hotel-sb`
- **Type**: Spring Boot Multi-Module (Java 17)
- **Owner**: metre-stick team (`#passkey-api`)
- **DB**: Oracle (via MyBatis)
- **Registry ID**: passkey-hotel-springboot

## What This Service Does
Modern Spring Boot implementation consolidating hotel-related operations for the Passkey platform. Provides hotel management, e-commerce rules, pricing logic, event-hotel associations, and attendee type management while bridging with legacy Passkey services.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Attendee Type** | Classification of event participants (Speaker, VIP, General, Staff) |
| **E-Commerce Rules** | Business rules governing booking processing, pricing, availability |
| **Event** | Scheduled gathering requiring hotel accommodations with negotiated rates |
| **Hotel** | A Participant entity representing a lodging establishment with specific object types, properties, room types, rates, availability |
| **Passkey** | Cvent's hotel booking and management platform for group reservations |
| **Housing Library** | Reusable hotel configurations and booking policies |
| **Locale** | Language/regional settings (en-US, fr-FR) for content display |
| **Group Rate** | Special negotiated pricing for event attendees |
| **Booking Policy** | Rules for reservation creation, modification, cancellation |
| **Guarantee Policy** | Requirements for securing reservations (credit card, deposit) |

## Architecture at a Glance
```
passkey-hotel-sb/
├── packages/
│   └── passkey-hotel-sb/
│       ├── service/                  # Main Spring Boot application
│       ├── model/                    # Domain models and entities
│       ├── java-client/              # Client library for integration
│       └── integration-test/         # Integration test suite
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Hotel Management** | `/passkey-hotel/v1/hotels` | CRUD operations for hotels |
| **E-Commerce Rules** | `/passkey-hotel/v1/ecommerce` | Pricing and booking rules |
| **Event Associations** | `/passkey-hotel/v1/events` | Event-hotel relationships |
| **Attendee Types** | `/passkey-hotel/v1/attendee-types` | Participant classifications |
| **Health** | `/actuator/health` | Service health and readiness |

## Key Business Rules
- E-commerce rules govern pricing, availability, and cancellation policies
- Attendee types determine booking privileges and access to inventory
- Group rates provide discounted pricing compared to standard retail
- Booking policies define reservation modification and cancellation rules
- Guarantee policies specify requirements for securing reservations
- Locale settings determine currency, date formats, and localized content
- Housing library provides reusable configurations across events
- Event-hotel associations manage negotiated rates and inventory allocations

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **passkey-hotel** | Legacy hotel service being replaced |
| **passkey-ecommerce** | E-commerce functionality integration |
| **passkey-reservation** | Reservation management operations |
| **passkey-housing-library** | Housing library services |
| **Oracle Database** | Data persistence via MyBatis ORM |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-hotel-sb` to browse:
- `packages/passkey-hotel-sb/service/src/main/java/` — Main Spring Boot service implementation
- `packages/passkey-hotel-sb/model/src/main/java/` — Domain models and entities
- `packages/passkey-hotel-sb/java-client/src/main/java/` — Client library
- `packages/passkey-hotel-sb/integration-test/` — Integration test suite
- `catalog-info.yaml` — Backstage service metadata

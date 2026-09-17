---
name: "passkey-repo-reservation-service"
description: "Handles the creation, modification, and cancellation of hotel reservations and attendee-related information for the Reservation Orchestrator within the Cvent Passkey platform. Serves as the core reservation management component with complete CRUD operations and integration with payment processing. Use when working with: the passkey-reservation repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-reservation`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Steakholders Team (`#passkey-steak-holders`)
- **DB**: Oracle Database
- **Registry ID**: 9992b616-fd36-482f-9768-10762c04fb55

## What This Service Does
Handles the creation, modification, and cancellation of hotel reservations and attendee-related information for the Reservation Orchestrator within the Cvent Passkey platform. Serves as the core reservation management component with complete CRUD operations and integration with payment processing.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Reservation | Individual room booking linking a guest to a specific block (hotel + event + attendee group + room type) for specific dates |
| Attendee | Individual guest who will be staying at the hotel (not to be confused with Participant which refers to organizations) |
| Group Booking | Multiple reservations linked via master acknowledgment number |
| Confirmation Number | Unique identifier shown to guest for their reservation |
| Master Acknowledgment Number | Links multiple reservations in a group booking |
| Reservation Lifecycle | Complete process of create, modify, cancel operations |
| Orchestrated Operations | Integration with Reservation Saga for complex workflows |
| Payment Integration | Seamless connection with payment wallet services |
| Inventory Management | Real-time room availability and inventory tracking across six pools |
| Waitlist | FIFO queue for reservations when inventory is exhausted |
| Queue-It | Virtual waiting room service for high-demand event launches (separate from waitlist) |
| Room List | Collection of room assignments for group bookings |
| Reservation Saga | Orchestration service for complex reservation workflows |
| Multi-version API | Support for multiple API versions (v2, v3) |

## Architecture at a Glance
```
passkey-reservation/
├── passkey-reservation-api/           # API contracts and OpenAPI specifications
├── passkey-reservation-service/       # Main service with REST resources
├── passkey-reservation-data-access/   # Data access layer
└── passkey-reservation-shared/        # Shared utilities and models

Reservation Orchestrator → Reservation Service → Payment/Inventory Services → Oracle DB
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Reservation Management | `/passkey-reservation/v2/reservations` | CRUD operations for reservations |
| Group Bookings | `/passkey-reservation/v2/groups` | Group reservation workflows |
| Attendee Management | `/passkey-reservation/v2/attendees` | Attendee information handling |
| Waitlist Operations | `/passkey-reservation/v2/waitlist` | Waitlist management |
| Room Lists | `/passkey-reservation/v2/room-lists` | Room list and inventory management |
| Admin Operations | `/passkey-reservation/v2/admin` | Administrative tools |
| Version 3 APIs | `/passkey-reservation/v3` | Enhanced reservation features |

## Key Business Rules
- Reservations require valid guest information, dates, and room details
- Group bookings support multiple rooms or guests in single workflow
- Waitlist management handles reservations when inventory is unavailable
- Payment integration ensures secure transaction processing
- Real-time inventory tracking prevents overbooking
- Reservation lifecycle includes create, modify, and cancel operations
- Orchestrated operations handle complex multi-step workflows
- Multi-version API support maintains backward compatibility
- Admin operations provide tools for reservation management
- Attendee information must be properly validated and stored

## Service Dependencies

| Service | Purpose |
|---------|---------|
| auth-service | Authentication and authorization |
| passkey-event-service | Event management and notifications |
| passkey-hotel-service | Hotel information and configuration |
| passkey-inventory-service | Room inventory and availability |
| payments-wallet-service | Payment processing and wallet management |
| passkey-acknowledgment-service | Confirmation and acknowledgment handling |
| passkey-reservation-saga | Orchestration for complex workflows |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-reservation` to browse:
- `passkey-reservation-service/src/main/java/com/cvent/passkey/reservation/resources/` — REST endpoints
- `passkey-reservation-data-access/src/main/java/com/cvent/passkey/reservation/dao/` — Data access layer
- `passkey-reservation-shared/src/main/java/com/cvent/passkey/reservation/model/` — Domain models
- `passkey-reservation-api/src/main/resources/` — OpenAPI specifications
- `catalog-info.yaml` — Backstage service metadata

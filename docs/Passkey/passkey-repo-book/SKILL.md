---
name: "passkey-repo-book"
description: "Serves as an attendee website for hotel bookings within the Passkey ecosystem. Provides a comprehensive booking platform for event attendees to reserve hotel accommodations with complete reservation lifecycle management from search to confirmation. Use when working with: the passkey-book repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-book`
- **Type**: Java 17 Spring MVC/WildFly Web Application
- **Owner**: Maurya Team (`#passkey-maurya`)
- **DB**: Oracle Database (with Hibernate ORM)
- **Registry ID**: Not specified in docs

## What This Service Does
Serves as an attendee website for hotel bookings within the Passkey ecosystem. This is one of the primary applications where reservations ARE made (not just viewed). Provides a comprehensive booking platform for event attendees to reserve hotel accommodations with complete reservation lifecycle management from search to confirmation.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Hotel Booking | Complete reservation lifecycle from search to confirmation |
| Guest Management | Handle multiple guests per reservation with detailed profiles |
| Payment Processing | Secure credit card processing and payment validation |
| Room Block Management | Support for group bookings and room blocks |
| Attendee Website | Web platform for event attendees to book accommodations |
| Reservation Lifecycle | Complete process from search through confirmation |
| Group Reservations | Booking multiple rooms for events or groups |
| Legacy Integration | Compatibility with GroupMax systems |
| Multi-language Support | Internationalization capabilities |
| Responsive Interface | Modern web UI built with Spring MVC |
| Access Code | 20-character unique code used in booking URLs to identify attendee group types |
| Attendee Group Types | Categories of attendees (VIP, general, staff) with different access and rates |
| Guarantee Plans | Payment and guarantee requirements for reservations (credit card, other payment, master guarantee) |
| Waitlist | Queue for reservations when inventory is exhausted (FIFO processing) |
| Queue-It | Virtual waiting room service for high-demand event launches (separate from waitlist) |

## Architecture at a Glance
```
passkey-book/
├── packages/app/           # Main application modules
│   ├── war/               # Web application (WAR)
│   ├── passkey-core/      # Core business logic
│   ├── groupmax-core2/    # Legacy GroupMax integration
│   └── passkey-dev-core/  # Development utilities
├── scripts/               # Setup and deployment scripts
└── configs/              # Environment configurations

Event Attendees → Booking Website → Reservation Processing → Hotel Confirmation
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Hotel Search | `/event/{eventId}/owner/{ownerId}/search` | Browse and search available hotels |
| Booking Management | `/event/{eventId}/owner/{ownerId}/booking` | Make and manage reservations |
| Guest Management | `/event/{eventId}/owner/{ownerId}/guests` | Handle guest information and profiles |
| Payment Processing | `/event/{eventId}/owner/{ownerId}/payment` | Process payments for hotel stays |
| Room Blocks | `/event/{eventId}/owner/{ownerId}/blocks` | Group bookings and room blocks |
| User Interface | `/event/{eventId}/owner/{ownerId}/home` | Main booking interface |

## Key Business Rules
- Event attendees can browse and search available hotel accommodations
- Reservations are made through this application (one of the primary booking channels)
- Booking URLs contain access codes (20-character unique identifiers) that determine attendee group type and available rates
- Attendee group types (VIP, general, staff, speakers) have different access levels and room allocations
- Guarantee plans define payment requirements (guest credit card, other payment methods, or master guarantee)
- Reservation lifecycle includes search, selection, booking, and confirmation
- Guest management handles multiple guests per reservation with detailed profiles
- Payment processing ensures secure credit card processing and validation
- Room block management supports group bookings and allocated room blocks
- Waitlist functionality queues reservations when inventory is exhausted (FIFO processing)
- Queue-It integration provides virtual waiting room for high-demand event launches (separate from waitlist)
- Multi-language support provides internationalization capabilities
- Responsive web interface adapts to different devices and screen sizes
- Legacy integration maintains compatibility with GroupMax systems
- All bookings require valid event and owner identification
- Payment validation must occur before reservation confirmation

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-authentication-service | User authentication and authorization |
| passkey-reservation-saga | Reservation workflow orchestration |
| passkey-payment | Payment processing |
| passkey-commerce | Commerce operations |
| passkey-compliance | GDPR and compliance management |
| messaging-api | Email and notification services |
| experiments-service | A/B testing and feature flags |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-book` to browse:
- `packages/app/war/src/main/java/com/cvent/passkey/book/` — Web application controllers
- `packages/app/passkey-core/src/main/java/com/cvent/passkey/core/` — Core business logic
- `packages/app/groupmax-core2/src/main/java/com/cvent/groupmax/` — Legacy integration
- `scripts/` — Setup and deployment scripts
- `catalog-info.yaml` — Backstage service metadata

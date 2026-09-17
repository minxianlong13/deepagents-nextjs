---
name: "passkey-repo-reservation-springboot"
description: "Provides unified reservation management for the Passkey platform using modern Spring Boot architecture. Serves as the backend for reservation operations, replacing legacy systems while maintaining backward compatibility during migration. Use when working with: the passkey-reservation-sb repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-reservation-sb`
- **Type**: Java 17 Spring Boot Microservice
- **Owner**: Passkey Team (`#passkey`)
- **DB**: Oracle
- **Registry ID**: Not specified

## What This Service Does
Provides unified reservation management for the Passkey platform using modern Spring Boot architecture. Serves as the backend for reservation operations, replacing legacy systems while maintaining backward compatibility during migration. Handles hotel bookings, guest profiles, and reservation lifecycle management.

**Important**: This service manages existing reservations. Reservations are NOT created in Passkey Manage (Resdesk/RDK2) but through guest-facing booking websites (passkey-book), call centers, planner portals, and vendor integrations. Passkey Manage is used to view and manage reservations after they are created.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| Reservation | Hotel booking record with dates, room preferences, guest info, payment status |
| Confirmation Number | Unique alphanumeric identifier for guest booking reference (shown to guest) |
| Master Acknowledgment Number | Links multiple reservations in a group booking |
| Passkey | Cvent's hotel booking platform for event attendees with special rates |
| Legacy System | Original reservation service being replaced by this Spring Boot service |
| Guest Profile | Personal information, contact details, preferences, special requirements |
| Room Block | Group of hotel rooms reserved for events with negotiated rates |
| Check-in/Check-out | Guest stay start and end dates |
| Hotel Property | Specific hotel location with unique ID, amenities, room inventory |
| Room Type | Room category with bed configuration, size, amenities |
| Booking Status | Current reservation state (Active/Confirmed, Modified, Cancelled, Waitlisted, No-show) |
| Waitlist | Queue for reservations when inventory is exhausted (FIFO processing) |
| Queue-It | Virtual waiting room service for high-demand event launches (separate from waitlist) |

## Architecture at a Glance
```
src/main/java/com/cvent/passkeyreservationsb/
├── controllers/          # REST API endpoints
├── services/            # Business logic layer
├── dao/                 # Data access objects
├── models/              # Domain entities and DTOs
├── config/              # Spring configuration
└── legacy/              # Legacy system compatibility
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Reservations | `/reservations` | CRUD - Reservation management |
| Legacy API | `/legacy` | GET/POST - Legacy system compatibility |
| Guest Profiles | `/guests` | CRUD - Guest information management |
| Room Blocks | `/room-blocks` | GET - Room block information |
| Health Checks | `/health` | GET - Service health monitoring |

## Key Business Rules
- Confirmation numbers must be unique alphanumeric identifiers
- Reservations support full lifecycle management from creation to completion
- Legacy API endpoints maintain backward compatibility during migration
- Guest profiles store personal information and preferences securely
- Room blocks provide negotiated rates for event attendees
- OAuth-based authentication ensures secure access to reservation data
- Database transactions ensure data consistency across operations

## Service Dependencies
| Service | Purpose |
|---------|---------|
| Cvent OAuth Service | Authentication and authorization |
| passkey-hotel | Hotel inventory and property information |
| passkey-payment | Payment processing and financial operations |
| Legacy Reservation System | Data migration and compatibility |
| Oracle Database | Primary data storage |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-reservation-sb` to browse:
- `src/main/java/com/cvent/passkeyreservationsb/controllers/` — REST API controllers
- `src/main/java/com/cvent/passkeyreservationsb/services/` — Business logic services
- `src/main/java/com/cvent/passkeyreservationsb/dao/` — Data access layer
- `src/main/resources/` — Configuration and MyBatis mappers
- `catalog-info.yaml` — Backstage service metadata

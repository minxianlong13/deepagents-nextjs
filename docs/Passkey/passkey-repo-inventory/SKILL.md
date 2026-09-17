---
name: "passkey-repo-inventory-service"
description: "Manages event inventory for the Passkey platform. Handles room inventory allocation, availability tracking, and reservation processing for hotel events, ensuring accurate availability tracking, preventing overbooking, and providing real-time inventory data to event planners and attendees. Use when working with: the passkey-inventory repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-inventory`
- **Type**: Java 21 Dropwizard Multi-Module
- **Owner**: Meeseeksbox Team (`#passkey-meeseeks-box`)
- **DB**: Oracle Database
- **Registry ID**: 67220661-db40-4d32-8958-a2ed688e761e

## What This Service Does
Manages event inventory for the Passkey platform. Handles room inventory allocation, availability tracking, and reservation processing for hotel events, ensuring accurate availability tracking, preventing overbooking, and providing real-time inventory data to event planners and attendees.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Room Block | An allocation of hotel rooms reserved for an event linking Event + Hotel + Attendee Group Type + Room Type |
| Six-Pool System | Inventory tracked across Block, Hotel Pool, Room Pool, Overbook, Waitlist, and Primary Pool |
| Inventory Tracking | Three-level tracking: daily per block, per event-hotel-room, and hotel base |
| R2FS | Release to Free Sell - automatically releases unused block inventory back to hotel |
| Sell-Only-From-Primary | Inventory control restricting sales to primary inventory pool only |
| Inventory Locking | Prevent race conditions during reservation processing |
| Primary Pool | Hotel's base inventory allocation (HOTELROOMTYPEINVENTORY.primarypool) |
| Block Inventory | Rooms allocated to a specific block (INVENTORY.totalnumber) |
| Availability Tracking | Real-time availability checking across the six inventory pools |
| Inventory Controls | Rules like R2FS, Sell-Highest-Rate, Pull From Higher Pool, Closed Status |

## Architecture at a Glance
```
passkey-inventory/
├── passkey-inventory-api/           # API contracts and specifications
├── passkey-inventory-service/       # Main service with REST resources
├── passkey-inventory-data-access/   # Data access layer
└── passkey-inventory-shared/        # Shared utilities and models

Event Planners → Inventory Service → Room Allocation → Oracle Database
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Inventory Management | `/passkey-inventory/v1/inventory` | Track six-pool inventory system |
| Availability Tracking | `/passkey-inventory/v1/availability` | Real-time availability across pools |
| Reservation Processing | `/passkey-inventory/v1/reservations` | Handle reservation requests |
| Room Blocks | `/passkey-inventory/v1/blocks` | Manage Event+Hotel+Group+Room blocks |
| Inventory Locking | `/passkey-inventory/v1/locks` | Prevent race conditions |
| Admin Operations | `/passkey-inventory/v1/admin` | Administrative inventory management |

## Key Business Rules
- Six-pool inventory system: Block → Hotel Pool → Room Pool → Overbook → Waitlist → Primary Pool
- Room Blocks link Event + Hotel + Attendee Group Type + Room Type
- Inventory tracked at three levels: daily per block, per event-hotel-room, hotel base
- R2FS (Release to Free Sell) automatically releases unused block inventory back to hotel
- Inventory controls include Sell-Only-From-Primary, Pull From Higher Pool, Closed Status
- Inventory locking prevents race conditions during concurrent reservation processing
- Primary Pool represents hotel's base inventory allocation
- Block Inventory (INVENTORY.totalnumber) is the most specific allocation level
- Availability calculated across all six pools with priority allocation rules
- Closed flags override inventory availability regardless of room counts

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-business-text-service | Business text and localization |
| passkey-event-service | Event management and configuration |
| passkey-hotel-service | Hotel information and management |
| passkey-room-type-data-service | Room type definitions and data |
| auth-service | Authentication and authorization |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-inventory` to browse:
- `passkey-inventory-service/src/main/java/com/cvent/passkey/inventory/resources/` — REST endpoints
- `passkey-inventory-data-access/src/main/java/com/cvent/passkey/inventory/dao/` — Data access layer
- `passkey-inventory-shared/src/main/java/com/cvent/passkey/inventory/model/` — Domain models
- `catalog-info.yaml` — Backstage service metadata

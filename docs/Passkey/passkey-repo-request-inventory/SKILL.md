---
name: "passkey-repo-request-inventory-service"
description: "Manages inventory allocation for Passkey hotel reservations, providing APIs for requesting, locking, and managing hotel room inventory across different dates and room types. It handles complex business logic for inventory allocation while ensuring data consistency and preventing double-booking. Use when working with: the passkey-request-inventory repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-request-inventory`
- **Type**: Java 21 Dropwizard Multi-Module
- **Owner**: Meeseeksbox (`#passkey-meeseeks-box`)
- **DB**: PostgreSQL
- **Registry ID**: 6e5d7a5d-9d1b-4fdd-9cbf-f65b1a2ea14d

## What This Service Does
Manages inventory allocation for Passkey hotel reservations, providing APIs for requesting, locking, and managing hotel room inventory across different dates and room types. It handles complex business logic for inventory allocation while ensuring data consistency and preventing double-booking.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| **Allocation** | Process of assigning specific hotel room inventory to a reservation for particular dates |
| **Block** | Group of hotel rooms reserved for a specific event or group containing allocatable inventory |
| **Inventory** | Available hotel room capacity for specific dates and room types |
| **Lock** | Temporary hold on inventory preventing other reservations from accessing the same rooms |
| **Reservation** | Booking request or confirmed booking for hotel accommodations with unique identifier |
| **Room Type** | Category of hotel room with specific characteristics (Standard, Deluxe Suite, etc.) |
| **Session Key** | Unique identifier tracking series of related operations for consistency and rollback |
| **Wait List** | Mechanism for handling requests when inventory is not immediately available |

## Architecture at a Glance
```
passkey-request-inventory/
├── passkey-request-inventory-api/          # API models and DTOs
├── passkey-request-inventory-service/      # Main service with REST resources
├── passkey-request-inventory-data-access/  # Database access layer
├── passkey-request-inventory-java-client/  # Java client library
├── passkey-request-inventory-integration-test/ # Integration tests
└── passkey-request-inventory-load-test/    # Performance tests
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Individual Operations** | `/api/v1/request-inventory/{reservationId}` | GET, POST, DELETE |
| **Bulk Operations** | `/api/v1/request-inventory/bulk` | POST |
| **Inventory Locking** | `/api/v1/lock-inventory/{reservationId}` | POST, DELETE |

## Key Business Rules
- Inventory allocation reduces available capacity for specified dates and room types
- Locks have expiration times and prevent double-booking during reservation processes
- Session keys ensure consistency across multiple API calls and enable rollback operations
- Wait-listing is supported when inventory is not immediately available
- Overbooking can be allowed based on configuration and business rules
- Bulk operations process multiple inventory requests efficiently in single transactions
- Rollback support allows cancellation of inventory operations when needed

## Service Dependencies

| Service | Purpose |
|---------|---------|
| **Auth Service** | API authentication and authorization |
| **Passkey Inventory Service** | Source of actual inventory data |
| **Passkey Reservation Service** | Reservation context and validation |
| **PostgreSQL Database** | Persistent storage for allocations and locks |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-request-inventory` to browse:
- `passkey-request-inventory-service/src/main/java/` — REST resources and business logic
- `passkey-request-inventory-api/src/main/java/` — API models and DTOs
- `passkey-request-inventory-data-access/src/main/java/` — Database access layer
- `pom.xml` — Maven configuration and dependencies
- `catalog-info.yaml` — Backstage service metadata

---
name: "passkey-repo-sub-block-dashboard-sbd"
description: "Provides a web-based dashboard interface for managing sub-block inventory and operations within the Passkey platform. Serves as a critical component in the Passkey for Planners Housing system, enabling hotel inventory management and reservation operations with real-time monitoring capabilities. Use when working with: the passkey-sbd repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-sbd`
- **Type**: Java EJB/WildFly + TypeScript/Next.js Hybrid
- **Owner**: Steakholders Team (`#passkey-steak-holders`)
- **DB**: Oracle Database
- **Registry ID**: 81f7ec0d-c69c-47aa-886e-053f7791ed10

## What This Service Does
Provides a web-based dashboard interface for managing sub-block inventory and operations within the Passkey platform. Serves as a critical component in the Passkey for Planners Housing system, enabling hotel inventory management and reservation operations with real-time monitoring capabilities.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Sub-Block Group (SBG) | A subdivision used for planner access control within room blocks |
| Room Block | Parent allocation of rooms from which sub-blocks are carved out |
| Inventory | Total available room capacity at hotel including room types and rates |
| Occupancy Rate | Percentage of available rooms occupied during specific time period |
| Pick-up Rate | Percentage of reserved rooms actually booked by guests |
| Attrition | Difference between committed room block size and actual bookings |
| Cut-off Date | Deadline for guests to book rooms before release to general inventory |
| Rooming List | Detailed list of guests assigned to specific rooms within sub-block |
| Rate Code | Unique identifier for specific room rates and packages |
| Passkey Platform | Comprehensive hotel booking and inventory management system |

## Architecture at a Glance
```
passkey-sbd/
├── Backend (Java EJB/WildFly)
│   ├── EJB Components
│   ├── REST Services
│   └── Database Layer
├── Frontend (TypeScript/Next.js)
│   ├── Dashboard UI
│   ├── Inventory Management
│   └── Real-time Monitoring
└── Build System (Maven + pnpm)

Hybrid: Java EJB Backend + TypeScript/Next.js Frontend → WildFly → Oracle DB
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Sub-Block Management | `/passkey-sbd/v1/sub-blocks` | Create, modify, track room sub-blocks |
| Dashboard Interface | `/passkey-sbd/v1/dashboard` | Web-based UI for inventory visualization |
| Inventory Operations | `/passkey-sbd/v1/inventory` | Room availability, occupancy tracking |
| Reporting | `/passkey-sbd/v1/reports` | Analytics, pick-up rates, attrition |
| Admin Operations | `/passkey-sbd/v1/admin` | System management, configuration |

## Key Business Rules
- Sub-blocks are carved out from parent room block allocations
- Cut-off dates determine when unused rooms return to general inventory
- Occupancy rates calculated as (Occupied Rooms / Total Available Rooms) × 100
- Pick-up rates indicate effectiveness of room block utilization
- Attrition may be subject to contractual penalties
- Rate codes provide unique identifiers for group discounts and packages
- Rooming lists must include guest names and room preferences
- Real-time monitoring ensures accurate inventory tracking
- Multi-environment support for dev, staging, and production deployments

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-authentication-service | User authentication and authorization |
| commerce | Payment and billing operations |
| passkey-gl | General ledger integration |
| passkey-reporting-service | Analytics and reporting |
| passkey-sputnik | Core Passkey services |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-sbd` to browse:
- `src/main/java/com/cvent/passkey/sbd/` — Java EJB components and services
- `frontend/` — TypeScript/Next.js dashboard application
- `scripts/` — Setup and deployment scripts
- `catalog-info.yaml` — Backstage service metadata

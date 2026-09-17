---
name: "passkey-repo-reporting-service"
description: "A Java-based Dropwizard microservice that provides comprehensive reporting capabilities for the Passkey platform. Serves various reporting data including bookings, events, revenue, and statistical information for hotels and event organizers within the Cvent ecosystem. Use when working with: the passkey-reporting repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-reporting`
- **Type**: Java 17 Dropwizard Microservice
- **Owner**: Passkey Team (`#passkey`)
- **DB**: Oracle Database (OLAP)
- **Registry ID**: passkey-reporting

## What This Service Does
A Java-based Dropwizard microservice that provides comprehensive reporting capabilities for the Passkey platform. Serves various reporting data including bookings, events, revenue, and statistical information for hotels and event organizers within the Cvent ecosystem.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Bookings Reporting | Comprehensive booking data with filtering capabilities |
| Revenue Analytics | Detailed revenue tracking including incremental calculations |
| Event Statistics | Statistical data for events including pace and performance |
| Reservation Method Analysis | Insights into how reservations are made |
| Data Aggregation | Combining data across multiple hotels and events |
| Time-based Analytics | Reporting with date range filtering and trends |
| Participant Types | Different categories of event participants |
| Event Categories | Classification system for different event types |
| Pace Data | Performance metrics showing booking velocity |
| Incremental Revenue | Additional revenue generated through Passkey |

## Architecture at a Glance
```
passkey-reporting/
├── passkey-reporting-service/      # Main Dropwizard application
├── passkey-reporting-api/          # Data models and API specifications
├── passkey-reporting-data-access/  # Database operations and queries
├── passkey-reporting-java-client/  # Client library
├── passkey-reporting-shared/       # Shared utilities
└── passkey-reporting-integration-test/ # End-to-end tests
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Bookings Reports | `/{env}/passkey-reporting/v1/bookings` | GET (filtered booking data) |
| Revenue Analytics | `/{env}/passkey-reporting/v1/revenue` | GET (revenue calculations) |
| Event Statistics | `/{env}/passkey-reporting/v1/events/stats` | GET (event performance data) |
| Reservation Methods | `/{env}/passkey-reporting/v1/reservations/methods` | GET (booking method analysis) |
| Health Check | `/healthcheck` | Service health monitoring |

## Key Business Rules
- Booking reports support filtering by date ranges and participant types
- Revenue analytics include incremental revenue calculations
- Event statistics provide pace data and performance metrics
- Reservation method analysis shows booking channel effectiveness
- Data aggregation spans multiple hotels and events
- Time-based analytics enable trend analysis
- Real-time reporting capabilities support operational decisions
- Statistical data helps optimize event performance
- Revenue tracking enables ROI analysis for hotel partners
- Comprehensive filtering supports detailed data analysis

## Service Dependencies

| Service | Purpose |
|---------|---------|
| Oracle Database (OLAP) | Analytical data storage and complex queries |
| Passkey Booking Services | Source data for reservation and booking information |
| Passkey Event Services | Event data for statistical analysis |
| Passkey Payment Services | Revenue and financial data |
| Auth Service | Authentication and authorization |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-reporting` to browse:
- `passkey-reporting-service/src/main/java/` — Main Dropwizard application
- `passkey-reporting-api/src/main/java/` — Data models and API specs
- `passkey-reporting-data-access/src/main/java/` — Database operations
- `passkey-reporting-java-client/src/main/java/` — Client library
- `passkey-reporting-service/configs/` — Environment configurations
- `catalog-info.yaml` — Backstage service metadata

---
name: "passkey-repo-hilton-srp-service"
description: "Manages SRP (Single Rate Plan) mapping between Cvent's Passkey platform and Hilton's reservation system. Pushes event codes to Hilton on an hourly schedule and receives inbound reservations for those events, ensuring synchronized hotel room inventory and reservations. Use when working with: the passkey-hiltonsrp repository; SRP (Single Rate Plan), Event Code, Inbound Reservation, Sync Operation, OAuth Client Credentials."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-hiltonsrp`
- **Type**: Java 21 Dropwizard Multi-Module
- **Owner**: meeseeksbox (`#passkey-meeseeks-box`)
- **DB**: None (integration service)
- **Registry ID**: 23cedbc4-a0d7-4b10-83ba-5bf303f49ff9

## What This Service Does
Manages SRP (Single Rate Plan) mapping between Cvent's Passkey platform and Hilton's reservation system. Pushes event codes to Hilton on an hourly schedule and receives inbound reservations for those events, ensuring synchronized hotel room inventory and reservations.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **SRP (Single Rate Plan)** | Hotel pricing concept where single rate applies to all room types for specific event |
| **Event Code** | Unique identifier for Cvent events, shared with hotel partners for inventory management |
| **Inbound Reservation** | Hotel reservation from Hilton systems synchronized back to Passkey platform |
| **Sync Operation** | Scheduled batch process pushing event codes and retrieving reservations |
| **OAuth Client Credentials** | Server-to-server authentication flow for Hilton API access |
| **SRP Mapping** | Association between Cvent event codes and Hilton rate plan identifiers |
| **Property Code** | Hilton hotel property identifier |
| **Passkey Reservation ID** | Cvent's internal reservation tracking identifier |

## Architecture at a Glance
```
passkey-hiltonsrp/
├── passkey-hiltonsrp-api/          # API contracts and models
├── passkey-hiltonsrp-service/      # Core SRP mapping logic
├── passkey-hiltonsrp-java-client/  # Client library
└── passkey-hiltonsrp-integration-test/ # Integration test suite
```

## API Surface
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/passkey-hiltonsrp/v1/sync` | POST | Manually trigger SRP sync operation |
| `/passkey-hiltonsrp/v1/mappings` | GET | Retrieve current SRP mappings |
| `/passkey-hiltonsrp/v1/reservations` | GET | Get inbound reservations from Hilton |

## Key Business Rules
- Automatically pushes event codes to Hilton endpoints hourly
- Maintains separate credentials for staging and production environments
- Synchronizes inbound reservations from Hilton to Passkey platform
- Maps Cvent event codes to Hilton rate plan identifiers
- Supports multi-environment deployment with environment-specific configurations
- Provides manual trigger capability for sync operations
- Tracks mapping status and synchronization timestamps

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **auth-service** | Authentication tokens for Hilton API calls |
| **passkey-reservation** | Core reservation management service |
| **passkey-inventory** | Hotel inventory management service |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-hiltonsrp` to browse:
- `passkey-hiltonsrp-api/src/main/java/` — API contracts and models
- `passkey-hiltonsrp-service/src/main/java/` — Core SRP mapping logic
- `passkey-hiltonsrp-service/src/main/resources/` — Configuration files
- `passkey-hiltonsrp-java-client/src/main/java/` — Client library
- `passkey-hiltonsrp-integration-test/src/test/java/` — Integration tests
- `catalog-info.yaml` — Backstage service metadata

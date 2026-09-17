---
name: "passkey-repo-hilton-converter-service"
description: "Transforms Hilton EventStays reservation messages from JSON format into Passkey API XML messages. Acts as a critical integration point between Hilton's reservation system and Cvent's Passkey platform, enabling seamless data flow for hotel booking operations. Use when working with: the passkey-hilton-converter repository; Stay Record, Transformation, EventStays, Rate Code, Hotel Code."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-hilton-converter`
- **Type**: Java 21 Dropwizard Multi-Module
- **Owner**: meeseeksbox (`#meeseeksbox`)
- **DB**: None (stateless transformation service)
- **Registry ID**: d1c9ebb3-fa78-4c0a-b8f6-1ac928b22f9f

## What This Service Does
Transforms Hilton EventStays reservation messages from JSON format into Passkey API XML messages. Acts as a critical integration point between Hilton's reservation system and Cvent's Passkey platform, enabling seamless data flow for hotel booking operations.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Stay Record** | Complete reservation record with guest details, dates, room info, and event data |
| **Transformation** | Converting Hilton JSON format to Passkey XML format |
| **EventStays** | Hilton's reservation system for events and group reservations |
| **Rate Code** | Hotel pricing categories (CORP, RACK, etc.) |
| **Hotel Code** | Unique identifier for hotel properties |
| **Event Block** | Group of hotel rooms reserved for an event via Passkey |
| **Reservation Status** | Current state (CONFIRMED, PENDING, CANCELLED, MODIFIED) |
| **API Key Authentication** | Security mechanism using unique keys for API access |

## Architecture at a Glance
```
passkey-hilton-converter/
├── passkey-hilton-converter-api/          # API contracts and models
├── passkey-hilton-converter-service/      # Core transformation logic
├── passkey-hilton-converter-java-client/  # Client library
└── passkey-hilton-converter-integration-test/ # Karate test suite
```

## API Surface
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/passkey-hilton-converter/v1/stayrecords` | POST | Transform Hilton stay records to Passkey XML |
| `/passkey-hilton-converter/v1/logging` | POST | Logging and monitoring endpoint |

## Key Business Rules
- Transforms JSON reservation data from Hilton EventStays to Passkey XML format
- Requires API key authentication for all requests
- Supports batch processing of multiple stay records in single request
- Maintains reservation status mapping between systems
- Preserves all critical reservation data during transformation
- Integrates with Cvent authentication infrastructure
- Provides comprehensive logging for audit trails

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **auth-service** | Authentication and authorization |
| **passkey-api** | Target API for transformed XML messages |
| **passkey-transfer-log** | Logging and audit trail |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-hilton-converter` to browse:
- `passkey-hilton-converter-api/src/main/java/` — API contracts and models
- `passkey-hilton-converter-service/src/main/java/` — Core transformation logic
- `passkey-hilton-converter-service/src/main/resources/` — Configuration files
- `passkey-hilton-converter-java-client/src/main/java/` — Client library
- `passkey-hilton-converter-integration-test/src/test/java/` — Integration tests
- `catalog-info.yaml` — Backstage service metadata

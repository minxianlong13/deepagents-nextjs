---
name: "passkey-repo-vendor-service"
description: "The Passkey Vendor Service manages vendor and vendor system entities within the Cvent Passkey platform. It provides centralized access to vendor system configurations, hotel mappings, and message type management, serving as the authoritative source for vendor system metadata and hotel-to-vendor system relationships. Use when working with: the passkey-vendor repository; Vendor System, Hotel Connector, Message Type, Transporter Parameters, Vendor Assignment."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-vendor`
- **Type**: Java 21 RAML-based Multi-Module
- **Owner**: Meeseeks Box team (`#passkey-api`)
- **DB**: Oracle Database
- **Registry ID**: passkey-vendor-service

## What This Service Does
The Passkey Vendor Service manages vendor and vendor system entities within the Cvent Passkey platform. It provides centralized access to vendor system configurations, hotel mappings, and message type management, serving as the authoritative source for vendor system metadata and hotel-to-vendor system relationships.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Vendor System** | External hotel technology platform (PMS/CRS) |
| **Hotel Connector** | Mapping between hotels and vendor systems |
| **Message Type** | Partner integration message format definitions |
| **Transporter Parameters** | Configuration for data transport and retry logic |
| **Vendor Assignment** | Process of linking hotels to vendor systems |
| **System Configuration** | Vendor-specific settings and metadata |
| **Partner Integration** | Connection with external hotel technology vendors |
| **Hotel Mapping** | Relationship between Cvent hotels and vendor systems |
| **Connector Management** | Administration of hotel-vendor relationships |
| **API Versioning** | Support for v1 and v2 API endpoints |

## Architecture at a Glance
```
passkey-vendor/
├── passkey-vendor-api/              # RAML API definitions
├── passkey-vendor-service/          # Core service implementation
├── passkey-vendor-data-access/      # Database access layer
├── passkey-vendor-java-client/      # Java client library
└── passkey-vendor-integration-test/ # Karate API tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Vendor Systems** | `/vendor-systems` | Retrieve by ID, hotel ID, search |
| **Hotel Connectors** | `/hotel-connectors` | Manage hotel-vendor mappings |
| **Message Types** | `/message-types` | Partner message type configurations |
| **Assignments** | `/assignments` | Assign/unassign hotels to vendor systems |
| **System Search** | `/search` | Query vendor systems by criteria |
| **Configuration** | `/config` | Vendor system settings and parameters |

## Key Business Rules
- Each hotel can be mapped to multiple vendor systems for different purposes
- Vendor system assignments require proper authorization and validation
- Message types define the communication protocols with partner systems
- Transporter parameters control retry logic and error handling for integrations
- Hotel connector configurations must include all required vendor-specific settings
- API versioning ensures backward compatibility for existing integrations
- Optional extra data parameters optimize performance by reducing unnecessary data fetching

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **Auth Service** | Authentication and authorization (v28.4.1) |
| **Passkey Microservices Common** | Shared utilities (v1.4.12) |
| **Passkey Transfer Log** | Logging client (v1.10.3) |
| **Oracle Database** | Persistent data storage |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-vendor` to browse:
- `passkey-vendor-service/src/main/java/` — Core service implementation
- `passkey-vendor-api/src/main/java/` — RAML API definitions and models
- `passkey-vendor-data-access/src/main/java/` — Database access layer
- `passkey-vendor-integration-test/src/test/java/` — Karate API tests
- `pom.xml` — Maven build configuration
- `catalog-info.yaml` — Backstage service metadata

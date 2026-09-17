---
name: "passkey-repo-inbound-service"
description: "Handles inbound integrations with vendor hotel management systems for Cvent's Passkey platform. Processes real-time business events, manages GraphQL subscriptions, handles external data loads, and routes events to downstream Passkey services. Use when working with: the passkey-inbound-service repository; Business Event, External Data Load Event, GML (Guest Management Layer), Hotel Configuration, Inbound Integration."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-inbound-service`
- **Type**: Spring Boot Multi-Module (Java 17)
- **Owner**: Meeseeksbox team (`#passkey-api`)
- **DB**: DynamoDB (configurations), SQS (messaging)
- **Registry ID**: passkey-inbound-service

## What This Service Does
Handles inbound integrations with vendor hotel management systems for Cvent's Passkey platform. Processes real-time business events, manages GraphQL subscriptions, handles external data loads, and routes events to downstream Passkey services.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Business Event** | Structured message from hotel systems (reservation, inventory changes) |
| **External Data Load Event** | Batch synchronization for bulk data processing |
| **GML (Guest Management Layer)** | Standardized interface for guest-related operations |
| **Hotel Configuration** | Dynamic settings controlling inbound data processing |
| **Inbound Integration** | Process of receiving/validating data from vendor systems |
| **Mapping Codes** | Translation rules converting vendor codes to Passkey codes |
| **OHIP** | Oracle Hospitality Integration Platform for hotel systems |
| **Passkey Platform** | Cvent's hotel booking and inventory management platform |
| **Subscription Management** | Real-time data subscriptions and webhook configurations |
| **Vendor System** | External HMS/PMS integrating with Passkey |
| **Vendor System ID (vsId)** | Unique identifier for vendor system integrations |

## Architecture at a Glance
```
passkey-inbound-service/
├── packages/
│   └── passkey-inbound/
│       ├── service/                  # Main Spring Boot application
│       ├── model/                    # Shared data models and DTOs
│       ├── java-client/              # Client library
│       ├── integration-test/         # Integration test suite
│       ├── mock-service/             # Third-party system simulator
│       └── lambda-handler/           # AWS Lambda event processing
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Business Events** | `/passkey-inbound/v1/events` | Process vendor system events |
| **Data Loads** | `/passkey-inbound/v1/loads` | Handle batch data synchronization |
| **Configurations** | `/passkey-inbound/v1/config` | Manage hotel integration settings |
| **GraphQL** | `/graphql` | Real-time subscriptions and queries |
| **Health** | `/actuator/health` | Service health and readiness |

## Key Business Rules
- Business events processed asynchronously via SQS messaging
- Hotel configurations stored in DynamoDB for dynamic processing
- Mapping codes translate vendor-specific identifiers to Passkey standards
- GraphQL subscriptions enable real-time data synchronization
- External data loads support bulk synchronization operations
- Vendor system IDs route events to appropriate processing logic
- OHIP integration provides standardized hotel system connectivity
- Mock service enables testing without live vendor systems

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **passkey-inventory** | Hotel inventory management integration |
| **passkey-reservation** | Reservation processing and orchestration |
| **passkey-event** | Event data management operations |
| **passkey-vendor** | Vendor system management |
| **passkey-transfer-log** | Data transfer logging and auditing |
| **passkey-core-mapper** | Data transformation and mapping |
| **AWS SQS** | Asynchronous message processing |
| **AWS DynamoDB** | Configuration and state management |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-inbound-service` to browse:
- `packages/passkey-inbound/service/src/main/java/` — Main Spring Boot service
- `packages/passkey-inbound/model/src/main/java/` — Shared data models
- `packages/passkey-inbound/java-client/src/main/java/` — Client library
- `packages/passkey-inbound/lambda-handler/src/main/java/` — AWS Lambda functions
- `packages/passkey-inbound/mock-service/` — Third-party system simulator

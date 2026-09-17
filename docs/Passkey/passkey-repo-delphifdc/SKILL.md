---
name: "passkey-repo-delphi-fdc-service"
description: "The Passkey Delphi FDC Service serves as the critical integration layer that receives event notifications from Amadeus Delphi FDC system, processes and transforms notification data into GML format, and forwards processed events to Passkey services. Delphi.fdc is an end-to-end sales and catering solution designed for organizations that sell and manage meeting and event space. Use when working with: the passkey-delphifdc repository; Delphi FDC, GML Integration, Event Notifications, Amadeus Integration, Notification Processing."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-delphifdc`
- **Type**: Java 21 Dropwizard Microservice
- **Owner**: meeseeksbox (`#passkey-meeseeksbox`)
- **DB**: DynamoDB
- **Registry ID**: ff9d9f79-0bc6-4067-a135-10cc200e784a

## What This Service Does
The Passkey Delphi FDC Service serves as the critical integration layer that receives event notifications from Amadeus Delphi FDC system, processes and transforms notification data into GML format, and forwards processed events to Passkey services. Delphi.fdc is an end-to-end sales and catering solution designed for organizations that sell and manage meeting and event space.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Delphi FDC** | End-to-end sales and catering solution for meeting and event space management |
| **GML Integration** | Guest Management Language format for event data transformation |
| **Event Notifications** | Notifications received from Amadeus system about event changes |
| **Amadeus Integration** | Connection to external Amadeus system for event data |
| **Notification Processing** | Asynchronous processing of event notifications |
| **Background Processor** | Scheduled execution system for notification handling |
| **Emulation Endpoints** | Testing and debugging capabilities for integration |
| **DynamoDB Storage** | Persistent storage for notifications, tasks, logs, and errors |

## Architecture at a Glance
```
passkey-delphifdc/
├── passkey-delphifdc-api/                # API models and contracts
├── passkey-delphifdc-service/            # Main Dropwizard service
│   ├── src/main/java/                   # Java source code
│   ├── src/main/resources/              # Configuration files
│   └── configs/                         # Environment configurations
├── passkey-delphifdc-data-access/       # Database and external service interactions
├── passkey-delphifdc-java-client/       # Client libraries
├── passkey-delphifdc-shared/            # Common utilities
└── passkey-delphifdc-integration-test/  # Karate integration tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Event Notifications** | `/notifications` | Receive and process Amadeus event notifications |
| **GML Integration** | `/gml` | Transform and forward GML formatted data |
| **Processing Status** | `/status` | Monitor notification processing status |
| **Emulation** | `/emulate` | Testing and debugging endpoints |
| **Health Check** | `/admin/healthcheck` | Service health monitoring |

## Key Business Rules
- Event notifications from Amadeus must be processed and transformed into GML format
- Notification processing is asynchronous with background scheduled execution
- All processed events must be forwarded to appropriate Passkey services
- DynamoDB stores notifications, processing tasks, logs, and error records
- Authentication is required for all API access through Cvent auth service
- Emulation endpoints are available for testing and debugging integration
- Multi-environment configuration supports different deployment scenarios

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **Auth Service** | Authentication and authorization |
| **Passkey Event Housing Service** | Event housing data management |
| **Amadeus Integration Service** | External Amadeus system integration |
| **CSN IBK Config SKU Service** | Configuration management |
| **Passkey API** | Target system for processed events |
| **DynamoDB** | Data persistence layer |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-delphifdc` to browse:
- `passkey-delphifdc-service/src/main/java/` — Java source code and resources
- `passkey-delphifdc-service/src/main/resources/` — Configuration files
- `passkey-delphifdc-service/configs/` — Environment configurations
- `passkey-delphifdc-api/` — API models and contracts
- `catalog-info.yaml` — Backstage service metadata

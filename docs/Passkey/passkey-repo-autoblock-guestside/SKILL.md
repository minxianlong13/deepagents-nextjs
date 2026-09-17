---
name: "passkey-repo-autoblock-guestside-service"
description: "The Passkey Autoblock Guestside Service acts as a bridge between the guest-facing autoblock UI and the underlying Passkey microservices ecosystem. It serves Nucleus Views instead of traditional JSON responses, providing a seamless web experience for hotel guests interacting with autoblock surveys and room selection interfaces. Use when working with: the passkey-autoblock-guestside repository; Autoblock Survey, Nucleus Views, Gateway Service, Guest-side Interface, Room Selection."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-autoblock-guestside`
- **Type**: Java 17 Dropwizard Microservice with Web UI
- **Owner**: metre-stick (`#passkey-metre-stick`)
- **DB**: None (Gateway service)
- **Registry ID**: 7994d060-b69d-4ee6-a8b3-b851dfc52fe4

## What This Service Does
The Passkey Autoblock Guestside Service acts as a bridge between the guest-facing autoblock UI and the underlying Passkey microservices ecosystem. It serves Nucleus Views instead of traditional JSON responses, providing a seamless web experience for hotel guests interacting with autoblock surveys and room selection interfaces.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Autoblock Survey** | Guest-facing survey for room blocking and selection |
| **Nucleus Views** | Web UI templating system for serving HTML pages |
| **Gateway Service** | Service that aggregates data from multiple backend services |
| **Guest-side Interface** | User-facing web interface for hotel guests |
| **Room Selection** | Interface for guests to select and block rooms |
| **Survey Website Creation** | Functionality to create autoblock survey websites |
| **Data Aggregation** | Fetching and combining data from multiple Passkey services |
| **Rate Limiting** | Built-in request throttling and error handling |

## Architecture at a Glance
```
passkey-autoblock-guestside/
├── passkey-autoblock-guestside-api/          # API models and interfaces
├── passkey-autoblock-guestside-service/      # Main Dropwizard service
│   ├── src/main/java/                       # Java source code
│   ├── src/main/resources/                  # Configuration and templates
│   └── configs/                             # Environment configurations
├── passkey-autoblock-guestside-java-client/ # Java client library
└── passkey-autoblock-guestside-integration-test/ # Integration tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Autoblock UI** | `/autoblock` | Guest-facing autoblock survey pages |
| **Survey Management** | `/survey` | Survey creation and management |
| **Room Selection** | `/rooms` | Room blocking and selection interface |
| **Data Gateway** | `/api` | Aggregated data from backend services |
| **Health Check** | `/admin/healthcheck` | Service health monitoring |

## Key Business Rules
- Serves Nucleus Views for seamless web experience instead of JSON responses
- Aggregates data from multiple Passkey backend services for unified UI
- Provides guest-facing interface for autoblock survey interactions
- Integrates with Cvent's auth-service for secure access
- Implements rate limiting and error handling for stability
- Supports autoblock survey website creation workflows
- Maintains integration with Site Designer for survey customization

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **passkey-autoblock-autoprovision** | Autoblock provisioning functionality |
| **passkey-autoblock-data-service** | Core autoblock data management |
| **passkey-autoblock-nx** | Autoblock NX integration |
| **passkey-business-text-service** | Business text and localization |
| **passkey-event-service** | Event management |
| **passkey-hotel-service** | Hotel information and management |
| **passkey-inventory-service** | Room inventory management |
| **passkey-planner-portal** | Planner portal integration |
| **passkey-room-type-data-service** | Room type data management |
| **passkey-smartcamp-cfg-data-service** | SmartCamp configuration |
| **auth-service** | Authentication and authorization |

## User Interface
The service provides a web-based guest interface using Nucleus Views:
- **Autoblock Survey Pages** - Guest-facing survey forms and interfaces
- **Room Selection Interface** - Interactive room blocking and selection
- **Survey Website Creation** - Tools for creating autoblock survey websites
- **Site Designer Integration** - Custom survey design capabilities

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards
- `docs/UI.md` — UI pages, user flows, navigation structure

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-autoblock-guestside` to browse:
- `passkey-autoblock-guestside-service/src/main/java/` — Java source code and resources
- `passkey-autoblock-guestside-service/src/main/resources/` — Templates and configuration
- `passkey-autoblock-guestside-service/configs/` — Environment configurations
- `passkey-autoblock-guestside-api/` — API models and interfaces
- `catalog-info.yaml` — Backstage service metadata

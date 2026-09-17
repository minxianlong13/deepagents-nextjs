---
name: "passkey-repo-bridge-service"
description: "The Passkey Bridge Service bridges the gap between event registration systems and hotel reservation systems by managing bridge registration numbers and their lifecycle, linking bridge registrations to hotel reservations, and providing registration data for downstream systems. Use when working with: the passkey-bridge repository; Bridge Registration, Registration Lifecycle, Association Management, Reservation Counting, Sub-block Group."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-bridge`
- **Type**: Java 21 Dropwizard Microservice
- **Owner**: meeseeksbox (`#passkey-meeseeksbox`)
- **DB**: Database for registration data
- **Registry ID**: 64396d9d-3c49-45ae-b6b2-b2e3a2f0ef27

## What This Service Does
The Passkey Bridge Service bridges the gap between event registration systems and hotel reservation systems by managing bridge registration numbers and their lifecycle, linking bridge registrations to hotel reservations, and providing registration data for downstream systems.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Bridge Registration** | Registration record that connects event registrations to hotel reservations |
| **Registration Lifecycle** | Complete process from creation to cancellation of bridge registrations |
| **Association Management** | Linking and unlinking bridge registrations with hotel reservations |
| **Reservation Counting** | Tracking unconfirmed reservation counts by event and sub-block group |
| **Sub-block Group** | Grouping mechanism for organizing reservations within events |
| **Registration Number** | Unique identifier for bridge registrations |
| **API Key Authentication** | Security mechanism for endpoint access |
| **Karate Testing** | Integration testing framework used for comprehensive testing |

## Architecture at a Glance
```
passkey-bridge/
├── passkey-bridge-api/                    # API models and interfaces
├── passkey-bridge-service/                # Main Dropwizard service
│   ├── src/main/java/                    # Java source code
│   ├── src/main/resources/               # Configuration files
│   └── configs/                          # Environment configurations
├── passkey-bridge-java-client/           # Java client library
└── passkey-bridge-integration-test/      # Karate integration tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Registration Management** | `/registrations` | Create, read, update, cancel bridge registrations |
| **Association Management** | `/associations` | Link and unlink registrations with reservations |
| **Reservation Counting** | `/counts` | Track unconfirmed reservation counts |
| **Health Check** | `/admin/healthcheck` | Service health monitoring |

## Key Business Rules
- Bridge registrations must have unique registration numbers
- Registrations can be linked to multiple hotel reservations
- Registration lifecycle includes creation, updates, and cancellation states
- Reservation counts are tracked by event and sub-block group
- API key authentication is required for all endpoints
- Registration data must be consistent across associated reservations
- Cancellation of bridge registrations affects downstream systems

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **Auth Service** | API key authentication and authorization |
| **Passkey Microservices Common** | Shared utilities and configurations |
| **Passkey Reservation** | Hotel reservation management |
| **Passkey Payment** | Payment processing integration |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-bridge` to browse:
- `passkey-bridge-service/src/main/java/` — Java source code and resources
- `passkey-bridge-service/src/main/resources/` — Configuration files
- `passkey-bridge-service/configs/` — Environment configurations
- `passkey-bridge-api/` — API models and interfaces
- `catalog-info.yaml` — Backstage service metadata

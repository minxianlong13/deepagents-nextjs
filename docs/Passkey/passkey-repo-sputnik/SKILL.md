---
name: "passkey-repo-sputnik"
description: "Passkey Sputnik handles reservation transfer operations for integrations with vendor systems using synchronous API communication. It serves as a critical component facilitating seamless data exchange between Cvent's reservation system and external hotel vendor platforms including Amadeus, DerbySoft, Hilton, OHIP, and Shiji. Use when working with: the passkey-sputnik repository; Transfer, Vendor System, Callback, Step Function, EventBridge."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-sputnik`
- **Type**: TypeScript AWS CDK Application
- **Owner**: steakholders team (`#passkey-api`)
- **DB**: DynamoDB
- **Registry ID**: passkey-sputnik

## What This Service Does
Passkey Sputnik handles reservation transfer operations for integrations with vendor systems using synchronous API communication. It serves as a critical component facilitating seamless data exchange between Cvent's reservation system and external hotel vendor platforms including Amadeus, DerbySoft, Hilton, OHIP, and Shiji.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Transfer** | Process of sending reservation data to vendor systems |
| **Vendor System** | External hotel PMS/CRS platforms (Amadeus, Hilton, etc.) |
| **Callback** | Asynchronous response from vendor systems |
| **Step Function** | AWS orchestration service managing transfer workflows |
| **EventBridge** | AWS event routing service for decoupled communication |
| **Bulk Transfer** | Large-scale reservation transfer operations |
| **Transfer State** | Current status of a reservation transfer operation |
| **Audit Trail** | Comprehensive logging of transfer operations |
| **JWT Token** | Authentication mechanism for API security |
| **Scheduled Transfer** | Queued transfers processed at specific times |

## Architecture at a Glance
```
passkey-sputnik/
├── lib/                    # CDK infrastructure code
│   ├── stacks/            # AWS stack definitions
│   ├── constructs/        # Reusable CDK constructs
│   └── lambdas/           # Lambda function implementations
├── test/                  # Unit and integration tests
├── docs/                  # Documentation
└── local/                 # Local development utilities
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Transfer Operations** | `/transfers` | Create, update, query transfers |
| **Vendor Callbacks** | `/callbacks` | Process vendor responses |
| **Bulk Operations** | `/bulk` | Handle large-scale transfers |
| **Health & Status** | `/health` | Service health monitoring |

## Key Business Rules
- All transfers must include valid reservation and vendor system identifiers
- Callbacks are processed asynchronously through SQS queues
- Failed transfers are automatically retried with exponential backoff
- Transfer audit logs are maintained for compliance and troubleshooting
- JWT authentication is required for all API operations
- Bulk transfers are processed in batches to prevent system overload
- Vendor-specific transfer formats are handled through configurable mappings

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **passkey-reservation-service** | Source of reservation data |
| **passkey-payment-service** | Payment processing integration |
| **passkey-vendor-service** | Vendor configuration management |
| **passkey-transfer-log-service** | Transfer audit logging |
| **auth-service** | Authentication and authorization |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-sputnik` to browse:
- `lib/` — CDK infrastructure and Lambda implementations
- `test/` — Unit and integration tests
- `package.json` — Dependencies and build scripts
- `cdk.json` — CDK configuration
- `catalog-info.yaml` — Backstage service metadata

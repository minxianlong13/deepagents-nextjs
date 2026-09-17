---
name: "passkey-repo-ecommerce-service"
description: "Serves as a legacy bridge service providing synchronous API compatibility for legacy Commerce systems. Wraps asynchronous PBB calls in synchronous interfaces to handle legacy reservation payment workflows and ecommerce transactions for hotel reservations. Use when working with: the passkey-ecommerce repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-ecommerce`
- **Type**: Java 17 Dropwizard Multi-Module (Deprecated/Bridge Service)
- **Owner**: Steakholders Team (`#passkey-steak-holders`)
- **DB**: Oracle Database
- **Registry ID**: b2f99589-fdea-42ee-b378-ca1408936e5f

## What This Service Does
Serves as a legacy bridge service providing synchronous API compatibility for legacy Commerce systems. Wraps asynchronous PBB calls in synchronous interfaces to handle legacy reservation payment workflows and ecommerce transactions for hotel reservations.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Authorization | Hold placed on funds in a payment method without capturing money |
| Bridge Service | Service providing compatibility between different system architectures |
| Capture | Process of collecting funds from a previously authorized payment method |
| Commerce | Legacy Cvent commerce system handling hotel reservation transactions |
| Ecommerce Transaction | Complete payment transaction including authorization, capture, refunds, voids |
| Legacy System | Older Cvent systems requiring synchronous API interactions |
| PBB | Passkey Business Backend - modern asynchronous backend system |
| Payment Gateway | External service processing payment transactions with processors |
| Reservation | Hotel booking made through Passkey system requiring payment processing |
| Transaction | Single payment operation with unique identifier and status |
| Void | Cancellation of previously authorized payment before capture |

## Architecture at a Glance
```
passkey-ecommerce/
├── passkey-ecommerce-api/        # API contracts and OpenAPI specifications
├── passkey-ecommerce-service/    # Main service with REST resources
├── passkey-ecommerce-data-access/ # Data access layer
└── passkey-ecommerce-shared/     # Shared utilities and models

Legacy Commerce → Ecommerce Service (Bridge) → PBB/Payment Services
                        ↓
                 Cvent Payment Gateway
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Ecommerce Operations | `/passkey-ecommerce/v1/ecommerce` | Payment processing, transactions |
| Admin Operations | `/passkey-ecommerce/v1/admin` | System management, monitoring |
| Legacy Bridge | `/passkey-ecommerce/v1/bridge` | Synchronous wrappers for PBB calls |

## Key Business Rules
- Service is deprecated - core functionality migrated to passkey-payment-service
- Provides synchronous API compatibility for legacy Commerce systems
- Authorizations typically expire after 7 days if not captured
- All payment operations must go through Cvent Payment Gateway
- Transactions require unique identifiers and proper status tracking
- Bridge operations convert asynchronous PBB calls to synchronous responses
- Legacy systems cannot be easily modified for modern asynchronous architectures
- Payment methods must be validated before processing transactions

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-payment-service | Primary payment processing service |
| passkey-commerce | Legacy commerce system integration |
| auth-service | Authentication and authorization |
| cvent-payment-api | Payment gateway integration |
| PBB Services | Modern asynchronous backend operations |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-ecommerce` to browse:
- `passkey-ecommerce-service/src/main/java/com/cvent/passkey/ecommerce/resources/` — REST endpoints
- `passkey-ecommerce-data-access/src/main/java/com/cvent/passkey/ecommerce/dao/` — Data access layer
- `passkey-ecommerce-shared/src/main/java/com/cvent/passkey/ecommerce/model/` — Domain models
- `passkey-ecommerce-api/src/main/resources/` — OpenAPI specifications
- `catalog-info.yaml` — Backstage service metadata

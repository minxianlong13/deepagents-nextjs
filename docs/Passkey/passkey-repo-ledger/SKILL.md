---
name: "passkey-repo-ledger-service"
description: "Controls processing and storage of payment operations within the Cvent Passkey platform. Serves as the central ledger system for managing financial tracking of room block commitments, deposits, transactions, credit card operations, and payment balances for hotel reservations and related services. Use when working with: the passkey-ledger repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-ledger`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Steakholders Team (`#passkey-steak-holders`)
- **DB**: Oracle Database
- **Registry ID**: 6c5bab3d-9bea-4cfa-a715-e97b8317b4f7

## What This Service Does
Controls processing and storage of payment operations within the Cvent Passkey platform. Serves as the central ledger system for managing financial tracking of room block commitments, deposits, transactions, credit card operations, and payment balances for hotel reservations and related services.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Balance | Current financial standing of an account holder (credit or debit) |
| Card Association | Payment network processing credit card transactions (Visa, MasterCard, etc.) |
| Credit Card Verification | Validation of card information without processing payment |
| Ledger Operation | Fundamental accounting entry recording financial transactions related to room block commitments, deposits, and hotel reservation payments |
| Owner | Entity holding a balance or account (organizational entities, properties, merchants) |
| PBB | Pay By Bank - payment method using direct bank account transfers |
| SBG | Subblock Group - collection of hotel room inventory managed as single unit |
| Transaction | Complete financial exchange consisting of multiple operations |
| Wallet Token | Secure representation of payment information in digital wallet |
| Operation | Individual ledger entry representing transaction component |

## Architecture at a Glance
```
passkey-ledger/
├── passkey-ledger-api/           # API contracts and OpenAPI specifications
├── passkey-ledger-service/       # Main service with REST resources
├── passkey-ledger-data-access/   # Data access layer and database operations
└── passkey-ledger-shared/        # Shared utilities and models

External Clients → REST API Layer → Service Layer → Data Access Layer → Oracle DB/External APIs
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Balance Management | `/passkey-ledger/v1/balances` | Balance tracking, account management |
| Credit Card Operations | `/passkey-ledger/v1/credit-cards` | Card verification, validation |
| Ledger Operations | `/passkey-ledger/v1/operations` | Transaction recording, ledger entries |
| Payment Processing | `/passkey-ledger/v1/payments` | Payment operations, transaction handling |
| SBG Operations | `/passkey-ledger/v1/sbg` | Subblock Group credit card management |
| PBB Callbacks | `/passkey-ledger/v1/pbb` | Pay By Bank callback handling |
| Admin Operations | `/passkey-ledger/v1/admin` | System management, monitoring |

## Key Business Rules
- All ledger operations must balance according to double-entry bookkeeping principles
- Credit card verification validates information without processing payments
- Balances can be positive (credit) or negative (debit) depending on account type
- Each card association (Visa, MasterCard, etc.) has specific processing requirements
- Wallet tokens provide secure payment processing without exposing card details
- SBG credit card operations may have special handling requirements
- PBB payments allow direct bank account transfers without credit cards
- All financial operations require comprehensive audit trails
- Optimistic locking prevents concurrent balance update conflicts

## Service Dependencies

| Service | Purpose |
|---------|---------|
| auth-service | Authentication and authorization |
| cvent-payment-api | Core payment processing |
| passkey-ecommerce-service | E-commerce operations |
| payments-wallet-service | Secure payment token management |
| webpayments-validator | Payment validation services |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-ledger` to browse:
- `passkey-ledger-service/src/main/java/com/cvent/passkey/ledger/resources/` — REST endpoints
- `passkey-ledger-data-access/src/main/java/com/cvent/passkey/ledger/dao/` — Data access layer
- `passkey-ledger-shared/src/main/java/com/cvent/passkey/ledger/model/` — Domain models
- `passkey-ledger-api/src/main/resources/` — OpenAPI specifications
- `catalog-info.yaml` — Backstage service metadata

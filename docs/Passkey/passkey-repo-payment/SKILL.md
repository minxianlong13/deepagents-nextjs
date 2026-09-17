---
name: "passkey-repo-payment-service"
description: "Calculates pricing and manages payments for hotel reservations created using the Reservation Orchestrator. Serves as the central payment processing hub within the Passkey ecosystem, handling pricing calculations, payment processing, and wallet management for hotel bookings. Use when working with: the passkey-payment repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-payment`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Steakholders Team (`#passkey-steak-holders`)
- **DB**: Oracle Database
- **Registry ID**: 51ad2f0e-3de6-4b61-b219-ffbb890515ab

## What This Service Does
Calculates pricing and manages payments for hotel reservations created using the Reservation Orchestrator. Serves as the central payment processing hub within the Passkey ecosystem, handling pricing calculations, payment processing, and wallet management for hotel bookings. Integrates with PBB (Payment Black Box) for payment gateway operations.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Payment Processing | Complete payment lifecycle management for hotel reservations |
| Pricing Calculations | Dynamic pricing based on rates, dates, and room types |
| Wallet Management | Integration with payment wallet services for secure storage |
| Group Payments | Support for group booking payment scenarios |
| Commerce Integration | E-commerce functionality for hotel bookings |
| Rate Management | Hotel rate calculations and management |
| Tokenization | Secure payment method tokenization |
| Payment Gateway | External service processing payment transactions |
| Payment Lifecycle | Complete process from authorization to settlement |
| Dynamic Pricing | Real-time pricing based on multiple factors |
| Payment Wallet | Secure storage for payment methods and tokens |
| Merchant Account | Event-specific payment processing configuration with CVV2 and billing address settings |
| Split Folio | Multiple payment methods for a single reservation |
| Guarantee Plan | Payment and guarantee requirements for reservations (Guest Credit Card, Guest Other Payment, Master Guarantee) |
| PBB Integration | Payment Black Box integration for payment gateway operations |

## Architecture at a Glance
```
passkey-payment/
├── passkey-payment-api/           # API contracts and OpenAPI specifications
├── passkey-payment-service/       # Main service with REST resources
├── passkey-payment-data-access/   # Data access layer
└── passkey-payment-shared/        # Shared utilities and models

Reservation Orchestrator → Payment Service → Payment Gateways/Wallets → Oracle DB
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Payment Processing | `/passkey-payment/v1/payments` | Payment lifecycle management |
| Pricing Calculations | `/passkey-payment/v1/pricing` | Dynamic pricing and rate calculations |
| Wallet Management | `/passkey-payment/v1/wallets` | Payment wallet operations |
| Group Payments | `/passkey-payment/v1/groups` | Group booking payment scenarios |
| Commerce Operations | `/passkey-payment/v1/commerce` | E-commerce functionality |
| Rate Management | `/passkey-payment/v1/rates` | Hotel rate calculations |
| Admin Operations | `/passkey-payment/v1/admin` | Administrative tools |
| Tokenization | `/passkey-payment/v1/tokens` | Secure payment method tokenization |

## Key Business Rules
- Pricing calculations are dynamic based on rates, dates, and room types
- Payment processing handles complete lifecycle from authorization to settlement
- Wallet management provides secure payment method storage and tokenization
- Group payments support complex multi-room booking scenarios
- Rate management ensures accurate hotel pricing calculations
- Commerce integration enables e-commerce functionality for bookings
- Tokenization secures sensitive payment information
- Admin operations provide tools for payment management and monitoring
- All payment operations must comply with PCI DSS requirements
- Payment gateways handle actual transaction processing via PBB (Payment Black Box)
- Merchant accounts provide event-specific payment configuration including CVV2 collection and billing address verification
- Split folio functionality allows multiple payment methods per reservation
- Guarantee plans determine payment requirements (Guest Credit Card, Guest Other Payment, Master Guarantee)

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-reservation-saga | Reservation orchestration |
| passkey-event-service | Event management and notifications |
| passkey-hotel-service | Hotel information and inventory |
| payments-wallet-service | Payment method storage and management |
| auth-service | Authentication and authorization |
| payment-gateways | External payment processing |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-payment` to browse:
- `passkey-payment-service/src/main/java/com/cvent/passkey/payment/resources/` — REST endpoints
- `passkey-payment-data-access/src/main/java/com/cvent/passkey/payment/dao/` — Data access layer
- `passkey-payment-shared/src/main/java/com/cvent/passkey/payment/model/` — Domain models
- `passkey-payment-api/src/main/resources/` — OpenAPI specifications
- `catalog-info.yaml` — Backstage service metadata

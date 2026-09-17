---
name: "passkey-repo-commerce"
description: "Processes commerce charges from legacy applications and provides EJBs for connecting to external payment systems. Acts as a bridge between legacy Passkey applications and modern payment processing systems, handling authorization, capture, and refund operations through Cvent's shared Payment Black Box (PBB) service. Use when working with: the passkey-commerce repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-commerce`
- **Type**: Java 17 WildFly EJB/EAR Multi-Module
- **Owner**: Steakholders Team (`#passkey-steak-holders`)
- **DB**: Oracle Database
- **Registry ID**: Not specified in docs

## What This Service Does
Processes commerce charges from legacy applications and provides EJBs for connecting to external payment systems. Acts as a bridge between legacy Passkey applications and modern payment processing systems, handling authorization, capture, and refund operations through Cvent's shared Payment Black Box (PBB) service.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Commerce Operations | Processing of commerce charges from legacy applications |
| EJB | Enterprise JavaBeans providing enterprise-grade transaction processing |
| Payment Authorization | Initial approval of payment without capturing funds |
| Payment Capture | Actual collection of authorized funds |
| Payment Refund | Return of previously captured funds to customer |
| Payment Gateway | External service processing payment transactions |
| Merchant Account | Business account for accepting credit card payments |
| PBB | Payment Black Box - Cvent's shared payment processing service |
| Legacy Integration | Bridge between old applications and modern payment systems |
| Scheduled Processing | Automated processing running every 3 minutes |

## Architecture at a Glance
```
passkey-commerce/
├── core/                    # Shared domain models, utilities, data access
├── group-commerce-ejb/      # Business logic and EJB implementations
└── group-commerce-ear/      # Enterprise application archive for deployment

Legacy Applications → Commerce EJBs → Payment Gateways → PBB Service
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Payment Authorization | `/commerce/v1/authorize` | Payment authorization operations |
| Payment Capture | `/commerce/v1/capture` | Payment capture operations |
| Payment Refund | `/commerce/v1/refund` | Payment refund operations |
| Merchant Management | `/commerce/v1/merchants` | Merchant account management |
| Scheduled Processing | `/commerce/v1/scheduler` | Automated transaction processing |
| Admin Operations | `/commerce/v1/admin` | System management and monitoring |

## Key Business Rules
- Scheduled processing runs every 3 minutes for refunds and captures
- Supports multiple payment gateways (Authorize.NET, Stripe, CPS)
- EJB-based architecture provides enterprise-grade transaction processing
- Legacy system integration maintains compatibility with existing applications
- Payment operations follow standard authorization, capture, refund lifecycle
- Merchant accounts must be properly configured for each payment gateway
- All transactions require proper audit trails and compliance tracking
- PBB service handles shared payment processing functionality
- WildFly deployment with port offset of 100 (default port 8180)

## Service Dependencies

| Service | Purpose |
|---------|---------|
| Payment Black Box (PBB) | Shared Cvent payment processing service |
| passkey-ecommerce-service | E-commerce functionality service |
| passkey-gl | General ledger service |
| Authorize.NET | Payment gateway integration |
| Stripe | Payment gateway integration |
| Cvent Payment Service (CPS) | Internal payment processing |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-commerce` to browse:
- `core/src/main/java/com/cvent/passkey/commerce/` — Shared domain models and utilities
- `group-commerce-ejb/src/main/java/com/cvent/passkey/commerce/` — EJB implementations
- `group-commerce-ear/` — Enterprise application archive configuration
- `catalog-info.yaml` — Backstage service metadata

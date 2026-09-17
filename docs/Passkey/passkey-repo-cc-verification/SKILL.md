---
name: "passkey-repo-credit-card-verification"
description: "A TypeScript-based AWS Lambda service that provides real-time credit card verification functionality for Passkey hotel reservation systems. Operates as a WebSocket API that validates credit cards collected through PBR (Property Booking Request) surveys. Use when working with: the passkey-cc-verification repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-cc-verification`
- **Type**: TypeScript AWS Lambda WebSocket Service
- **Owner**: Passkey Team (`#passkey`)
- **DB**: None (Serverless Function)
- **Registry ID**: passkey-cc-verification

## What This Service Does
A TypeScript-based AWS Lambda service that provides real-time credit card verification functionality for Passkey hotel reservation systems. Operates as a WebSocket API that validates credit cards collected through PBR (Property Booking Request) surveys.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Credit Card Verification | Real-time validation of payment card information |
| WebSocket API | Bidirectional communication for instant validation feedback |
| PBR Survey | Property Booking Request survey collecting payment information |
| Real-time Validation | Immediate feedback during payment card entry |
| Bearer Token Authentication | Secure token-based access control |
| Payment Processing Integration | Connection with Passkey Ledger for transactions |
| Serverless Architecture | AWS Lambda-based scalable execution |
| Hotel Booking Flow | Complete reservation process including payment validation |
| Invalid Payment Detection | Early identification of problematic payment methods |
| Survey Completion | Final step validation before reservation confirmation |

## Architecture at a Glance
```
passkey-cc-verification/
├── packages/
│   ├── websocket-api/       # WebSocket API implementation
│   ├── verification-logic/  # Credit card validation logic
│   ├── auth-handler/       # Bearer token authentication
│   └── infra/              # CDK infrastructure
├── tools/                  # Build and development tools
└── nx.json                # Nx workspace configuration
```

## API Surface

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| WebSocket API | Real-time communication | Instant validation feedback, bidirectional |
| Verification Logic | Card validation | Real-time processing, error detection |
| Authentication | Security layer | Bearer token validation, secure access |
| Lambda Functions | Serverless execution | Scalable, event-driven processing |

## Key Business Rules
- Credit cards must be validated before completing reservations
- Real-time feedback prevents invalid payment methods from proceeding
- WebSocket API provides instant validation during survey completion
- Bearer token authentication ensures secure access to validation services
- Integration with Passkey Ledger enables payment processing
- Invalid payment detection occurs early in the booking flow
- Serverless architecture provides automatic scaling and cost efficiency
- Validation results are immediately available to the booking interface
- PBR survey completion requires successful payment validation

## Service Dependencies

| Service | Purpose |
|---------|---------|
| AWS Lambda | Serverless function execution |
| AWS API Gateway | WebSocket API management |
| Passkey Ledger Service | Payment processing and validation |
| Bearer Token Service | Authentication and authorization |
| PBR Survey System | Source of payment card information |
| Hotel Booking System | Consumer of validation results |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-cc-verification` to browse:
- `packages/websocket-api/` — WebSocket API implementation
- `packages/verification-logic/` — Credit card validation logic
- `packages/auth-handler/` — Authentication handling
- `packages/infra/` — CDK infrastructure code
- `catalog-info.yaml` — Backstage service metadata

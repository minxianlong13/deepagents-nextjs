---
name: "passkey-repo-reservation-saga"
description: "A next-generation reservation orchestration engine that manages Passkey's Booking API and coordinates reservation lifecycle operations across multiple services. Implements the saga pattern to manage long-running transactions and ensure reliable reservation processing. Use when working with: the passkey-reservation-saga repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-reservation-saga`
- **Type**: TypeScript AWS CDK Orchestration Service
- **Owner**: Passkey Team (`#passkey`)
- **DB**: DynamoDB + SQS
- **Registry ID**: passkey-reservation-saga

## What This Service Does
A next-generation reservation orchestration engine that manages Passkey's Booking API and coordinates reservation lifecycle operations across multiple services. Implements the saga pattern to manage long-running transactions and ensure reliable reservation processing.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Saga Pattern | Distributed transaction management pattern for microservices |
| Reservation Orchestration | Coordination of complex booking workflows across services |
| Booking API | Primary API interface for reservation operations |
| Lifecycle Management | End-to-end reservation process from creation to completion |
| Multi-Service Coordination | Orchestrating operations across payment, inventory, compliance services |
| Event-Driven Architecture | Processing reservation events through queues and functions |
| Long-Running Transactions | Complex workflows that span multiple services and time |
| Compensation Logic | Rollback mechanisms for failed distributed transactions |
| Step Functions | AWS service for workflow orchestration |
| Real-time Status Tracking | Live monitoring of reservation processing states |

## Architecture at a Glance
```
passkey-reservation-saga/
├── packages/
│   ├── saga-orchestrator/    # Main orchestration logic
│   ├── booking-api/         # REST API for reservations
│   ├── event-handlers/      # SQS event processing
│   ├── step-functions/      # Workflow definitions
│   └── infra/              # CDK infrastructure
├── tools/                  # Build and development tools
└── nx.json                # Nx workspace configuration
```

## API Surface

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| Booking API | Reservation operations | REST endpoints, API Gateway integration |
| Saga Orchestrator | Workflow coordination | Step Functions, compensation logic |
| Event Handlers | Asynchronous processing | SQS queues, Lambda functions |
| Status Tracking | Real-time monitoring | State management, progress reporting |
| Batch Processing | Bulk operations | Efficient handling of multiple reservations |

## Key Business Rules
- Saga pattern ensures distributed transaction consistency
- Multi-service coordination maintains data integrity across systems
- Event-driven architecture enables scalable asynchronous processing
- Compensation logic handles failure scenarios and rollbacks
- Real-time status tracking provides visibility into reservation progress
- API Gateway integration provides secure and scalable REST endpoints
- Step Functions orchestrate complex multi-step workflows
- Batch processing supports efficient bulk reservation operations
- Third-party payment integration includes Stripe 3DS verification
- Long-running transactions maintain state across service boundaries

## Service Dependencies

| Service | Purpose |
|---------|---------|
| AWS Step Functions | Workflow orchestration and state management |
| AWS SQS | Event queuing and asynchronous processing |
| AWS Lambda | Serverless function execution |
| API Gateway | REST API management and security |
| DynamoDB | State persistence and tracking |
| Passkey Payment Services | Payment processing and verification |
| Passkey Inventory Services | Room availability and booking |
| Passkey Compliance Services | Regulatory and business rule validation |
| Third-Party Payment Providers | External payment processing (Stripe, etc.) |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-reservation-saga` to browse:
- `packages/saga-orchestrator/` — Main orchestration logic
- `packages/booking-api/` — REST API implementation
- `packages/event-handlers/` — SQS event processing
- `packages/step-functions/` — Workflow definitions
- `packages/infra/` — CDK infrastructure code
- `catalog-info.yaml` — Backstage service metadata

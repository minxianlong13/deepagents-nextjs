---
name: "passkey-repo-event-bus-cdk"
description: "A comprehensive AWS CDK-based infrastructure project that provides event-driven architecture for Passkey-related business entities. Enables event propagation across different Passkey services within the hospitality platform through centralized event bus infrastructure. Use when working with: the passkey-event-bus-cdk repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-event-bus-cdk`
- **Type**: AWS CDK Infrastructure (Event Bus)
- **Owner**: Passkey Team (`#passkey`)
- **DB**: EventBridge + Elasticsearch
- **Registry ID**: passkey-event-bus-cdk

## What This Service Does
A comprehensive AWS CDK-based infrastructure project that provides event-driven architecture for Passkey-related business entities. Enables event propagation across different Passkey services within the hospitality platform through centralized event bus infrastructure.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Event Bus | Centralized AWS EventBridge-based communication hub |
| Event Propagation | Distribution of business events across microservices |
| Reservation Consumer | Lambda function processing reservation events |
| Authentication Publisher | Event publishing for auth-related events |
| Notification Publishers | Multiple publishers for different notification channels |
| Elasticsearch Sync | Event-driven data synchronization with search index |
| Decoupled Communication | Loose coupling between microservices via events |
| Business Entity Events | Domain events for hotels, reservations, users, etc. |

## Architecture at a Glance
```
passkey-event-bus-cdk/
├── lib/
│   ├── event-bus-stack.ts      # Main EventBridge infrastructure
│   ├── reservation-consumer/   # Reservation event processing
│   ├── auth-publisher/        # Authentication event publishing
│   ├── notification-publishers/ # ECS and Service Bus publishers
│   └── elasticsearch-sync/    # Search index synchronization
└── bin/                       # CDK app entry points
```

## API Surface

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| EventBridge Bus | Central event routing | Event patterns, rule-based routing |
| Lambda Consumers | Event processing | Reservation updates, Elasticsearch sync |
| Event Publishers | Event generation | Authentication, notification events |
| Dead Letter Queues | Error handling | Failed event processing recovery |

## Key Business Rules
- Event bus enables decoupled communication between Passkey services
- Reservation events trigger Elasticsearch index updates
- Authentication events are published for security monitoring
- Notification events support multiple delivery channels
- Event patterns determine routing to appropriate consumers
- Dead letter queues handle failed event processing
- Infrastructure supports multiple environments and scaling
- Event-driven architecture improves system resilience and scalability

## Service Dependencies

| Service | Purpose |
|---------|---------|
| AWS EventBridge | Central event bus infrastructure |
| AWS Lambda | Event processing functions |
| Elasticsearch | Search index for event-driven data sync |
| AWS SQS | Dead letter queues and event buffering |
| Passkey Microservices | Event producers and consumers |
| ECS Services | Notification processing |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-event-bus-cdk` to browse:
- `lib/` — CDK infrastructure definitions
- `bin/` — CDK application entry points
- `lambda/` — Event processing functions
- `catalog-info.yaml` — Backstage service metadata

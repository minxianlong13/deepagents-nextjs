---
name: "passkey-repo-notifications-service"
description: "Central notification hub for the Passkey ecosystem, handling auto-block notifications, reservation transfer alerts, and general hotel/event notifications. Processes events via SQS and publishes to EventBridge for downstream consumption. Use when working with: the passkey-notifications repository; Auto-Block Request, Notification, Participant, Reservation Transfer, Event."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-notifications`
- **Type**: Java 17 Dropwizard Multi-Module
- **Owner**: Meeseeksbox team (`#passkey-api`)
- **DB**: Oracle (transactional), DynamoDB (notifications)
- **Registry ID**: passkey-notifications

## What This Service Does
Central notification hub for the Passkey ecosystem, handling auto-block notifications, reservation transfer alerts, and general hotel/event notifications. Processes events via SQS and publishes to EventBridge for downstream consumption.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Auto-Block Request** | Request to automatically reserve hotel room blocks for events |
| **Notification** | Message/alert delivered to users about events or required actions |
| **Notification Template** | Email/communication templates for planners, hotels, or attendees |
| **Business Text** | Customizable labels and text strings used throughout the UI. Supports multi-language via message keys and locale codes |
| **Notification Contact** | Hotel staff designated to receive reservation notifications (new bookings, cancellations, modifications) |
| **Participant** | Individual involved in event (attendee, organizer, hotel contact) |
| **Reservation Transfer** | Process of moving hotel reservations between systems |
| **Event** | Gathering requiring hotel accommodations (conference, wedding) |
| **SPORG** | Special Organization with enhanced privileges in Cvent system |
| **EventBridge** | AWS service for event-driven architecture and publishing |
| **SQS** | AWS messaging service for asynchronous event processing |
| **Passkey** | Cvent's hotel booking and management platform |

## Architecture at a Glance
```
passkey-notifications/
├── packages/
│   ├── service/                      # Main Dropwizard service
│   ├── infrastructure/               # TypeScript CDK infrastructure
│   └── shared/                       # Shared models and utilities
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **User Notifications V1** | `/passkey-notifications/v1/user-notifications` | Retrieve notifications, counts |
| **User Notifications V2** | `/passkey-notifications/v2/user-notifications` | Enhanced notification retrieval |
| **Admin Operations** | `/passkey-notifications/admin` | Administrative notification management |

## Key Business Rules
- Notifications categorized by type and priority levels (LOW, MEDIUM, HIGH, CRITICAL)
- Status tracking for notifications (READ, UNREAD, ARCHIVED)
- Auto-block requests generate status notifications for users
- Reservation transfers trigger stakeholder notifications
- Events published to EventBridge for downstream processing
- SQS queues handle asynchronous event consumption
- Hybrid storage: Oracle for transactional data, DynamoDB for notifications
- Multi-version API support for backward compatibility

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **passkey-event** | Event publishing and consumption |
| **passkey-hotel** | Hotel data and operations |
| **Oracle Database** | Primary transactional data storage |
| **AWS DynamoDB** | Notification storage and retrieval |
| **AWS SQS** | Event queue processing |
| **AWS EventBridge** | Event publishing for downstream services |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-notifications` to browse:
- `packages/service/src/main/java/` — Main Dropwizard service implementation
- `packages/infrastructure/` — TypeScript CDK infrastructure code
- `packages/shared/` — Shared models and utilities
- `catalog-info.yaml` — Backstage service metadata

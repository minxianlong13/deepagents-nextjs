---
name: "passkey-repo-autoblock-autoprovision-service"
description: "Orchestrates automated provisioning of hotel room blocks through AWS STEP Functions workflows. Handles both automatic and manual block provisioning processes, providing real-time tracking and monitoring of room inventory allocation for the Passkey platform. Use when working with: the passkey-autoblock-autoprovision repository; Autoblock Provisioning, STEP Functions Workflow, Block Allocation, Demand Forecasting, Manual Override."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-autoblock-autoprovision`
- **Type**: TypeScript AWS CDK Monorepo
- **Owner**: metre-stick team (`#metre-stick`)
- **DB**: DynamoDB (State management)
- **Registry ID**: autoblock-autoprovision-cdk

## What This Service Does
Orchestrates automated provisioning of hotel room blocks through AWS STEP Functions workflows. Handles both automatic and manual block provisioning processes, providing real-time tracking and monitoring of room inventory allocation for the Passkey platform.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Autoblock Provisioning** | Automated creation and allocation of hotel room blocks |
| **STEP Functions Workflow** | AWS orchestration service managing provisioning processes |
| **Block Allocation** | Assignment of room inventory to specific events or groups |
| **Demand Forecasting** | Predictive analysis for room block requirements |
| **Manual Override** | Human intervention capability for custom provisioning |
| **Provisioning State** | Current status and progress of block creation process |
| **Execution Tracking** | Monitoring and logging of workflow activities |
| **WebSocket Communication** | Real-time status updates and notifications |
| **Email Notifications** | Automated alerts for provisioning status changes |

## Architecture at a Glance
```
passkey-autoblock-autoprovision/
├── packages/
│   └── passkey-autoblock-autoprovision-cdk/  # AWS CDK infrastructure
│       ├── lib/                              # CDK stack definitions
│       ├── lambda/                           # Lambda function code
│       └── step-functions/                   # Workflow definitions
├── raml/                                     # API specifications
└── docs/                                     # Documentation
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Provisioning API** | `/v1/autoblockautoprovision` | Trigger provisioning workflows |
| **WebSocket API** | `/ws` | Real-time status updates |
| **Health Check** | `/health` | Service health monitoring |

## Key Business Rules
- Automated provisioning follows configurable demand forecasting rules
- Manual override capabilities allow custom block creation when needed
- Real-time WebSocket communication provides live status updates
- All provisioning activities are tracked and logged for audit purposes
- Email notifications alert stakeholders of status changes and failures
- DynamoDB maintains persistent state across workflow executions
- Integration with multiple Passkey services ensures data consistency
- STEP Functions provide fault tolerance and retry mechanisms
- Provisioning workflows support both synchronous and asynchronous execution

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **passkey-reservation** | Room reservation management |
| **passkey-inventory** | Hotel inventory tracking |
| **passkey-smart** | Smart campaign configuration |
| **passkey-ecommerce** | E-commerce functionality |
| **Cvent Email Service** | Notification delivery |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full API docs with endpoints, parameters, examples
- `docs/ARCHITECTURE.md` — Detailed system design, STEP Functions workflows
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — AWS services, CDK configuration, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-autoblock-autoprovision` to browse:
- `packages/passkey-autoblock-autoprovision-cdk/lib/` — CDK stack definitions
- `packages/passkey-autoblock-autoprovision-cdk/lambda/` — Lambda function implementations
- `packages/passkey-autoblock-autoprovision-cdk/step-functions/` — Workflow definitions
- `raml/` — API specifications and documentation
- `catalog-info.yaml` — Backstage service metadata

# Architecture

## System Overview

The Passkey Event Bus CDK implements an event-driven architecture using AWS services to enable decoupled communication between Passkey microservices. The system is built as a TypeScript monorepo using AWS CDK for infrastructure as code.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Passkey       │    │   Event Bus     │    │   Consumers     │
│   Services      │───▶│   (EventBridge) │───▶│   (Lambda)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Elasticsearch  │
                       │    Cluster      │
                       └─────────────────┘
```

## Components

### Producer Stack (PasskeyManageProducerStack)
- **Purpose**: Generates and publishes events from the Passkey Manage API
- **Location**: `lib/generated/` (auto-generated from AsyncAPI spec)
- **Key Features**:
  - Event schema validation
  - EventBridge integration
  - Notification channel configuration

### Reservation Consumer Stack (PasskeyReservationConsumerStack)
- **Purpose**: Processes reservation-related events and updates Elasticsearch
- **Location**: `lib/reservation-consumer-stack.ts`
- **Key Components**:
  - Lambda function for event processing
  - Elasticsearch client integration
  - Event filtering and routing
  - Dead letter queue for failed events

### Authentication Stack (PasskeyAuthenticationStack)
- **Purpose**: Handles authentication-related event publishing
- **Location**: `lib/passkey-authentication-stack.ts`
- **Key Features**:
  - Authentication event processing
  - EventBridge rule configuration

### Notification Publisher Stacks
#### ECS Publisher (PasskeyNotificationServicePublisherStack)
- **Purpose**: Publishes events to ECS-based notification services
- **Location**: `lib/passkey-notification-service-publisher-stack.ts`

#### Service Bus Publisher (PasskeyNotificationSbPublisherStack)
- **Purpose**: Publishes events to Service Bus for message queuing
- **Location**: `lib/passkey-notification-sb-publisher-stack.ts`

### Elasticsearch Client Package
- **Purpose**: Provides reusable Elasticsearch client functionality
- **Location**: `packages/elasticsearch-client/`
- **Key Features**:
  - Connection management
  - Index operations
  - Query utilities

### Reservation Consumer Lambda Package
- **Purpose**: Lambda function implementation for processing reservation events
- **Location**: `packages/reservation-consumer-lambda/`
- **Key Features**:
  - Event deserialization
  - Business logic processing
  - Elasticsearch document updates

## Data Flow

1. **Event Generation**: Passkey services generate events through the Manage API
2. **Event Publishing**: Events are published to the EventBridge event bus
3. **Event Routing**: EventBridge routes events to appropriate consumers based on rules
4. **Event Processing**: Lambda functions process events and perform business logic
5. **Data Persistence**: Processed data is stored in Elasticsearch for search and analytics
6. **Notification Distribution**: Events are forwarded to notification services and message queues

## Design Patterns

### Event-Driven Architecture
- Loose coupling between services
- Asynchronous communication
- Event sourcing for audit trails

### Infrastructure as Code
- AWS CDK for declarative infrastructure
- Version-controlled infrastructure changes
- Environment-specific configurations

### Monorepo Structure
- Shared dependencies and tooling
- Consistent build and deployment processes
- Cross-package type safety

### Lambda-based Processing
- Serverless event processing
- Automatic scaling based on event volume
- Cost-effective for variable workloads

## Module Structure

```
passkey-event-bus-cdk/
├── packages/
│   ├── event-bus-cdk/           # Main CDK application
│   │   ├── lib/                 # CDK stack definitions
│   │   │   ├── application.ts   # Main application class
│   │   │   ├── *-stack.ts      # Individual stack definitions
│   │   │   └── utils/          # Utility functions
│   │   ├── bin/                # CDK app entry point
│   │   └── test/               # Unit tests
│   ├── elasticsearch-client/   # Elasticsearch utilities
│   │   └── src/                # Client implementation
│   └── reservation-consumer-lambda/ # Lambda function
│       └── src/                # Lambda handler code
├── docs/                       # Documentation
└── pnpm-workspace.yaml        # Monorepo configuration
```

## Environment Configuration

The application supports multiple deployment environments:

- **Local**: Uses LocalStack for local development
- **CI**: Ephemeral environments for continuous integration
- **Development**: Shared development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

Each environment has its own:
- AWS account and region configuration
- Elasticsearch cluster settings
- Service endpoint configurations
- Resource naming conventions

## Security Considerations

- **IAM Roles**: Least privilege access for Lambda functions
- **VPC Configuration**: Network isolation for sensitive resources
- **Secret Management**: AWS Secrets Manager for sensitive configuration
- **Event Validation**: Schema validation for incoming events
- **Encryption**: At-rest and in-transit encryption for data

## Scalability Features

- **Auto-scaling**: Lambda functions scale automatically with event volume
- **Event Batching**: Efficient processing of multiple events
- **Dead Letter Queues**: Handling of failed event processing
- **Elasticsearch Sharding**: Distributed data storage for large datasets
- **Multi-AZ Deployment**: High availability across availability zones
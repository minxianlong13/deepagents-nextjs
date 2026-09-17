# Architecture

## System Overview

The Passkey Notifications Service is built as a hybrid Java/TypeScript monorepo that combines a Dropwizard-based REST API with TypeScript infrastructure components. The service follows an event-driven architecture pattern, consuming events from SQS queues and publishing notifications through EventBridge.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Admin Tools   │    │  Event Sources  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Passkey Notifications Service                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   REST API  │  │ Admin API   │  │    SQS Consumers        │ │
│  │   (v1/v2)   │  │             │  │ - AutoBlock Events      │ │
│  └─────────────┘  └─────────────┘  │ - Reservation Transfer  │ │
│           │               │        └─────────────────────────┘ │
│           ▼               ▼                      │              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Business Services Layer                        │ │
│  │ - PasskeyNotificationsService                              │ │
│  │ - AdminPasskeyNotificationsService                         │ │
│  │ - NotificationsEventPubService                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│           │                                      │              │
│           ▼                                      ▼              │
│  ┌─────────────────┐                   ┌─────────────────────┐ │
│  │  Data Access    │                   │   Event Publishing  │ │
│  │ - Oracle DB     │                   │   - EventBridge     │ │
│  │ - DynamoDB      │                   └─────────────────────┘ │
│  └─────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### REST API Layer
- **Purpose**: Provides HTTP endpoints for notification retrieval and management
- **Location**: `packages/service/src/main/java/com/cvent/passkeynotifications/resources/`
- **Key Classes**:
  - `PasskeyNotificationsResource` - V1 user notification endpoints
  - `PasskeyNotificationsResourceV2` - V2 enhanced notification endpoints
  - `AdminPasskeyNotificationsResource` - Administrative operations
  - `NotificationsEventPubResource` - Event publishing endpoints
  - `PasskeyAlertsResource` - Alert management

### Business Services Layer
- **Purpose**: Contains core business logic and orchestration
- **Location**: `packages/service/src/main/java/com/cvent/passkeynotifications/services/`
- **Key Classes**:
  - `PasskeyNotificationsService` - Core notification business logic
  - `PasskeyNotificationsServiceV2` - Enhanced V2 notification logic
  - `AdminPasskeyNotificationsService` - Administrative operations
  - `NotificationsEventPubService` - Event publishing logic
  - `PasskeyAlertsService` - Alert management logic

### Data Access Layer
- **Purpose**: Handles data persistence and retrieval operations
- **Location**: Multiple packages for different data stores
- **Key Classes**:
  - `NotificationsOracleDataAccess` - Oracle database operations
  - `AutoblockNotificationsDynamoDbDataAccess` - DynamoDB auto-block notifications
  - `ReservationTransferDynamoDbDataAccess` - DynamoDB reservation transfers
  - `PasskeyAlertsDataAccess` - Alert data operations

### Event Processing Layer
- **Purpose**: Handles asynchronous event consumption and processing
- **Location**: `packages/service/src/main/java/com/cvent/passkeynotifications/sqs/`
- **Key Classes**:
  - `AutoBlockRequestEventProcessor` - Processes auto-block events from SQS
  - `ReservationTransferProcessor` - Handles reservation transfer events

### Infrastructure Layer (TypeScript)
- **Purpose**: AWS infrastructure as code using CDK
- **Location**: `packages/eb-sqs-consumer/`, `packages/infra/`
- **Components**:
  - CDK stacks for AWS resource provisioning
  - SQS queue configurations
  - EventBridge rule definitions
  - Lambda functions for event processing

## Data Flow

### Notification Retrieval Flow
1. Client application makes REST API call to get notifications
2. Resource layer validates request and delegates to service layer
3. Service layer orchestrates data retrieval from multiple sources:
   - Oracle DB for alert data
   - DynamoDB for auto-block and reservation transfer notifications
4. Service layer aggregates and formats response
5. Response returned to client

### Event Processing Flow
1. External systems publish events to SQS queues
2. SQS consumers (AutoBlockRequestEventProcessor, ReservationTransferProcessor) poll queues
3. Events are processed and stored in DynamoDB
4. Processed events may trigger EventBridge publications for downstream systems
5. Notifications become available through REST API

### Event Publishing Flow
1. Admin or automated systems call event publishing endpoints
2. NotificationsEventPubService formats events for EventBridge
3. Events published to EventBridge with appropriate routing
4. Downstream systems consume events for further processing

## Design Patterns

### Repository Pattern
- Data access is abstracted through repository interfaces
- Separate implementations for Oracle and DynamoDB
- Enables easy testing and data source switching

### Service Layer Pattern
- Business logic encapsulated in service classes
- Clear separation between API concerns and business rules
- Services orchestrate multiple data access operations

### Event-Driven Architecture
- Loose coupling between components through events
- Asynchronous processing for better scalability
- EventBridge provides reliable event delivery

### Multi-Version API Support
- V1 and V2 endpoints coexist for backward compatibility
- Gradual migration path for clients
- Separate service implementations allow for different business logic

## Module Structure

### Java Modules (Maven)
```
passkey-notifications/
├── packages/parent/          # Parent POM with shared configuration
├── packages/model/           # Shared data models and DTOs
├── packages/repository/      # Data access layer implementations
├── packages/service/         # Main Dropwizard application
└── packages/java-client/     # Java client library
```

### TypeScript Modules (pnpm)
```
passkey-notifications/
├── packages/eb-sqs-consumer/ # EventBridge SQS consumer infrastructure
├── packages/infra/           # CDK infrastructure definitions
└── packages/it/              # Integration tests
```

### Package Dependencies
- **service** depends on **model**, **repository**
- **repository** depends on **model**
- **java-client** depends on **model**
- TypeScript packages are independent infrastructure components

## Configuration Management

### Environment-Specific Configuration
- Development, staging, and production configurations
- Multi-environment support through Pangaea framework
- Database connection pooling and retry policies
- SQS queue configurations per environment

### Security Configuration
- API key authentication through Cvent Auth framework
- Role-based access control for admin endpoints
- Secure credential management for AWS services

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables multiple instances
- SQS consumers can be scaled independently
- Database connection pooling optimizes resource usage

### Performance Optimization
- Caching layer for frequently accessed data
- Batch processing for bulk operations
- Asynchronous event processing reduces API latency

### Monitoring and Observability
- Health checks for service and dependency monitoring
- Metrics collection through Dropwizard Metrics
- Structured logging with correlation IDs
- Distributed tracing support
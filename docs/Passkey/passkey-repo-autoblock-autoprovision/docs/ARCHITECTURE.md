# Architecture

## System Overview

The Passkey Autoblock Autoprovision Service is built as a serverless, event-driven architecture on AWS. The system orchestrates complex room block provisioning workflows using AWS Step Functions, with Lambda functions handling individual workflow steps and API Gateway providing external interfaces.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   API Gateway   │───▶│  Step Functions  │───▶│   Lambda Functions  │
│   (REST/WS)     │    │   (Workflows)    │    │   (Business Logic)  │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │                         │
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│    DynamoDB     │    │   CloudWatch     │    │  External Services  │
│  (State Store)  │    │   (Monitoring)   │    │ (Passkey Services)  │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## Components

### CDK Infrastructure (`passkey-autoblock-autoprovision-cdk`)
- **Purpose**: Infrastructure as Code definition for all AWS resources
- **Location**: `packages/passkey-autoblock-autoprovision-cdk/`
- **Key Classes**:
  - `Application`: Main CDK application entry point
  - Stack configurations for different environments
  - Lambda function definitions and Step Function workflows

### Lambda Functions (`passkey-autoblock-autoprovision-lambdas`)
- **Purpose**: Serverless compute functions implementing business logic
- **Location**: `packages/passkey-autoblock-autoprovision-lambdas/src/main/ts/`
- **Key Components**:
  - `api.ts`: API Gateway request handlers
  - `starter/`: Workflow initiation functions
  - `plannerOrch/`: Planning orchestration logic
  - `subBlockOrch/`: Sub-block orchestration
  - `subBlockGroupOrch/`: Sub-block group management
  - `autoblockDataService/`: Data access layer for autoblock operations
  - `eventService/`: Event handling and processing
  - `cventEmailService/`: Email notification service
  - `smartCampaignCfgDataService/`: Smart campaign configuration management
  - `publisher/`: Event publishing functionality
  - `tracking/`: Execution tracking and monitoring
  - `authorize/`: Authentication and authorization
  - `access/`: Access control management

### Common Library (`passkey-autoblock-autoprovision-common`)
- **Purpose**: Shared models, types, and utilities
- **Location**: `packages/passkey-autoblock-autoprovision-common/`
- **Key Components**:
  - Data models and interfaces
  - Common validation logic
  - Shared constants and enums

### WebSocket Handler (`passkey-autoblock-autoprovision-websocket`)
- **Purpose**: Real-time communication for status updates
- **Location**: `packages/passkey-autoblock-autoprovision-websocket/`
- **Key Components**:
  - WebSocket connection management
  - Real-time status broadcasting
  - Client connection tracking

## Data Flow

### Automatic Provisioning Workflow
1. **Trigger**: External system or scheduled event initiates provisioning
2. **Validation**: Input validation and authorization checks
3. **Planning**: Analyze demand patterns and determine block requirements
4. **Orchestration**: Step Functions coordinate multi-step provisioning process
5. **Execution**: Lambda functions execute individual provisioning steps
6. **Tracking**: Progress updates stored in DynamoDB and broadcast via WebSocket
7. **Completion**: Final status updates and notifications sent

### Manual Provisioning Override
1. **Manual Trigger**: User-initiated provisioning request
2. **Authorization**: Enhanced permission checks for manual operations
3. **Custom Logic**: Bypass automated rules for specific scenarios
4. **Execution**: Similar orchestration but with manual parameters
5. **Audit Trail**: Enhanced logging for manual interventions

## Design Patterns

### Orchestration Pattern
- **Step Functions** coordinate complex, multi-step workflows
- Each Lambda function handles a single responsibility
- State is passed between functions via Step Function context
- Error handling and retry logic built into workflow definitions

### Event-Driven Architecture
- **Event Sourcing**: All state changes captured as events
- **Publisher-Subscriber**: Loose coupling between components via events
- **Eventual Consistency**: Asynchronous processing with eventual consistency guarantees

### Repository Pattern
- Data access abstracted through service layers
- `autoblockDataService` provides data persistence operations
- `smartCampaignCfgDataService` manages configuration data
- DynamoDB utilities handle low-level database operations

### Command Query Responsibility Segregation (CQRS)
- Separate read and write operations
- Optimized data models for different access patterns
- Event tracking for audit and replay capabilities

## Module Structure

### Monorepo Organization
```
packages/
├── passkey-autoblock-autoprovision-cdk/     # Infrastructure definitions
│   ├── lib/
│   │   ├── application.ts                   # CDK application
│   │   ├── config/                          # Environment configurations
│   │   └── stack/                           # Stack definitions
│   └── bin/                                 # CDK entry points
├── passkey-autoblock-autoprovision-lambdas/ # Business logic
│   └── src/main/ts/
│       ├── api.ts                           # API handlers
│       ├── starter/                         # Workflow starters
│       ├── *Orch/                          # Orchestration functions
│       ├── *Service/                       # Service integrations
│       └── model/                          # Data models
├── passkey-autoblock-autoprovision-common/  # Shared utilities
│   └── src/                                # Common models and utilities
└── passkey-autoblock-autoprovision-websocket/ # Real-time communication
    └── src/                                # WebSocket handlers
```

### Lambda Function Organization
- **Orchestration Functions**: Handle workflow coordination
- **Service Integration Functions**: Interface with external Passkey services
- **Data Access Functions**: Manage DynamoDB operations
- **Utility Functions**: Provide common functionality (validation, logging, etc.)

## Scalability Considerations

### Horizontal Scaling
- Lambda functions automatically scale based on demand
- Step Functions can handle thousands of concurrent executions
- DynamoDB provides consistent performance at any scale

### Performance Optimization
- Lambda function cold start optimization through provisioned concurrency
- DynamoDB query optimization with proper indexing
- Caching strategies for frequently accessed configuration data

### Error Handling and Resilience
- Step Function retry policies for transient failures
- Dead letter queues for failed messages
- Circuit breaker patterns for external service calls
- Comprehensive logging and monitoring for troubleshooting

## Security Architecture

### Authentication and Authorization
- AWS IAM roles and policies for service-to-service communication
- API Gateway authentication integration
- Fine-grained permissions for different workflow operations

### Data Protection
- Encryption at rest for DynamoDB tables
- Encryption in transit for all API communications
- Secure parameter storage for sensitive configuration

### Network Security
- VPC integration for Lambda functions when required
- Security groups and NACLs for network-level protection
- Private API endpoints where appropriate
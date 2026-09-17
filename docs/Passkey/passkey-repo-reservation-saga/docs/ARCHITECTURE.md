# Architecture

## System Overview

The Passkey Reservation Saga implements a distributed saga orchestration pattern to manage complex reservation workflows across multiple Passkey services. The system is built as a TypeScript monorepo deployed on AWS using CDK infrastructure as code.

The architecture follows event-driven principles with clear separation between API handling, orchestration logic, and service integration. It uses AWS Step Functions for workflow orchestration, SQS for asynchronous processing, and DynamoDB for state persistence.

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Lambda Functions │────│  Step Functions │
│                 │    │                   │    │                 │
│ - REST Endpoints│    │ - Request Handler │    │ - Saga Workflow │
│ - Authentication│    │ - Validation      │    │ - State Machine │
│ - Rate Limiting │    │ - Transformation  │    │ - Error Handling│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   SQS Queues    │    │    DynamoDB      │    │ External APIs   │
│                 │    │                  │    │                 │
│ - Batch Create  │    │ - Request State  │    │ - Payment API   │
│ - Batch Modify  │    │ - Audit Logs     │    │ - Inventory API │
│ - Batch Cancel  │    │ - Configuration  │    │ - Compliance API│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components

### API Gateway Layer
- **Purpose**: Exposes REST endpoints for reservation operations
- **Location**: `packages/passkey-reservation-saga-lambdas/src/api-gateway/`
- **Key Classes**:
  - Request routing and validation
  - Authentication and authorization
  - Response transformation

### Lambda Functions
- **Purpose**: Serverless compute for handling requests and orchestration
- **Location**: `packages/passkey-reservation-saga-lambdas/src/handlers/`
- **Key Classes**:
  - `api-handler.ts` - REST API request processing
  - `queue-processor.ts` - SQS message processing
  - `orchestrator/` - Saga orchestration logic

### Step Functions State Machine
- **Purpose**: Workflow orchestration and saga coordination
- **Location**: `packages/passkey-reservation-saga-cdk/lib/`
- **Key Classes**:
  - Reservation creation workflow
  - Modification workflow
  - Cancellation workflow
  - Error handling and compensation

### Data Layer
- **Purpose**: State persistence and audit logging
- **Location**: `packages/passkey-reservation-saga-lambdas/src/data/`
- **Key Classes**:
  - `dynamo-data-source.ts` - DynamoDB operations
  - Request state management
  - Audit transaction logging

### Service Integration
- **Purpose**: External service communication
- **Location**: `packages/passkey-reservation-saga-lambdas/src/services/`
- **Key Classes**:
  - Payment service client
  - Inventory service client
  - Compliance service client

## Data Flow

### Reservation Creation Flow
1. **API Request**: Client submits reservation request via REST API
2. **Validation**: Lambda validates request structure and business rules
3. **State Persistence**: Initial request state saved to DynamoDB
4. **Saga Initiation**: Step Function workflow triggered
5. **Service Orchestration**: Sequential calls to downstream services
6. **State Updates**: Progress tracked in DynamoDB
7. **Response**: Final status returned to client

### Batch Processing Flow
1. **Queue Message**: Batch requests received via SQS
2. **Message Processing**: Lambda processes queue messages
3. **Parallel Execution**: Multiple reservations processed concurrently
4. **Status Aggregation**: Results collected and summarized
5. **Notification**: Completion status published

### Error Handling Flow
1. **Error Detection**: Service failures detected by Step Functions
2. **Compensation**: Rollback operations executed
3. **State Recovery**: System state restored to consistent point
4. **Notification**: Error details logged and reported

## Design Patterns

### Saga Pattern
- **Implementation**: AWS Step Functions coordinate distributed transactions
- **Compensation**: Automatic rollback on failures
- **State Management**: Persistent state tracking throughout workflow

### Event Sourcing
- **Audit Trail**: All state changes logged for compliance
- **Replay Capability**: Events can be replayed for debugging
- **Immutable Log**: Historical record of all operations

### Circuit Breaker
- **Fault Tolerance**: Prevents cascade failures
- **Service Protection**: Limits impact of downstream failures
- **Recovery**: Automatic retry with exponential backoff

### Repository Pattern
- **Data Access**: Abstracted data layer operations
- **Testing**: Mockable data access for unit tests
- **Consistency**: Standardized data operations

## Module Structure

### Core Packages
```
packages/
├── passkey-reservation-saga-cdk/          # Infrastructure as Code
│   ├── lib/                               # CDK constructs
│   ├── bin/                               # CDK apps
│   └── test/                              # Infrastructure tests
├── passkey-reservation-saga-lambdas/      # Business logic
│   ├── src/api/                           # External service clients
│   ├── src/handlers/                      # Lambda handlers
│   ├── src/orchestrator/                  # Saga orchestration
│   ├── src/data/                          # Data access layer
│   └── src/services/                      # Business services
├── passkey-reservation-saga-model/        # Domain models
│   └── src/                               # TypeScript interfaces
├── passkey-reservation-saga-common/       # Shared utilities
│   └── src/                               # Common functions
└── passkey-reservation-global-tables-cdk/ # Global DynamoDB tables
    └── lib/                               # Global table constructs
```

### Supporting Packages
```
packages/
├── passkey-reservation-consumer/          # Event consumers
│   └── src/                               # Consumer logic
└── sam/                                   # Local development
    └── templates/                         # SAM templates
```

## Deployment Architecture

### AWS Services Used
- **API Gateway**: REST API endpoints
- **Lambda**: Serverless compute
- **Step Functions**: Workflow orchestration
- **SQS**: Message queuing
- **DynamoDB**: NoSQL database
- **CloudWatch**: Monitoring and logging
- **Secrets Manager**: Configuration management

### Environment Separation
- **Development**: Feature branch deployments
- **Staging**: Pre-production testing
- **Production**: Live customer traffic

### Cross-Region Setup
- **Global Tables**: DynamoDB replication
- **Multi-Region**: Disaster recovery capability
- **Data Consistency**: Eventually consistent reads

## Security Architecture

### Authentication
- **API Keys**: Service-to-service authentication
- **IAM Roles**: AWS resource access control
- **Secrets Management**: Encrypted configuration storage

### Data Protection
- **Encryption**: Data encrypted at rest and in transit
- **Access Control**: Principle of least privilege
- **Audit Logging**: All operations logged for compliance

### Network Security
- **VPC**: Isolated network environment
- **Security Groups**: Firewall rules
- **Private Subnets**: Internal service communication

## Scalability Considerations

### Horizontal Scaling
- **Lambda Concurrency**: Auto-scaling compute
- **DynamoDB**: On-demand capacity scaling
- **SQS**: Unlimited message throughput

### Performance Optimization
- **Connection Pooling**: Reused database connections
- **Caching**: Frequently accessed data cached
- **Batch Operations**: Bulk processing for efficiency

### Monitoring and Alerting
- **CloudWatch Metrics**: Performance monitoring
- **Custom Dashboards**: Business metrics tracking
- **Automated Alerts**: Proactive issue detection
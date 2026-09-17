# Architecture

## System Overview

The Passkey Email CDK service implements a serverless, event-driven architecture for processing email communications in the Passkey for Hotels platform. The system is built on AWS services and follows a microservices pattern with clear separation of concerns.

The architecture consists of:
- **AWS Step Functions** for workflow orchestration
- **AWS Lambda** functions for business logic processing
- **Amazon SQS FIFO** queues for reliable message processing
- **Amazon DynamoDB** for persistent data storage
- **AWS IAM** roles for security and access control

## High-Level Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Email Event   │───▶│   SQS FIFO       │───▶│  Process Email      │
│   Scheduler     │    │   Queue          │    │  Event Consumer     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step Functions State Machine                     │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐   │
│  │Pre-Process  │───▶│  Processing     │───▶│ Post-Processing  │   │
│  │   Lambda    │    │   Map State     │    │     Lambda       │   │
│  └─────────────┘    └─────────────────┘    └──────────────────┘   │
│                             │                                      │
│                             ▼                                      │
│                    ┌─────────────────┐                            │
│                    │   Processing    │                            │
│                    │     Lambda      │                            │
│                    │  (Per Recipient)│                            │
│                    └─────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │    DynamoDB         │
                    │  Email Task Logs    │
                    └─────────────────────┘
```

## Components

### Email Event Scheduler Lambda
- **Purpose**: Schedules email events for processing based on business rules and timing requirements
- **Location**: `packages/email-event-scheduler-lambda/`
- **Key Responsibilities**:
  - Validates incoming email requests
  - Determines optimal processing timing
  - Queues events for processing

### Pre-processing Lambda
- **Purpose**: Initial validation and preparation of email events
- **Location**: `packages/pre-processing-lambda/`
- **Key Responsibilities**:
  - Event validation and sanitization
  - Recipient list preparation
  - Template and data validation
  - Error handling for malformed requests

### Processing Lambda
- **Purpose**: Core email processing logic executed per recipient
- **Location**: `packages/processing-lambda/`
- **Key Responsibilities**:
  - Template rendering with Hogan.js
  - Personalization data injection
  - Email content generation
  - Integration with external services

### Post-processing Lambda
- **Purpose**: Cleanup and finalization tasks after email processing
- **Location**: `packages/post-processing-lambda/`
- **Key Responsibilities**:
  - Task completion logging
  - Cleanup of temporary resources
  - Success/failure reporting
  - Metrics collection

### Process Email Event Consumer Lambda
- **Purpose**: Consumes email events from the SQS queue and triggers Step Functions
- **Location**: `packages/process-email-event-consumer-lambda/`
- **Key Responsibilities**:
  - SQS message consumption
  - Step Function execution triggering
  - Dead letter queue handling

### Failure Handling Lambdas
- **Purpose**: Handle various failure scenarios with appropriate recovery strategies
- **Locations**: 
  - `packages/failure-lambda/` - General failure handling
  - `packages/single-instance-failure-lambda/` - Single instance failure handling
- **Key Responsibilities**:
  - Error classification and logging
  - Retry logic implementation
  - Alerting and notification
  - Graceful degradation

### Shared Components
- **Purpose**: Common utilities and domain models shared across all Lambda functions
- **Location**: `packages/passkey-email-shared/`
- **Key Components**:
  - Domain models and types
  - DynamoDB access patterns
  - Logging utilities
  - Business logic strategies

## Data Flow

### 1. Email Event Initiation
1. External systems trigger email events through the Email Event Scheduler
2. Events are validated and queued in the SQS FIFO queue
3. Process Email Event Consumer Lambda picks up messages from the queue

### 2. Step Functions Orchestration
1. Consumer Lambda triggers the Step Functions state machine
2. Pre-processing Lambda validates and prepares the email event
3. Processing Map State executes Processing Lambda for each recipient in parallel
4. Post-processing Lambda handles cleanup and finalization

### 3. Data Persistence
1. Email task logs are stored in DynamoDB throughout the process
2. Automation configuration is maintained in separate DynamoDB tables
3. All operations are logged with correlation IDs for traceability

### 4. Error Handling
1. Each step has defined error handling with appropriate catch blocks
2. Failures trigger specific failure Lambda functions
3. Retry logic is implemented at multiple levels
4. Dead letter queues capture unprocessable messages

## Design Patterns

### Event-Driven Architecture
- Loose coupling between components through events
- Asynchronous processing for improved scalability
- Event sourcing for audit trails and debugging

### Microservices Pattern
- Single responsibility principle for each Lambda function
- Independent deployment and scaling
- Clear service boundaries and interfaces

### Saga Pattern (via Step Functions)
- Distributed transaction management
- Compensation actions for failure scenarios
- Consistent state management across services

### Repository Pattern
- Abstracted data access through shared components
- Consistent data access patterns
- Testable data layer

### Strategy Pattern
- Pluggable business logic strategies
- Environment-specific behavior
- Extensible processing rules

## Module Structure

### Monorepo Organization
```
packages/
├── passkey-email-cdk/           # CDK infrastructure definitions
│   ├── lib/
│   │   ├── stack/               # CDK stack definitions
│   │   ├── application.ts       # Main CDK application
│   │   └── emailProps.ts        # Configuration properties
│   └── bin/                     # CDK deployment scripts
├── passkey-email-shared/        # Shared utilities and models
│   └── src/
│       ├── types/               # TypeScript type definitions
│       ├── dynamo/              # DynamoDB access patterns
│       ├── enums/               # Enumeration definitions
│       └── util/                # Common utilities
└── [lambda-name]-lambda/        # Individual Lambda functions
    ├── src/                     # Lambda source code
    ├── test/                    # Unit tests
    └── package.json             # Lambda-specific dependencies
```

### CDK Stack Organization
- **Application Stack**: Main orchestration and configuration
- **DynamoDB Stack**: Database table definitions and configurations
- **Step Functions Stack**: Workflow definition and Lambda integrations
- **Queue Stack**: SQS queue and dead letter queue setup
- **Roles Stack**: IAM roles and policies
- **Automation DynamoDB Stack**: Automation-specific data storage

## Infrastructure as Code

### CDK Constructs
- Custom constructs for Lambda function creation
- Reusable patterns for IAM policies
- Environment-specific resource naming
- Automated tagging and resource management

### Environment Management
- **Sandbox**: Development and testing environment
- **CI**: Continuous integration environment
- **Production**: Live production environment

Each environment has:
- Isolated resource naming
- Environment-specific configurations
- Appropriate retention policies
- Scaling parameters

### Security Architecture
- Least privilege IAM policies
- VPC integration for Lambda functions
- Encrypted data at rest and in transit
- Parameter Store for sensitive configuration
- AWS Secrets Manager integration

## Scalability and Performance

### Horizontal Scaling
- Lambda functions scale automatically based on demand
- Step Functions handle concurrent executions
- DynamoDB auto-scaling for read/write capacity
- SQS provides buffering for traffic spikes

### Performance Optimizations
- Lambda function memory and timeout tuning
- DynamoDB query optimization
- Connection pooling and reuse
- Efficient error handling and retry strategies

### Monitoring and Observability
- CloudWatch metrics and alarms
- Distributed tracing with correlation IDs
- Structured logging across all components
- Performance monitoring and alerting
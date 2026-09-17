# Architecture

## System Overview

Passkey Sputnik implements a serverless, event-driven architecture on AWS using CDK (Cloud Development Kit). The system is designed to handle reservation transfers to multiple vendor systems with high reliability, scalability, and observability.

The architecture follows a microservices pattern with Lambda functions handling specific business operations, orchestrated through Step Functions, and integrated via EventBridge for loose coupling.

## Components

### Core Lambda Functions

#### **reservationTransferApi**
- **Purpose**: Main API gateway handler for all transfer operations
- **Location**: `lib/lambdas/reservationTransferApi.ts`
- **Key Responsibilities**:
  - Route API requests to appropriate handlers
  - Handle authentication and authorization
  - Process synchronous transfer requests
  - Manage scheduled transfer operations

#### **reservationTransferStep**
- **Purpose**: Step Function task handler for transfer workflow
- **Location**: `lib/lambdas/reservationTransferStep.ts`
- **Key Responsibilities**:
  - Execute individual steps in transfer workflow
  - Handle state transitions
  - Coordinate with other services

#### **callbacksConsumer & callbacksExecutor**
- **Purpose**: Process vendor callbacks and notifications
- **Location**: `lib/lambdas/callbacksConsumer.ts`, `lib/lambdas/callbacksExecutor.ts`
- **Key Responsibilities**:
  - Consume SQS messages from vendor callbacks
  - Execute callback processing logic
  - Update transfer status based on vendor responses

#### **initiateQueuedTransfers**
- **Purpose**: Process scheduled and queued transfers
- **Location**: `lib/lambdas/initiateQueuedTransfers.ts`
- **Key Responsibilities**:
  - Trigger scheduled transfers at appropriate times
  - Manage transfer queues
  - Handle bulk transfer operations

### Business Logic Handlers

#### **Transfer Request Processors**
- **bulkTransferRequestProcessor**: Handles bulk reservation transfers
- **blockTransferRequestProcessor**: Manages block transfer operations
- **transferRequestProcessor**: Processes individual transfer requests

#### **State Management Handlers**
- **initialTransferState**: Sets up initial transfer state
- **finalTransferState**: Handles transfer completion and cleanup
- **sendVendorTransfer**: Manages vendor-specific transfer logic

#### **Vendor Integration Handlers**
- **authorizeVendor**: Handles vendor authorization
- **sendResultToVendor**: Sends transfer results back to vendors
- **transformVendorRequest/Response**: Data transformation for vendor APIs

### Infrastructure Components

#### **CDK Stacks**
- **Main Stack** (`lib/stack.ts`): Primary infrastructure definition
- **Callbacks Stack** (`lib/callbacksStack.ts`): Callback processing infrastructure
- **Application** (`lib/application.ts`): CDK application entry point

#### **AWS Resources**
- **API Gateway**: REST API endpoints
- **Lambda Functions**: Serverless compute
- **Step Functions**: Workflow orchestration
- **DynamoDB**: Data persistence
- **SQS**: Message queuing
- **EventBridge**: Event routing
- **S3**: File storage
- **CloudWatch**: Logging and monitoring

## Data Flow

### Synchronous Transfer Flow
1. **API Request**: Client sends transfer request to API Gateway
2. **Authentication**: Request validated using JWT/API key
3. **Processing**: Transfer request processed by appropriate handler
4. **Vendor Communication**: Data sent to vendor system
5. **Response**: Immediate response returned to client

### Asynchronous Transfer Flow
1. **Queue Request**: Transfer request queued for later processing
2. **Step Function**: Workflow initiated for complex transfers
3. **State Management**: Transfer state tracked through multiple steps
4. **Vendor Integration**: Data transformed and sent to vendor
5. **Callback Processing**: Vendor responses processed asynchronously
6. **Completion**: Final state updated and notifications sent

### Bulk Transfer Flow
1. **Bulk Request**: Large batch of transfers submitted
2. **Decomposition**: Bulk request broken into individual transfers
3. **Parallel Processing**: Multiple transfers processed concurrently
4. **Aggregation**: Results collected and consolidated
5. **Reporting**: Bulk transfer status reported back

## Design Patterns

### **Event-Driven Architecture**
- Uses EventBridge for decoupled communication
- Enables reactive processing of vendor events
- Supports scalable event processing

### **Command Query Responsibility Segregation (CQRS)**
- Separate handlers for read and write operations
- Optimized data access patterns
- Clear separation of concerns

### **Saga Pattern**
- Step Functions implement distributed transactions
- Handles complex multi-step workflows
- Provides compensation logic for failures

### **Adapter Pattern**
- Vendor-specific transformers handle API differences
- Standardized internal data models
- Pluggable vendor integrations

### **Circuit Breaker Pattern**
- Protects against vendor system failures
- Implements retry logic with exponential backoff
- Graceful degradation of service

## Module Structure

```
lib/
├── application.ts              # CDK application entry point
├── stack.ts                   # Main infrastructure stack
├── callbacksStack.ts          # Callbacks infrastructure
├── config/                    # Configuration management
├── resources/                 # AWS resource definitions
└── lambdas/
    ├── api/                   # External API clients
    ├── handlers/              # Business logic handlers
    │   ├── events/           # Event processing
    │   ├── helpers/          # Utility functions
    │   ├── transformers/     # Data transformation
    │   └── transporters/     # Vendor communication
    ├── model/                # Data models and types
    │   ├── amadeus.ts        # Amadeus vendor models
    │   ├── derbySoft.ts      # DerbySoft vendor models
    │   ├── hilton.ts         # Hilton vendor models
    │   ├── ohip.ts           # OHIP vendor models
    │   ├── shiji.ts          # Shiji vendor models
    │   ├── types.ts          # Common type definitions
    │   └── constants.ts      # Application constants
    └── utils/                # Shared utilities
```

## Scalability Considerations

### **Horizontal Scaling**
- Lambda functions scale automatically based on demand
- SQS queues handle variable message loads
- DynamoDB provides consistent performance at scale

### **Performance Optimization**
- Connection pooling for external API calls
- Caching of frequently accessed data
- Optimized data serialization

### **Resource Management**
- Lambda memory and timeout tuning
- DynamoDB capacity planning
- SQS visibility timeout optimization

## Security Architecture

### **Authentication & Authorization**
- JWT token validation for API access
- API key authentication for vendor systems
- IAM roles for AWS service access

### **Data Protection**
- Encryption at rest and in transit
- Secure parameter storage in SSM
- VPC isolation for sensitive operations

### **Audit & Compliance**
- Comprehensive logging of all operations
- Transfer audit trails
- Compliance with data protection regulations
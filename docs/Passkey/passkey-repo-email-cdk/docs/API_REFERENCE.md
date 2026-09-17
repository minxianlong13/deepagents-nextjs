# API Reference

## Overview

The Passkey Email CDK service provides a set of Lambda function APIs that work together through AWS Step Functions to process email events. The APIs are designed for internal service-to-service communication and are not exposed as REST endpoints.

## Lambda Function Interfaces

### Email Event Scheduler Lambda

**Purpose**: Schedules email events for processing based on business rules and timing requirements.

**Input Event Schema**:
```typescript
interface SchedulerInput {
  emailSetupId: string;
  taskStartedBy: string;
  associatedParticipantId: number;
  campaignType?: CampaignType;
  configStrategy: ConfigStrategy;
  initializationType: InitializationType;
  configStrategyContext: BaseContext;
  recipientStrategy?: RecipientStrategy;
  recipientStrategyContext?: RecipientStrategyContext;
  postProcessingCallbacks?: Array<PostProcessingCallback>;
}
```

**Output Schema**:
```typescript
interface SchedulerOutput {
  success: boolean;
  queuedEventId?: string;
  scheduledTime?: string;
  error?: string;
}
```

### Pre-processing Lambda

**Purpose**: Validates and prepares email events for processing.

**Input Event Schema**:
```typescript
interface PreProcessingInput<T extends BaseContext> {
  emailSetupId: string;
  taskStarted: string;
  taskStartedBy: string;
  associatedParticipantId: number;
  campaignType?: CampaignType;
  configStrategy: ConfigStrategy;
  initializationType: InitializationType;
  configStrategyContext: T;
  recipientStrategy?: RecipientStrategy;
  recipientStrategyContext?: RecipientStrategyContext;
  postProcessingCallbacks?: Array<PostProcessingCallback>;
}
```

**Output Schema**:
```typescript
interface PreProcessingOutput {
  recipientEvents: Recipient[];
  taskStartedBy: string;
  recipientStrategy: RecipientStrategy;
  initializationType: InitializationType;
  postProcessingCallback?: Array<PostProcessingCallback>;
  associatedParticipantId: number;
  smartEmailSetupId?: number;
}
```

**Error Handling**:
- Validation errors result in Step Function failure
- Invalid recipients are filtered out with logging
- Configuration errors trigger failure Lambda

### Processing Lambda

**Purpose**: Processes individual email events for each recipient.

**Input Event Schema**:
```typescript
interface ProcessingInput {
  recipientDataId: string;
  emailSetupId: string;
  taskStarted: string;
  smartEmailSetupId?: number;
  iterationIndex: number;
}
```

**Output Schema**:
```typescript
interface ProcessingOutput {
  success: boolean;
  recipientDataId: string;
  emailBodies?: ResolvedEmailBodies;
  error?: string;
  retryable?: boolean;
}
```

**Email Bodies Schema**:
```typescript
interface ResolvedEmailBodies {
  emailHtmlBody?: string;
  emailTextBody?: string;
  emailSubjectLine?: string;
}
```

### Post-processing Lambda

**Purpose**: Handles cleanup and finalization tasks after email processing.

**Input Event Schema**:
```typescript
interface PostProcessingInput {
  recipientEvents: Recipient[];
  postProcessingCallback?: PostProcessingCallback[];
  emailSetupId: string;
  taskStarted: string;
  taskStartedBy: string;
  recipientStrategy: RecipientStrategy;
  initializationType: InitializationType;
  associatedParticipantId: number;
  smartEmailSetupId?: number;
}
```

**Output Schema**:
```typescript
interface PostProcessingOutput {
  success: boolean;
  processedCount: number;
  failedCount: number;
  callbacksExecuted: number;
  error?: string;
}
```

### Process Email Event Consumer Lambda

**Purpose**: Consumes email events from SQS queue and triggers Step Functions.

**Input Event Schema** (SQS Event):
```typescript
interface SQSEvent {
  Records: Array<{
    messageId: string;
    receiptHandle: string;
    body: string; // JSON string containing email event
    attributes: {
      ApproximateReceiveCount: string;
      SentTimestamp: string;
      SenderId: string;
      ApproximateFirstReceiveTimestamp: string;
    };
    messageAttributes: Record<string, any>;
    md5OfBody: string;
    eventSource: string;
    eventSourceARN: string;
    awsRegion: string;
  }>;
}
```

**Output Schema**:
```typescript
interface ConsumerOutput {
  processedMessages: number;
  failedMessages: number;
  stepFunctionExecutions: Array<{
    executionArn: string;
    status: string;
  }>;
}
```

### Failure Lambda

**Purpose**: Handles general failure scenarios with appropriate recovery strategies.

**Input Event Schema**:
```typescript
interface FailureInput {
  error: {
    Error: string;
    Cause: string;
  };
  originalInput: any;
  executionContext: {
    executionArn: string;
    stateMachineName: string;
    stepName: string;
  };
}
```

**Output Schema**:
```typescript
interface FailureOutput {
  handled: boolean;
  retryable: boolean;
  notificationSent: boolean;
  error: string;
}
```

### Single Instance Failure Lambda

**Purpose**: Handles failures specific to individual recipient processing.

**Input Event Schema**:
```typescript
interface SingleInstanceFailureInput {
  processingError: {
    Error: string;
    Cause: string;
  };
  recipientDataId: string;
  emailSetupId: string;
  taskStarted: string;
  iterationIndex: number;
}
```

**Output Schema**:
```typescript
interface SingleInstanceFailureOutput {
  handled: boolean;
  recipientDataId: string;
  retryAttempted: boolean;
  error: string;
}
```

## Common Data Types

### Recipient
```typescript
interface Recipient {
  emailAddress?: string;
  recipientName?: string;
  smartEmailUserId?: number;
  recipientDataId?: string;
}
```

### PostProcessingCallback
```typescript
interface PostProcessingCallback {
  callback?: Callback;
  callbackContext?: CallbackContext;
}

interface CallbackContext {
  pkUserId: number;
}
```

### Service Configuration
```typescript
interface ServiceConfig {
  endpoint: string;
  version: string;
}
```

### Tag Resolution Context
```typescript
interface TagResolutionContext {
  id: number;
  contextType?: TagResolutionContextType;
  complexContextType?: ComplexTagResolutionContextType;
}

enum TagResolutionContextType {
  EVENT = 'EVENT',
  HOTEL = 'HOTEL',
  RECIPIENT = 'RECIPIENT',
  REQUEST = 'REQUEST'
}

enum ComplexTagResolutionContextType {
  BR_SUMMARY = 'BR_SUMMARY'
}
```

## Enumerations

### ConfigStrategy
Defines the configuration strategy for email processing:
- `SMART_CAMPAIGN_METADATA`
- `DEFAULT_CAMPAIGN_FIELDS`
- `CUSTOM_CONFIGURATION`

### RecipientStrategy
Defines how recipients are determined:
- `SUBMITTED_REQUEST_PLANNERS`
- `CUSTOM_RECIPIENTS`
- `EVENT_PARTICIPANTS`

### InitializationType
Defines the initialization type for email processing:
- `IMMEDIATE`
- `SCHEDULED`
- `TRIGGERED`

### CampaignType
Defines the type of email campaign:
- `MARKETING`
- `TRANSACTIONAL`
- `NOTIFICATION`

### Callback
Defines post-processing callback types:
- `UPDATE_STATUS`
- `SEND_NOTIFICATION`
- `LOG_COMPLETION`

## Step Functions Integration

### State Machine Input
The Step Functions state machine expects the following input format:
```typescript
interface StateMachineInput {
  emailSetupId: string;
  taskStarted: string;
  taskStartedBy: string;
  associatedParticipantId: number;
  campaignType?: CampaignType;
  configStrategy: ConfigStrategy;
  initializationType: InitializationType;
  configStrategyContext: BaseContext;
  recipientStrategy?: RecipientStrategy;
  recipientStrategyContext?: RecipientStrategyContext;
  postProcessingCallbacks?: Array<PostProcessingCallback>;
}
```

### State Machine Output
```typescript
interface StateMachineOutput {
  success: boolean;
  processedRecipients: number;
  failedRecipients: number;
  emailSetupId: string;
  taskStarted: string;
  executionTime: number;
  error?: string;
}
```

## Error Handling

### Error Response Format
All Lambda functions return errors in a consistent format:
```typescript
interface ErrorResponse {
  error: string;
  errorCode: string;
  retryable: boolean;
  details?: any;
  timestamp: string;
  correlationId: string;
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `CONFIGURATION_ERROR`: Invalid configuration
- `EXTERNAL_SERVICE_ERROR`: External service call failed
- `DATABASE_ERROR`: DynamoDB operation failed
- `TEMPLATE_ERROR`: Email template processing failed
- `RECIPIENT_ERROR`: Recipient processing failed

### Retry Behavior
- **Retryable Errors**: Automatically retried by Step Functions with exponential backoff
- **Non-retryable Errors**: Immediately fail and trigger failure handling
- **Maximum Retries**: 3 attempts with 2-second initial delay

## Environment Variables

All Lambda functions expect the following environment variables:

### Database Configuration
- `tableName`: DynamoDB table name for email task logs
- `automationAdminTable`: DynamoDB table name for automation configuration

### Service Endpoints
- `smartCampCfgEndpoint`: Smart campaign configuration service endpoint
- `smartCampCfgVersion`: Smart campaign configuration service version
- `eventEndpoint`: Event service endpoint
- `eventVersion`: Event service version
- `businessTextEndpoint`: Business text service endpoint
- `businessTextVersion`: Business text service version
- `autoblockDataEndpoint`: Autoblock data service endpoint
- `autoblockDataVersion`: Autoblock data service version
- `passkeyPlannersEndpoint`: Passkey planners service endpoint
- `passkeyPlannersVersion`: Passkey planners service version

### Configuration
- `cventSubEnv`: Cvent sub-environment (sandbox, ci, production)
- `authorizedEmailDomains`: Comma-separated list of authorized email domains
- `automationParticipants`: Comma-separated list of automation participant IDs

### Experiment Service
- `experimentServiceEndpoint`: Experiment service endpoint
- `experimentServiceEtcd`: Experiment service etcd configuration
- `experimentEnvKey`: Experiment environment key

## Monitoring and Logging

### Correlation IDs
All API calls include correlation IDs for distributed tracing:
- Generated at the entry point (Consumer Lambda)
- Propagated through all Lambda function calls
- Logged with all operations for traceability

### Metrics
Each Lambda function emits custom CloudWatch metrics:
- `ProcessingTime`: Time taken to process the request
- `SuccessCount`: Number of successful operations
- `ErrorCount`: Number of failed operations
- `RetryCount`: Number of retry attempts

### Structured Logging
All logs follow a structured format:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "correlationId": "abc123-def456",
  "service": "pre-processing-lambda",
  "message": "Processing email event",
  "emailSetupId": "email-123",
  "recipientCount": 5
}
```
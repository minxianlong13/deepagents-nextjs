# Domain Model

## Glossary

### Email Setup
A configuration entity that defines how an email campaign should be processed, including template information, recipient strategies, and processing rules.

### Email Task Log
A persistent record of email processing activities stored in DynamoDB, used for tracking, auditing, and debugging email operations.

### Recipient
An individual who will receive an email, identified by email address, name, and associated metadata such as Smart Email User ID.

### Config Strategy
A pattern that determines how email configuration is resolved, such as using smart campaign metadata, default campaign fields, or custom configuration.

### Recipient Strategy
A pattern that determines how the list of email recipients is built, such as from submitted request planners, custom recipient lists, or event participants.

### Initialization Type
The method by which email processing is triggered - immediately, scheduled for later, or triggered by an external event.

### Campaign Type
The classification of the email campaign (marketing, transactional, or notification) which affects processing rules and compliance requirements.

### Post-processing Callback
An action to be executed after email processing completes, such as updating status, sending notifications, or logging completion.

### Tag Resolution Context
The contextual information needed to resolve dynamic tags in email templates, categorized by type (event, hotel, recipient, request).

### Smart Email Setup
An identifier linking the email processing to Smart Email system configurations for template and delivery management.

### Business Text
Localized text content stored in the business text service, used for dynamic content in email templates.

### Automation Admin
Configuration data for automated email processes, stored separately from regular email task logs.

### Correlation ID
A unique identifier that tracks a request through all processing steps, enabling distributed tracing and debugging.

## Core Entities

### EmailSetup
**Description**: Represents a complete email processing configuration

**Attributes**:
- `emailSetupId`: string - Unique identifier for the email setup
- `taskStarted`: string - ISO timestamp when processing began
- `taskStartedBy`: string - Identifier of the user/system that initiated the task
- `associatedParticipantId`: number - ID of the participant associated with this email
- `campaignType`: CampaignType - Type of email campaign (optional)
- `configStrategy`: ConfigStrategy - Strategy for resolving email configuration
- `initializationType`: InitializationType - How the email processing was initiated
- `configStrategyContext`: BaseContext - Context data for configuration resolution
- `recipientStrategy`: RecipientStrategy - Strategy for determining recipients (optional)
- `recipientStrategyContext`: RecipientStrategyContext - Context data for recipient resolution (optional)
- `postProcessingCallbacks`: Array<PostProcessingCallback> - Actions to execute after processing (optional)

**Relationships**:
- Has many Recipients
- Has many PostProcessingCallbacks
- References SmartEmailSetup (optional)

### Recipient
**Description**: Represents an individual email recipient

**Attributes**:
- `emailAddress`: string - Email address of the recipient (optional)
- `recipientName`: string - Display name of the recipient (optional)
- `smartEmailUserId`: number - ID in the Smart Email system (optional)
- `recipientDataId`: string - Unique identifier for this recipient's data (optional)

**Relationships**:
- Belongs to EmailSetup
- May have associated TagResolutionContext

### EmailTaskLog
**Description**: Persistent record of email processing activities

**Attributes**:
- `taskId`: string - Unique identifier for the task
- `emailSetupId`: string - Reference to the email setup
- `status`: string - Current status of the task
- `createdAt`: string - ISO timestamp of creation
- `updatedAt`: string - ISO timestamp of last update
- `recipientCount`: number - Total number of recipients
- `processedCount`: number - Number of successfully processed recipients
- `failedCount`: number - Number of failed recipients
- `errorDetails`: string - Details of any errors encountered (optional)

**Relationships**:
- References EmailSetup
- May have multiple processing attempts

### PostProcessingCallback
**Description**: Represents an action to be executed after email processing

**Attributes**:
- `callback`: Callback - Type of callback to execute
- `callbackContext`: CallbackContext - Context data for the callback (optional)

**Relationships**:
- Belongs to EmailSetup
- May reference external systems

### CallbackContext
**Description**: Context information for post-processing callbacks

**Attributes**:
- `pkUserId`: number - Passkey user ID for callback context

### TagResolutionContext
**Description**: Context information for resolving dynamic tags in email templates

**Attributes**:
- `id`: number - Identifier for the context entity
- `contextType`: TagResolutionContextType - Type of context (event, hotel, recipient, request) (optional)
- `complexContextType`: ComplexTagResolutionContextType - Type for complex HTML tags (optional)

**Relationships**:
- May be associated with Recipients
- References external entities based on contextType

### ServiceConfig
**Description**: Configuration for external service endpoints

**Attributes**:
- `endpoint`: string - Service endpoint URL
- `version`: string - API version to use

**Relationships**:
- Used by various processing strategies

## Business Rules

### Email Processing Workflow
1. **Initialization**: Email setup is created with required configuration
2. **Pre-processing**: Recipients are resolved and validated based on recipient strategy
3. **Processing**: Each recipient is processed individually with template resolution
4. **Post-processing**: Cleanup tasks and callbacks are executed
5. **Completion**: Task status is updated and metrics are recorded

### Recipient Resolution Rules
- **Submitted Request Planners**: Recipients are determined from submitted booking requests
- **Custom Recipients**: Recipients are provided explicitly in the request
- **Event Participants**: Recipients are determined from event participant lists

### Configuration Resolution Rules
- **Smart Campaign Metadata**: Configuration is retrieved from Smart Campaign system
- **Default Campaign Fields**: Standard default values are used
- **Custom Configuration**: Configuration is provided in the request

### Validation Rules
- Email addresses must be valid and from authorized domains
- Recipient data ID must be unique within an email setup
- Configuration strategy context must match the selected strategy
- Post-processing callbacks must have valid callback types

### Error Handling Rules
- Validation errors are non-retryable and fail immediately
- External service errors are retryable with exponential backoff
- Individual recipient failures don't fail the entire batch
- Critical errors trigger failure Lambda functions

### Retry Logic Rules
- Maximum of 3 retry attempts for retryable errors
- Exponential backoff starting with 2-second delay
- Different retry strategies for different error types
- Dead letter queue for messages that exceed retry limits

### Data Persistence Rules
- All email task logs are persisted to DynamoDB
- Task status is updated at each processing stage
- Error details are logged for debugging purposes
- Correlation IDs are maintained throughout the process

### Security Rules
- All Lambda functions run with least privilege IAM policies
- Sensitive configuration is stored in Parameter Store
- Email domains are validated against authorized list
- Access to external services requires proper authentication

### Performance Rules
- Processing Lambda functions have 2-minute timeout
- Maximum concurrency is configurable per environment
- DynamoDB operations use consistent read/write patterns
- Step Functions provide automatic scaling and throttling

### Monitoring Rules
- All operations emit CloudWatch metrics
- Structured logging with correlation IDs
- Error rates and processing times are tracked
- Alerts are configured for critical failures

## State Transitions

### Email Task Status States
1. **INITIALIZED**: Task has been created but not started
2. **PRE_PROCESSING**: Recipients are being resolved and validated
3. **PROCESSING**: Individual recipients are being processed
4. **POST_PROCESSING**: Cleanup and callbacks are being executed
5. **COMPLETED**: All processing has finished successfully
6. **FAILED**: Processing has failed and cannot be retried
7. **RETRYING**: Processing is being retried after a failure

### Recipient Processing States
1. **PENDING**: Recipient is queued for processing
2. **PROCESSING**: Recipient is currently being processed
3. **COMPLETED**: Recipient processing completed successfully
4. **FAILED**: Recipient processing failed
5. **SKIPPED**: Recipient was skipped due to validation issues

## Data Relationships

### Primary Relationships
- EmailSetup → Recipients (1:many)
- EmailSetup → PostProcessingCallbacks (1:many)
- EmailSetup → EmailTaskLog (1:1)
- Recipient → TagResolutionContext (1:many)

### Reference Relationships
- EmailSetup → SmartEmailSetup (via smartEmailSetupId)
- TagResolutionContext → External Entities (via id and contextType)
- PostProcessingCallback → External Systems (via callbackContext)

### Temporal Relationships
- EmailTaskLog tracks the lifecycle of EmailSetup processing
- Processing attempts are recorded with timestamps
- Retry attempts maintain relationship to original processing attempt

## Integration Points

### External Services
- **Smart Campaign Service**: Provides email template and configuration data
- **Event Service**: Provides event and participant information
- **Business Text Service**: Provides localized text content
- **Autoblock Data Service**: Provides blocking and filtering rules
- **Passkey Planners Service**: Provides planner and contact information
- **Experiment Service**: Provides A/B testing configuration

### Data Stores
- **DynamoDB**: Primary storage for email task logs and automation configuration
- **Parameter Store**: Secure storage for API keys and sensitive configuration
- **SQS**: Message queuing for reliable email event processing

### Monitoring Systems
- **CloudWatch**: Metrics, logs, and alarms
- **Datadog**: Application performance monitoring and distributed tracing
- **Step Functions**: Workflow execution monitoring and visualization
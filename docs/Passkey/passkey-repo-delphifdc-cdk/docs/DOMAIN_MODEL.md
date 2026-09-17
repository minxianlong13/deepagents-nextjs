# Domain Model

## Glossary

### CDK (Cloud Development Kit)
AWS CDK is a software development framework for defining cloud infrastructure in code and provisioning it through AWS CloudFormation. In this context, it's used to define DynamoDB tables and IAM roles for the passkey-delphifdc service.

### Delphi.fdc (File Data Collector)
A component of the Passkey platform responsible for collecting and processing file data. The "fdc" stands for File Data Collector, and it handles tasks related to file ingestion, processing, and management.

### DynamoDB
Amazon's fully managed NoSQL database service used for storing application data with single-digit millisecond performance. In this project, it stores tasks, notifications, history, and error records.

### ECS (Elastic Container Service)
AWS container orchestration service that runs the passkey-delphifdc service. The CDK creates IAM roles that ECS tasks assume to access DynamoDB tables.

### Ephemeral Environment
Temporary infrastructure environments (like CI) that are created for testing and automatically destroyed after use. These environments use DESTROY removal policies for easy cleanup.

### Hogan Environment
Cvent's internal environment naming system that maps to specific AWS accounts and regions. Examples include pr50, sg50, ts50 for production regions.

### IAM (Identity and Access Management)
AWS service for managing access to AWS resources. This CDK creates IAM roles with specific permissions to access DynamoDB tables.

### Passkey Platform
Cvent's hospitality platform that manages hotel inventory, rates, and availability. The delphifdc component handles file-based data collection within this platform.

### Stack
A unit of deployment in AWS CDK that groups related AWS resources. This project uses two stacks: one for DynamoDB tables and one for IAM roles.

### TTL (Time To Live)
DynamoDB feature that automatically deletes items after a specified time period. Used for automatic cleanup of processed tasks, notifications, and historical records.

## Core Entities

### Application
**Description**: The root CDK application that orchestrates the creation and configuration of all infrastructure stacks.

**Attributes**:
- `mainStack`: PasskeyDelphiFDCStack - Contains IAM roles and policies
- `dynamoDBStack`: PasskeyDelphiFDCDynamoDBStack - Contains DynamoDB tables

**Relationships**:
- Contains two child stacks with dependency relationship
- Manages environment-specific configuration and tagging

### Stack (Infrastructure Unit)
**Description**: A logical grouping of AWS resources that are deployed together as a single unit.

**Types**:
- **DynamoDB Stack**: Contains persistent data storage resources
- **Main Stack**: Contains access control and compute resources

**Attributes**:
- `id`: string - Unique identifier within the application
- `props`: StackProps - Configuration including environment and region
- `tags`: TagManager - Resource tagging for cost allocation and management

**Relationships**:
- Main Stack depends on DynamoDB Stack for table ARN references
- Both stacks belong to the same Application

### DynamoDB Table
**Description**: NoSQL database table that stores application data with automatic scaling and management.

**Common Attributes**:
- `tableName`: string - Environment-specific table name
- `partitionKey`: 'key' (String) - Primary key for item identification
- `encryption`: AWS_MANAGED - Encryption at rest using AWS managed keys
- `pointInTimeRecovery`: boolean - Backup and restore capability
- `timeToLiveAttribute`: 'ttl' - Automatic item expiration
- `billingMode`: PAY_PER_REQUEST - On-demand pricing model

**Relationships**:
- Referenced by IAM policies for access control
- Grouped within DbStructure construct

### Task
**Description**: Represents a file processing job or operation within the Delphi.fdc system.

**Storage**: `passkey-dfdc-tasks-{environment}` table

**Key Attributes**:
- `key`: string - Unique task identifier (partition key)
- `ttl`: number - Expiration timestamp for automatic cleanup
- Additional attributes defined by the passkey-delphifdc service

**Lifecycle**:
1. Created when file processing is initiated
2. Updated with progress and status information
3. Automatically deleted after TTL expiration

### Notification
**Description**: Messages and alerts generated during file processing operations.

**Storage**: `passkey-dfdc-notifications-{environment}` table

**Key Attributes**:
- `key`: string - Unique notification identifier (partition key)
- `ttl`: number - Expiration timestamp
- Additional attributes for message content and delivery status

**Relationships**:
- May reference Tasks that generated the notification
- Used by notification delivery systems

### History Record
**Description**: Audit trail entries that track file processing activities and system events.

**Storage**: `passkey-dfdc-history-{environment}` table

**Key Attributes**:
- `key`: string - Unique history record identifier (partition key)
- `ttl`: number - Long-term retention with eventual expiration
- Additional attributes for audit information

**Purpose**:
- Compliance and audit requirements
- Troubleshooting and system analysis
- Performance monitoring and optimization

### Error Record
**Description**: Detailed information about processing failures and system errors.

**Storage**: `passkey-dfdc-errors-{environment}` table

**Key Attributes**:
- `key`: string - Unique error identifier (partition key)
- `ttl`: number - Error log retention period
- Additional attributes for error details and context

**Relationships**:
- May reference failed Tasks
- Used for error analysis and system monitoring

### IAM Role
**Description**: AWS identity that defines permissions for accessing AWS resources.

**Types**:
- **PasskeyDynamoDbRole**: Standard IAM role for ECS tasks
- **PasskeyDFDynamoDbRole**: ECS task role following Cvent conventions

**Attributes**:
- `assumedBy`: ServicePrincipal('ecs-tasks.amazonaws.com')
- `managedPolicies`: Cross-account KMS policy
- `inlinePolicies`: DynamoDB access permissions

**Permissions Granted**:
- Read operations: GetItem, BatchGetItem, Query, Scan
- Write operations: PutItem, BatchWriteItem, UpdateItem, DeleteItem
- Scope: Limited to specific table ARNs

## Business Rules

### Environment Naming
- Production environments (ts50, sg50, pr50) use cventEnvironment for table naming
- Other environments use hoganEnvironment for table naming
- CI environments are treated as ephemeral with automatic cleanup

### Resource Lifecycle
- **Persistent Environments**: DynamoDB tables use RETAIN removal policy
- **Ephemeral Environments**: All resources use DESTROY removal policy
- **TTL Configuration**: All tables have TTL enabled for automatic data cleanup

### Access Control
- ECS tasks can only access tables in their specific environment
- No cross-environment access is permitted
- Permissions follow least-privilege principle with specific table ARNs

### Tagging Strategy
- All resources tagged with business unit, platform, product information
- Environment-specific tags for cost allocation
- Consistent tagging across all stacks and resources

### Stack Dependencies
- Main Stack cannot be deployed without DynamoDB Stack
- IAM policies reference table ARNs from DynamoDB Stack
- Deployment order: DynamoDB Stack → Main Stack

### Error Handling
- Failed deployments can be rolled back independently by stack
- Ephemeral environments can be completely destroyed and recreated
- Point-in-time recovery available for production table restoration

## Data Patterns

### Partition Key Strategy
All tables use a simple partition key pattern with 'key' as the partition key name. This provides:
- Even distribution of data across partitions
- Simple access patterns for the application
- Consistent querying approach across all tables

### TTL Implementation
Time-to-live attributes enable automatic data cleanup:
- Reduces storage costs over time
- Maintains system performance by removing old data
- Supports compliance requirements for data retention

### Cross-Account Integration
- KMS policies enable encryption key access across AWS accounts
- Supports Cvent's multi-account AWS architecture
- Maintains security boundaries while enabling necessary access

## Environment Mapping

### Production Regions
- **pr50**: Primary production (US East)
- **pr51**: Secondary production (US East)
- **sg50**: Singapore production (Asia Pacific)
- **ts50**: Test/staging environment

### Development Regions
- **alpha**: Alpha testing environment
- **ct50**: Customer testing environment
- **it50**: Integration testing environment
- **ci**: Continuous integration (ephemeral)

### Special Handling
Certain production environments (ts50, sg50, pr50) use the cventEnvironment name instead of hoganEnvironment for database naming to maintain consistency with existing systems.
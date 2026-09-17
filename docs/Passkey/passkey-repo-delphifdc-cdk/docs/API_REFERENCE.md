# API Reference

## Overview

This document describes the CDK constructs, interfaces, and classes that make up the Passkey Delphifdc CDK. Since this is an infrastructure project, the "API" refers to the programmatic interfaces for defining and deploying AWS resources.

## Core Classes

### Application

**File**: `cdk/lib/application.ts`

The main CDK application class that orchestrates stack creation and configuration.

#### Constructor
```typescript
constructor(id: string, props: ApplicationProps)
```

**Parameters**:
- `id`: string - Unique identifier for the application
- `props`: ApplicationProps - Configuration properties

#### Properties
- `mainStack`: PasskeyDelphiFDCStack - The main stack containing IAM resources
- `dynamoDBStack`: PasskeyDelphiFDCDynamoDBStack - The database stack containing DynamoDB tables

#### Methods

##### addTags(props: ApplicationProps): void
Applies consistent tags to all stacks based on environment configuration.

##### ephemeralizeStacks(props: ApplicationProps): void
Configures stacks for automatic cleanup in CI environments.

##### generateTags(props: ApplicationProps): [string, string][]
**Static method** - Generates standardized tags for AWS resources.

##### isCiEnvironment(props: ApplicationProps): boolean
**Static method** - Determines if the current environment is CI.

### ApplicationProps

**Interface** for Application constructor parameters.

```typescript
interface ApplicationProps {
  readonly version?: string;           // Optional version identifier
  readonly awsEnvironment: Environment; // AWS account and region
  readonly cventEnvironment: string;   // Cvent environment name
  readonly hoganEnvironment: Env;      // Hogan environment configuration
}
```

### PasskeyDelphiFDCStack

**File**: `cdk/lib/stack.ts`

Main stack that creates IAM roles and policies for DynamoDB access.

#### Constructor
```typescript
constructor(
  scope: Construct, 
  id: string, 
  dbStructure: DbStructure, 
  props?: PasskeyDelphiFDCStackProps
)
```

**Parameters**:
- `scope`: Construct - Parent construct
- `id`: string - Stack identifier
- `dbStructure`: DbStructure - Database structure containing table references
- `props`: PasskeyDelphiFDCStackProps - Stack configuration properties

#### Created Resources
- **PasskeyDynamoDbRole**: IAM role for ECS tasks
- **PasskeyDFDynamoDbRole**: ECS task role with Cvent conventions
- **DynamoDB Policies**: Attached to both roles with table-specific permissions

### PasskeyDelphiFDCDynamoDBStack

**File**: `cdk/lib/dynamodb-stack.ts`

Stack responsible for creating and managing DynamoDB tables.

#### Constructor
```typescript
constructor(scope: Construct, id: string, props: PasskeyDelphiFDCStackProps)
```

#### Properties
- `dbStructure`: DbStructure - Contains references to all created tables

#### Methods

##### getDbEnvName(props: PasskeyDelphiFDCStackProps): string
**Private method** - Determines the appropriate environment name for table naming.

### DbStructure

**File**: `cdk/lib/db-structure.ts`

Construct that creates and manages all DynamoDB tables with consistent configuration.

#### Constructor
```typescript
constructor(scope: Stack, environmentName: string, ttlAttributeName: string)
```

**Parameters**:
- `scope`: Stack - Parent stack
- `environmentName`: string - Environment suffix for table names
- `ttlAttributeName`: string - Name of the TTL attribute

#### Properties
- `tasks`: DynamoDB.Table - Tasks table
- `notifications`: DynamoDB.Table - Notifications table  
- `history`: DynamoDB.Table - History table
- `errors`: DynamoDB.Table - Errors table
- `ttlAttributeName`: string - TTL attribute name

#### Methods

##### makeTable(stack: Stack, tableDescription: any, ttlAttributeName: string): DynamoDB.Table
Creates a DynamoDB table with standard configuration.

**Table Configuration**:
- **Partition Key**: 'key' (String)
- **Encryption**: AWS_MANAGED
- **Point-in-Time Recovery**: Enabled
- **Billing Mode**: PAY_PER_REQUEST
- **TTL Attribute**: Configurable (default: 'ttl')

## Table Definitions

### Table Schema

All tables follow the same schema pattern:

```typescript
{
  tableName: string,    // Environment-specific name
  keyName: 'key'       // Partition key name
}
```

### Table Names by Environment

| Base Name | Environment | Full Table Name |
|-----------|-------------|-----------------|
| passkey-dfdc-tasks | pr50 | passkey-dfdc-tasks-pr50 |
| passkey-dfdc-notifications | pr50 | passkey-dfdc-notifications-pr50 |
| passkey-dfdc-history | pr50 | passkey-dfdc-history-pr50 |
| passkey-dfdc-errors | pr50 | passkey-dfdc-errors-pr50 |

### Table Purposes

#### Tasks Table
- **Purpose**: Stores file processing tasks and their status
- **Key Pattern**: Task identifiers
- **TTL**: Automatic cleanup of completed tasks

#### Notifications Table  
- **Purpose**: Manages notification messages and delivery status
- **Key Pattern**: Notification identifiers
- **TTL**: Cleanup of processed notifications

#### History Table
- **Purpose**: Maintains audit trail of file processing activities
- **Key Pattern**: Historical record identifiers
- **TTL**: Long-term retention with eventual cleanup

#### Errors Table
- **Purpose**: Tracks processing errors and failure details
- **Key Pattern**: Error record identifiers
- **TTL**: Error log retention and cleanup

## IAM Permissions

### DynamoDB Actions Granted

The following DynamoDB actions are granted to the ECS task roles:

```typescript
[
  'dynamodb:GetItem',        // Read single item
  'dynamodb:PutItem',        // Write single item
  'dynamodb:BatchGetItem',   // Read multiple items
  'dynamodb:BatchWriteItem', // Write multiple items
  'dynamodb:DeleteItem',     // Delete single item
  'dynamodb:Query',          // Query with partition key
  'dynamodb:Scan',           // Full table scan
  'dynamodb:UpdateItem'      // Update existing item
]
```

### Resource ARNs

Permissions are granted specifically to the table ARNs:
- `dbStructure.tasks.tableArn`
- `dbStructure.notifications.tableArn`
- `dbStructure.history.tableArn`
- `dbStructure.errors.tableArn`

## Environment Entry Points

### Production Environments

Each production environment has its own entry point file:

```typescript
// Example: cdk/bin/passkey-pr50.ts
import { Application } from '../lib/application';
import { getEnvironment } from '@cvent/environments';

const env = getEnvironment('pr50');
new Application('passkey-delphifdc', {
  awsEnvironment: env.aws,
  cventEnvironment: env.cvent,
  hoganEnvironment: env.hogan
});
```

### CI Environment

```typescript
// cdk/bin/ci.ts
import { Application } from '../lib/application';
import { getEnvironment } from '@cvent/environments';

const env = getEnvironment('ci');
new Application('passkey-delphifdc', {
  awsEnvironment: env.aws,
  cventEnvironment: 'ci',
  hoganEnvironment: env.hogan
});
```

## Stack Properties Interface

```typescript
interface PasskeyDelphiFDCStackProps extends StackProps {
  readonly cventEnvironment: string;
  readonly hoganEnvironment: Env;
}
```

## Deployment Commands

### CDK Commands
```bash
# Synthesize CloudFormation templates
cdk-cvent build

# Deploy to environment
cdk-cvent deploy

# Destroy environment
cdk-cvent destroy

# Test infrastructure
cdk-cvent test
```

### Environment-Specific Commands
```bash
# Sandbox deployment
pnpm sandbox:setup
pnpm sandbox:teardown

# CI deployment
pnpm ci:setup
pnpm ci:teardown
```

## Error Handling

### Lint Ignores
The following CDK lint rules are ignored for DynamoDB tables in ephemeral environments:
- **E9020**: No PointInTimeRecoverySpecification specified
- **E9022**: UpdateReplacePolicy/DeletionPolicy is not 'Retain'

These are ignored because ephemeral environments use DESTROY removal policies for easy cleanup.

## Dependencies

### External Dependencies
- `aws-cdk-lib`: AWS CDK core library
- `@cvent/cdk-lib`: Cvent CDK utilities
- `@cvent/environments`: Environment configuration
- `@cvent/cdk-applications`: Cvent application constructs

### Internal Dependencies
- Stack dependencies: DynamoDB Stack → Main Stack
- Resource dependencies: DbStructure tables → IAM role policies
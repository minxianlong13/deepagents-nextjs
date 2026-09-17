# Architecture

## System Overview

The Passkey Delphifdc CDK follows a multi-stack architecture pattern that separates database infrastructure from application-level IAM resources. This design enables independent lifecycle management of persistent data storage and ephemeral compute resources.

```
┌─────────────────────────────────────────────────────────────┐
│                    CDK Application                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  DynamoDB Stack     │    │    Main Stack               │ │
│  │                     │    │                             │ │
│  │  ┌───────────────┐  │    │  ┌─────────────────────────┐│ │
│  │  │ DbStructure   │  │    │  │ ECS Task Roles          ││ │
│  │  │ - Tasks       │  │    │  │ - PasskeyDynamoDbRole   ││ │
│  │  │ - Notifications│  │    │  │ - PasskeyDFDynamoDbRole ││ │
│  │  │ - History     │  │    │  │                         ││ │
│  │  │ - Errors      │  │    │  │ IAM Policies            ││ │
│  │  └───────────────┘  │    │  │ - DynamoDB Access       ││ │
│  └─────────────────────┘    │  │ - Cross-Account KMS     ││ │
│                             │  └─────────────────────────┘│ │
│                             └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Application Layer
- **Purpose**: Root CDK application that orchestrates stack creation and configuration
- **Location**: `cdk/lib/application.ts`
- **Key Classes**: `Application`
- **Responsibilities**:
  - Environment-specific stack naming
  - Tag management across all resources
  - Ephemeral environment handling for CI
  - Removal policy configuration for temporary environments

### DynamoDB Stack
- **Purpose**: Manages all DynamoDB table resources and their configuration
- **Location**: `cdk/lib/dynamodb-stack.ts`
- **Key Classes**: `PasskeyDelphiFDCDynamoDBStack`, `DbStructure`
- **Responsibilities**:
  - Creates four core DynamoDB tables
  - Configures TTL attributes for automatic cleanup
  - Manages table encryption and point-in-time recovery
  - Environment-specific table naming

### Main Stack
- **Purpose**: Provisions IAM roles and policies for service access
- **Location**: `cdk/lib/stack.ts`
- **Key Classes**: `PasskeyDelphiFDCStack`
- **Responsibilities**:
  - Creates ECS task execution roles
  - Configures DynamoDB access policies
  - Integrates with cross-account KMS policies
  - Manages service principal assumptions

### Database Structure
- **Purpose**: Defines the schema and configuration for all DynamoDB tables
- **Location**: `cdk/lib/db-structure.ts`
- **Key Classes**: `DbStructure`
- **Responsibilities**:
  - Table creation with consistent configuration
  - Partition key definition (all tables use 'key' as partition key)
  - TTL attribute configuration
  - Encryption and billing mode settings

## Data Flow

1. **Deployment Initiation**: Environment-specific entry points (`bin/*.ts`) initialize the application
2. **Stack Creation**: Application creates DynamoDB stack first, then Main stack with dependency
3. **Resource Provisioning**: 
   - DynamoDB tables are created with environment-specific names
   - IAM roles are created with references to table ARNs
   - Policies are attached granting appropriate DynamoDB permissions
4. **Service Integration**: The passkey-delphifdc-service assumes the created roles to access tables

## Design Patterns

### Stack Separation Pattern
- **Database Stack**: Contains stateful resources (DynamoDB tables)
- **Application Stack**: Contains stateless resources (IAM roles, policies)
- **Benefits**: Independent lifecycle management, easier rollbacks, clearer separation of concerns

### Environment Abstraction Pattern
- Uses `@cvent/environments` for consistent environment handling
- Maps Hogan environments to appropriate naming conventions
- Supports both permanent and ephemeral environments

### Infrastructure as Code Pattern
- All infrastructure defined in TypeScript
- Version controlled alongside application code
- Repeatable deployments across environments

### Least Privilege Access Pattern
- IAM roles granted only necessary DynamoDB permissions
- Specific table ARN references (no wildcard permissions)
- Cross-account KMS integration for encryption key access

## Module Structure

```
cdk/
├── bin/                    # Environment-specific entry points
│   ├── ci.ts              # CI environment
│   ├── passkey-*.ts       # Production environments
│   ├── cvent-sandbox.ts   # Sandbox environment
│   └── pipeline.ts        # Pipeline configuration
├── lib/                   # Core CDK constructs
│   ├── application.ts     # Main application orchestrator
│   ├── stack.ts          # Main stack with IAM resources
│   ├── dynamodb-stack.ts # DynamoDB infrastructure
│   ├── db-structure.ts   # Table definitions
│   └── props/            # TypeScript interfaces
└── test/                 # Unit tests
```

## Environment Handling

### Production Environments
- **passkey-alpha**: Alpha testing environment
- **passkey-ct50, it50, pr50, pr51, sg50, ts50**: Regional production environments
- Tables named with environment suffix (e.g., `passkey-dfdc-tasks-pr50`)

### Development Environments
- **ci**: Ephemeral CI environment with automatic cleanup
- **cvent-sandbox**: Developer sandbox environment
- Removal policies set to DESTROY for easy cleanup

### Environment Mapping
```typescript
// Special handling for production regions
const dbEnvName = ['ts50', 'sg50', 'pr50'].includes(hoganEnvironment) 
  ? cventEnvironment 
  : hoganEnvironment;
```

## Security Architecture

### IAM Role Structure
- **ECS Task Role**: For service runtime access to DynamoDB
- **Cross-Account KMS**: Access to encryption keys across AWS accounts
- **Service Principal**: ECS tasks service principal for role assumption

### Access Control
- Granular DynamoDB permissions (GetItem, PutItem, Query, Scan, etc.)
- Table-specific ARN references
- No administrative or destructive permissions granted

### Encryption
- DynamoDB tables use AWS-managed encryption
- Cross-account KMS policy integration
- Point-in-time recovery enabled for data protection
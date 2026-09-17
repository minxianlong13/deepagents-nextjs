# Technical Details

## Technology Stack

### Core Framework
- **AWS CDK**: v2.178.2 - Infrastructure as Code framework
- **TypeScript**: v4.5.4 - Primary programming language
- **Node.js**: v18.x - Runtime environment
- **AWS Lambda**: Serverless compute platform

### Build and Package Management
- **pnpm**: Package manager with workspace support
- **TypeScript Compiler**: Code compilation and type checking
- **Jest**: v30.0 - Testing framework
- **ESLint**: v7.31.0 - Code linting and style enforcement
- **Prettier**: v2.5.1 - Code formatting

### AWS Services
- **AWS Step Functions**: Workflow orchestration
- **Amazon SQS**: Message queuing (FIFO queues)
- **Amazon DynamoDB**: NoSQL database for task logs
- **AWS Lambda**: Serverless function execution
- **AWS IAM**: Identity and access management
- **AWS Systems Manager Parameter Store**: Configuration management
- **Amazon CloudWatch**: Monitoring and logging

### Development Tools
- **asdf**: Tool version management
- **npm-run-all**: Parallel script execution
- **Changesets**: Version management and changelog generation
- **SWC**: Fast TypeScript/JavaScript compiler
- **ts-jest**: TypeScript support for Jest

## Dependencies

### Production Dependencies

#### Core CDK and AWS
```json
{
  "@cvent/cdk-applications": "^1.44.10",
  "@cvent/cdk-lib": "^1.32.19",
  "@cvent/environments": "^1.46.51",
  "aws-cdk-lib": "^2.178.2",
  "constructs": "^10.4.3"
}
```

#### Lambda Runtime Dependencies
```json
{
  "@cvent/fetch": "1.0.27",
  "@cvent/hogan-client": "^2.1.2",
  "@cvent/logging": "1.0.17",
  "aws-sdk": "^2.1692.0",
  "dd-trace": "^4.55.0"
}
```

#### Testing Dependencies
```json
{
  "jest": "29.1.0",
  "jest-fetch-mock": "^3.0.3",
  "ts-jest": "29.4.5"
}
```

### Development Dependencies

#### Build Tools
```json
{
  "@cvent/builder-cdk": "^3.10.4",
  "@cvent/builder-changesets": "^1.3.1",
  "@cvent/builder-prettier": "^1.1.3",
  "@cvent/builder-sonar": "^4.1.0"
}
```

#### Code Quality
```json
{
  "@cvent/nucleus-eslint": "^3.2.3",
  "eslint": "^7.31.0",
  "prettier": "^2.5.1"
}
```

#### TypeScript Support
```json
{
  "@types/jest": "29.5.0",
  "@types/node": "^16.18.25",
  "typescript": "^4.5.4"
}
```

## Configuration

### Environment Variables

#### Database Configuration
- `tableName`: DynamoDB table name for email task logs
- `automationAdminTable`: DynamoDB table name for automation configuration

#### Service Endpoints
- `smartCampCfgEndpoint`: Smart campaign configuration service endpoint
- `smartCampCfgVersion`: Smart campaign configuration service API version
- `eventEndpoint`: Event service endpoint
- `eventVersion`: Event service API version
- `businessTextEndpoint`: Business text service endpoint
- `businessTextVersion`: Business text service API version
- `autoblockDataEndpoint`: Autoblock data service endpoint
- `autoblockDataVersion`: Autoblock data service API version
- `passkeyPlannersEndpoint`: Passkey planners service endpoint
- `passkeyPlannersVersion`: Passkey planners service API version

#### Environment Configuration
- `cventSubEnv`: Cvent sub-environment identifier (sandbox, ci, production)
- `authorizedEmailDomains`: Comma-separated list of authorized email domains
- `automationParticipants`: Comma-separated list of automation participant IDs

#### Experiment Service Configuration
- `experimentServiceEndpoint`: Experiment service endpoint
- `experimentServiceEtcd`: Experiment service etcd configuration
- `experimentEnvKey`: Experiment environment key

### CDK Configuration

#### Application Configuration (`emailProps.ts`)
```typescript
interface EmailProps {
  awsEnvironment: Environment;
  cventEnvironment: string;
  cventSubEnv: string;
  version: string;
  emailTaskLogTable: string;
  processEmailEventQueueName: string;
  processEmailEventStateMachineName: string;
  automationAdminTable: string;
  // Service configurations
  smartCampCfgDataConfig: ServiceConfig;
  eventConfig: ServiceConfig;
  businessTextConfig: ServiceConfig;
  autoblockDataConfig: ServiceConfig;
  passkeyPlannersConfig: ServiceConfig;
  experimentClientConfig: ExperimentConfig;
  // Processing configuration
  processEmailStepFunctionConfigs: ProcessingConfig;
  authorizedEmailDomains: string;
  automationParticipants: string;
  secretManagerExtARN: string;
}
```

#### Environment-Specific Naming
- **Sandbox/CI**: Resources include version in name for isolation
- **Production**: Resources use environment-specific naming without version
- **Tagging**: All resources tagged with environment, product, and business unit

### Lambda Configuration

#### Runtime Settings
- **Runtime**: Node.js 18.x
- **Memory**: 512 MB
- **Timeout**: 2 minutes
- **VPC**: Enabled for secure network access
- **Layers**: 
  - AWS Parameters and Secrets Lambda Extension
  - Datadog monitoring layer

#### IAM Policies
```typescript
const lambdaPolicyStatements = [
  // DynamoDB access
  {
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:DeleteItem',
      'dynamodb:UpdateItem',
      'dynamodb:Scan'
    ],
    resources: [emailTaskLogTableArn]
  },
  // Parameter Store access
  {
    actions: ['ssm:GetParameter'],
    resources: [apiKeyParameterArn, experimentServiceKeyArn]
  }
];
```

## Database Schema

### Email Task Log Table (DynamoDB)

#### Primary Key Structure
- **Partition Key**: `emailSetupId` (String)
- **Sort Key**: `taskStarted` (String, ISO timestamp)

#### Attributes
```typescript
interface EmailTaskLogItem {
  emailSetupId: string;           // Partition key
  taskStarted: string;            // Sort key (ISO timestamp)
  taskStartedBy: string;          // User/system that initiated
  associatedParticipantId: number; // Participant ID
  status: string;                 // Current processing status
  recipientCount?: number;        // Total recipients
  processedCount?: number;        // Successfully processed
  failedCount?: number;          // Failed recipients
  errorDetails?: string;         // Error information
  createdAt: string;             // Creation timestamp
  updatedAt: string;             // Last update timestamp
  ttl?: number;                  // TTL for automatic cleanup
}
```

#### Global Secondary Indexes
- **StatusIndex**: 
  - Partition Key: `status`
  - Sort Key: `updatedAt`
  - Purpose: Query tasks by status

### Automation Admin Table (DynamoDB)

#### Primary Key Structure
- **Partition Key**: `automationId` (String)
- **Sort Key**: `configType` (String)

#### Attributes
```typescript
interface AutomationAdminItem {
  automationId: string;          // Partition key
  configType: string;            // Sort key
  configData: any;               // Configuration payload
  isActive: boolean;             // Whether config is active
  createdAt: string;             // Creation timestamp
  updatedAt: string;             // Last update timestamp
}
```

## Monitoring & Logging

### CloudWatch Metrics

#### Custom Metrics
- `EmailProcessing.Duration`: Processing time per email setup
- `EmailProcessing.RecipientCount`: Number of recipients processed
- `EmailProcessing.SuccessRate`: Percentage of successful processing
- `EmailProcessing.ErrorRate`: Percentage of failed processing
- `StepFunction.ExecutionTime`: Step function execution duration
- `Lambda.ColdStart`: Lambda cold start occurrences

#### Metric Dimensions
- `Environment`: sandbox, ci, production
- `Service`: passkey-email-cdk
- `Version`: Deployment version
- `LambdaFunction`: Specific Lambda function name

### Structured Logging

#### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "passkey-email-cdk",
  "function": "pre-processing-lambda",
  "correlationId": "abc123-def456-ghi789",
  "emailSetupId": "email-setup-123",
  "message": "Processing email event",
  "metadata": {
    "recipientCount": 5,
    "configStrategy": "SMART_CAMPAIGN_METADATA",
    "processingTime": 1250
  }
}
```

#### Log Levels
- **ERROR**: System errors, failures, exceptions
- **WARN**: Recoverable errors, validation issues
- **INFO**: Normal processing events, status updates
- **DEBUG**: Detailed processing information (development only)

### Datadog Integration

#### APM Configuration
```typescript
addDatadog(lambdaFunction, {
  service: 'passkey-email-cdk',
  environment: props.cventEnvironment,
  version: props.version,
  addLayers: true
});
```

#### Custom Tags
- `service`: passkey-email-cdk
- `environment`: Environment name
- `version`: Deployment version
- `lambda_function`: Function name
- `config_strategy`: Configuration strategy used
- `recipient_strategy`: Recipient strategy used

## Build Process

### Workspace Configuration (`pnpm-workspace.yaml`)
```yaml
packages:
  - 'packages/*'
```

### Build Scripts
```json
{
  "build:ts": "tsc",
  "build:cdk": "cdk-cvent build --service passkey-email",
  "build": "run-s -ls build:*"
}
```

### Testing Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Code Quality

#### ESLint Configuration
```javascript
module.exports = {
  extends: ['@cvent/nucleus-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn'
  }
};
```

#### Prettier Configuration
```javascript
module.exports = {
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 120,
  tabWidth: 2
};
```

## Security

### IAM Roles and Policies

#### Lambda Execution Role
- **Managed Policies**:
  - `AWSLambdaVPCAccessExecutionRole`
  - `AWSXRayDaemonWriteAccess`
- **Custom Policies**:
  - DynamoDB table access (read/write)
  - Parameter Store access (read-only)
  - CloudWatch Logs access

#### Step Functions Execution Role
- **Permissions**:
  - Lambda function invocation
  - CloudWatch Logs access
  - X-Ray tracing

### Data Encryption

#### At Rest
- **DynamoDB**: Encrypted using AWS managed keys
- **Parameter Store**: Encrypted using AWS KMS
- **CloudWatch Logs**: Encrypted using AWS managed keys

#### In Transit
- **HTTPS**: All external service calls use HTTPS
- **TLS**: Internal AWS service communication uses TLS
- **VPC**: Lambda functions run in VPC for network isolation

### Access Control

#### API Keys
- Stored in AWS Systems Manager Parameter Store
- Retrieved using Lambda extension layer
- Cached for performance with automatic refresh

#### Email Domain Validation
- Configurable list of authorized email domains
- Validation performed during pre-processing
- Prevents unauthorized email sending

## Performance Optimization

### Lambda Optimization
- **Memory Allocation**: 512 MB for optimal price/performance
- **Timeout**: 2 minutes to handle complex processing
- **Connection Reuse**: HTTP connections reused across invocations
- **Layer Usage**: Common dependencies in Lambda layers

### DynamoDB Optimization
- **On-Demand Billing**: Automatic scaling based on demand
- **Query Patterns**: Optimized for common access patterns
- **TTL**: Automatic cleanup of old task logs
- **Consistent Reads**: Used only when necessary

### Step Functions Optimization
- **Map State**: Parallel processing of recipients
- **Error Handling**: Efficient retry and failure handling
- **Express Workflows**: For high-volume, short-duration workflows

### Caching Strategy
- **Parameter Store**: Values cached using Lambda extension
- **Service Responses**: Appropriate caching for external service calls
- **Template Compilation**: Compiled templates cached in memory

## Deployment Configuration

### Environment Management
- **Sandbox**: Development and testing
- **CI**: Continuous integration testing
- **Production**: Live production environment

### Resource Naming Strategy
```typescript
const resourceName = isCiOrSandbox 
  ? stackName(id, resourceType, version, suffix)
  : `passkey-email-${resourceType}-${environment}`;
```

### Tagging Strategy
```typescript
const tags = {
  Product: 'passkey-for-hotels',
  BusinessUnit: 'hospitality',
  Platform: 'passkey',
  Environment: environment,
  SubEnvironment: subEnvironment,
  Service: 'passkey-email-cdk',
  Version: version
};
```

### Ephemeral Resources
- **CI/Testing**: Resources automatically deleted after 1 day
- **Sandbox**: Manual cleanup required
- **Production**: Persistent resources with backup/retention policies
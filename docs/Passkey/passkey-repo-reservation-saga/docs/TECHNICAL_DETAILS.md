# Technical Details

## Technology Stack

- **Framework**: AWS CDK (Cloud Development Kit)
- **Language**: TypeScript
- **Runtime**: Node.js 18
- **Build Tool**: pnpm (monorepo workspace)
- **Database**: DynamoDB (Global Tables)
- **Message Queues**: SQS
- **Orchestration**: AWS Step Functions
- **API Gateway**: AWS API Gateway
- **Compute**: AWS Lambda

## Architecture Overview

The Passkey Reservation Saga is a TypeScript monorepo built with AWS CDK that orchestrates reservation workflows using the Saga pattern. It consists of multiple packages:

- `passkey-reservation-saga-cdk` - Infrastructure as Code
- `passkey-reservation-saga-lambdas` - Lambda function implementations
- `passkey-reservation-saga-common` - Shared utilities and types
- `passkey-reservation-saga-model` - Data models and schemas
- `passkey-reservation-consumer` - Event consumers
- `passkey-reservation-global-tables-cdk` - Global DynamoDB tables
- `sam` - Local development configuration

## Key Dependencies

### CDK Package Dependencies
```json
{
  "@cvent/cdk-applications": "^1.38.3",
  "@cvent/cdk-lib": "^1.28.0",
  "@cvent/environments": "^1.40.39",
  "@cvent/octopusdeploy-cdk": "^4.4.1",
  "@cvent/passkey-manage-api": "0.13.8",
  "aws-cdk-lib": "^2.209.1"
}
```

### Lambda Runtime Dependencies
```json
{
  "@aws-sdk/client-dynamodb": "3.329.0",
  "@aws-sdk/client-eventbridge": "^3.329.0",
  "@aws-sdk/client-lambda": "^3.329.0",
  "@aws-sdk/client-s3": "^3.329.0",
  "@aws-sdk/client-sfn": "^3.329.0",
  "@aws-sdk/client-sqs": "^3.329.0",
  "@aws-sdk/lib-dynamodb": "3.329.0",
  "@cvent/nucleus-networking": "^2.1.0",
  "@cvent/passkey-manage-api": "0.13.8",
  "@middy/core": "^2.5.7"
}
```

## Configuration

### Environment Variables
The service uses environment-specific configuration managed through:
- AWS Systems Manager Parameter Store
- Environment-specific CDK context
- Lambda environment variables

### Key Configuration Files
- `cdk.json` - CDK application configuration
- `catalog-info.yaml` - Backstage service catalog metadata
- `tsconfig.json` - TypeScript compiler configuration
- `jest.config.js` - Test configuration
- `.tool-versions` - Development tool versions (Node.js 18)

## Database Schema

### DynamoDB Tables
The service uses DynamoDB Global Tables for cross-region replication:

**Primary Tables:**
- Reservation state tracking
- Transaction audit logs
- Request status management
- Batch processing queues

**Global Secondary Indexes (GSI):**
- Status-based queries
- Time-based queries
- User-based queries

## AWS Services Integration

### Step Functions
- Orchestrates complex reservation workflows
- Implements saga pattern for distributed transactions
- Handles compensation logic for failed operations

### SQS Queues
- **BatchCreateSourceQueue** - Create reservation requests
- **BatchModifySourceQueue** - Modify reservation requests  
- **BatchCancelSourceQueue** - Cancel reservation requests

### Lambda Functions
- **API Gateway handlers** - REST API endpoints
- **Queue processors** - SQS message processing
- **Step Function tasks** - Workflow step implementations
- **Event handlers** - EventBridge event processing

### EventBridge
- Publishes domain events
- Integrates with other Passkey services
- Handles cross-service communication

## Build System

### Monorepo Structure
```bash
packages/
├── passkey-reservation-saga-cdk/          # Infrastructure
├── passkey-reservation-saga-lambdas/      # Lambda functions
├── passkey-reservation-saga-common/       # Shared utilities
├── passkey-reservation-saga-model/        # Data models
├── passkey-reservation-consumer/          # Event consumers
├── passkey-reservation-global-tables-cdk/ # Global tables
└── sam/                                   # Local development
```

### Build Commands
```bash
# Install dependencies
pnpm -r install

# Build all packages
pnpm -r build

# Run tests
pnpm -r test

# Lint code
pnpm -r lint

# Fix linting issues
pnpm -r fix

# Update CDK snapshots
pnpm update-snapshots
```

### Compilation
- **TypeScript**: Compiled to JavaScript for Lambda runtime
- **esbuild**: Used for Lambda function bundling and minification
- **CDK**: Synthesizes CloudFormation templates

## Testing

### Test Framework
- **Jest** - Unit and integration testing
- **ts-jest** - TypeScript support for Jest
- **jest-mock-extended** - Enhanced mocking capabilities

### Test Types
- Unit tests for business logic
- Integration tests for AWS service interactions
- CDK snapshot tests for infrastructure changes

### Coverage
- Code coverage reporting enabled
- SonarQube integration for quality metrics

## Monitoring & Logging

### Observability Stack
- **DataDog** - Application monitoring and alerting
- **AWS CloudWatch** - Infrastructure metrics and logs
- **AWS X-Ray** - Distributed tracing (via Middy middleware)

### Logging
- Structured JSON logging
- Request/response logging via Middy middleware
- Correlation IDs for request tracking
- Log levels: ERROR, WARN, INFO, DEBUG

### Metrics
- Lambda function metrics (duration, errors, invocations)
- DynamoDB metrics (read/write capacity, throttling)
- Step Function execution metrics
- Custom business metrics

## Security

### Authentication & Authorization
- API Gateway with AWS IAM authentication
- Service-to-service authentication via AWS IAM roles
- API keys for external service integration

### Data Protection
- Encryption at rest (DynamoDB, S3)
- Encryption in transit (HTTPS, TLS)
- Sensitive data tokenization
- PCI compliance for payment data

### Network Security
- VPC deployment for Lambda functions
- Security groups and NACLs
- Private subnets for database access

## Performance

### Optimization Strategies
- Lambda function warming
- Connection pooling for external services
- DynamoDB query optimization
- Batch processing for high-volume operations

### Scaling
- Auto-scaling Lambda concurrency
- DynamoDB on-demand billing
- SQS queue scaling
- Step Function parallel execution

## Development Tools

### Code Quality
- ESLint with Cvent configuration
- Prettier for code formatting
- TypeScript strict mode
- Pre-commit hooks

### IDE Support
- VS Code configuration included
- TypeScript language server
- Debugging configuration for local development

## External Integrations

### Cvent Services
- **passkey-manage-api** - Core Passkey management
- **cvent-payment-api** - Payment processing
- **experiments-service** - Feature flags
- **passkey-bridge-service** - Legacy system integration

### Third-Party Services
- Payment processors (Stripe, etc.)
- Hotel booking systems
- Event management platforms

## Version Management

### Changesets
- Uses `@changesets/cli` for version management
- Semantic versioning
- Automated changelog generation
- Release automation via Jenkins

### Package Versioning
- Independent package versioning
- Workspace dependencies using `workspace:*`
- Lock file management with pnpm
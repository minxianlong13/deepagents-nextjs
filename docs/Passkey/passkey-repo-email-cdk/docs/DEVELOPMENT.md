# Development Guide

## Prerequisites

### Required Tools
- **Node.js**: v18.x (managed via asdf)
- **pnpm**: v8.x (package manager)
- **asdf**: Tool version manager
- **AWS CLI**: v2.x (for AWS operations)
- **Docker**: For local testing (optional)
- **Git**: Version control

### AWS Access
- **oktaws**: Cvent's AWS credential management tool
- **AWS Profile**: Configured for sandbox environment access
- **Permissions**: Lambda, DynamoDB, Step Functions, SQS, IAM read/write access

### Development Environment
- **IDE**: VS Code, IntelliJ IDEA, or similar with TypeScript support
- **Extensions**: 
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - AWS Toolkit (optional)

## Local Setup

### Step 1: Clone Repository
```bash
git clone git@github.com:cvent-internal/passkey-email-cdk.git
cd passkey-email-cdk
```

### Step 2: Install Tools
```bash
# Install required tool versions
asdf install

# Verify installations
node --version    # Should show v18.x
pnpm --version    # Should show v8.x
```

### Step 3: Install Dependencies
```bash
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

### Step 4: Build Project
```bash
# Compile TypeScript and build CDK assets
pnpm build

# Verify build success
ls -la packages/*/lib/
```

### Step 5: Configure AWS Access
```bash
# Get AWS credentials for sandbox environment
oktaws

# Verify AWS access
aws sts get-caller-identity
```

### Step 6: Deploy to Sandbox
```bash
# Deploy all stacks to your sandbox environment
pnpm sandbox:setup

# Verify deployment
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode (development)
pnpm test --watch

# Run tests for specific package
cd packages/pre-processing-lambda
pnpm test
```

### Integration Tests
```bash
# Run integration tests (requires deployed infrastructure)
pnpm test:integration

# Run integration tests for specific component
pnpm test:integration --testNamePattern="PreProcessing"
```

### End-to-End Tests
```bash
# Run full end-to-end test suite
pnpm test:e2e

# Run smoke tests
pnpm test:smoke
```

### Test Configuration
Tests are configured using Jest with the following setup:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
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

## Code Structure

### Monorepo Organization
```
passkey-email-cdk/
├── packages/
│   ├── passkey-email-cdk/           # CDK infrastructure
│   │   ├── lib/
│   │   │   ├── stack/               # CDK stack definitions
│   │   │   ├── application.ts       # Main CDK application
│   │   │   └── emailProps.ts        # Configuration properties
│   │   ├── bin/                     # CDK deployment scripts
│   │   └── test/                    # Infrastructure tests
│   ├── passkey-email-shared/        # Shared utilities and models
│   │   ├── src/
│   │   │   ├── types/               # TypeScript type definitions
│   │   │   ├── dynamo/              # DynamoDB access patterns
│   │   │   ├── enums/               # Enumeration definitions
│   │   │   ├── logging/             # Logging utilities
│   │   │   ├── strategies/          # Business logic strategies
│   │   │   └── util/                # Common utilities
│   │   └── test/                    # Shared component tests
│   ├── email-event-scheduler-lambda/ # Email event scheduling
│   ├── pre-processing-lambda/       # Pre-processing logic
│   ├── processing-lambda/           # Core processing logic
│   ├── post-processing-lambda/      # Post-processing logic
│   ├── process-email-event-consumer-lambda/ # SQS consumer
│   ├── failure-lambda/              # General failure handling
│   └── single-instance-failure-lambda/ # Single instance failures
├── docs/                            # Documentation
├── .changeset/                      # Version management
├── package.json                     # Root package configuration
├── pnpm-workspace.yaml             # Workspace configuration
└── README.md                        # Project overview
```

### Lambda Function Structure
Each Lambda function follows a consistent structure:

```
lambda-function/
├── src/
│   ├── index.ts                     # Lambda handler entry point
│   ├── handler.ts                   # Main business logic
│   ├── types.ts                     # Function-specific types
│   └── utils/                       # Utility functions
├── test/
│   ├── handler.test.ts              # Handler unit tests
│   └── fixtures/                    # Test data
├── package.json                     # Function dependencies
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # Function documentation
```

### CDK Stack Structure
```
lib/
├── stack/
│   ├── dynamodb-stack.ts            # DynamoDB tables
│   ├── step-function-stack.ts       # Step Functions workflow
│   ├── passkey-queue-stack.ts       # SQS queues
│   ├── roles-stack.ts               # IAM roles and policies
│   └── automation-dynamodb-stack.ts # Automation tables
├── application.ts                   # Main CDK application
├── emailProps.ts                    # Configuration interface
├── CommonProps.ts                   # Common properties
└── hogan.ts                         # Hogan client configuration
```

## Coding Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use enums for fixed sets of values
- Always specify return types for functions
- Use async/await instead of Promises

### Code Style
```typescript
// Good: Clear interface definition
interface EmailProcessingRequest {
  emailSetupId: string;
  recipients: Recipient[];
  configStrategy: ConfigStrategy;
}

// Good: Explicit return type
async function processEmail(request: EmailProcessingRequest): Promise<ProcessingResult> {
  // Implementation
}

// Good: Proper error handling
try {
  const result = await processEmail(request);
  return result;
} catch (error) {
  logger.error('Email processing failed', { error, emailSetupId: request.emailSetupId });
  throw error;
}
```

### Naming Conventions
- **Files**: kebab-case (`email-processor.ts`)
- **Classes**: PascalCase (`EmailProcessor`)
- **Functions**: camelCase (`processEmail`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Interfaces**: PascalCase with descriptive names (`EmailProcessingRequest`)

### Error Handling
```typescript
// Custom error types
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Consistent error logging
logger.error('Processing failed', {
  error: error.message,
  stack: error.stack,
  correlationId,
  emailSetupId
});
```

### Logging Standards
```typescript
import { Logger } from '@cvent/logging';

const logger = new Logger('pre-processing-lambda');

// Structured logging with context
logger.info('Processing email event', {
  emailSetupId,
  recipientCount: recipients.length,
  configStrategy,
  correlationId
});
```

## Common Development Tasks

### Adding a New Lambda Function

#### Step 1: Create Package Structure
```bash
mkdir packages/new-lambda-function
cd packages/new-lambda-function

# Create basic structure
mkdir -p src test
touch src/index.ts src/handler.ts test/handler.test.ts
touch package.json tsconfig.json README.md
```

#### Step 2: Configure Package
```json
{
  "name": "@cvent/new-lambda-function",
  "version": "0.1.0",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "clean": "rm -rf lib",
    "clean:deep": "pnpm clean && rm -rf node_modules"
  },
  "dependencies": {
    "@cvent/passkey-email-shared": "workspace:*",
    "@cvent/logging": "1.0.17"
  },
  "devDependencies": {
    "@types/node": "^16.18.25",
    "typescript": "^4.5.4"
  }
}
```

#### Step 3: Implement Handler
```typescript
// src/index.ts
import { Context, Handler } from 'aws-lambda';
import { handler } from './handler';

export const lambdaHandler: Handler = async (event: any, context: Context) => {
  return handler(event, context);
};
```

#### Step 4: Add to CDK Stack
```typescript
// In appropriate stack file
const newLambdaStep = this.createLambdaStep(
  'new-lambda',
  '../new-lambda-function/lib',
  lambdaPolicyStatements,
  [parametersSecretsLambdaLayer]
);
```

### Adding a New API Endpoint
Since this is a Lambda-based service without REST APIs, new functionality is added as Lambda functions integrated with Step Functions.

### Modifying Step Functions Workflow

#### Step 1: Update Workflow Definition
```typescript
// In step-function-stack.ts
const newWorkflow = Chain.start(preProcessingStep)
  .next(newLambdaStep)  // Add new step
  .next(processingMapState)
  .next(postProcessingStep);
```

#### Step 2: Test Workflow Changes
```bash
# Deploy to sandbox
pnpm sandbox:setup

# Test workflow execution
aws stepfunctions start-execution \
  --state-machine-arn "arn:aws:states:us-east-1:account:stateMachine:test-workflow" \
  --input '{"test": "data"}'
```

### Adding New Configuration
```typescript
// In emailProps.ts
export interface EmailProps {
  // Existing properties...
  newConfigProperty: string;
  newServiceConfig: ServiceConfig;
}

// In application.ts
const newLambdaFunction = this.createLambda('new-lambda', '../new-lambda/lib', [], [], {
  newConfigValue: this.stackProps.applicationProps.newConfigProperty
});
```

### Database Schema Changes

#### Step 1: Update DynamoDB Stack
```typescript
// In dynamodb-stack.ts
const newTable = new Table(this, 'NewTable', {
  tableName: props.applicationProps.newTableName,
  partitionKey: { name: 'id', type: AttributeType.STRING },
  billingMode: BillingMode.ON_DEMAND,
  pointInTimeRecovery: true
});
```

#### Step 2: Update Shared Types
```typescript
// In passkey-email-shared/src/types/index.ts
export interface NewEntity {
  id: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}
```

#### Step 3: Add Data Access Layer
```typescript
// In passkey-email-shared/src/dynamo/
export class NewEntityRepository {
  async create(entity: NewEntity): Promise<void> {
    // Implementation
  }
  
  async findById(id: string): Promise<NewEntity | null> {
    // Implementation
  }
}
```

## Debugging

### Local Debugging
```bash
# Enable debug logging
export DEBUG=passkey-email:*

# Run with verbose output
pnpm test --verbose

# Debug specific Lambda function
cd packages/pre-processing-lambda
node --inspect-brk lib/index.js
```

### CloudWatch Debugging
```bash
# View Lambda logs
aws logs tail /aws/lambda/passkey-email-pre-processing --follow

# View Step Function execution
aws stepfunctions describe-execution \
  --execution-arn "arn:aws:states:us-east-1:account:execution:workflow:execution-id"

# Query DynamoDB for task logs
aws dynamodb scan \
  --table-name passkey-email-taskLog-sandbox \
  --filter-expression "emailSetupId = :id" \
  --expression-attribute-values '{":id":{"S":"email-123"}}'
```

### Performance Debugging
```bash
# Check Lambda performance metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=passkey-email-processing \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average,Maximum
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear all build artifacts
pnpm clean:deep

# Reinstall dependencies
pnpm install

# Rebuild everything
pnpm build
```

#### Deployment Failures
```bash
# Check CDK diff
cdk diff

# Validate CDK templates
cdk synth

# Check AWS credentials
aws sts get-caller-identity

# Verify permissions
aws iam get-user
```

#### Test Failures
```bash
# Run tests with verbose output
pnpm test --verbose

# Run specific test file
pnpm test handler.test.ts

# Update test snapshots
pnpm test -u
```

#### Lambda Function Issues
```bash
# Check function logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/passkey-email

# Test function locally
sam local invoke PreProcessingFunction --event test-event.json

# Check function configuration
aws lambda get-function --function-name passkey-email-pre-processing
```

### Getting Help
- **Documentation**: Check the docs/ directory for detailed documentation
- **Slack**: #passkey-api channel for team support
- **Code Reviews**: Create pull requests for code review and feedback
- **Pair Programming**: Schedule pairing sessions for complex features

### Contributing Guidelines
1. **Branch Naming**: Use feature/bug/hotfix prefixes (`feature/add-new-lambda`)
2. **Commit Messages**: Use conventional commit format (`feat: add new processing step`)
3. **Pull Requests**: Include description, testing notes, and documentation updates
4. **Code Review**: At least one approval required before merging
5. **Testing**: All new code must include unit tests with >80% coverage

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 18+
- pnpm package manager
- AWS CLI configured with appropriate credentials
- asdf for tool version management

### Local Development Setup

```bash
# Install required tools
asdf install

# Install dependencies
pnpm install

# Build the project
pnpm build

# Get AWS credentials
oktaws

# Deploy to sandbox environment
pnpm sandbox:setup
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run linting
pnpm lint

# Fix linting issues
pnpm fix
```

## Architecture Overview


The service follows a microservices architecture with the following key components:

- **Email Event Scheduler Lambda**: Schedules email events for processing
- **Pre-processing Lambda**: Handles initial email event validation and preparation
- **Processing Lambda**: Core email processing logic
- **Post-processing Lambda**: Handles post-processing tasks and cleanup
- **Process Email Event Consumer Lambda**: Consumes email events from the queue
- **Failure Lambdas**: Handle various failure scenarios
- **Step Functions**: Orchestrates the email processing workflow
- **DynamoDB Tables**: Store email task logs and automation configuration
- **SQS FIFO Queue**: Ensures ordered processing of email events

## Environment Configuration


The service supports multiple environments:
- **Sandbox**: For local development and testing
- **CI**: For continuous integration testing
- **Production**: For live email processing

Each environment has its own configuration for:
- DynamoDB table names
- SQS queue names
- Step Function state machine names
- IAM roles and permissions

## Monitoring and Observability


The service includes comprehensive monitoring through:
- CloudWatch metrics and alarms
- Structured logging with correlation IDs
- DynamoDB task log tracking
- Step Function execution monitoring
- Lambda function performance metrics

## Documentation Structure


- [Architecture](./ARCHITECTURE.md) - Detailed system architecture and design patterns
- [API Reference](./API_REFERENCE.md) - Lambda function interfaces and event schemas
- [Domain Model](./DOMAIN_MODEL.md) - Email processing domain concepts and entities
- [Technical Details](./TECHNICAL_DETAILS.md) - Technology stack, dependencies, and configuration
- [Deployment](./DEPLOYMENT.md) - Deployment procedures and infrastructure setup
- [Development](./DEVELOPMENT.md) - Local development setup and coding guidelines

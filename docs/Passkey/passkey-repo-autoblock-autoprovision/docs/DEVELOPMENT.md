# Development Guide

## Prerequisites

### Required Software
- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher (package manager)
- **AWS CLI**: 2.0.0 or higher
- **AWS CDK CLI**: 2.150.0 or higher
- **Docker**: 20.0.0 or higher (for local testing)
- **Git**: 2.30.0 or higher

### Development Tools
- **Visual Studio Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - AWS Toolkit
  - Jest Runner
- **Alternative IDEs**: IntelliJ IDEA, WebStorm

### AWS Account Access
- **Development Account**: cvent-development
- **Staging Account**: cvent-staging (for integration testing)
- **Required Permissions**:
  - CloudFormation full access
  - Lambda full access
  - Step Functions full access
  - DynamoDB full access
  - API Gateway full access
  - IAM role creation and management

## Local Setup

### 1. Repository Clone and Setup
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-autoblock-autoprovision.git
cd passkey-autoblock-autoprovision

# Install pnpm if not already installed
npm install -g pnpm

# Install dependencies for all packages
pnpm -r install

# Verify installation
pnpm -r build
```

### 2. AWS Configuration
```bash
# Install AWS CLI
# macOS
brew install awscli

# Windows
# Download from https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure --profile cvent-development
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1
# Default output format: json

# Verify AWS access
aws sts get-caller-identity --profile cvent-development
```

### 3. CDK Setup
```bash
# Install CDK CLI globally
npm install -g aws-cdk

# Verify CDK installation
cdk --version

# Bootstrap CDK (one-time setup per account/region)
cd packages/passkey-autoblock-autoprovision-cdk
cdk bootstrap --profile cvent-development
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
# Set appropriate values for local development
STAGE=local
LOG_LEVEL=DEBUG
AWS_PROFILE=cvent-development
```

### 5. Tool Versions Setup
```bash
# Install asdf version manager (optional but recommended)
# macOS
brew install asdf

# Install required versions
asdf install nodejs 18.19.0
asdf install python 3.11.0

# Set local versions
asdf local nodejs 18.19.0
asdf local python 3.11.0
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm -r test

# Run tests for specific package
cd packages/passkey-autoblock-autoprovision-lambdas
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test:coverage

# Update test snapshots
pnpm test -- -u
```

### Integration Tests
```bash
# Run integration tests (requires AWS access)
pnpm test:integration

# Run specific integration test suite
pnpm test:integration -- --testNamePattern="AutoblockOrchestration"
```

### End-to-End Tests
```bash
# Deploy to development environment first
pnpm cdk deploy --profile cvent-development PasskeyAutoblockAutoprovisionStack-alpha

# Run E2E tests
pnpm test:e2e

# Run E2E tests against specific environment
pnpm test:e2e --environment=alpha
```

### Test Configuration

#### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## Code Structure

### Monorepo Organization
```
passkey-autoblock-autoprovision/
├── packages/
│   ├── passkey-autoblock-autoprovision-cdk/        # Infrastructure
│   │   ├── lib/
│   │   │   ├── application.ts                      # CDK app entry point
│   │   │   ├── config/                             # Environment configs
│   │   │   │   ├── alpha.ts
│   │   │   │   ├── beta.ts
│   │   │   │   └── prod.ts
│   │   │   └── stack/                              # CDK stacks
│   │   │       ├── autoprovision-stack.ts
│   │   │       ├── api-stack.ts
│   │   │       └── monitoring-stack.ts
│   │   ├── bin/                                    # CDK entry points
│   │   └── test/                                   # CDK tests
│   ├── passkey-autoblock-autoprovision-lambdas/    # Business logic
│   │   ├── src/main/ts/
│   │   │   ├── api.ts                              # API Gateway handlers
│   │   │   ├── starter/                            # Workflow starters
│   │   │   │   ├── autoprovision-starter.ts
│   │   │   │   └── manual-starter.ts
│   │   │   ├── plannerOrch/                        # Planning orchestration
│   │   │   │   ├── demand-analyzer.ts
│   │   │   │   ├── block-planner.ts
│   │   │   │   └── capacity-calculator.ts
│   │   │   ├── subBlockOrch/                       # Sub-block orchestration
│   │   │   ├── subBlockGroupOrch/                  # Block group management
│   │   │   ├── autoblockDataService/               # Data access layer
│   │   │   ├── eventService/                       # Event handling
│   │   │   ├── cventEmailService/                  # Email notifications
│   │   │   ├── smartCampaignCfgDataService/        # Campaign config
│   │   │   ├── publisher/                          # Event publishing
│   │   │   ├── tracking/                           # Execution tracking
│   │   │   ├── authorize/                          # Authentication
│   │   │   ├── access/                             # Access control
│   │   │   ├── model/                              # Data models
│   │   │   ├── api-util/                           # API utilities
│   │   │   ├── execution-log/                      # Logging utilities
│   │   │   ├── dynamoDbUtil.ts                     # DynamoDB utilities
│   │   │   └── validationUtil.ts                   # Validation helpers
│   │   └── test/                                   # Lambda tests
│   ├── passkey-autoblock-autoprovision-common/     # Shared utilities
│   │   └── src/
│   │       ├── models/                             # Common data models
│   │       ├── types/                              # TypeScript types
│   │       ├── constants/                          # Application constants
│   │       └── utils/                              # Utility functions
│   └── passkey-autoblock-autoprovision-websocket/  # WebSocket handlers
│       └── src/
│           ├── connection-handler.ts
│           ├── message-handler.ts
│           └── broadcast-service.ts
├── raml/                                           # API specifications
│   └── examples/
├── docs/                                           # Documentation
└── scripts/                                       # Build and utility scripts
```

### Package Dependencies
```
passkey-autoblock-autoprovision-cdk
├── depends on: passkey-autoblock-autoprovision-lambdas
├── depends on: passkey-autoblock-autoprovision-common
└── depends on: passkey-autoblock-autoprovision-websocket

passkey-autoblock-autoprovision-lambdas
└── depends on: passkey-autoblock-autoprovision-common

passkey-autoblock-autoprovision-websocket
└── depends on: passkey-autoblock-autoprovision-common
```

## Coding Standards

### TypeScript Guidelines

#### Code Style
```typescript
// Use explicit types for function parameters and return values
function processAutoblockRequest(request: AutoblockRequest): Promise<ExecutionResult> {
  // Implementation
}

// Use interfaces for object shapes
interface AutoblockRequest {
  readonly requestId: string;
  readonly eventId: string;
  readonly hotelId: string;
  readonly checkInDate: Date;
  readonly checkOutDate: Date;
}

// Use enums for constants
enum RequestStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Use async/await instead of Promises
async function createRoomBlock(request: AutoblockRequest): Promise<RoomBlock> {
  try {
    const result = await autoblockDataService.createBlock(request);
    return result;
  } catch (error) {
    logger.error('Failed to create room block', { error, requestId: request.requestId });
    throw error;
  }
}
```

#### Error Handling
```typescript
// Custom error classes
class AutoblockValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = 'AutoblockValidationError';
  }
}

// Error handling in Lambda functions
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const result = await processRequest(event);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    if (error instanceof AutoblockValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message, field: error.field }),
      };
    }
    
    logger.error('Unexpected error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### ESLint Configuration
```json
{
  "extends": [
    "@cvent/nucleus-eslint",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

## Common Tasks

### Adding a New Lambda Function

1. **Create the function file**:
```typescript
// packages/passkey-autoblock-autoprovision-lambdas/src/main/ts/newFunction/handler.ts
import { Logger } from '@cvent/logging';

const logger = new Logger('newFunction');

export interface NewFunctionInput {
  // Define input interface
}

export interface NewFunctionOutput {
  // Define output interface
}

export const handler = async (input: NewFunctionInput): Promise<NewFunctionOutput> => {
  logger.info('Processing new function request', { input });
  
  try {
    // Implementation logic
    const result = await processLogic(input);
    
    logger.info('New function completed successfully', { result });
    return result;
  } catch (error) {
    logger.error('New function failed', { error, input });
    throw error;
  }
};

async function processLogic(input: NewFunctionInput): Promise<NewFunctionOutput> {
  // Business logic implementation
}
```

2. **Add function to CDK stack**:
```typescript
// packages/passkey-autoblock-autoprovision-cdk/lib/stack/autoprovision-stack.ts
const newFunction = new Function(this, 'NewFunction', {
  runtime: Runtime.NODEJS_18_X,
  handler: 'newFunction/handler.handler',
  code: Code.fromAsset(path.join(__dirname, '../../../passkey-autoblock-autoprovision-lambdas/dist')),
  timeout: Duration.minutes(5),
  memorySize: 512,
  environment: {
    LOG_LEVEL: 'INFO',
    // Other environment variables
  },
});
```

3. **Add to Step Function workflow** (if needed):
```typescript
const newFunctionTask = new LambdaInvoke(this, 'NewFunctionTask', {
  lambdaFunction: newFunction,
  outputPath: '$.Payload',
});

// Add to workflow definition
const workflow = new StateMachine(this, 'Workflow', {
  definition: Chain.start(existingTask)
    .next(newFunctionTask)
    .next(nextTask),
});
```

4. **Write tests**:
```typescript
// packages/passkey-autoblock-autoprovision-lambdas/test/newFunction/handler.test.ts
import { handler } from '../../src/main/ts/newFunction/handler';

describe('NewFunction Handler', () => {
  it('should process input successfully', async () => {
    const input = {
      // Test input
    };
    
    const result = await handler(input);
    
    expect(result).toEqual({
      // Expected output
    });
  });
  
  it('should handle errors gracefully', async () => {
    const input = {
      // Invalid input
    };
    
    await expect(handler(input)).rejects.toThrow('Expected error message');
  });
});
```

### Adding a New API Endpoint

1. **Define the endpoint handler**:
```typescript
// packages/passkey-autoblock-autoprovision-lambdas/src/main/ts/api.ts
export const newEndpointHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const result = await processNewEndpoint(body);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

2. **Add to API Gateway**:
```typescript
// packages/passkey-autoblock-autoprovision-cdk/lib/stack/api-stack.ts
const newEndpointFunction = new Function(this, 'NewEndpointFunction', {
  // Function configuration
});

api.root.addResource('new-endpoint').addMethod('POST', new LambdaIntegration(newEndpointFunction));
```

3. **Update RAML specification**:
```yaml
# raml/api.raml
/new-endpoint:
  post:
    description: Description of the new endpoint
    body:
      application/json:
        type: NewEndpointRequest
    responses:
      200:
        body:
          application/json:
            type: NewEndpointResponse
```

### Debugging

#### Local Debugging
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Run specific function locally (using SAM CLI)
sam local invoke NewFunction --event test-events/new-function-event.json

# Debug with VS Code
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Lambda",
  "program": "${workspaceFolder}/packages/passkey-autoblock-autoprovision-lambdas/src/main/ts/newFunction/handler.ts",
  "env": {
    "LOG_LEVEL": "DEBUG"
  }
}
```

#### Remote Debugging
```bash
# View CloudWatch logs
aws logs tail /aws/lambda/AutoprovisionOrchestrator --follow --profile cvent-development

# View Step Function execution
aws stepfunctions describe-execution --execution-arn <execution-arn> --profile cvent-development

# Query DynamoDB for debugging
aws dynamodb scan --table-name AutoblockRequests-alpha --profile cvent-development
```

### Performance Optimization

#### Lambda Optimization
```typescript
// Use connection pooling for external services
const httpAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
});

// Cache frequently accessed data
const configCache = new Map<string, any>();

export const handler = async (event: any): Promise<any> => {
  // Reuse connections and cache data
  const config = configCache.get('key') || await loadConfig();
  configCache.set('key', config);
  
  // Process with cached config
};
```

#### DynamoDB Optimization
```typescript
// Use batch operations when possible
const batchWriteParams = {
  RequestItems: {
    'AutoblockRequests': items.map(item => ({
      PutRequest: { Item: item }
    }))
  }
};

await dynamodb.batchWrite(batchWriteParams).promise();

// Use projection expressions to reduce data transfer
const queryParams = {
  TableName: 'AutoblockRequests',
  ProjectionExpression: 'requestId, #status, createdAt',
  ExpressionAttributeNames: {
    '#status': 'status'
  }
};
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node_modules and reinstall
pnpm -r clean
pnpm -r install

# Clear CDK cache
rm -rf packages/passkey-autoblock-autoprovision-cdk/cdk.out
pnpm -r build
```

#### Deployment Issues
```bash
# Check CDK diff
pnpm cdk diff --profile cvent-development

# Verify AWS credentials
aws sts get-caller-identity --profile cvent-development

# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name PasskeyAutoblockAutoprovisionStack-alpha --profile cvent-development
```

#### Runtime Errors
```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/Autoprovision" --profile cvent-development

# Monitor Step Function executions
aws stepfunctions list-executions --state-machine-arn <state-machine-arn> --profile cvent-development
```

### Getting Help

- **Team Slack**: #passkey-autoblock-autoprovision
- **Documentation**: This repository's docs/ directory
- **Code Reviews**: Create pull requests for peer review
- **Architecture Decisions**: Consult with the metre-stick team
- **AWS Issues**: Contact the cloud infrastructure team

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 18+
- pnpm package manager
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed

### Installation
```bash
# Install dependencies
pnpm -r install

# Build all packages
pnpm -r build

# Run tests
pnpm -r test

# Deploy to AWS (sandbox environment)
cd packages/passkey-autoblock-autoprovision-cdk
pnpm cdk deploy --profile cvent-sandbox PasskeyAutoblockAutoprovisionStack-ci
```

### Running the Service
1. Deploy the CDK stack to create AWS resources
2. Use the generated API Gateway URL to trigger provisioning workflows
3. Monitor execution through AWS Step Functions console or WebSocket connections

## API Endpoints


- **POST** `/v1/autoblockautoprovision` - Trigger automatic block provisioning workflow
- **WebSocket** connections for real-time status updates

## Team


- **Owner**: metre-stick team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels

## Links


- [GitHub Repository](https://github.com/cvent-internal/passkey-autoblock-autoprovision)
- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-autoblock-autoprovision)
- [Datadog Monitoring](https://cvent.datadoghq.com/apm/services/passkey-autoblock-autoprovision)
- [Octopus Deployment](https://octo.core.cvent.org/app#/Spaces-1/projects/autoblock-autoprovision-cdk/deployments)

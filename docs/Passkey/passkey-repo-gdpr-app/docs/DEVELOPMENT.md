# Development Guide

## Prerequisites

### Required Tools
- **Node.js**: Version 16+ (managed via asdf)
- **pnpm**: Package manager with workspace support
- **asdf**: Version manager for Node.js and other tools
- **AWS CLI**: For AWS service interactions
- **oktaws**: Cvent's AWS credential management tool
- **Git**: Version control system

### Development Environment Setup

#### 1. Install asdf (if not already installed)
```bash
# macOS
brew install asdf

# Ubuntu/Debian
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.10.2
echo '. $HOME/.asdf/asdf.sh' >> ~/.bashrc
echo '. $HOME/.asdf/completions/asdf.bash' >> ~/.bashrc
```

#### 2. Install Required Plugins
```bash
# Add Node.js plugin
asdf plugin add nodejs

# Add pnpm plugin
asdf plugin add pnpm
```

#### 3. Install Tools
```bash
# Install tools specified in .tool-versions
asdf install

# Verify installations
node --version
pnpm --version
```

#### 4. Configure AWS CLI
```bash
# Install AWS CLI
pip install awscli

# Configure default region
aws configure set default.region us-east-1
```

#### 5. Setup oktaws
Follow the internal Cvent documentation for oktaws setup:
- [oktaws Setup Guide](https://wiki.cvent.com/display/AWS/Oktaws)

## Local Setup

### Initial Project Setup

#### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-gdpr-app.git
cd passkey-gdpr-app
```

#### 2. Install Dependencies
```bash
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

#### 3. Build Project
```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @cvent/gdpr-lambdas build
```

#### 4. Verify Setup
```bash
# Run all verification steps
pnpm verify

# This runs: build, lint, format, and test
```

### Environment Configuration

#### 1. AWS Credentials
```bash
# Get sandbox credentials
oktaws

# Verify credentials
aws sts get-caller-identity
```

#### 2. Local Environment Variables
Create a `.env.local` file (not committed to Git):
```bash
# .env.local
AWS_REGION=us-east-1
ENVIRONMENT=local
LOG_LEVEL=DEBUG
PARAMETER_STORE_PREFIX=/passkey-gdpr-app/sandbox
```

#### 3. Parameter Store Access
Ensure you have access to sandbox Parameter Store values:
```bash
# Test parameter access
aws ssm get-parameter \
  --name "/passkey-gdpr-app/sandbox/api/auth-secret" \
  --with-decryption
```

## Running Tests

### Unit Tests

#### Run All Tests
```bash
# Run tests for all packages
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test --watch
```

#### Run Package-Specific Tests
```bash
# Test specific package
pnpm --filter @cvent/gdpr-lambdas test

# Test with coverage for specific package
pnpm --filter @cvent/gdpr-lambdas test:coverage
```

#### Test Configuration
Tests use Jest with the following configuration:
```javascript
// jest.config.js
module.exports = {
  preset: '@cvent/jest-config',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}'
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

### Integration Tests

#### Local Integration Testing
```bash
# Start local API simulation
pnpm --filter @cvent/gdpr-lambdas local

# In another terminal, run integration tests
curl http://localhost:3000/health
```

#### Sandbox Integration Testing
```bash
# Deploy to sandbox first
pnpm deploy:sandbox

# Run integration tests against sandbox
pnpm ci:test
```

### Test Writing Guidelines

#### Unit Test Example
```typescript
// src/handlers/authorizer/authorizer.test.ts
import { handler } from './authorizer';
import { APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

describe('Authorizer Handler', () => {
  it('should allow valid tokens', async () => {
    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      authorizationToken: 'Bearer valid-token',
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/request'
    };

    const result = await handler(event);
    
    expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
  });

  it('should deny invalid tokens', async () => {
    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      authorizationToken: 'Bearer invalid-token',
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/request'
    };

    const result = await handler(event);
    
    expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
  });
});
```

#### Mock Configuration
```typescript
// __mocks__/@cvent/aws-param-secrets-lambda-ext-ts-client.ts
export class ParameterStoreClient {
  async getParameter(name: string): Promise<string> {
    const mockValues: Record<string, string> = {
      '/passkey-gdpr-app/sandbox/api/auth-secret': 'mock-secret',
      '/passkey-gdpr-app/sandbox/services/gdpr-service-endpoint': 'http://localhost:3001'
    };
    
    return mockValues[name] || 'mock-value';
  }
}
```

## Code Structure

### Monorepo Organization

#### Workspace Structure
```
passkey-gdpr-app/
├── packages/
│   ├── gdpr-lambdas/           # Lambda functions for GDPR operations
│   │   ├── src/
│   │   │   ├── handlers/       # Lambda handler functions
│   │   │   │   └── authorizer/ # API Gateway authorizer
│   │   │   └── api/           # API endpoint handlers
│   │   ├── package.json       # Package dependencies
│   │   └── project.json       # Nx project configuration
│   ├── infra/                 # CDK infrastructure code
│   │   ├── lib/               # CDK constructs and stacks
│   │   ├── bin/               # CDK app entry points
│   │   └── tests/             # Infrastructure tests
│   └── scheduler-lambda/       # Scheduling Lambda functions
│       ├── src/               # Scheduler source code
│       └── package.json       # Package dependencies
├── package.json               # Root workspace configuration
├── nx.json                    # Nx workspace configuration
└── pnpm-workspace.yaml        # pnpm workspace definition
```

#### Package Dependencies
```json
{
  "name": "root",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "devDependencies": {
    "nx": "20.7.0",
    "@cvent/eslint-config": "1.0.33",
    "@cvent/prettier-config": "1.0.34"
  }
}
```

### Code Organization Patterns

#### Lambda Handler Structure
```typescript
// src/handlers/gdpr-request/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@cvent/logging';
import { ParameterStoreClient } from '@cvent/aws-param-secrets-lambda-ext-ts-client';

const logger = new Logger({ service: 'gdpr-request-handler' });
const parameterStore = new ParameterStoreClient();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  
  try {
    logger.info('Processing GDPR request', { requestId });
    
    // Handler logic here
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({
        success: true,
        requestId,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    logger.error('Error processing GDPR request', { requestId, error });
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        requestId,
        timestamp: new Date().toISOString()
      })
    };
  }
};
```

#### CDK Construct Structure
```typescript
// lib/gdpr-lambda-construct.ts
import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export interface GdprLambdaProps {
  environment: string;
  parameterStorePrefix: string;
}

export class GdprLambdaConstruct extends Construct {
  public readonly function: Function;

  constructor(scope: Construct, id: string, props: GdprLambdaProps) {
    super(scope, id);

    this.function = new Function(this, 'Function', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset('../gdpr-lambdas/lib'),
      environment: {
        ENVIRONMENT: props.environment,
        PARAMETER_STORE_PREFIX: props.parameterStorePrefix
      }
    });

    // Add Parameter Store permissions
    this.function.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath'
      ],
      resources: [`arn:aws:ssm:*:*:parameter${props.parameterStorePrefix}/*`]
    }));
  }
}
```

## Coding Standards

### TypeScript Configuration

#### Strict Type Checking
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### Import Organization
```typescript
// 1. Node.js built-in modules
import { readFileSync } from 'fs';

// 2. External libraries
import { APIGatewayProxyEvent } from 'aws-lambda';
import { Logger } from '@cvent/logging';

// 3. Internal modules (relative imports)
import { validateRequest } from './validation';
import { processGdprRequest } from '../services/gdpr-service';
```

### ESLint Configuration

#### Rules
```json
{
  "extends": ["@cvent/eslint-config"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### Prettier Configuration
```json
{
  "extends": "@cvent/prettier-config",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

### Error Handling Patterns

#### Structured Error Handling
```typescript
export class GdprError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'GdprError';
  }
}

// Usage
throw new GdprError(
  'Invalid request format',
  'INVALID_REQUEST',
  400,
  { field: 'requestType', value: 'UNKNOWN' }
);
```

#### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  requestId: string;
  timestamp: string;
}
```

## Common Tasks

### Adding a New Lambda Function

#### 1. Create Handler File
```typescript
// packages/gdpr-lambdas/src/handlers/new-handler/index.ts
export { handler } from './handler';
```

#### 2. Implement Handler Logic
```typescript
// packages/gdpr-lambdas/src/handlers/new-handler/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Implementation here
};
```

#### 3. Add Tests
```typescript
// packages/gdpr-lambdas/src/handlers/new-handler/handler.test.ts
import { handler } from './handler';

describe('New Handler', () => {
  it('should process requests correctly', async () => {
    // Test implementation
  });
});
```

#### 4. Update CDK Infrastructure
```typescript
// packages/infra/lib/lambda-stack.ts
const newLambda = new Function(this, 'NewLambda', {
  runtime: Runtime.NODEJS_18_X,
  handler: 'new-handler/index.handler',
  code: Code.fromAsset('../gdpr-lambdas/lib')
});
```

### Adding a New API Endpoint

#### 1. Create Route Handler
```typescript
// packages/gdpr-lambdas/src/api/new-endpoint.ts
export const handler = async (event: APIGatewayProxyEvent) => {
  // Endpoint logic
};
```

#### 2. Add API Gateway Route
```typescript
// packages/infra/lib/api-stack.ts
api.addRoutes({
  path: '/new-endpoint',
  methods: [HttpMethod.GET],
  integration: new HttpLambdaIntegration('NewEndpoint', newEndpointLambda)
});
```

#### 3. Update Documentation
Add endpoint documentation to `API_REFERENCE.md`

### Updating Dependencies

#### 1. Update Package Dependencies
```bash
# Update specific package
pnpm --filter @cvent/gdpr-lambdas update @cvent/logging

# Update all dependencies
pnpm update --recursive
```

#### 2. Update CDK Dependencies
```bash
# Update CDK version in root .pnpmfile.cjs
# Then run
pnpm install
```

#### 3. Test After Updates
```bash
# Run full verification
pnpm verify

# Deploy to sandbox for integration testing
pnpm deploy:sandbox
```

### Debugging

#### Local Debugging
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Run with debugger
node --inspect-brk=0.0.0.0:9229 lib/index.js
```

#### CloudWatch Logs
```bash
# View logs for specific function
aws logs tail /aws/lambda/passkey-gdpr-app-sandbox-gdpr-handler --follow

# Filter logs by request ID
aws logs filter-log-events \
  --log-group-name /aws/lambda/passkey-gdpr-app-sandbox-gdpr-handler \
  --filter-pattern "req-123456"
```

#### X-Ray Tracing
```typescript
// Enable X-Ray tracing in Lambda
import AWSXRay from 'aws-xray-sdk-core';
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
```

## Performance Optimization

### Lambda Cold Start Optimization
- Minimize bundle size with tree shaking
- Use esbuild for fast compilation
- Implement connection pooling for external services
- Cache Parameter Store values

### Memory and Timeout Configuration
```typescript
// Optimize Lambda configuration
new Function(this, 'OptimizedLambda', {
  memorySize: 512,  // Adjust based on profiling
  timeout: Duration.seconds(30),
  reservedConcurrentExecutions: 10
});
```

### Monitoring Performance
```typescript
// Add custom metrics
import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();

await cloudwatch.putMetricData({
  Namespace: 'PasskeyGdprApp',
  MetricData: [{
    MetricName: 'ProcessingTime',
    Value: processingTime,
    Unit: 'Milliseconds'
  }]
}).promise();
```

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 16+ (managed via asdf)
- pnpm package manager
- AWS CLI configured
- oktaws for AWS credentials

### Setup
```bash
# Install required tools
asdf install

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Local Development
```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm fix

# Run tests
pnpm test

# Verify everything
pnpm verify
```

### Deployment
```bash
# Get AWS credentials
oktaws

# Deploy to sandbox
pnpm deploy:sandbox
```

## Project Structure


```
passkey-gdpr-app/
├── packages/
│   ├── gdpr-lambdas/          # Lambda functions for GDPR operations
│   ├── infra/                 # CDK infrastructure code
│   └── scheduler-lambda/      # Scheduling Lambda functions
├── package.json               # Root package configuration
├── nx.json                    # Nx workspace configuration
├── pnpm-workspace.yaml        # pnpm workspace configuration
└── Jenkinsfile               # CI/CD pipeline configuration
```

## Team


- **Owner**: cherry-pickers team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels

## Support


For questions and issues:
- Reach out to the cherry-pickers team
- Use `#tech-aws-cdk` for CDK-related questions
- Check the [Contributing Guide](packages/gdpr-lambdas/CONTRIBUTING.md) for development guidelines

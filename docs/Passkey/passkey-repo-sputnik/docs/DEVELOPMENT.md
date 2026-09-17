# Development Guide

## Prerequisites

### Required Software
- **Node.js**: Version 22+ (managed via `.tool-versions`)
- **pnpm**: Package manager (version 8+)
- **AWS CLI**: Version 2+ configured with appropriate credentials
- **Docker**: For local testing and SonarQube
- **Git**: Version control
- **asdf**: Version manager (recommended)

### Development Tools
- **IDE**: VS Code, WebStorm, or similar TypeScript-capable editor
- **Extensions**: 
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - AWS Toolkit

### AWS Access
- **Development Account**: Access to development AWS account
- **Profiles**: Configure AWS profiles for different environments
  ```bash
  # ~/.aws/config
  [profile passkey-dev]
  region = us-east-1
  output = json
  
  [profile passkey-staging]
  region = us-east-1
  output = json
  ```

## Local Setup

### 1. Clone Repository
```bash
git clone git@github.com:cvent-internal/passkey-sputnik.git
cd passkey-sputnik
```

### 2. Install Dependencies
```bash
# Install Node.js version specified in .tool-versions
asdf install

# Install project dependencies
pnpm install
```

### 3. Environment Configuration
```bash
# Copy environment template (if exists)
cp .env.example .env.local

# Configure AWS credentials
aws configure --profile passkey-dev
```

### 4. Build Project
```bash
# Full build (TypeScript + esbuild + CDK)
pnpm build

# Or individual build steps
pnpm build:ts      # TypeScript compilation
pnpm build:esbuild # Lambda bundling
pnpm build:cdk     # CDK synthesis
```

### 5. Run Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## Running Tests

### Unit Tests
```bash
# Run unit tests
pnpm test:ts

# Run specific test file
pnpm test:ts -- handlers/transferRequestProcessor.test.ts

# Run tests with debugging
pnpm test:ts -- --verbose --detectOpenHandles
```

### Integration Tests
```bash
# Run CDK tests
pnpm test:cdk

# Test CDK synthesis
cdk synth --profile passkey-dev
```

### Local SonarQube Testing
```bash
# Start local SonarQube
docker run --rm -p 9999:9000 sonarqube

# Run sonar scanner locally
pnpm sonar-local
```

Access SonarQube at `http://localhost:9999` with credentials `admin/admin`.

## Code Structure

### Project Organization
```
passkey-sputnik/
├── bin/                    # CDK app entry points
├── lib/                    # Source code
│   ├── application.ts      # CDK application
│   ├── stack.ts           # Main CDK stack
│   ├── callbacksStack.ts  # Callbacks infrastructure
│   ├── config/            # Configuration management
│   ├── resources/         # AWS resource definitions
│   └── lambdas/           # Lambda function code
│       ├── api/           # External API clients
│       ├── handlers/      # Business logic handlers
│       ├── model/         # Data models and types
│       └── utils/         # Shared utilities
├── test/                  # Test files
├── docs/                  # Documentation
├── local/                 # Local development scripts
└── .github/              # GitHub workflows
```

### Lambda Function Structure
```typescript
// Standard Lambda handler pattern
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { Context } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation
};
```

### Error Handling Pattern
```typescript
import { HttpStatusError } from './model/types';
import { Logger, errorJson } from './utils/logging';

try {
  // Business logic
} catch (error) {
  Logger.error('Operation failed', { error: errorJson(error) });
  throw new HttpStatusError(500, 'Internal server error');
}
```

## Coding Standards

### TypeScript Guidelines
- **Strict Mode**: All TypeScript strict checks enabled
- **Type Safety**: Prefer explicit types over `any`
- **Interfaces**: Use interfaces for object shapes
- **Enums**: Use const enums for better performance
- **Async/Await**: Prefer async/await over Promises

### Code Style
```typescript
// Good: Explicit return types
const processTransfer = async (request: TransferRequest): Promise<TransferResult> => {
  // Implementation
};

// Good: Destructuring with types
const { reservationId, eventId }: TransferRequest = request;

// Good: Error handling
if (!reservationId) {
  throw new HttpStatusError(400, 'Reservation ID is required');
}
```

### Naming Conventions
- **Files**: camelCase for TypeScript files
- **Classes**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase (no 'I' prefix)
- **Types**: PascalCase with 'Type' suffix

### ESLint Configuration
```javascript
// eslint.config.mjs
export default [
  {
    extends: ['@cvent/eslint-config'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];
```

## Common Development Tasks

### Adding a New Lambda Function
1. **Create Handler File**:
   ```typescript
   // lib/lambdas/newFunction.ts
   import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
   
   export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
     // Implementation
     return {
       statusCode: 200,
       body: JSON.stringify({ message: 'Success' })
     };
   };
   ```

2. **Add to CDK Stack**:
   ```typescript
   // lib/stack.ts
   const newFunction = new Function(this, 'NewFunction', {
     runtime: Runtime.NODEJS_22_X,
     handler: 'newFunction.handler',
     code: Code.fromAsset('dist/lambdas'),
     // Additional configuration
   });
   ```

3. **Add API Route** (if needed):
   ```typescript
   // Add to API Gateway
   api.root.addResource('new-endpoint').addMethod('POST', new LambdaIntegration(newFunction));
   ```

4. **Write Tests**:
   ```typescript
   // test/newFunction.test.ts
   import { handler } from '../lib/lambdas/newFunction';
   
   describe('newFunction', () => {
     it('should return success response', async () => {
       const event = { /* mock event */ };
       const result = await handler(event);
       expect(result.statusCode).toBe(200);
     });
   });
   ```

### Adding a New Vendor Integration
1. **Create Vendor Model**:
   ```typescript
   // lib/lambdas/model/newVendor.ts
   export interface NewVendorRequest {
     // Vendor-specific request structure
   }
   
   export interface NewVendorResponse {
     // Vendor-specific response structure
   }
   ```

2. **Create Transformer**:
   ```typescript
   // lib/lambdas/handlers/transformers/newVendorTransformer.ts
   export class NewVendorTransformer {
     transform(request: TransferRequest): NewVendorRequest {
       // Transform internal format to vendor format
     }
   }
   ```

3. **Create Transporter**:
   ```typescript
   // lib/lambdas/handlers/transporters/newVendorTransporter.ts
   export class NewVendorTransporter {
     async send(request: NewVendorRequest): Promise<NewVendorResponse> {
       // Send request to vendor API
     }
   }
   ```

4. **Update Constants**:
   ```typescript
   // lib/lambdas/model/constants.ts
   export enum VendorType {
     // ... existing vendors
     NEW_VENDOR = 'newVendor'
   }
   ```

### Adding Configuration Parameters
1. **Add to SSM Parameter Store**:
   ```bash
   aws ssm put-parameter \
     --name "/passkey-sputnik/dev/NEW_PARAMETER" \
     --value "parameter-value" \
     --type "SecureString" \
     --profile passkey-dev
   ```

2. **Update CDK Stack**:
   ```typescript
   // lib/stack.ts
   const newParameter = StringParameter.fromStringParameterName(
     this, 'NewParameter', '/passkey-sputnik/NEW_PARAMETER'
   );
   
   // Add to Lambda environment
   lambdaFunction.addEnvironment('NEW_PARAMETER', newParameter.stringValue);
   ```

### Debugging Lambda Functions Locally
1. **Use AWS SAM CLI**:
   ```bash
   # Install SAM CLI
   pip install aws-sam-cli
   
   # Generate SAM template from CDK
   cdk synth --no-staging > template.yaml
   
   # Start local API
   sam local start-api --template template.yaml
   ```

2. **Use VS Code Debugger**:
   ```json
   // .vscode/launch.json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Lambda",
     "program": "${workspaceFolder}/lib/lambdas/functionName.ts",
     "env": {
       "NODE_ENV": "development"
     }
   }
   ```

## Testing Strategies

### Unit Testing
- **Scope**: Individual functions and classes
- **Mocking**: Mock external dependencies (AWS SDK, HTTP clients)
- **Coverage**: Aim for >80% code coverage
- **Tools**: Jest with TypeScript support

### Integration Testing
- **Scope**: End-to-end API workflows
- **Environment**: Use development AWS environment
- **Data**: Use test data that can be safely modified
- **Cleanup**: Clean up test resources after tests

### Load Testing
- **Tools**: Artillery, JMeter, or AWS Load Testing solution
- **Scenarios**: Typical usage patterns and peak load
- **Metrics**: Response time, throughput, error rate
- **Environment**: Use staging environment for load tests

## Local Development Workflow

### Daily Development
1. **Pull Latest Changes**:
   ```bash
   git pull origin development
   pnpm install  # Update dependencies if needed
   ```

2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/new-feature-name
   ```

3. **Development Cycle**:
   ```bash
   # Make changes
   pnpm build-local  # Quick build and test
   pnpm test         # Run tests
   pnpm lint         # Check code style
   ```

4. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and Create PR**:
   ```bash
   git push origin feature/new-feature-name
   # Create pull request in GitHub
   ```

### Code Review Process
1. **Self Review**: Review your own changes before submitting
2. **Automated Checks**: Ensure CI pipeline passes
3. **Peer Review**: At least one team member review required
4. **Address Feedback**: Make requested changes
5. **Merge**: Squash and merge to development branch

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear CDK cache
rm -rf cdk.out
pnpm build:cdk
```

#### Test Failures
```bash
# Run tests with verbose output
pnpm test -- --verbose

# Run specific test file
pnpm test -- handlers/transferRequestProcessor.test.ts

# Debug test with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### AWS Deployment Issues
```bash
# Check AWS credentials
aws sts get-caller-identity --profile passkey-dev

# Validate CDK template
cdk synth --profile passkey-dev

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name PasskeySputnikStack
```

### Debugging Tips
- **Use Console Logs**: Add strategic console.log statements
- **AWS X-Ray**: Enable tracing for Lambda functions
- **CloudWatch Logs**: Monitor real-time logs during testing
- **Local Testing**: Test business logic locally before deploying

### Getting Help
- **Team Slack**: `#passkey-api` channel
- **Documentation**: Check existing docs and wiki
- **Code Review**: Ask team members for guidance
- **Pair Programming**: Schedule pairing sessions for complex features

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 22+
- pnpm package manager
- AWS CDK CLI
- Docker (for local development)

### Local Setup
```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# Run tests
pnpm test

# Deploy to CI environment
pnpm ci:setup
```

### Environment Configuration
Required SSM parameters with prefix `/passkey-sputnik/`:
- `API_KEY`
- `ENCRYPTION_DECRYPTION_KEY`
- `ENCRYPTION_SECRET_KEY`
- `EXPERIMENTS_API_KEY`
- `PAYMENTS_PROXY_JWT_SECRET`

## Links


- [DataDog Dashboard](https://cvent.datadoghq.com/dashboard/tet-93n-kdh/passkey-sputnik-transfers)
- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-sputnik)
- [Octopus Deployment](https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-sputnik/deployments)
- [SonarQube Quality Gate](https://sonar.core.cvent.org/dashboard?id=passkey-sputnik)

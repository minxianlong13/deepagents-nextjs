# Development Guide

## Prerequisites

### Required Tools
- **Node.js**: 18.x (managed via asdf)
- **pnpm**: Latest version (package manager)
- **Docker**: For local services (Rancher Desktop recommended)
- **AWS CLI**: For AWS service interaction
- **SAM CLI**: For local Lambda development
- **asdf**: Version manager for development tools

### Installation

#### 1. Install asdf and tools
```bash
# Install asdf (if not already installed)
git clone https://github.com/asdf-vm/asdf.git ~/.asdf

# Install tools from .tool-versions
asdf install
```

#### 2. Install SAM CLI
```bash
# M1/M2 MacBook
curl -O -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-macos-arm64.pkg
open aws-sam-cli-macos-arm64.pkg

# Intel MacBook
curl -O -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-macos-x86_64.pkg
open aws-sam-cli-macos-x86_64.pkg
```

#### 3. Install Python dependencies (for SQS event source)
```bash
cd local/sqs-event-source
python3 -m pipenv install

# If pipenv is not installed
python3 -m pip install pipenv
```

## Local Setup

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone git@github.com:cvent-internal/passkey-reservation-saga.git
cd passkey-reservation-saga

# Install dependencies
pnpm -r install
```

### 2. Configure API Keys
Create `packages/sam/.env` with required API keys:

```bash
# Get API keys from Backstage
# Staging: https://backstage.core.cvent.org/catalog/default/component/passkey-reservation-saga/api-keys?environment=staging
# Ecommerce: https://backstage.core.cvent.org/catalog/default/component/passkey-reservation-saga/api-keys?environment=ecommerce-us-staging

LOCAL_API_KEY=<staging-api-key>
LOCAL_ECOMMERCE_API_KEY=<ecommerce-api-key>
```

### 3. AWS Authentication
```bash
# Obtain AWS token
oktaws

# Verify credentials
aws sts get-caller-identity
```

## Local Development

### Starting the Development Environment

#### 1. Synthesize CDK Stacks
```bash
# Build and synthesize all stacks
local/dev.sh synth
```

#### 2. Start Local Services
```bash
# Start APIs and Lambdas
local/dev.sh start
```

#### 3. Build Lambda Functions (after changes)
```bash
# Rebuild lambdas only
local/dev.sh build
```

### Local Services

| Service           | Endpoint               | Purpose                    |
|-------------------|------------------------|----------------------------|
| APIs              | http://localhost:4000/ | REST API endpoints         |
| Lambdas           | http://localhost:3001/ | Lambda function invocation |
| Step Functions    | http://localhost:8083/ | Workflow orchestration     |
| DynamoDB          | http://localhost:8000/ | Local database             |
| SQS (elasticmq)   | http://localhost:9324/ | Message queuing            |
| ElasticMQ Console | http://localhost:9325/ | Queue management UI        |

### Development Scripts

#### Main Development Script
```bash
# All-in-one development script
local/dev.sh <command>

# Available commands:
local/dev.sh synth    # Build and synthesize stacks
local/dev.sh init     # Initialize local containers
local/dev.sh start    # Start APIs and Lambdas
local/dev.sh build    # Rebuild Lambda functions
local/dev.sh stop     # Stop APIs and Lambdas
local/dev.sh destroy  # Tear down everything
```

#### AWS Service Wrappers
```bash
# DynamoDB operations
local/dynamodb.sh list-tables
local/dynamodb.sh scan --table-name <table-name>

# Step Functions operations
local/stepfunctions.sh list-state-machines
local/stepfunctions.sh start-execution --state-machine-arn <arn>

# SQS operations
local/sqs.sh list-queues
local/sqs.sh send-message --queue-url <url> --message-body <message>
```

## Code Structure

### Monorepo Organization
```
packages/
├── passkey-reservation-saga-cdk/          # Infrastructure as Code
│   ├── lib/                               # CDK constructs
│   ├── bin/                               # CDK app entry points
│   └── test/                              # CDK tests
├── passkey-reservation-saga-lambdas/      # Lambda functions
│   ├── src/
│   │   ├── api/                           # API Gateway handlers
│   │   ├── handlers/                      # Lambda handlers
│   │   ├── orchestrator/                  # Step Function tasks
│   │   ├── services/                      # Business logic
│   │   ├── data/                          # Data access layer
│   │   └── utils/                         # Utilities
│   └── __tests__/                         # Lambda tests
├── passkey-reservation-saga-common/       # Shared utilities
├── passkey-reservation-saga-model/        # Data models
├── passkey-reservation-consumer/          # Event consumers
├── passkey-reservation-global-tables-cdk/ # Global DynamoDB tables
└── sam/                                   # SAM configuration
```

### Key Directories

#### Lambda Source Structure
```
src/
├── api/                    # REST API endpoints
├── api-gateway/           # API Gateway integration
├── handlers/              # Lambda entry points
├── orchestrator/          # Step Function tasks
├── group-orchestrator/    # Group booking logic
├── services/              # Business services
├── data/                  # Data access objects
├── state/                 # State management
├── validation/            # Input validation
├── queue/                 # Queue processing
├── constants/             # Application constants
└── utils/                 # Utility functions
```

## Running Tests

### Unit Tests
```bash
# Run all tests
pnpm -r test

# Run tests for specific package
cd packages/passkey-reservation-saga-lambdas
pnpm test

# Run tests with coverage
pnpm test:ts

# Run tests in watch mode
pnpm test --watch
```

### CDK Tests
```bash
# Run CDK snapshot tests
cd packages/passkey-reservation-saga-cdk
pnpm test

# Update snapshots
pnpm test -u
```

### Integration Tests
```bash
# Start local environment first
local/dev.sh start

# Run integration tests
pnpm test:integration
```

## Code Quality

### Linting
```bash
# Lint all packages
pnpm -r lint

# Fix linting issues
pnpm -r fix

# Lint specific package
cd packages/passkey-reservation-saga-lambdas
pnpm lint:eslint
```

### Code Formatting
```bash
# Format code with Prettier
pnpm -r fix

# Check formatting
pnpm -r lint
```

### Type Checking
```bash
# TypeScript compilation
pnpm -r build:ts

# Watch mode for development
pnpm watch
```

## Debugging

### Local Debugging

#### VS Code Configuration
The repository includes VS Code debugging configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Lambda",
  "program": "${workspaceFolder}/packages/passkey-reservation-saga-lambdas/src/handlers/api.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

#### Lambda Function Debugging
```bash
# Start Lambda in debug mode
sam local start-lambda --debug-port 5858

# Attach debugger to port 5858
```

### Remote Debugging

#### CloudWatch Logs
```bash
# Tail Lambda logs
aws logs tail /aws/lambda/<function-name> --follow

# Search logs
aws logs filter-log-events --log-group-name /aws/lambda/<function-name> --filter-pattern "ERROR"
```

#### X-Ray Tracing
- Enable X-Ray tracing in Lambda configuration
- View traces in AWS X-Ray console
- Analyze performance bottlenecks

## Common Development Tasks

### Adding a New API Endpoint

#### 1. Create Handler
```typescript
// packages/passkey-reservation-saga-lambdas/src/handlers/new-endpoint.ts
import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  // Implementation
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' })
  };
};
```

#### 2. Add CDK Resource
```typescript
// packages/passkey-reservation-saga-cdk/lib/api-stack.ts
const newEndpointFunction = new Function(this, 'NewEndpointFunction', {
  // Configuration
});

api.addMethod('GET', '/new-endpoint', new LambdaIntegration(newEndpointFunction));
```

#### 3. Add Tests
```typescript
// packages/passkey-reservation-saga-lambdas/src/__tests__/new-endpoint.test.ts
describe('New Endpoint', () => {
  it('should return success', async () => {
    // Test implementation
  });
});
```

### Adding a New Step Function Task

#### 1. Create Task Handler
```typescript
// packages/passkey-reservation-saga-lambdas/src/orchestrator/new-task.ts
export const handler = async (event: any) => {
  // Task implementation
  return { success: true };
};
```

#### 2. Add to Step Function Definition
```typescript
// packages/passkey-reservation-saga-cdk/lib/step-function-stack.ts
const newTask = new LambdaInvoke(this, 'NewTask', {
  lambdaFunction: newTaskFunction
});

definition.next(newTask);
```

### Modifying Database Schema

#### 1. Update Model
```typescript
// packages/passkey-reservation-saga-model/src/reservation.ts
export interface Reservation {
  id: string;
  newField: string; // Add new field
}
```

#### 2. Update Data Access
```typescript
// packages/passkey-reservation-saga-lambdas/src/data/reservation-dao.ts
export class ReservationDAO {
  async create(reservation: Reservation) {
    // Include new field in DynamoDB operations
  }
}
```

#### 3. Add Migration (if needed)
```typescript
// packages/passkey-reservation-saga-lambdas/src/migrations/add-new-field.ts
export const migrateReservations = async () => {
  // Migration logic
};
```

## Testing with Other Services

### Local Service Integration
When testing with other local Passkey services, use `host.docker.internal` instead of `localhost`:

```typescript
// Temporary change for local testing
const serviceEndpoint = 'http://host.docker.internal:3000';
```

### Third-Party Payment Testing
For testing payment flows (e.g., Stripe 3DS):

#### 1. Install ngrok
```bash
brew install ngrok
```

#### 2. Expose Local Service
```bash
# Disable Netskope client first
ngrok http 4000
```

#### 3. Update Configuration
```typescript
// In sam-builder configuration
resolved['baseUrl'] = '<ngrok-url>';
```

## SQS Event Source Testing

### Queue Processors
Start queue processors to simulate SQS event sources:

```bash
# Create queue processor
local/sqs-event-source/create-queue-source

# Modify queue processor
local/sqs-event-source/modify-queue-source

# Cancel queue processor
local/sqs-event-source/cancel-queue-source
```

### Manual Message Testing
```bash
# Send test message
local/sqs.sh send-message \
  --queue-url http://localhost:9324/queue/BatchCreatedevSourceQueue \
  --message-body '{"test": "message"}'
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check port usage
lsof -i :4000

# Kill process using port
kill -9 <PID>
```

#### Docker Issues
```bash
# Restart Docker
docker restart

# Clean up containers
docker system prune
```

#### AWS Token Expiration
```bash
# Refresh AWS credentials
oktaws

# Restart local services
local/dev.sh stop
local/dev.sh start
```

#### Build Failures
```bash
# Clean and rebuild
pnpm -r clean
pnpm -r install
pnpm -r build
```

### Getting Help

#### Documentation
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Cvent Wiki](https://wiki.cvent.com/)

#### Support Channels
- **Slack**: #passkey-api
- **Team**: Steakholders (primary), JDivision (secondary)
- **Code Reviews**: Create PR and request review

## Contributing

### Pull Request Process
1. Create feature branch from `development`
2. Make changes and add tests
3. Run full test suite: `pnpm -r test`
4. Update documentation if needed
5. Create pull request
6. Address review feedback
7. Merge after approval

### Commit Guidelines
- Use conventional commit format
- Include changeset for version bumps
- Reference Jira tickets in commit messages

### Code Review Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance considerations
- [ ] Error handling implemented
- [ ] Logging added where appropriate

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 18+ (managed via asdf)
- pnpm package manager
- AWS CLI configured with appropriate credentials
- Docker (for local development)

### Local Setup
```bash
# Install tools
asdf install

# Install dependencies
pnpm -r install

# Build all packages
pnpm -r build

# Start local development environment
local/dev.sh synth
local/dev.sh start
```

### API Access
- **Local API**: http://localhost:4000/
- **Local Lambdas**: http://localhost:3001/
- **Step Functions**: http://localhost:8083/
- **DynamoDB**: http://localhost:8000/

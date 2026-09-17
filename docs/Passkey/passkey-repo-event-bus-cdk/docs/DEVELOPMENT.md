# Development Guide

## Prerequisites

### Required Software
- **Node.js**: Version 22.0.0 or higher
- **pnpm**: Package manager (install via `npm install -g pnpm`)
- **Docker**: For LocalStack and Elasticsearch development
- **AWS CLI**: Version 2.x for AWS operations
- **Git**: Version control

### Development Tools
- **asdf**: Version manager for Node.js (recommended)
- **VS Code**: Recommended IDE with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - AWS CDK snippets

### AWS Setup
```bash
# Configure AWS CLI
aws configure --profile dev
aws configure --profile staging
aws configure --profile prod

# Install CDK CLI
npm install -g aws-cdk
```

## Local Setup

### 1. Clone Repository
```bash
git clone git@github.com:cvent-internal/passkey-event-bus-cdk.git
cd passkey-event-bus-cdk
```

### 2. Install Node.js Version
```bash
# Using asdf (recommended)
asdf install

# Or manually install Node.js 22.x
```

### 3. Install Dependencies
```bash
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm --version
node --version
```

### 4. Build Project
```bash
# Build all packages
pnpm build

# Build specific package
cd packages/event-bus-cdk
pnpm build
```

### 5. Setup LocalStack (Optional)
```bash
# Start LocalStack for local AWS services
docker run -d \
  --name localstack \
  -p 4566:4566 \
  -e SERVICES=events,lambda,elasticsearch,secretsmanager \
  -e DEBUG=1 \
  localstack/localstack

# Verify LocalStack is running
curl http://localhost:4566/health
```

### 6. Setup Local Elasticsearch (Optional)
```bash
# Run Elasticsearch in Docker
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.11.0

# Verify Elasticsearch is running
curl http://localhost:9200/_cluster/health
```

## Running Tests

### Unit Tests
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test packages/event-bus-cdk/test/application.test.ts
```

### CDK Tests
```bash
# Run CDK-specific tests
cd packages/event-bus-cdk
pnpm test:cdk

# Synthesize CloudFormation templates
pnpm cdk synth

# Validate CDK code
pnpm cdk diff
```

### Integration Tests
```bash
# Run integration tests (requires LocalStack)
pnpm test:integration

# Run end-to-end tests
pnpm test:e2e
```

## Code Structure

### Monorepo Organization
```
passkey-event-bus-cdk/
├── packages/
│   ├── event-bus-cdk/           # Main CDK application
│   │   ├── lib/                 # CDK constructs and stacks
│   │   │   ├── application.ts   # Main application entry point
│   │   │   ├── *-stack.ts      # Individual CDK stacks
│   │   │   ├── utils/          # Utility functions
│   │   │   └── generated/      # Auto-generated code from AsyncAPI
│   │   ├── bin/                # CDK app bootstrap
│   │   ├── test/               # Unit and integration tests
│   │   └── package.json        # Package configuration
│   ├── elasticsearch-client/   # Elasticsearch client library
│   │   ├── src/                # Source code
│   │   │   ├── client.ts       # Main client class
│   │   │   ├── types.ts        # Type definitions
│   │   │   └── utils.ts        # Utility functions
│   │   └── test/               # Tests
│   └── reservation-consumer-lambda/ # Lambda function package
│       ├── src/                # Lambda source code
│       │   ├── index.ts        # Lambda handler
│       │   ├── processor.ts    # Event processing logic
│       │   └── elasticsearch.ts # Elasticsearch operations
│       └── test/               # Lambda tests
├── docs/                       # Documentation
├── .changeset/                 # Changeset configuration
└── pnpm-workspace.yaml        # Workspace configuration
```

### Package Dependencies
```
event-bus-cdk
├── depends on: elasticsearch-client
├── depends on: reservation-consumer-lambda
└── generates: CloudFormation templates

elasticsearch-client
├── provides: ES client utilities
└── used by: reservation-consumer-lambda

reservation-consumer-lambda
├── depends on: elasticsearch-client
└── deployed as: AWS Lambda function
```

## Coding Standards

### TypeScript Configuration
```json
// tsconfig.json
{
  "extends": "@cvent/tsconfig/base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: ['@cvent/eslint-config'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

### Prettier Configuration
```javascript
// prettier.config.js
module.exports = {
  ...require('@cvent/prettier-config'),
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5'
};
```

### Code Formatting
```bash
# Format code
pnpm fix

# Check formatting
pnpm lint

# Auto-fix ESLint issues
pnpm fix:eslint

# Auto-fix Prettier issues
pnpm fix:prettier
```

## Common Development Tasks

### Adding a New Event Type

1. **Update AsyncAPI Specification**:
   ```yaml
   # In @cvent/passkey-manage-api package
   channels:
     user.created:
       publish:
         message:
           $ref: '#/components/messages/UserCreated'
   ```

2. **Regenerate CDK Code**:
   ```bash
   cd packages/event-bus-cdk
   pnpm build:gen
   ```

3. **Add Event Handler**:
   ```typescript
   // packages/reservation-consumer-lambda/src/handlers/user-handler.ts
   export const handleUserCreated = async (event: UserCreatedEvent): Promise<void> => {
     // Process user created event
   };
   ```

4. **Update Event Router**:
   ```typescript
   // packages/reservation-consumer-lambda/src/processor.ts
   switch (event['detail-type']) {
     case 'user.created':
       await handleUserCreated(event.detail);
       break;
   }
   ```

### Adding a New Lambda Function

1. **Create Lambda Stack**:
   ```typescript
   // packages/event-bus-cdk/lib/user-processor-stack.ts
   export class UserProcessorStack extends Stack {
     constructor(scope: Construct, id: string, props: StackProps) {
       super(scope, id, props);
       
       const userProcessor = new Function(this, 'UserProcessor', {
         runtime: Runtime.NODEJS_22_X,
         handler: 'index.handler',
         code: Code.fromAsset('dist/user-processor')
       });
     }
   }
   ```

2. **Add to Application**:
   ```typescript
   // packages/event-bus-cdk/lib/application.ts
   this.userProcessorStack = new UserProcessorStack(this, stackIdGen('user-processor'), {
     // stack props
   });
   ```

3. **Create Lambda Package**:
   ```bash
   mkdir packages/user-processor-lambda
   cd packages/user-processor-lambda
   pnpm init
   ```

### Adding New Dependencies

1. **Add to Workspace**:
   ```bash
   # Add to root workspace
   pnpm add -w <package-name>
   
   # Add to specific package
   pnpm add --filter event-bus-cdk <package-name>
   ```

2. **Update Package.json**:
   ```json
   {
     "dependencies": {
       "new-package": "^1.0.0"
     }
   }
   ```

3. **Install and Build**:
   ```bash
   pnpm install
   pnpm build
   ```

### Debugging Lambda Functions

1. **Local Testing**:
   ```typescript
   // test/lambda-test.ts
   import { handler } from '../src/index';
   
   const testEvent = {
     'detail-type': 'reservation.created',
     detail: { /* test data */ }
   };
   
   await handler(testEvent, {} as Context);
   ```

2. **Remote Debugging**:
   ```bash
   # View Lambda logs
   aws logs tail /aws/lambda/passkey-reservation-consumer --follow
   
   # Invoke Lambda directly
   aws lambda invoke \
     --function-name passkey-reservation-consumer \
     --payload '{"test": "data"}' \
     response.json
   ```

### Working with Elasticsearch

1. **Local Development**:
   ```typescript
   // Use local Elasticsearch
   const client = new ElasticsearchClient({
     endpoint: 'http://localhost:9200',
     auth: { username: 'elastic', password: 'password' }
   });
   ```

2. **Index Management**:
   ```bash
   # Create index
   curl -X PUT "localhost:9200/test-index" -H 'Content-Type: application/json' -d'
   {
     "mappings": {
       "properties": {
         "field1": { "type": "text" }
       }
     }
   }'
   
   # Query index
   curl -X GET "localhost:9200/test-index/_search"
   ```

## Environment Variables

### Development Environment
```bash
# .env.local
NODE_ENV=development
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566
ELASTICSEARCH_ENDPOINT=http://localhost:9200
LOG_LEVEL=debug
```

### Testing Environment
```bash
# .env.test
NODE_ENV=test
AWS_REGION=us-east-1
ELASTICSEARCH_ENDPOINT=http://localhost:9200
LOG_LEVEL=error
```

## Git Workflow

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature development branches
- **hotfix/***: Critical production fixes

### Commit Convention
```bash
# Format: type(scope): description
git commit -m "feat(lambda): add user event processing"
git commit -m "fix(elasticsearch): handle connection timeouts"
git commit -m "docs(readme): update setup instructions"
```

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Run linting and tests locally
4. Create pull request to `develop`
5. Code review and approval
6. Merge to `develop`
7. Deploy to development environment

## Troubleshooting

### Common Issues

#### pnpm Install Failures
```bash
# Clear pnpm cache
pnpm store prune

# Delete node_modules and reinstall
rm -rf node_modules
pnpm install
```

#### CDK Version Conflicts
```bash
# Check CDK versions
pnpm list aws-cdk-lib

# Update all CDK packages
pnpm upgrade -i
# Select all CDK packages for consistent versioning
```

#### LocalStack Connection Issues
```bash
# Check LocalStack status
docker logs localstack

# Restart LocalStack
docker restart localstack

# Set AWS endpoint
export AWS_ENDPOINT_URL=http://localhost:4566
```

#### Elasticsearch Connection Issues
```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# View Elasticsearch logs
docker logs elasticsearch

# Restart Elasticsearch
docker restart elasticsearch
```

### Debug Commands

```bash
# CDK debugging
pnpm cdk synth --verbose
pnpm cdk diff --verbose

# Lambda debugging
sam local start-lambda
sam local invoke FunctionName

# Elasticsearch debugging
curl -X GET "localhost:9200/_cat/indices?v"
curl -X GET "localhost:9200/_cluster/stats?pretty"
```

## Performance Tips

### Build Optimization
```bash
# Use esbuild for faster compilation
pnpm add -D esbuild

# Parallel builds
pnpm run --parallel build
```

### Test Optimization
```bash
# Run tests in parallel
pnpm test --maxWorkers=4

# Run only changed tests
pnpm test --onlyChanged
```

### Development Workflow
- Use `--watch` mode for continuous testing
- Enable hot reloading for faster feedback
- Use incremental TypeScript compilation
- Cache dependencies with pnpm store

## IDE Configuration

### VS Code Settings
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.aws-sam": true
  }
}
```

### Recommended Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "aws-scripting-guy.cdk-snippets",
    "ms-vscode.vscode-json"
  ]
}
```

## Additional Resources

## Architecture Components


- **Producer Stack**: Generates events from the Passkey Manage API
- **Consumer Stack**: Processes reservation events and updates Elasticsearch
- **Authentication Stack**: Handles authentication-related event publishing
- **Notification Stacks**: Publishes events to notification services and Service Bus

## Quick Start


### Prerequisites
- Node.js 22+
- pnpm package manager
- AWS CDK CLI
- Docker (for local development with LocalStack)

### Local Setup
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Deploy to local environment
cd packages/event-bus-cdk
pnpm local:setup
```

### Environment Variables
The service requires configuration through Hogan for:
- Elasticsearch cluster settings
- Passkey service endpoints
- AWS credentials and regions

## Team


- **Owner**: metre-stick team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels

## Links


- [GitHub Repository](https://github.com/cvent-internal/passkey-event-bus-cdk)
- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-event-bus-cdk/)
- [Datadog Monitoring](https://cvent.datadoghq.com/apm/entity/service%3Apasskey-event-bus)
- [Octopus Deployment](https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-event-bus/deployments)

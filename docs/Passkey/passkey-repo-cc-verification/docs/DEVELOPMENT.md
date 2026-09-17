# Development Guide

## Prerequisites

### Required Tools
- **Node.js**: v18.17.1 (specified in `.nvmrc`)
- **pnpm**: v8.7.5 (package manager)
- **asdf**: Version manager for tools (recommended)
- **AWS CLI**: For CDK deployments
- **Docker**: For containerized testing (optional)

### Tool Installation
```bash
# Install asdf (if not already installed)
git clone https://github.com/asdf-vm/asdf.git ~/.asdf

# Install all tools from .tool-versions
asdf install

# Alternatively, install Node.js and pnpm manually
nvm install v18.17.1
nvm use v18.17.1
npm install -g pnpm@8.7.5
```

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-cc-verification.git
cd passkey-cc-verification
```

### 2. Install Dependencies
```bash
# Install all dependencies
pnpm install
```

### 3. Environment Configuration
```bash
# Copy environment template (if exists)
cp .env.example .env

# Configure AWS credentials
aws configure
```

### 4. Build Project
```bash
# Compile TypeScript
pnpm run build:ts

# Build CDK
pnpm run build:cdk

# Build everything
pnpm run build
```

## Running Tests

### Unit Tests
```bash
# Run Jest tests
pnpm run test:ts

# Run tests with coverage
pnpm test

# Run tests in watch mode
npx jest --watch
```

### CDK Tests
```bash
# Run CDK-specific tests
pnpm run test:cdk
```

### Code Quality
```bash
# Run all linting
pnpm run lint

# Fix linting issues
pnpm run fix

# Run ESLint only
pnpm run lint:eslint

# Run Prettier only
pnpm run lint:prettier
```

## Code Structure

### Project Layout
```
passkey-cc-verification/
├── app/                    # Lambda function source code
│   └── lambda/
│       ├── authorizer.ts   # API Gateway authorizer
│       ├── requestProcessor.ts  # Main verification handler
│       ├── dev/           # Development utilities
│       └── utils/         # Shared utilities
├── lib/                   # CDK infrastructure code
│   ├── application.ts     # CDK App definition
│   ├── stack.ts          # Main stack
│   ├── GatewayBuilder.ts # API Gateway construction
│   ├── LambdaBuilder.ts  # Lambda function construction
│   ├── config/           # Configuration classes
│   ├── common/           # Shared CDK constructs
│   └── dev/              # Development-specific constructs
├── test/                 # Test files
├── bin/                  # CDK entry points
└── docs/                 # Documentation
```

### Key Components

#### Lambda Functions
- **requestProcessor**: Main handler for credit card verification requests
- **authorizer**: API Gateway custom authorizer for request validation

#### CDK Infrastructure
- **Application**: Main CDK app with environment configuration
- **PasskeyCcVerificationStack**: Primary stack with all AWS resources
- **GatewayBuilder**: Constructs API Gateway with proper routing
- **LambdaBuilder**: Creates Lambda functions with correct permissions

#### Utilities
- **HttpsClient**: HTTP client for external API calls
- **Secrets**: AWS Secrets Manager integration

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... code changes ...

# Run tests
pnpm test

# Lint and fix
pnpm run fix

# Commit changes
git add .
git commit -m "feat: your feature description"
```

### 2. Testing Changes
```bash
# Deploy to dev environment
pnpm run ci:setup

# Test your changes
# ... manual testing ...

# Clean up (if needed)
pnpm run ci:teardown
```

### 3. Code Review
```bash
# Push branch
git push origin feature/your-feature-name

# Create pull request
# ... use GitHub UI ...
```

## Coding Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Prefer `const` over `let` where possible
- Use proper typing, avoid `any` unless necessary
- Follow async/await pattern for promises

### Code Formatting
- **Prettier**: Automatic code formatting
- **ESLint**: Code quality and style enforcement
- **Max warnings**: 30 (configured in package.json)

### Example Code Style
```typescript
// Good
export const handler = async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
  try {
    const data = JSON.stringify({
      contextId: event.queryStringParameters?.contextId,
      bearerToken: event.queryStringParameters?.bearerToken,
      userId: event.queryStringParameters?.userId
    });
    
    const apiKey = await Secrets.apiKey();
    const response = await HttpsClient.fetchData(/* ... */);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected' })
    };
  } catch (error) {
    console.error('Verification failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

### CDK Best Practices
- Use construct builders for complex resources
- Apply consistent naming conventions
- Tag all resources appropriately
- Use environment-specific configurations

## Common Development Tasks

### Adding a New Lambda Function
1. Create function file in `app/lambda/`
2. Add function to `LambdaBuilder.ts`
3. Configure API Gateway route in `GatewayBuilder.ts`
4. Add necessary IAM permissions
5. Write unit tests

### Adding New Configuration
1. Update `CardVerificationConfig` interface
2. Add environment-specific values
3. Pass config to stack constructor
4. Use in Lambda functions via environment variables

### Debugging Lambda Functions
```bash
# View logs locally (if using SAM)
sam logs -n YourFunctionName --tail

# Or use AWS CLI
aws logs tail /aws/lambda/your-function-name --follow
```

### CDK Development
```bash
# View what will be deployed
cdk diff

# Deploy specific stack
cdk deploy StackName

# Destroy stack
cdk destroy StackName

# Synthesize CloudFormation
cdk synth
```

## Testing Strategy

### Unit Tests
- Test Lambda handlers with mock events
- Test utility functions in isolation
- Mock external dependencies (AWS services, HTTP calls)

### Integration Tests
- Test CDK stack synthesis
- Validate CloudFormation templates
- Test API Gateway integration

### Manual Testing
1. Deploy to dev environment
2. Create PBR survey with credit card collection enabled
3. Fill out survey with test credit card data
4. Verify verification process completes successfully

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear CDK cache
rm -rf cdk.out
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update type definitions
pnpm update @types/*
```

#### CDK Deployment Issues
```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Check AWS credentials
aws sts get-caller-identity

# Verify CDK version compatibility
cdk --version
```

### Getting Help
- **Primary Team**: Steakholders (`#passkey-steak-holders`)
- **Secondary Team**: Meeseeksbox (`#passkey-meeseeks-box`)
- **Documentation**: [Cvent Wiki](https://wiki.cvent.com/display/DEV/)
- **Tools**: [asdf](https://wiki.cvent.com/display/DEV/asdf), [pnpm](https://wiki.cvent.com/display/DEV/Pnpm)

## Release Process

### Version Management
```bash
# Generate changeset
pnpm changeset

# Version bump (automated)
pnpm run release:version

# Publish release
pnpm run release:publish
```

### Deployment to Production
1. Merge to `master` branch
2. Jenkins automatically triggers build
3. Manual approval required for production deployment
4. Monitor deployment in CloudWatch and Datadog

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 18+ (see `.nvmrc`)
- pnpm package manager
- AWS CDK CLI
- asdf for tool version management

### Local Setup
```bash
# Install tool versions
asdf install

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm run test
```

### Testing the Service
1. Create a PBR survey with 'Enable credit card collection' option
2. View the survey using the 'Copy Survey Link'
3. Fill out the survey and enter a credit card
4. The service will verify the card in real-time via WebSocket

## Service Ownership


| Role      | Team         | Slack Channel            |
|-----------|--------------|--------------------------|
| Primary   | Steakholders | `#passkey-steak-holders` |
| Secondary | Meeseeksbox  | `#passkey-meeseeks-box`  |

## Useful Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/passkey-cdk/job/passkey-cc-verification-cdk/)
- [Octopus Deploy](https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-cc-verification/deployments)
- [DataDog Service](https://app.datadoghq.com/apm/service/passkey-cc-verification)

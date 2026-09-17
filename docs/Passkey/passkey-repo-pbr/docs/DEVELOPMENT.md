# Development Guide

## Prerequisites

### Required Tools
- **Node.js**: 18+ (managed via asdf)
- **pnpm**: Package manager (installed via npm)
- **AWS CDK CLI**: `npm install -g aws-cdk`
- **asdf**: Version manager for tools
- **Docker**: For CloudFormation linting (optional)

### Tool Installation

```bash
# Install asdf (if not already installed)
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.10.2

# Install required tools from .tool-versions
asdf install

# Install pnpm globally
npm install -g pnpm

# Install AWS CDK CLI
npm install -g aws-cdk

# Verify installations
node --version    # Should be 18+
pnpm --version    # Should be latest
cdk --version     # Should be 2.x
```

### AWS Configuration

```bash
# Configure AWS credentials (if not using SSO)
aws configure --profile passkey-dev

# Or configure SSO
aws configure sso --profile passkey-dev

# Verify access
aws sts get-caller-identity --profile passkey-dev
```

## Local Setup

### Repository Setup

```bash
# Clone the repository
git clone git@github.com:cvent-internal/passkey-pbr.git
cd passkey-pbr

# Install all dependencies
pnpm install

# Verify setup
pnpm build
pnpm test
```

### Environment Configuration

Create local environment configuration (not committed to git):

```bash
# Create local config file
touch .env.local

# Add environment-specific variables
echo "AWS_PROFILE=passkey-dev" >> .env.local
echo "CDK_DEFAULT_REGION=us-east-1" >> .env.local
```

### IDE Setup

**VS Code Configuration** (`.vscode/settings.json`):
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.workingDirectories": ["packages/passkey-pbr-cdk"],
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

**Recommended Extensions**:
- TypeScript and JavaScript Language Features
- ESLint
- Prettier - Code formatter
- AWS CDK Snippets

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test passkey-pbr.test.ts
```

### CDK Tests

```bash
# Run CDK-specific tests
pnpm test:cdk

# Update CDK snapshots
pnpm fix:jest

# Synthesize CloudFormation templates
cdk synth --app "npx ts-node bin/passkey-pr50.ts"
```

### Integration Tests

```bash
# Deploy to sandbox environment
pnpm sandbox:setup

# Run integration tests (if available)
pnpm test:integration

# Cleanup sandbox
pnpm sandbox:teardown
```

## Code Structure

### Package Organization

```
packages/passkey-pbr-cdk/
├── bin/                     # Environment entry points
│   ├── ci.ts               # CI environment
│   ├── passkey-pr50.ts     # Production environment
│   ├── passkey-ct50.ts     # Staging environment
│   └── pipeline.ts         # Pipeline configuration
├── lib/                     # CDK stack definitions
│   ├── application.ts      # Main application class
│   └── api-gateway-stack.ts # API Gateway infrastructure
├── test/                    # Unit tests
│   ├── __snapshots__/      # Jest snapshots
│   └── passkey-pbr.test.ts # Stack tests
├── package.json            # Package configuration
├── tsconfig.json           # TypeScript configuration
└── cdk.json               # CDK configuration
```

### Key Directories

**`bin/`**: Environment-specific entry points
- Each file represents a deployment target
- Contains environment-specific configuration
- Imports and configures the main Application class

**`lib/`**: Core CDK infrastructure code
- `application.ts`: Main orchestration and configuration
- `api-gateway-stack.ts`: AWS resource definitions
- Follows CDK best practices for construct organization

**`test/`**: Test files and snapshots
- Unit tests for CDK constructs
- Snapshot tests for CloudFormation templates
- Integration test helpers

## Coding Standards

### TypeScript Configuration

**Strict Mode Enabled**:
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noImplicitReturns": true
}
```

### ESLint Rules

**Configuration**: `@cvent/nucleus-eslint`

**Key Rules**:
- No unused variables
- Consistent import ordering
- Prefer const over let
- No console.log in production code

### Prettier Configuration

**Settings** (`.prettierrc`):
```json
{
  "singleQuote": true,
  "trailingComma": "none",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 120
}
```

### Code Formatting

```bash
# Check formatting
pnpm lint

# Auto-fix formatting issues
pnpm fix

# Fix specific issues
pnpm fix:prettier  # Prettier formatting
pnpm fix:eslint    # ESLint auto-fixes
```

## Common Tasks

### Adding a New Environment

1. **Create Entry Point**:
```typescript
// bin/passkey-new-env.ts
#!/usr/bin/env node
import 'source-map-support/register';
import { getAccountId, getCertificateId } from '@cvent/environments';
import { Application } from '../lib/application';

Application.build('PasskeyPbrStack', {
  awsEnvironment: {
    account: getAccountId('new-env-account'),
    region: 'us-east-1'
  },
  cventEnvironment: 'staging',
  cventSubEnv: 'staging',
  certificateId: getCertificateId(getAccountId('new-env-account'), 'us-east-1', 'passkey.com'),
  deploymentTarget: 'new-env'
});
```

2. **Update Package Scripts**:
```json
{
  "scripts": {
    "deploy:new-env": "cdk deploy --app 'npx ts-node bin/passkey-new-env.ts'"
  }
}
```

3. **Configure Hogan**: Ensure configuration exists for the new environment

### Modifying API Gateway Configuration

**Adding New Routes**:
```typescript
// In api-gateway-stack.ts
const newResource = this._api.root.addResource('new-endpoint');
const newIntegration = new HttpIntegration(`${props.pbrServiceUrl}/v1/new-endpoint`);
newResource.addMethod('GET', newIntegration);
```

**Updating Integration Settings**:
```typescript
const integration = new HttpIntegration(httpHost, {
  httpMethod: 'POST',  // Change method
  requestParameters: {  // Add parameters
    'integration.request.header.Authorization': 'method.request.header.Authorization'
  }
});
```

### Adding Configuration Parameters

1. **Update Interface**:
```typescript
export interface ApplicationProps {
  // existing properties...
  readonly newParameter: string;
}
```

2. **Update Entry Points**:
```typescript
Application.build('PasskeyPbrStack', {
  // existing properties...
  newParameter: 'value'
});
```

3. **Use in Stack**:
```typescript
constructor(scope: Construct, id: string, props?: GatewayStackProps) {
  // Use props.newParameter in resource configuration
}
```

### Debugging CDK Issues

**Synthesize Templates**:
```bash
# Generate CloudFormation templates
cdk synth --app "npx ts-node bin/passkey-pr50.ts"

# View specific stack template
cdk synth --app "npx ts-node bin/passkey-pr50.ts" PasskeyPbrStack-pr50
```

**Diff Changes**:
```bash
# Compare with deployed stack
cdk diff --app "npx ts-node bin/passkey-pr50.ts"
```

**Debug Mode**:
```bash
# Enable CDK debug logging
cdk deploy --debug --app "npx ts-node bin/passkey-pr50.ts"
```

### Working with Hogan Configuration

**Test Configuration Locally**:
```typescript
// Create test script: scripts/test-hogan.ts
import { Hogan } from '@cvent/hogan-client';

async function testConfig() {
  const hogan = new Hogan({});
  const config = await hogan.config('pr50');
  console.log(config.ConfigData['passkey-pbr-survey-wrapper']);
}

testConfig();
```

**Run Test Script**:
```bash
npx ts-node scripts/test-hogan.ts
```

## Development Workflow

### Feature Development

1. **Create Feature Branch**:
```bash
git checkout -b feature/new-feature
```

2. **Make Changes**:
```bash
# Edit code
# Add tests
# Update documentation
```

3. **Test Changes**:
```bash
pnpm build
pnpm test
pnpm lint
```

4. **Deploy to Sandbox**:
```bash
pnpm sandbox:setup
# Test functionality
pnpm sandbox:teardown
```

5. **Create Pull Request**:
```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### Release Process

1. **Create Changeset**:
```bash
pnpm changeset
# Follow prompts to describe changes
```

2. **Version Bump**:
```bash
pnpm release:version
```

3. **Merge to Master**:
- Create PR to master branch
- Ensure all tests pass
- Get code review approval

4. **Automated Deployment**:
- Jenkins pipeline automatically deploys to environments
- Monitor deployment in Octopus Deploy

### Troubleshooting

**Common Issues**:

1. **TypeScript Compilation Errors**:
```bash
# Clear build cache
pnpm clean
pnpm build
```

2. **CDK Version Conflicts**:
```bash
# Update all CDK packages together
pnpm upgrade -i
# Select all @aws-cdk/* packages
```

3. **Test Failures**:
```bash
# Update snapshots
pnpm fix:jest

# Run specific test
pnpm test -- --testNamePattern="specific test"
```

4. **Hogan Configuration Issues**:
```bash
# Verify configuration exists
curl -H "Authorization: Bearer {token}" https://hogan-api/config/{environment}
```

### Getting Help

- **Team Slack**: `#passkey-api`
- **Documentation**: Backstage service catalog
- **Code Reviews**: GitHub pull requests
- **Architecture Questions**: Cherry Pickers team leads

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 18+ (managed via `.tool-versions`)
- pnpm package manager
- AWS CDK CLI
- Access to Cvent AWS accounts and Hogan configuration service

### Local Setup
```bash
# Install required tools
asdf install

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Deploy to sandbox environment
pnpm sandbox:setup
```

### Environment-Specific Deployment
```bash
# Deploy to specific environment (example: pr50)
cdk deploy --app "npx ts-node bin/passkey-pr50.ts"
```

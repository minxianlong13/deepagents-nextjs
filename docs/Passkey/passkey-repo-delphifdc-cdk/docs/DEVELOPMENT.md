# Development Guide

## Prerequisites

### Required Software
- **Node.js**: Version 18+ (specified in `.tool-versions`)
- **pnpm**: Package manager (version 8+)
- **AWS CLI**: Version 2+ for AWS interactions
- **Docker**: For local SonarQube testing
- **Git**: Version control

### Development Tools
- **TypeScript**: Language and compiler
- **AWS CDK CLI**: Infrastructure deployment tool
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Access Requirements
- **Cvent NPM Registry**: Access to `@cvent/*` packages
- **AWS Accounts**: Appropriate permissions for target environments
- **GitHub**: Access to `cvent-internal` organization
- **Oktaws**: Cvent's AWS credential management tool

## Local Setup

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-delphifdc-cdk.git
cd passkey-delphifdc-cdk

# Install dependencies (root level)
pnpm install

# Navigate to CDK directory
cd cdk

# Install CDK dependencies
pnpm install

# Build the project
pnpm build
```

### Environment Configuration
```bash
# Configure AWS credentials using oktaws
oktaws --profile your-profile

# Verify AWS access
aws sts get-caller-identity

# Set up environment variables (if needed)
export AWS_PROFILE=your-profile
export AWS_REGION=us-east-1
```

### Verify Setup
```bash
# Run tests to verify setup
pnpm test

# Lint code
pnpm lint

# Build CDK templates
pnpm build:cdk
```

## Running Tests

### Unit Tests
```bash
# Run all tests
pnpm test:ts

# Run tests in watch mode
pnpm test:ts --watch

# Run tests with coverage
pnpm test:ts --coverage

# Update test snapshots
pnpm test:ts -u
```

### CDK Tests
```bash
# Run CDK-specific tests
pnpm test:cdk

# Synthesize templates for testing
pnpm build:cdk
```

### Integration Tests
```bash
# Deploy to sandbox for integration testing
pnpm sandbox:setup

# Run integration tests (if available)
# pnpm test:integration

# Clean up sandbox
pnpm sandbox:teardown
```

### Quality Checks
```bash
# Run all quality checks
pnpm test

# Individual quality tools
pnpm lint:eslint
pnpm lint:prettier
pnpm test:sonar
```

## Code Structure

### Project Layout
```
passkey-delphifdc-cdk/
├── .changeset/              # Version management
├── cdk/                     # Main CDK project
│   ├── bin/                 # Environment entry points
│   │   ├── ci.ts           # CI environment
│   │   ├── passkey-*.ts    # Production environments
│   │   └── pipeline.ts     # Pipeline configuration
│   ├── lib/                # CDK constructs and stacks
│   │   ├── application.ts  # Main application
│   │   ├── stack.ts        # Main stack (IAM)
│   │   ├── dynamodb-stack.ts # DynamoDB stack
│   │   ├── db-structure.ts # Table definitions
│   │   └── props/          # TypeScript interfaces
│   ├── test/               # Unit tests
│   └── package.json        # CDK dependencies
├── docs/                   # Documentation
├── local/                  # Local development tools
└── package.json            # Root workspace config
```

### Key Directories

#### `cdk/bin/`
Contains environment-specific entry points that initialize the CDK application:
- Each file represents a deployable environment
- Imports environment configuration from `@cvent/environments`
- Instantiates the main Application class

#### `cdk/lib/`
Core CDK constructs and business logic:
- **application.ts**: Orchestrates stack creation and configuration
- **stack.ts**: Main stack with IAM roles and policies
- **dynamodb-stack.ts**: DynamoDB table management
- **db-structure.ts**: Table creation and configuration logic

#### `cdk/test/`
Unit tests for CDK constructs:
- Tests stack synthesis and resource creation
- Validates IAM policies and permissions
- Ensures proper resource naming and tagging

## Coding Standards

### TypeScript Guidelines
- **Strict Mode**: All TypeScript strict checks enabled
- **Type Safety**: Explicit types preferred over `any`
- **Interfaces**: Use interfaces for object shapes
- **Readonly**: Mark properties readonly when appropriate

### Code Style
```typescript
// Good: Explicit types and readonly properties
interface StackProps {
  readonly environment: string;
  readonly region: string;
}

// Good: Descriptive variable names
const dynamoDbTableName = `passkey-dfdc-tasks-${environment}`;

// Good: Error handling
try {
  const table = this.createTable(props);
} catch (error) {
  console.error('Failed to create table:', error);
  throw error;
}
```

### Naming Conventions
- **Classes**: PascalCase (`PasskeyDelphiFDCStack`)
- **Variables/Functions**: camelCase (`createTable`)
- **Constants**: UPPER_SNAKE_CASE (`TABLE_NAME`)
- **Files**: kebab-case (`dynamodb-stack.ts`)
- **AWS Resources**: Include environment suffix

### ESLint Configuration
The project uses Cvent's ESLint configuration:
```javascript
// eslint.config.js
import { nucleus } from '@cvent/nucleus-eslint';

export default [
  ...nucleus.configs.node,
  ...nucleus.configs.typescript,
  {
    rules: {
      // Custom rules can be added here
    }
  }
];
```

## Common Tasks

### Adding a New Environment

1. **Create Entry Point**:
```bash
# Create new environment file
touch cdk/bin/passkey-newenv.ts
```

2. **Configure Environment**:
```typescript
// cdk/bin/passkey-newenv.ts
import { Application } from '../lib/application';
import { getEnvironment } from '@cvent/environments';

const env = getEnvironment('newenv');
new Application('passkey-delphifdc', {
  awsEnvironment: env.aws,
  cventEnvironment: env.cvent,
  hoganEnvironment: env.hogan
});
```

3. **Add Build Script** (if needed):
```json
// cdk/package.json
{
  "scripts": {
    "newenv:setup": "cdk-cvent deploy --assembly=cdk.out/passkey-newenv"
  }
}
```

### Adding a New DynamoDB Table

1. **Update DbStructure**:
```typescript
// cdk/lib/db-structure.ts
private Tables = {
  // ... existing tables
  NEW_TABLE: {
    tableName: 'passkey-dfdc-newtable',
    keyName: 'key'
  }
};

// Add property
public readonly newTable: DynamoDB.Table;

// Initialize in constructor
this.Tables.NEW_TABLE.tableName = `${this.Tables.NEW_TABLE.tableName}-${environmentName}`;
this.newTable = this.makeTable(scope, this.Tables.NEW_TABLE, ttlAttributeName);
```

2. **Update IAM Policies**:
```typescript
// cdk/lib/stack.ts
const addDynamoDbPolicy = (role: Role, dbStructure: DbStructure) => {
  role.addToPolicy(
    new PolicyStatement({
      actions: [/* ... existing actions */],
      resources: [
        // ... existing resources
        dbStructure.newTable.tableArn
      ],
      effect: Effect.ALLOW
    })
  );
};
```

3. **Add Tests**:
```typescript
// cdk/test/db-structure.test.ts
test('creates new table with correct configuration', () => {
  // Test implementation
});
```

### Modifying IAM Permissions

1. **Update Policy Actions**:
```typescript
// cdk/lib/stack.ts
const addDynamoDbPolicy = (role: Role, dbStructure: DbStructure) => {
  role.addToPolicy(
    new PolicyStatement({
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        // Add new actions here
        'dynamodb:DescribeTable'
      ],
      resources: [/* ... */],
      effect: Effect.ALLOW
    })
  );
};
```

2. **Test Changes**:
```bash
# Synthesize to check generated policies
pnpm build:cdk

# Review generated CloudFormation
cat cdk.out/PasskeyDelphiFDC-Main-ci/PasskeyDelphiFDC-Main-ci.template.json
```

### Adding Configuration Options

1. **Update Props Interface**:
```typescript
// cdk/lib/props/stack-props.ts
export interface PasskeyDelphiFDCStackProps extends StackProps {
  readonly cventEnvironment: string;
  readonly hoganEnvironment: Env;
  readonly newOption?: string; // Add new option
}
```

2. **Use in Stack**:
```typescript
// cdk/lib/stack.ts
export class PasskeyDelphiFDCStack extends Stack {
  constructor(scope: Construct, id: string, dbStructure: DbStructure, props?: PasskeyDelphiFDCStackProps) {
    super(scope, id, props);
    
    if (props?.newOption) {
      // Use the new option
    }
  }
}
```

## Debugging

### CDK Debugging
```bash
# Synthesize templates to see generated CloudFormation
pnpm build:cdk

# View differences between deployed and local
cdk-cvent diff

# Enable CDK debug logging
export CDK_DEBUG=true
pnpm build:cdk
```

### AWS Debugging
```bash
# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name PasskeyDelphiFDC-DB-ci

# View stack events
aws cloudformation describe-stack-events --stack-name PasskeyDelphiFDC-DB-ci

# Check DynamoDB tables
aws dynamodb list-tables --region us-east-1
aws dynamodb describe-table --table-name passkey-dfdc-tasks-ci
```

### Local Testing
```bash
# Run SonarQube locally for code analysis
docker run --rm -p 9999:9000 sonarqube

# Run local sonar scan
pnpm sonar-local

# Test specific components
pnpm test:ts --testNamePattern="DbStructure"
```

## Contributing

### Development Workflow
1. **Create Feature Branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**:
   - Follow coding standards
   - Add/update tests
   - Update documentation if needed

3. **Test Changes**:
```bash
pnpm build
pnpm test
pnpm lint
```

4. **Create Changeset** (for version changes):
```bash
pnpm changeset
```

5. **Commit and Push**:
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

6. **Create Pull Request**:
   - Use the provided PR template
   - Ensure all CI checks pass
   - Request review from team members

### Code Review Guidelines
- **Functionality**: Does the code work as intended?
- **Tests**: Are there adequate tests for new functionality?
- **Documentation**: Is documentation updated for significant changes?
- **Security**: Are there any security implications?
- **Performance**: Will changes impact deployment or runtime performance?

### Release Process
1. **Version Bump**: Use changesets for version management
2. **Testing**: Ensure all tests pass in CI
3. **Deployment**: Deploy to staging environments first
4. **Validation**: Verify functionality in staging
5. **Production**: Deploy to production environments
6. **Monitoring**: Monitor deployment and system health

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
# Update test snapshots
pnpm test:ts -u

# Run specific test file
pnpm test:ts db-structure.test.ts

# Debug test with verbose output
pnpm test:ts --verbose
```

#### Deployment Issues
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify CDK bootstrap
cdk bootstrap aws://ACCOUNT/REGION

# Check for resource conflicts
aws dynamodb list-tables --region us-east-1
```

### Getting Help
- **Team Documentation**: Check internal wiki and confluence
- **AWS CDK Docs**: [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/)
- **Cvent Libraries**: Internal documentation for `@cvent/*` packages
- **Team Slack**: Reach out to the passkey team for assistance

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 18+ (specified in `.tool-versions`)
- pnpm package manager
- AWS CLI configured with appropriate credentials
- Access to Cvent's internal npm registry

### Local Setup
```bash
# Install dependencies
pnpm install

# Build the project
cd cdk
pnpm build

# Run tests
pnpm test

# Deploy to sandbox environment
pnpm sandbox:setup
```

### Environment-Specific Deployment
```bash
# Deploy to specific environment (example: passkey-alpha)
cdk-cvent deploy --assembly=cdk.out/passkey-alpha
```

## Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-delphifdc-cdk)
- [Octopus Deploy](https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-delphifdc/deployments)
- [SonarQube](https://sonar.core.cvent.org/dashboard?id=passkey-delphifdc-cdk)
- [Design Documentation](https://wiki.cvent.com/display/PASKY/Design+of+delphi.fdc)

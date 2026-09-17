# Technical Details

## Technology Stack

- **Framework**: AWS CDK (Cloud Development Kit) v2
- **Language**: TypeScript 5.9.2
- **Build Tool**: pnpm (Package Manager)
- **Runtime**: Node.js 18+ (specified in `.tool-versions`)
- **Infrastructure**: AWS CloudFormation (via CDK)
- **Database**: Amazon DynamoDB
- **Identity Management**: AWS IAM

## Dependencies

### Core CDK Dependencies
```json
{
  "aws-cdk": "^2.1029.1",
  "aws-cdk-lib": "^2.219.0",
  "constructs": "^10.4.2"
}
```

### Cvent Internal Libraries
```json
{
  "@cvent/builder-cdk": "3.13.14",
  "@cvent/cdk-applications": "1.43.10",
  "@cvent/cdk-lib": "1.32.4",
  "@cvent/environments": "^1.46.1",
  "@cvent/octopusdeploy-cdk": "^4.5.6"
}
```

### Development Tools
```json
{
  "typescript": "^5.9.2",
  "jest": "^30.1.3",
  "ts-jest": "^29.4.4",
  "eslint": "^9.35.0",
  "prettier": "^3.6.2"
}
```

### Build and Quality Tools
```json
{
  "@cvent/builder-prettier": "^1.3.2",
  "@cvent/builder-sonar": "^4.3.4",
  "@cvent/nucleus-eslint": "^4.0.0",
  "sonarqube-scanner": "^4.3.2"
}
```

## Configuration

### Environment Variables
The CDK uses environment-specific configuration through the `@cvent/environments` library:

- **AWS_ACCOUNT**: Target AWS account ID
- **AWS_REGION**: Target AWS region
- **CVENT_ENVIRONMENT**: Cvent environment identifier
- **HOGAN_ENVIRONMENT**: Hogan environment configuration

### CDK Configuration
**File**: `cdk/cdk.json`
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/ci.ts"
}
```

### TypeScript Configuration
**File**: `cdk/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"]
  }
}
```

### Jest Configuration
**File**: `cdk/jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  reporters: ['default', 'jest-junit']
};
```

## Database Schema

### Table Configuration
All DynamoDB tables share the same configuration pattern:

```typescript
{
  partitionKey: {
    name: 'key',
    type: DynamoDB.AttributeType.STRING
  },
  encryption: DynamoDB.TableEncryption.AWS_MANAGED,
  pointInTimeRecovery: true,
  timeToLiveAttribute: 'ttl',
  billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST
}
```

### Table Specifications

#### Tasks Table
- **Name Pattern**: `passkey-dfdc-tasks-{environment}`
- **Purpose**: File processing task management
- **Partition Key**: `key` (String)
- **TTL Attribute**: `ttl`
- **Billing**: Pay-per-request
- **Encryption**: AWS managed keys

#### Notifications Table
- **Name Pattern**: `passkey-dfdc-notifications-{environment}`
- **Purpose**: System notification management
- **Schema**: Same as Tasks table

#### History Table
- **Name Pattern**: `passkey-dfdc-history-{environment}`
- **Purpose**: Audit trail and historical records
- **Schema**: Same as Tasks table

#### Errors Table
- **Name Pattern**: `passkey-dfdc-errors-{environment}`
- **Purpose**: Error logging and tracking
- **Schema**: Same as Tasks table

### Performance Characteristics
- **Read/Write Capacity**: On-demand scaling
- **Latency**: Single-digit millisecond response times
- **Throughput**: Scales automatically based on demand
- **Consistency**: Eventually consistent reads by default

## Build System

### Package Manager
Uses pnpm for dependency management with workspace support:

**File**: `pnpm-workspace.yaml`
```yaml
packages:
  - 'cdk'
```

### Build Scripts
**Root package.json**:
```json
{
  "scripts": {
    "changeset": "changeset",
    "release:version": "changeset-cvent release:version",
    "update-snapshots": "pnpm -r test:ts -u"
  }
}
```

**CDK package.json**:
```json
{
  "scripts": {
    "build:ts": "tsc",
    "build:cdk": "cdk-cvent build",
    "build": "pnpm build:ts && pnpm build:cdk",
    "test:ts": "jest",
    "test:cdk": "cdk-cvent test",
    "lint": "run-p -ls lint:*",
    "fix": "run-s -ls fix:*"
  }
}
```

### Compilation Process
1. **TypeScript Compilation**: `tsc` compiles TypeScript to JavaScript
2. **CDK Synthesis**: `cdk-cvent build` generates CloudFormation templates
3. **Testing**: Jest runs unit tests against compiled code
4. **Linting**: ESLint and Prettier ensure code quality

## Monitoring & Logging

### SonarQube Integration
- **Project Key**: `passkey-delphifdc-cdk`
- **Quality Gate**: Configured for code quality metrics
- **Coverage**: Tracks test coverage across the codebase
- **Local Testing**: Docker-based SonarQube for development

### Quality Metrics
- **Coverage Threshold**: Maintained through Jest configuration
- **ESLint Rules**: Maximum 30 warnings allowed
- **Prettier**: Enforced code formatting
- **TypeScript**: Strict type checking enabled

### Build Monitoring
- **Jenkins Pipeline**: Automated builds and deployments
- **Octopus Deploy**: Deployment orchestration and monitoring
- **AWS CloudWatch**: Infrastructure monitoring (via deployed resources)

## Security Configuration

### IAM Permissions
The CDK creates IAM roles with minimal required permissions:

```typescript
{
  actions: [
    'dynamodb:GetItem',
    'dynamodb:PutItem',
    'dynamodb:BatchGetItem',
    'dynamodb:BatchWriteItem',
    'dynamodb:DeleteItem',
    'dynamodb:Query',
    'dynamodb:Scan',
    'dynamodb:UpdateItem'
  ],
  resources: [
    'arn:aws:dynamodb:region:account:table/passkey-dfdc-*'
  ]
}
```

### Cross-Account Access
- **KMS Policy**: `CrossAccountKMSPolicy-v2-{region}`
- **Purpose**: Enables encryption key access across AWS accounts
- **Scope**: Region-specific policy attachment

### Encryption
- **DynamoDB**: AWS managed encryption at rest
- **KMS**: Cross-account key access for multi-account architecture
- **Transit**: HTTPS for all AWS API communications

## Development Tools

### Code Quality
- **ESLint**: JavaScript/TypeScript linting with Cvent rules
- **Prettier**: Code formatting with Cvent configuration
- **TypeScript**: Static type checking and compilation
- **Jest**: Unit testing framework with coverage reporting

### Version Management
- **Changesets**: Automated version management and changelog generation
- **Git**: Version control with conventional commit messages
- **Semantic Versioning**: Follows semver for releases

### Local Development
```bash
# Install dependencies
pnpm install

# Build project
pnpm build

# Run tests
pnpm test

# Lint and fix code
pnpm fix

# Local SonarQube analysis
pnpm sonar-local
```

## Performance Considerations

### CDK Synthesis
- **Template Size**: Optimized CloudFormation template generation
- **Deployment Speed**: Stack separation enables parallel deployment
- **Resource Limits**: Stays within CloudFormation resource limits

### DynamoDB Optimization
- **Billing Mode**: Pay-per-request eliminates capacity planning
- **Partition Key**: Simple string key for even distribution
- **TTL**: Automatic cleanup reduces storage costs
- **Point-in-Time Recovery**: Minimal performance impact

### Build Performance
- **Incremental Builds**: TypeScript incremental compilation
- **Parallel Execution**: pnpm workspace parallel script execution
- **Caching**: Node modules and build artifacts cached in CI

## Deployment Architecture

### Multi-Environment Support
- **Environment Isolation**: Separate AWS accounts/regions per environment
- **Configuration Management**: Environment-specific parameter injection
- **Resource Naming**: Environment suffix prevents naming conflicts

### CI/CD Integration
- **Jenkins**: Build automation and testing
- **Octopus Deploy**: Multi-environment deployment orchestration
- **GitHub**: Source code management and pull request workflows

### Rollback Strategy
- **Stack-Level**: Independent rollback of DynamoDB and Main stacks
- **CloudFormation**: Native rollback capabilities
- **Point-in-Time Recovery**: Database-level recovery for data issues
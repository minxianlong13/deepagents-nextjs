# Technical Details

## Technology Stack

- **Runtime**: Node.js 18.x (see `.nvmrc`)
- **Language**: TypeScript 4.9.5
- **Framework**: AWS Lambda + API Gateway WebSocket
- **Build Tool**: pnpm (workspace management)
- **Infrastructure**: AWS CDK 2.x
- **Testing**: Jest 29.x with SWC compiler
- **Code Quality**: ESLint + Prettier
- **CI/CD**: Jenkins + Octopus Deploy

## Dependencies

### Production Dependencies

```json
{
  "@cvent/aws-cdk-core": "^1.151.0",
  "@cvent/aws-cdk-logs": "^1.157.1", 
  "@cvent/cdk-lib": "1.30.1",
  "@cvent/environments": "^1.40.39",
  "@cvent/hogan-client": "^1.4.2",
  "@cvent/octopusdeploy-cdk": "^4.5.6",
  "@types/aws-lambda": "^8.10.115",
  "aws-cdk-lib": "^2.211.0",
  "constructs": "^10.1.289"
}
```

### Key Dependencies Explained

- **@cvent/cdk-lib**: Cvent's CDK extensions and utilities
- **@cvent/environments**: Environment-specific configuration management
- **@cvent/hogan-client**: Service discovery and configuration client
- **aws-cdk-lib**: AWS CDK core library for infrastructure as code
- **constructs**: CDK constructs for building cloud applications

### Development Dependencies

```json
{
  "@cvent/builder-cdk": "^3.4.0",
  "@cvent/jest-config": "^1.0.5",
  "@cvent/nucleus-eslint": "^3.2.3",
  "@swc/core": "^1.3.53",
  "@swc/jest": "^0.2.26",
  "typescript": "^4.9.5",
  "jest": "^29.7.0",
  "eslint": "^7.32.0",
  "prettier": "^2.7.1"
}
```

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LEDGER_URL` | Passkey Ledger service base URL | `https://api.passkey.com/ledger` |
| `AUTH_URL` | Authentication service base URL | `https://auth.passkey.com` |
| `AWS_REGION` | AWS region for deployment | `us-east-1` |
| `ENVIRONMENT` | Deployment environment | `dev`, `staging`, `prod` |

### AWS Secrets Manager

Secrets are stored in AWS Secrets Manager and retrieved at runtime:

```typescript
// API key retrieval
const apiKey = await Secrets.apiKey();
```

**Secret Names by Environment**:
- Development: `dev/passkey-cc-verification/api-key`
- Staging: `staging/passkey-cc-verification/api-key`
- Production: `prod/passkey-cc-verification/api-key`

### CDK Configuration

Configuration is managed through CDK context and environment-specific files:

```json
// cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

## Build System

### Package Scripts

```json
{
  "build:ts": "tsc",
  "build:cdk": "cdk-cvent build", 
  "build": "run-s -ls build:*",
  "test:ts": "jest",
  "test:cdk": "cdk-cvent test",
  "test": "run-p -ls test:*",
  "lint": "run-p -ls lint:*",
  "fix": "run-s -ls fix:*"
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
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

```javascript
// jest.config.js
module.exports = {
  preset: '@cvent/jest-config',
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest']
  },
  testMatch: ['**/test/**/*.test.ts'],
  collectCoverageFrom: [
    'app/**/*.ts',
    'lib/**/*.ts',
    '!**/*.d.ts'
  ]
};
```

## AWS Infrastructure

### Lambda Functions

**Authorizer Lambda**:
- Runtime: Node.js 18.x
- Memory: 128 MB
- Timeout: 30 seconds
- Environment: VPC not required
- IAM: Secrets Manager read access

**Request Processor Lambda**:
- Runtime: Node.js 18.x  
- Memory: 256 MB
- Timeout: 30 seconds
- Environment: VPC not required
- IAM: Secrets Manager read access

### API Gateway WebSocket

- **Type**: WebSocket API
- **Stage**: Environment-specific (dev, staging, prod)
- **Routes**: 
  - `$connect` → Authorizer Lambda
  - `$default` → Request Processor Lambda
- **Throttling**: Configured per environment
- **Logging**: CloudWatch integration enabled

### IAM Roles and Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:*/passkey-cc-verification/*"
    },
    {
      "Effect": "Allow", 
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## Monitoring & Logging

### CloudWatch Metrics

- **Lambda Metrics**: Duration, errors, invocations, throttles
- **API Gateway Metrics**: Connection count, message count, errors
- **Custom Metrics**: Verification success/failure rates

### Logging Strategy

```typescript
// Structured logging example
console.info('Begin verification process', {
  contextId: event.queryStringParameters.contextId,
  userId: event.queryStringParameters.userId,
  timestamp: new Date().toISOString()
});
```

### DataDog Integration

Service is monitored in DataDog with:
- Service name: `passkey-cc-verification`
- APM tracing enabled
- Custom dashboards for business metrics
- Alerting on error rates and latency

### SonarQube Analysis

Code quality monitored via SonarQube:
- Project key: `passkey-cc-verification-cdk`
- Quality gates enforced in CI/CD
- Coverage thresholds: 80% minimum

## Security

### Secrets Management

- API keys stored in AWS Secrets Manager
- Runtime secret retrieval (no hardcoded values)
- Automatic secret rotation support
- Environment-specific secret isolation

### Network Security

- HTTPS/WSS encryption for all communications
- API Gateway provides DDoS protection
- Lambda functions in isolated execution environments
- VPC not required (public subnet deployment)

### Authentication & Authorization

- Bearer token validation via external auth service
- API key authentication for service-to-service calls
- Connection-level authorization (WebSocket authorizer)
- Request-level validation

## Performance Characteristics

### Lambda Cold Start

- TypeScript compilation: ~200ms
- Dependency loading: ~100ms
- AWS SDK initialization: ~50ms
- Total cold start: ~350ms

### Optimization Strategies

- SWC compiler for faster builds
- Tree shaking to reduce bundle size
- Connection pooling for external API calls
- Secrets caching to reduce API calls

### Scaling Limits

- Lambda concurrent executions: 1000 (default)
- API Gateway connections: 100,000 per account
- WebSocket message rate: 1000 messages/second per connection
- Secrets Manager: 5000 requests/second per secret

## Development Tools

### Code Quality

- **ESLint**: `@cvent/nucleus-eslint` configuration
- **Prettier**: Code formatting with 2-space indentation
- **Husky**: Git hooks for pre-commit validation
- **Changesets**: Automated versioning and changelog

### Testing Tools

- **Jest**: Unit testing framework
- **AWS CDK Assert**: Infrastructure testing
- **SWC**: Fast TypeScript compilation
- **Coverage**: Istanbul-based coverage reporting

### Build Tools

- **pnpm**: Fast, disk space efficient package manager
- **npm-run-all**: Parallel and sequential script execution
- **TypeScript**: Static type checking
- **AWS CDK**: Infrastructure as code
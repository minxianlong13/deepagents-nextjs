# Technical Details

## Technology Stack

- **Framework**: AWS CDK (Cloud Development Kit) v2.177.0
- **Language**: TypeScript 4.9.5
- **Runtime**: Node.js 18+ (managed via asdf)
- **Package Manager**: pnpm (workspace-enabled)
- **Build Tool**: TypeScript Compiler (tsc) + AWS CDK CLI
- **Testing Framework**: Jest 29.6.4
- **Cloud Provider**: AWS (API Gateway, Certificate Manager, CloudFormation)

## Dependencies

### Core CDK Dependencies
```json
{
  "@cvent/cdk-applications": "^1.9.0",
  "@cvent/cdk-lib": "^1.4.2", 
  "@cvent/environments": "^1.24.25",
  "@cvent/hogan-client": "^2.0.2",
  "@cvent/octopusdeploy-cdk": "^4.4.1",
  "aws-cdk-lib": "^2.177.0",
  "constructs": "^10.0.0"
}
```

### Development Dependencies
```json
{
  "@cvent/builder-cdk": "^3.13.7",
  "@cvent/builder-changesets": "^1.5.0",
  "@cvent/builder-prettier": "^1.2.3",
  "@cvent/builder-sonar": "^4.1.0",
  "@cvent/jest-config": "^1.0.0",
  "@cvent/nucleus-eslint": "^4.0.0",
  "aws-cdk": "^2.177.0",
  "typescript": "^4.9.5"
}
```

### AWS SDK Dependencies (Testing)
```json
{
  "@aws-sdk/client-cloudwatch-events": "^3.418.0",
  "@aws-sdk/client-codedeploy": "^3.418.0",
  "@aws-sdk/client-ecs": "^3.418.0",
  "@aws-sdk/client-sfn": "^3.418.0",
  "@aws-sdk/client-ssm": "^3.418.0"
}
```

## Configuration

### Environment Variables

The application uses environment-specific configuration through entry point files rather than environment variables:

**Deployment Configuration** (via entry points):
- `AWS_ACCOUNT`: Resolved via `@cvent/environments`
- `AWS_REGION`: Typically `us-east-1`
- `DEPLOYMENT_TARGET`: Environment identifier (pr50, ct50, etc.)
- `CERTIFICATE_ID`: SSL certificate identifier per environment

### Configuration Files

#### `cdk.json`
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/pipeline.ts",
  "requireApproval": "never",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": "true"
  }
}
```

#### `tsconfig.json`
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
  },
  "exclude": ["cdk.out"]
}
```

#### `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
```

### Hogan Configuration Schema

The service expects the following configuration structure from Hogan:

```json
{
  "passkey-pbr-survey-wrapper": {
    "endpoint": {
      "internal": "https://internal-service-endpoint"
    },
    "custom-domain": "pbr.passkey.com"
  }
}
```

## Build System

### pnpm Workspace Configuration

**Root `package.json` scripts**:
```json
{
  "scripts": {
    "build": "pnpm recursive run --if-present build",
    "test": "pnpm recursive run --if-present test", 
    "lint": "pnpm recursive run --if-present lint",
    "fix": "pnpm recursive run --if-present fix",
    "clean": "pnpm recursive run --if-present clean"
  }
}
```

**CDK Package scripts**:
```json
{
  "scripts": {
    "build:ts": "tsc",
    "build:cdk": "cdk-cvent build", 
    "build": "run-s -ls build:*",
    "test:ts": "jest",
    "test:cdk": "cdk-cvent test",
    "test": "run-p -ls test:*",
    "sandbox:setup": "cdk-cvent deploy --assembly cdk.out/local",
    "sandbox:teardown": "cdk-cvent destroy --assembly cdk.out/local"
  }
}
```

### Build Process

1. **TypeScript Compilation**: `tsc` compiles TypeScript to JavaScript
2. **CDK Synthesis**: `cdk synth` generates CloudFormation templates
3. **Template Validation**: `cdk-cvent build` validates templates
4. **Testing**: Jest runs unit tests and CDK snapshot tests
5. **Linting**: ESLint and Prettier check code quality

## AWS Resources Created

### API Gateway Resources
- **RestApi**: Main API Gateway instance
- **DomainName**: Custom domain configuration
- **BasePathMapping**: Maps domain to API stage
- **Resource**: `/survey` path resource
- **Method**: GET method on survey resource
- **Integration**: HTTP integration to backend service

### Certificate Manager
- **Certificate Reference**: References existing ACM certificate
- **Domain Validation**: Validates certificate for custom domain

### CloudFormation
- **Stack**: Contains all resources for the environment
- **Outputs**: DNS name for domain configuration

### Resource Naming Convention
- Stack: `PasskeyPbrStack-{deploymentTarget}-{version}`
- API Gateway: `passkey-pbr-custom-domain-{envName}`
- Resources follow CDK default naming with logical IDs

## Monitoring & Logging

### CloudWatch Integration

**Automatic Metrics**:
- `AWS/ApiGateway/Count`: Request count
- `AWS/ApiGateway/Latency`: Request latency
- `AWS/ApiGateway/4XXError`: Client errors
- `AWS/ApiGateway/5XXError`: Server errors
- `AWS/ApiGateway/IntegrationLatency`: Backend response time

**Log Groups**:
- API Gateway execution logs (if enabled)
- API Gateway access logs (if enabled)

### Datadog Integration

**Service Configuration**:
- Service Name: `passkey-pbr-cdk`
- Environment tags for filtering
- APM integration for request tracing

**Dashboard Links**:
- Environment-specific Datadog dashboards
- Service performance metrics
- Error rate monitoring

### SonarQube Integration

**Code Quality Metrics**:
- Project Key: `passkey-pbr-cdk`
- Code coverage reporting
- Security vulnerability scanning
- Code smell detection

## Security Configuration

### SSL/TLS Settings
```typescript
{
  securityPolicy: SecurityPolicy.TLS_1_2,
  endpointType: EndpointType.REGIONAL,
  certificate: Certificate.fromCertificateArn(...)
}
```

### API Gateway Security
- No API keys required
- No request validation
- CORS handled by backend service
- Regional endpoint for better security

### IAM Permissions

**CDK Deployment Role**:
- CloudFormation stack management
- API Gateway resource management
- Certificate Manager read access
- Parameter Store access for configuration

**Runtime Permissions**:
- No runtime IAM roles (stateless proxy)
- Backend service handles authentication

## Performance Considerations

### API Gateway Limits
- **Request Rate**: 10,000 requests per second (default)
- **Burst Limit**: 5,000 requests (default)
- **Payload Size**: 10MB maximum
- **Timeout**: 29 seconds maximum

### Optimization Settings
- Regional endpoint for lower latency
- HTTP integration for minimal overhead
- No request/response transformation
- CloudFront integration possible for caching

### Monitoring Thresholds
- Latency: Monitor >1000ms requests
- Error Rate: Alert on >5% error rate
- Availability: Target 99.9% uptime

## Development Tools

### Code Quality
- **ESLint**: `@cvent/nucleus-eslint` configuration
- **Prettier**: `@cvent/builder-prettier` formatting
- **TypeScript**: Strict mode enabled
- **Jest**: Unit testing with snapshot testing

### Version Management
- **Changesets**: `@changesets/cli` for version management
- **Semantic Versioning**: Follows semver conventions
- **Release Automation**: Automated via CI/CD pipeline

### Local Development
- **asdf**: Tool version management
- **pnpm**: Fast, disk-efficient package manager
- **ts-node**: Direct TypeScript execution
- **Source Maps**: Enabled for debugging
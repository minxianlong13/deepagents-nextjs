# Technical Details

## Technology Stack

### Core Technologies
- **Language**: TypeScript 4.9.5
- **Runtime**: Node.js 16+ (managed via asdf)
- **Package Manager**: pnpm with workspace support
- **Build System**: Nx 20.7.0 monorepo toolkit
- **Infrastructure**: AWS CDK v2 (2.178.2)
- **Cloud Platform**: Amazon Web Services (AWS)

### AWS Services
- **Compute**: AWS Lambda (Node.js runtime)
- **API**: Amazon API Gateway (HTTP APIs)
- **Scheduling**: Amazon EventBridge
- **Configuration**: AWS Systems Manager Parameter Store
- **Monitoring**: Amazon CloudWatch
- **Deployment**: AWS CloudFormation (via CDK)
- **Security**: AWS IAM roles and policies

### Development Tools
- **Testing**: Jest 29.7.0 with TypeScript support
- **Linting**: ESLint 8.57.0 with TypeScript parser
- **Formatting**: Prettier 2.8.8
- **Type Checking**: TypeScript compiler with strict mode
- **Build**: esbuild for fast compilation
- **CI/CD**: Jenkins with pipeline-utils library

## Dependencies

### Root Package Dependencies

#### Development Dependencies
```json
{
  "@changesets/cli": "^2.27.1",
  "@cvent/analytics": "1.6.6",
  "@cvent/builder-cdk": "3.13.7",
  "@cvent/builder-changesets": "^1.11.1",
  "@cvent/builder-pnpm": "^1.5.1",
  "@cvent/builder-prettier": "^1.2.15",
  "@cvent/builder-sonar": "^4.3.3",
  "@cvent/cdf": "1.65.1",
  "@cvent/cdk-applications": "1.40.11",
  "@cvent/cdk-credential-plugin": "1.1.8",
  "@cvent/cdk-lib": "1.29.10",
  "@cvent/environments": "^1.37.0",
  "@cvent/eslint-config": "1.0.33",
  "@cvent/feature-flags": "2.7.12",
  "@cvent/framework-scripts": "1.5.69",
  "@cvent/jest-config": "1.3.0",
  "@cvent/octopusdeploy-cdk": "^4.5.0",
  "@cvent/prettier-config": "1.0.34",
  "@cvent/tsconfig": "1.2.5"
}
```

### GDPR Lambdas Dependencies

#### Runtime Dependencies
```json
{
  "@cvent/aws-param-secrets-lambda-ext-ts-client": "0.4.8",
  "@cvent/ts-client-common": "0.2.4"
}
```

#### Development Dependencies
```json
{
  "@cvent/builder-prettier": "^1.1.2",
  "@cvent/fetch": "2.0.7",
  "@cvent/logging": "^2.0.4",
  "@cvent/nucleus-eslint": "^3.2.2",
  "esbuild": "^0.20.2",
  "jest": "^29.6.2",
  "jest-fetch-mock": "^3.0.3"
}
```

### Infrastructure Package Dependencies

#### CDK Dependencies
```json
{
  "aws-cdk": "^2.1007.0",
  "aws-cdk-lib": "^2.178.2",
  "constructs": "^10.3.0"
}
```

## Configuration

### Environment Variables

#### Lambda Functions
- `AWS_REGION`: AWS region for service deployment
- `PARAMETER_STORE_PREFIX`: Prefix for Parameter Store paths
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARN, ERROR)
- `SERVICE_NAME`: Service name for monitoring and tracing
- `ENVIRONMENT`: Deployment environment (sandbox, staging, production)

#### CDK Deployment
- `CDK_DEFAULT_ACCOUNT`: AWS account ID for deployment
- `CDK_DEFAULT_REGION`: Default AWS region
- `ENVIRONMENT`: Target environment for deployment
- `STACK_NAME_PREFIX`: Prefix for CloudFormation stack names

### Configuration Files

#### TypeScript Configuration (`tsconfig.json`)
```json
{
  "extends": "@cvent/tsconfig/base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

#### Nx Configuration (`nx.json`)
```json
{
  "extends": "nx/presets/npm.json",
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test", "format"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    }
  }
}
```

#### Jest Configuration (`jest.config.js`)
```javascript
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

### Parameter Store Configuration

#### Configuration Paths
- `/passkey-gdpr-app/{environment}/database/connection-string`
- `/passkey-gdpr-app/{environment}/api/auth-secret`
- `/passkey-gdpr-app/{environment}/services/gdpr-service-endpoint`
- `/passkey-gdpr-app/{environment}/monitoring/datadog-api-key`
- `/passkey-gdpr-app/{environment}/features/feature-flags`

#### Access Patterns
```typescript
import { ParameterStoreClient } from '@cvent/aws-param-secrets-lambda-ext-ts-client';

const client = new ParameterStoreClient({
  region: process.env.AWS_REGION,
  prefix: `/passkey-gdpr-app/${process.env.ENVIRONMENT}`
});

const config = await client.getParameters([
  'database/connection-string',
  'api/auth-secret',
  'services/gdpr-service-endpoint'
]);
```

## Build System

### Nx Workspace Configuration

#### Project Structure
```
packages/
├── gdpr-lambdas/
│   ├── project.json          # Nx project configuration
│   ├── package.json          # Package dependencies
│   └── src/                  # Source code
├── infra/
│   ├── project.json          # Nx project configuration
│   ├── package.json          # Package dependencies
│   └── lib/                  # CDK constructs
└── scheduler-lambda/
    ├── project.json          # Nx project configuration
    ├── package.json          # Package dependencies
    └── src/                  # Source code
```

#### Build Targets
- `build`: Compile TypeScript to JavaScript
- `test`: Run Jest unit tests
- `lint`: Run ESLint checks
- `format`: Run Prettier formatting
- `fix`: Auto-fix linting issues
- `verify`: Run build, lint, and test

#### Dependency Graph
```bash
# View project dependencies
nx graph

# Build affected projects
nx affected --target=build

# Test affected projects
nx affected --target=test
```

### Compilation Process

#### TypeScript Compilation
1. **Type Checking**: Full TypeScript type checking
2. **Transpilation**: Convert TypeScript to JavaScript (ES2020)
3. **Module Resolution**: Resolve imports and dependencies
4. **Output Generation**: Generate JavaScript files in `lib/` directories

#### Lambda Bundling
1. **Entry Point**: Identify Lambda handler functions
2. **Dependency Analysis**: Analyze required dependencies
3. **Tree Shaking**: Remove unused code
4. **Bundling**: Create optimized bundles with esbuild
5. **Asset Generation**: Generate deployment packages

## Database Schema

### Parameter Store Schema

#### Configuration Parameters
```
/passkey-gdpr-app/
├── {environment}/
│   ├── database/
│   │   ├── connection-string
│   │   ├── pool-size
│   │   └── timeout
│   ├── api/
│   │   ├── auth-secret
│   │   ├── rate-limit
│   │   └── cors-origins
│   ├── services/
│   │   ├── gdpr-service-endpoint
│   │   ├── notification-service-endpoint
│   │   └── audit-service-endpoint
│   └── monitoring/
│       ├── datadog-api-key
│       ├── log-level
│       └── metrics-enabled
```

### Data Models

#### GDPR Request Model
```typescript
interface GDPRRequest {
  requestId: string;
  requestType: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY' | 'OBJECTION';
  dataSubjectId: string;
  submittedAt: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  completedAt?: Date;
  requestorEmail: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  processingNotes?: string;
}
```

#### Configuration Model
```typescript
interface AppConfig {
  database: {
    connectionString: string;
    poolSize: number;
    timeout: number;
  };
  api: {
    authSecret: string;
    rateLimit: number;
    corsOrigins: string[];
  };
  services: {
    gdprServiceEndpoint: string;
    notificationServiceEndpoint: string;
    auditServiceEndpoint: string;
  };
  monitoring: {
    datadogApiKey: string;
    logLevel: string;
    metricsEnabled: boolean;
  };
}
```

## Monitoring & Logging

### Logging Configuration

#### Log Levels
- **DEBUG**: Detailed debugging information
- **INFO**: General information about application flow
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages for failures

#### Log Format
```typescript
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  requestId?: string;
  function: string;
  message: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack: string;
  };
}
```

#### Structured Logging
```typescript
import { Logger } from '@cvent/logging';

const logger = new Logger({
  service: 'passkey-gdpr-app',
  environment: process.env.ENVIRONMENT,
  version: process.env.npm_package_version
});

logger.info('Processing GDPR request', {
  requestId: 'req-123',
  requestType: 'ACCESS',
  dataSubjectId: 'subject-456'
});
```

### Metrics and Monitoring

#### CloudWatch Metrics
- Lambda function duration and memory usage
- API Gateway request count and latency
- Error rates by function and endpoint
- Custom business metrics

#### DataDog Integration
- Application performance monitoring (APM)
- Custom metrics and dashboards
- Log aggregation and analysis
- Alert configuration for critical issues

#### Health Checks
```typescript
export const healthCheck = async (): Promise<HealthStatus> => {
  return {
    status: 'healthy',
    version: process.env.npm_package_version,
    timestamp: new Date().toISOString(),
    dependencies: {
      parameterStore: await checkParameterStore(),
      gdprService: await checkGdprService()
    }
  };
};
```

## Security Configuration

### IAM Roles and Policies

#### Lambda Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/passkey-gdpr-app/*"
    }
  ]
}
```

#### API Gateway Authorizer Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "execute-api:Invoke",
      "Resource": "arn:aws:execute-api:*:*:*/*/GET/*"
    }
  ]
}
```

### Encryption

#### Data in Transit
- TLS 1.2+ for all API communications
- AWS service-to-service encryption
- Certificate management via AWS Certificate Manager

#### Data at Rest
- Parameter Store encryption with AWS KMS
- CloudWatch Logs encryption
- Lambda environment variable encryption

### Access Control

#### Authentication
- Lambda Authorizer for API Gateway
- Service-to-service authentication via Parameter Store secrets
- AWS IAM for infrastructure access

#### Authorization
- Role-based access control (RBAC)
- Principle of least privilege
- Regular access reviews and audits
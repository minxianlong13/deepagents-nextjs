# Technical Details

## Technology Stack

### Core Framework
- **AWS CDK**: 2.150.0 - Infrastructure as Code framework for AWS resource provisioning
- **TypeScript**: 5.1.3 - Primary programming language for type-safe development
- **Node.js**: 18+ - JavaScript runtime environment
- **pnpm**: Package manager for monorepo dependency management

### AWS Services
- **AWS Step Functions**: Workflow orchestration and state machine management
- **AWS Lambda**: Serverless compute for individual workflow steps
- **Amazon API Gateway**: RESTful API and WebSocket API management
- **Amazon DynamoDB**: NoSQL database for state management and tracking
- **Amazon CloudWatch**: Monitoring, logging, and alerting
- **AWS IAM**: Identity and access management
- **Amazon S3**: Object storage for assets and configurations

### Build and Development Tools
- **esbuild**: 0.17.19 - Fast JavaScript/TypeScript bundler
- **Jest**: 26.6.3 - Testing framework for unit and integration tests
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript Compiler**: 5.1.3 - TypeScript to JavaScript compilation

### Monitoring and Observability
- **Datadog**: Application performance monitoring and logging
- **SonarQube**: Code quality analysis and security scanning
- **AWS X-Ray**: Distributed tracing (when enabled)

## Dependencies

### CDK Package Dependencies
```json
{
  "dependencies": {
    "@cvent/builder-cdk": "^3.5.2",
    "@cvent/cdk-applications": "^1.1.1",
    "@cvent/cdk-lib": "1.13.4",
    "@cvent/environments": "^1.24.20",
    "@cvent/hogan-client": "^2.0.5",
    "@cvent/logging": "^1.0.7",
    "@cvent/octopusdeploy-cdk": "^4.1.1",
    "aws-cdk-lib": "^2.150.0",
    "constructs": "10.2.33"
  }
}
```

### Lambda Package Dependencies
```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "Latest",
    "@aws-sdk/client-stepfunctions": "Latest",
    "@aws-sdk/client-apigatewaymanagementapi": "Latest",
    "@cvent-internal/cvent-auth-api-client": "2.0.1",
    "isomorphic-fetch": "^2.2.1"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "@aws-cdk/assertions": "^1.203.0",
    "@cvent/builder-sonar": "4.2.1",
    "@cvent/nucleus-eslint": "^2.0.4",
    "@types/jest": "^25.2.3",
    "@types/node": "20.2.5",
    "npm-run-all": "^4.1.5"
  }
}
```

## Configuration

### Environment Variables

#### Runtime Configuration
- `AWS_REGION`: AWS region for service deployment (default: us-east-1)
- `STAGE`: Deployment stage (alpha, beta, prod)
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARN, ERROR)
- `DYNAMODB_TABLE_PREFIX`: Prefix for DynamoDB table names
- `STEP_FUNCTION_ARN`: ARN of the main orchestration Step Function
- `WEBSOCKET_API_ENDPOINT`: WebSocket API Gateway endpoint URL

#### Service Integration
- `PASSKEY_RESERVATION_API_URL`: Passkey reservation service endpoint
- `PASSKEY_INVENTORY_API_URL`: Passkey inventory service endpoint
- `PASSKEY_SMART_API_URL`: Passkey smart campaign service endpoint
- `CVENT_EMAIL_SERVICE_URL`: Cvent email service endpoint
- `AUTH_SERVICE_URL`: Authentication service endpoint

#### Performance Tuning
- `LAMBDA_TIMEOUT`: Lambda function timeout in seconds (default: 300)
- `LAMBDA_MEMORY`: Lambda function memory allocation in MB (default: 512)
- `DYNAMODB_READ_CAPACITY`: DynamoDB read capacity units
- `DYNAMODB_WRITE_CAPACITY`: DynamoDB write capacity units
- `MAX_CONCURRENT_EXECUTIONS`: Maximum concurrent Step Function executions

### CDK Configuration Files

#### `cdk.json`
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/passkey-alpha.ts"
}
```

#### Environment-Specific Configurations
Located in `lib/config/` directory:
- `alpha.ts`: Development environment configuration
- `beta.ts`: Staging environment configuration
- `prod.ts`: Production environment configuration

### TypeScript Configuration

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
  }
}
```

## Database Schema

### DynamoDB Tables

#### AutoblockRequests Table
- **Primary Key**: `requestId` (String)
- **Attributes**:
  - `eventId`: String
  - `hotelId`: String
  - `checkInDate`: String (ISO date)
  - `checkOutDate`: String (ISO date)
  - `roomTypeId`: String
  - `blockSize`: Number
  - `status`: String
  - `createdAt`: String (ISO timestamp)
  - `ttl`: Number (Unix timestamp for auto-deletion)
- **Global Secondary Indexes**:
  - `HotelDateIndex`: `hotelId` (PK), `checkInDate` (SK)
  - `StatusIndex`: `status` (PK), `createdAt` (SK)

#### ExecutionLogs Table
- **Primary Key**: `executionId` (String)
- **Attributes**:
  - `requestId`: String
  - `status`: String
  - `startTime`: String (ISO timestamp)
  - `endTime`: String (ISO timestamp)
  - `input`: Map
  - `output`: Map
  - `errorDetails`: Map
  - `retryCount`: Number
- **Global Secondary Indexes**:
  - `RequestIndex`: `requestId` (PK), `startTime` (SK)

#### RoomBlocks Table
- **Primary Key**: `blockId` (String)
- **Attributes**:
  - `hotelId`: String
  - `roomTypeId`: String
  - `startDate`: String (ISO date)
  - `endDate`: String (ISO date)
  - `totalRooms`: Number
  - `availableRooms`: Number
  - `status`: String
  - `createdAt`: String (ISO timestamp)
- **Global Secondary Indexes**:
  - `HotelRoomTypeIndex`: `hotelId#roomTypeId` (PK), `startDate` (SK)

#### WebSocketConnections Table
- **Primary Key**: `connectionId` (String)
- **Attributes**:
  - `userId`: String
  - `subscribedExecutions`: StringSet
  - `connectedAt`: String (ISO timestamp)
  - `lastActivity`: String (ISO timestamp)
  - `ttl`: Number (Unix timestamp for auto-cleanup)

## Build Process

### Build Scripts

#### Root Package Scripts
```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "changeset": "changeset",
    "release:version": "changeset-cvent release:version"
  }
}
```

#### CDK Package Scripts
```json
{
  "scripts": {
    "build:ts": "tsc",
    "build:cdk": "cdk-cvent build",
    "build:cfn": "node dist/scripts/synth.js",
    "build": "pnpm build:ts && pnpm build:cdk",
    "test": "run-p -ls test:*",
    "test:cdk": "cdk-cvent test",
    "test:coverage": "jest --coverage",
    "lint": "eslint --ext .js,.ts,.tsx ./",
    "fix": "eslint --fix --ext .js,.ts,.tsx ./"
  }
}
```

### Build Pipeline

1. **Dependency Installation**: `pnpm -r install`
2. **Code Linting**: `pnpm -r lint`
3. **TypeScript Compilation**: `pnpm -r build:ts`
4. **CDK Synthesis**: `pnpm -r build:cdk`
5. **Unit Testing**: `pnpm -r test`
6. **Code Coverage**: `pnpm -r test:coverage`
7. **Security Scanning**: SonarQube analysis
8. **Asset Bundling**: esbuild optimization
9. **CloudFormation Generation**: CDK synthesis to CloudFormation

### Lambda Bundling

Lambda functions are bundled using esbuild with the following configuration:
- **Target**: ES2020
- **Format**: CommonJS
- **Minification**: Enabled for production
- **Source Maps**: Enabled for debugging
- **External Dependencies**: AWS SDK excluded (provided by Lambda runtime)
- **Tree Shaking**: Enabled to reduce bundle size

## Monitoring & Logging

### CloudWatch Metrics

#### Custom Metrics
- `AutoblockRequests.Count`: Number of autoprovision requests
- `AutoblockRequests.Duration`: Request processing duration
- `AutoblockRequests.Errors`: Number of failed requests
- `StepFunction.Executions`: Step Function execution count
- `StepFunction.Failures`: Step Function failure count
- `Lambda.Invocations`: Lambda function invocation count
- `Lambda.Duration`: Lambda function execution duration
- `Lambda.Errors`: Lambda function error count
- `DynamoDB.ConsumedCapacity`: DynamoDB capacity consumption
- `WebSocket.Connections`: Active WebSocket connections

#### Alarms
- **High Error Rate**: >5% error rate over 5 minutes
- **High Latency**: >30 second average response time
- **Failed Executions**: >10 failed Step Function executions in 15 minutes
- **DynamoDB Throttling**: Any throttling events
- **Lambda Timeouts**: >5 Lambda timeouts in 10 minutes

### Logging Configuration

#### Log Levels
- **DEBUG**: Detailed execution flow and variable values
- **INFO**: General operational messages and milestones
- **WARN**: Recoverable errors and degraded functionality
- **ERROR**: Unrecoverable errors requiring attention

#### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "passkey-autoblock-autoprovision",
  "component": "plannerOrch",
  "executionId": "exec_123",
  "requestId": "req_456",
  "message": "Block planning completed successfully",
  "metadata": {
    "blocksCreated": 3,
    "totalRooms": 75,
    "duration": 1250
  }
}
```

### Distributed Tracing

When AWS X-Ray is enabled:
- **Service Map**: Visual representation of service dependencies
- **Trace Analysis**: End-to-end request tracing
- **Performance Insights**: Latency analysis and bottleneck identification
- **Error Analysis**: Error correlation across services

### Datadog Integration

- **APM**: Application performance monitoring with distributed tracing
- **Log Aggregation**: Centralized log collection and analysis
- **Custom Dashboards**: Business and technical metrics visualization
- **Alerting**: Proactive monitoring and incident response
- **Service Dependencies**: Automatic service map generation

## Security

### Authentication & Authorization
- **AWS IAM**: Role-based access control for AWS resources
- **API Gateway**: Request authentication and rate limiting
- **Lambda Execution Roles**: Least-privilege access to AWS services
- **Cross-Service Authentication**: Service-to-service token validation

### Data Protection
- **Encryption at Rest**: DynamoDB tables encrypted with AWS KMS
- **Encryption in Transit**: TLS 1.2+ for all API communications
- **Parameter Store**: Secure storage for sensitive configuration
- **Secrets Manager**: Secure storage for API keys and credentials

### Network Security
- **VPC Integration**: Lambda functions deployed in private subnets when required
- **Security Groups**: Network-level access control
- **API Gateway**: Request validation and input sanitization
- **WAF Integration**: Web application firewall for additional protection

### Compliance
- **Audit Logging**: Comprehensive audit trail for all operations
- **Data Retention**: Configurable data retention policies
- **Access Logging**: Detailed access logs for security monitoring
- **Compliance Reporting**: Automated compliance report generation
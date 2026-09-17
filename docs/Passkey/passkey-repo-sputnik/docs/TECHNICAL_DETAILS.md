# Technical Details

## Technology Stack

- **Framework**: AWS CDK (Cloud Development Kit) v2.236.0
- **Language**: TypeScript 5.9.3
- **Runtime**: Node.js 22
- **Build Tool**: pnpm (Package Manager)
- **Bundler**: esbuild 0.27.2
- **Testing**: Jest 30.2.0
- **Linting**: ESLint 9.39.2 with Prettier 3.8.1
- **Cloud Platform**: AWS (Amazon Web Services)

## Dependencies

### Core AWS Dependencies
```json
{
  "@aws-sdk/client-dynamodb": "3.975.0",
  "@aws-sdk/client-eventbridge": "3.975.0",
  "@aws-sdk/client-s3": "3.975.0",
  "@aws-sdk/client-sfn": "3.975.0",
  "@aws-sdk/client-sqs": "3.975.0",
  "@aws-sdk/lib-dynamodb": "3.975.0"
}
```

### Cvent Internal Dependencies
```json
{
  "@cvent/passkey-manage-api": "0.13.8",
  "@cvent/cdk-applications": "1.47.13",
  "@cvent/cdk-lib": "1.35.8",
  "@cvent/environments": "1.47.0"
}
```

### External Libraries
```json
{
  "@launchdarkly/node-server-sdk": "^9.10.5",
  "jsonwebtoken": "9.0.3",
  "soap": "1.6.3",
  "uuid": "13.0.0",
  "xml2js": "0.6.2",
  "follow-redirects": "1.15.11"
}
```

### Development Dependencies
```json
{
  "@changesets/cli": "2.29.8",
  "aws-cdk": "2.1103.0",
  "aws-cdk-lib": "2.236.0",
  "constructs": "10.4.5",
  "typescript": "5.9.3",
  "jest": "30.2.0",
  "eslint": "9.39.2"
}
```

## Configuration

### Environment Variables
- `AWS_REGION`: AWS region for deployment
- `NODE_ENV`: Environment (development, staging, production)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `STAGE`: Deployment stage identifier

### SSM Parameters (Required)
All parameters are stored in AWS Systems Manager Parameter Store with prefix `/passkey-sputnik/`:

- `API_KEY`: Primary API key for authentication
- `ENCRYPTION_DECRYPTION_KEY`: Key for data encryption/decryption
- `ENCRYPTION_SECRET_KEY`: Secret key for encryption operations
- `EXPERIMENTS_API_KEY`: API key for experiments service integration
- `PAYMENTS_PROXY_JWT_SECRET`: JWT secret for payments proxy communication

### CDK Configuration
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "requireApproval": "never",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true
  }
}
```

### TypeScript Configuration
```json
{
  "extends": "@cvent/tsconfig/base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./lib",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["lib/**/*"],
  "exclude": ["node_modules", "dist", "cdk.out"]
}
```

## AWS Infrastructure

### Lambda Functions
- **Runtime**: Node.js 22.x
- **Memory**: 512MB - 1024MB (varies by function)
- **Timeout**: 30 seconds - 5 minutes (varies by function)
- **Architecture**: x86_64
- **Environment**: VPC-enabled for secure communication

### API Gateway
- **Type**: REST API
- **Authentication**: Custom Lambda Authorizer
- **Throttling**: 1000 requests per second
- **Caching**: Enabled for GET endpoints (5 minutes TTL)
- **CORS**: Enabled for cross-origin requests

### DynamoDB Tables
- **Transfer Requests Table**:
  - Partition Key: `transferId`
  - Sort Key: `timestamp`
  - GSI: `reservationId-index`, `eventId-index`
  - Billing Mode: On-Demand
  - Point-in-time Recovery: Enabled

- **Scheduled Transfers Table**:
  - Partition Key: `eventId`
  - Sort Key: `scheduledDate`
  - GSI: `hotelId-index`
  - TTL: Enabled (auto-cleanup after 30 days)

### Step Functions
- **Type**: Standard Workflows
- **Execution Role**: Custom IAM role with minimal permissions
- **Logging**: CloudWatch Logs enabled
- **X-Ray Tracing**: Enabled for debugging

### SQS Queues
- **Callbacks Queue**:
  - Visibility Timeout: 300 seconds
  - Message Retention: 14 days
  - Dead Letter Queue: Enabled (3 retries)
  - Encryption: SSE-SQS

- **Transfer Queue**:
  - Visibility Timeout: 900 seconds
  - Message Retention: 14 days
  - FIFO: Enabled for ordered processing

### EventBridge
- **Custom Event Bus**: `passkey-sputnik-events`
- **Rules**: Event routing to Lambda functions
- **Archive**: 30-day event replay capability
- **Schema Registry**: Event schema validation

## Database Schema

### Transfer Requests Table
```typescript
interface TransferRequest {
  transferId: string;           // Partition Key
  timestamp: string;           // Sort Key
  reservationId: string;
  eventId: number;
  hotelId: number;
  vendorType: VendorType;
  transferType: TransferType;
  status: TransferStatus;
  priority: Priority;
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastError?: string;
  requestData: object;
  responseData?: object;
  ttl?: number;
}
```

### Scheduled Transfers Table
```typescript
interface ScheduledTransfer {
  eventId: number;             // Partition Key
  scheduledDate: string;       // Sort Key
  transferId: string;
  reservationId: string;
  hotelId: number;
  vendorType: VendorType;
  transferType: TransferType;
  priority: Priority;
  status: TransferStatus;
  createdAt: string;
  ttl: number;
}
```

## Build Process

### Build Scripts
```bash
# TypeScript compilation
pnpm build:ts

# Lambda bundling with esbuild
pnpm build:esbuild

# CDK synthesis
pnpm build:cdk

# Complete build
pnpm build
```

### esbuild Configuration
```javascript
{
  bundle: true,
  platform: 'node',
  target: 'node22',
  minify: true,
  sourcemap: true,
  entryNames: '[name]/index',
  outdir: 'dist/lambdas',
  external: ['aws-sdk']
}
```

### Test Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts'
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

## Monitoring & Logging

### CloudWatch Metrics
- **Lambda Metrics**: Duration, errors, invocations, throttles
- **API Gateway Metrics**: Request count, latency, 4xx/5xx errors
- **DynamoDB Metrics**: Read/write capacity, throttles, errors
- **Step Functions Metrics**: Execution count, success/failure rates
- **Custom Metrics**: Transfer success rates, vendor response times

### CloudWatch Logs
- **Log Groups**: Separate log groups per Lambda function
- **Retention**: 30 days for development, 90 days for production
- **Log Format**: Structured JSON logging
- **Log Levels**: DEBUG, INFO, WARN, ERROR

### DataDog Integration
- **Service Name**: `passkey-sputnik`
- **Environment Tags**: `env:dev`, `env:staging`, `env:prod`
- **Custom Dashboards**: Transfer metrics, vendor performance
- **Alerts**: Error rate thresholds, latency alerts
- **Log Forwarding**: CloudWatch logs forwarded to DataDog

### X-Ray Tracing
- **Sampling Rate**: 10% for normal operations, 100% for errors
- **Service Map**: Visual representation of service dependencies
- **Trace Analysis**: Performance bottleneck identification
- **Error Analysis**: Detailed error traces and root cause analysis

## Security

### IAM Roles and Policies
- **Lambda Execution Role**: Minimal permissions for each function
- **API Gateway Role**: CloudWatch logging permissions
- **Step Functions Role**: Lambda invocation and state management
- **Cross-Service Permissions**: Least privilege access

### Encryption
- **At Rest**: All DynamoDB tables encrypted with AWS KMS
- **In Transit**: TLS 1.2+ for all API communications
- **Parameter Store**: SecureString parameters with KMS encryption
- **Lambda Environment**: Encrypted environment variables

### Network Security
- **VPC**: Lambda functions deployed in private subnets
- **Security Groups**: Restrictive inbound/outbound rules
- **NACLs**: Network-level access control
- **NAT Gateway**: Outbound internet access for Lambda functions

### Authentication & Authorization
- **API Keys**: Stored in AWS Secrets Manager
- **JWT Tokens**: RS256 signature verification
- **Vendor Credentials**: Encrypted storage in Parameter Store
- **Service-to-Service**: IAM roles for AWS service authentication

## Performance Optimization

### Lambda Optimization
- **Memory Allocation**: Tuned based on function requirements
- **Connection Pooling**: Reuse of database and HTTP connections
- **Cold Start Mitigation**: Provisioned concurrency for critical functions
- **Bundle Size**: Minimized using esbuild tree shaking

### Database Optimization
- **DynamoDB**: On-demand billing for variable workloads
- **Indexes**: Strategic GSI design for query patterns
- **Caching**: Application-level caching for frequently accessed data
- **Batch Operations**: Batch reads/writes where possible

### API Optimization
- **Response Caching**: API Gateway caching for read operations
- **Compression**: GZIP compression for large responses
- **Pagination**: Cursor-based pagination for large datasets
- **Rate Limiting**: Throttling to prevent abuse

## Disaster Recovery

### Backup Strategy
- **DynamoDB**: Point-in-time recovery enabled
- **Code**: Git repository with multiple remotes
- **Configuration**: Infrastructure as Code with CDK
- **Secrets**: Cross-region replication of critical parameters

### Recovery Procedures
- **RTO**: 4 hours for complete service restoration
- **RPO**: 15 minutes maximum data loss
- **Failover**: Automated failover to secondary region
- **Testing**: Monthly disaster recovery drills
# Technical Details

## Technology Stack

- **Framework**: AWS CDK (Cloud Development Kit) v2.204.0
- **Language**: TypeScript 4.8.3
- **Runtime**: Node.js 22.x
- **Build Tool**: pnpm (Package Manager)
- **Package Manager**: pnpm workspace (monorepo)
- **Testing**: Jest 28.1.3
- **Linting**: ESLint 8.x with Prettier
- **Infrastructure**: AWS (EventBridge, Lambda, Elasticsearch, IAM)

## Dependencies

### Core CDK Dependencies
```json
{
  "@cvent/cdk-applications": "^1.47.14",
  "@cvent/cdk-lib": "^1.35.8",
  "aws-cdk-lib": "2.204.0",
  "constructs": "^10.3.0"
}
```

### Cvent Internal Libraries
```json
{
  "@cvent/environments": "^1.24.20",
  "@cvent/hogan-client": "^2.0.5",
  "@cvent/octopusdeploy-cdk": "^4.3.7",
  "@cvent/passkey-manage-api": "^0.11.0",
  "@cvent/schema-drift-notification-lambda": "^2.0.1",
  "@cvent/schema-drift-validator-lambda": "^2.1.0",
  "@cvent/schema-publisher-lambda": "^2.1.0"
}
```

### Development Dependencies
```json
{
  "@asyncapi/generator": "^2.0.0",
  "@cvent/asyncapi-producer-cdk-template": "^13.0.0",
  "@cvent/builder-cdk": "^3.10.4",
  "@cvent/jest-config": "^1.0.0",
  "@cvent/tsconfig": "^1.0.0",
  "esbuild": "^0.17.10",
  "typescript": "^4.8.3"
}
```

## Configuration

### Environment Variables

#### Event Bus CDK Package
- `NODE_ENV`: Environment mode (development|staging|production)
- `AWS_REGION`: AWS region for deployment
- `AWS_ACCOUNT`: AWS account ID
- `CVENT_ENVIRONMENT`: Cvent environment name (dev|staging|prod)

#### Reservation Consumer Lambda
- `ELASTICSEARCH_ENDPOINT`: Elasticsearch cluster endpoint URL
- `ELASTICSEARCH_USERNAME`: Elasticsearch authentication username
- `ELASTICSEARCH_PASSWORD`: Elasticsearch authentication password
- `ELASTICSEARCH_INDEX_PREFIX`: Prefix for Elasticsearch indexes
- `LOG_LEVEL`: Logging level (debug|info|warn|error)
- `PASSKEY_MANAGE_API_ENDPOINT`: Passkey Manage API base URL
- `SECRET_MANAGER_EXT_ARN`: AWS Secrets Manager extension ARN

### Hogan Configuration Schema
```typescript
interface HoganConfig {
  elasticsearch: {
    endpoint: string;
    username: string;
    password: string;
    indexPrefix: string;
    maxRetries: number;
    requestTimeout: number;
  };
  passkeyEndpoints: {
    manageApi: string;
    authService: string;
    notificationService: string;
  };
  aws: {
    region: string;
    account: string;
    secretManagerExtArn: string;
  };
  monitoring: {
    datadogApiKey: string;
    logLevel: string;
  };
}
```

## Build System

### Monorepo Structure
The project uses pnpm workspaces for monorepo management:

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

### Build Scripts
```json
{
  "build:gen": "ag node_modules/@cvent/passkey-manage-api/resolved/asyncapi.json @cvent/asyncapi-producer-cdk-template -o lib/generated -p legacyName=true",
  "build:ts": "tsc",
  "build:cdk": "cdk-cvent build --service passkey-event-bus",
  "build": "run-s -ls build:*"
}
```

### Code Generation
- **AsyncAPI Generator**: Generates CDK constructs from AsyncAPI specifications
- **TypeScript Compilation**: Compiles TypeScript to JavaScript
- **CDK Synthesis**: Generates CloudFormation templates

## Database Schema

### Elasticsearch Index Structure

#### Reservation Index
**Index Pattern**: `passkey-reservations-{environment}-{YYYY.MM.DD}`

**Mapping**:
```json
{
  "mappings": {
    "properties": {
      "reservationId": { "type": "keyword" },
      "guestId": { "type": "keyword" },
      "hotelId": { "type": "keyword" },
      "checkInDate": { "type": "date" },
      "checkOutDate": { "type": "date" },
      "roomType": { "type": "keyword" },
      "status": { "type": "keyword" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" },
      "eventMetadata": {
        "properties": {
          "eventId": { "type": "keyword" },
          "eventType": { "type": "keyword" },
          "processedAt": { "type": "date" },
          "source": { "type": "keyword" },
          "version": { "type": "keyword" }
        }
      }
    }
  }
}
```

#### Event Audit Index
**Index Pattern**: `passkey-events-{environment}-{YYYY.MM.DD}`

**Mapping**:
```json
{
  "mappings": {
    "properties": {
      "eventId": { "type": "keyword" },
      "source": { "type": "keyword" },
      "detailType": { "type": "keyword" },
      "timestamp": { "type": "date" },
      "detail": { "type": "object", "enabled": false },
      "processingStatus": { "type": "keyword" },
      "errorMessage": { "type": "text" },
      "retryCount": { "type": "integer" }
    }
  }
}
```

## AWS Infrastructure

### EventBridge Configuration
```typescript
const eventBus = new EventBus(this, 'PasskeyEventBus', {
  eventBusName: `passkey-event-bus-${environment}`,
  description: 'Event bus for Passkey service communication'
});

const rule = new Rule(this, 'ReservationRule', {
  eventBus: eventBus,
  eventPattern: {
    source: ['passkey-manage-api'],
    detailType: ['reservation.created', 'reservation.updated', 'reservation.cancelled']
  },
  targets: [new LambdaFunction(reservationConsumerLambda)]
});
```

### Lambda Configuration
```typescript
const reservationConsumer = new Function(this, 'ReservationConsumer', {
  runtime: Runtime.NODEJS_22_X,
  handler: 'index.handler',
  code: Code.fromAsset('dist/reservation-consumer'),
  timeout: Duration.minutes(5),
  memorySize: 512,
  environment: {
    ELASTICSEARCH_ENDPOINT: elasticsearchEndpoint,
    LOG_LEVEL: 'info'
  },
  deadLetterQueue: dlq,
  retryAttempts: 3
});
```

### IAM Policies
```typescript
const lambdaPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'es:ESHttpPost',
    'es:ESHttpPut',
    'es:ESHttpGet',
    'secretsmanager:GetSecretValue',
    'logs:CreateLogGroup',
    'logs:CreateLogStream',
    'logs:PutLogEvents'
  ],
  resources: [
    elasticsearchClusterArn,
    secretArn,
    'arn:aws:logs:*:*:*'
  ]
});
```

## Monitoring & Logging

### CloudWatch Metrics
- **Lambda Metrics**: Duration, error rate, invocation count
- **EventBridge Metrics**: Event count, failed invocations
- **Elasticsearch Metrics**: Index rate, search latency, cluster health

### Custom Metrics
```typescript
const eventProcessingMetric = new Metric({
  namespace: 'PasskeyEventBus',
  metricName: 'EventsProcessed',
  dimensionsMap: {
    Environment: environment,
    EventType: eventType
  }
});
```

### Structured Logging
```typescript
const logger = {
  info: (message: string, context: object) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      correlationId: context.correlationId,
      ...context
    }));
  }
};
```

### Distributed Tracing
- **AWS X-Ray**: Request tracing across services
- **Correlation IDs**: Event tracking through the system
- **Trace sampling**: Performance monitoring with configurable sampling rates

## Security Configuration

### IAM Roles and Policies
```typescript
const lambdaRole = new Role(this, 'LambdaExecutionRole', {
  assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
  ],
  inlinePolicies: {
    ElasticsearchAccess: elasticsearchPolicy,
    SecretsManagerAccess: secretsPolicy
  }
});
```

### VPC Configuration
```typescript
const vpc = Vpc.fromLookup(this, 'VPC', {
  vpcId: vpcId
});

const lambdaFunction = new Function(this, 'Function', {
  vpc: vpc,
  vpcSubnets: {
    subnetType: SubnetType.PRIVATE_WITH_EGRESS
  },
  securityGroups: [lambdaSecurityGroup]
});
```

### Encryption
- **At Rest**: Elasticsearch encryption, Lambda environment variables encryption
- **In Transit**: TLS 1.2+ for all service communication
- **Secrets**: AWS Secrets Manager with automatic rotation

## Performance Optimization

### Lambda Optimization
- **Memory Allocation**: Optimized based on workload profiling
- **Cold Start Reduction**: Provisioned concurrency for critical functions
- **Bundle Optimization**: Tree-shaking and minification with esbuild

### Elasticsearch Optimization
- **Index Templates**: Automated index lifecycle management
- **Sharding Strategy**: Optimal shard count based on data volume
- **Query Optimization**: Efficient query patterns and caching

### Event Processing Optimization
- **Batch Processing**: Process multiple events in single Lambda invocation
- **Parallel Processing**: Concurrent event processing where possible
- **Circuit Breaker**: Prevent cascade failures with circuit breaker pattern

## Testing Strategy

### Unit Testing
```typescript
// Jest configuration
module.exports = {
  preset: '@cvent/jest-config',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
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

### Integration Testing
- **LocalStack**: Local AWS service emulation
- **Test Containers**: Elasticsearch testing with Docker
- **Mock Services**: HTTP mocking for external dependencies

### CDK Testing
```typescript
import { Template } from 'aws-cdk-lib/assertions';

test('EventBridge rule created', () => {
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::Events::Rule', {
    EventPattern: {
      source: ['passkey-manage-api']
    }
  });
});
```

## Deployment Pipeline

### CI/CD Configuration
```groovy
// Jenkinsfile
pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'pnpm install'
        sh 'pnpm build'
      }
    }
    stage('Test') {
      steps {
        sh 'pnpm test'
        sh 'pnpm test:coverage'
      }
    }
    stage('Deploy') {
      steps {
        sh 'pnpm ci:setup'
      }
    }
  }
}
```

### Environment Promotion
1. **Development**: Automatic deployment on merge to main
2. **Staging**: Manual promotion with approval
3. **Production**: Scheduled deployment with rollback capability

## Troubleshooting

### Common Issues

#### CDK Version Conflicts
```bash
# Fix CDK version mismatches
pnpm upgrade -i
# Select all CDK packages for consistent versioning
```

#### LocalStack Setup
```bash
# Start LocalStack for local development
docker run -d -p 4566:4566 localstack/localstack
export AWS_ENDPOINT_URL=http://localhost:4566
```

#### Elasticsearch Connection Issues
```bash
# Test Elasticsearch connectivity
curl -X GET "elasticsearch-endpoint/_cluster/health"
```

### Debug Commands
```bash
# View CDK diff
pnpm cdk diff

# Deploy with debug logging
pnpm cdk deploy --verbose

# View Lambda logs
aws logs tail /aws/lambda/function-name --follow
```
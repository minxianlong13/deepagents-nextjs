# Deployment

## Infrastructure

The Passkey Event Bus CDK is deployed on AWS using a multi-account, multi-region strategy with infrastructure as code principles.

### AWS Services Used
- **EventBridge**: Event routing and filtering
- **Lambda**: Serverless event processing
- **Elasticsearch**: Search and analytics engine
- **IAM**: Identity and access management
- **CloudWatch**: Monitoring and logging
- **Secrets Manager**: Secure configuration storage
- **VPC**: Network isolation and security

### Multi-Account Strategy
- **Development Account**: For development and testing
- **Staging Account**: Pre-production validation
- **Production Account**: Live production workloads

### Multi-Region Deployment
- **Primary Region**: us-east-1 (N. Virginia)
- **Secondary Region**: us-west-2 (Oregon) - for disaster recovery

## Environments

### Development Environment
- **Account**: Development AWS Account
- **Region**: us-east-1
- **Purpose**: Feature development and integration testing
- **Elasticsearch**: Single-node cluster for cost optimization
- **Lambda**: Lower memory allocation and timeout settings
- **Monitoring**: Basic CloudWatch metrics

**Configuration**:
```yaml
environment: dev
elasticsearch:
  instanceType: t3.small.elasticsearch
  instanceCount: 1
  volumeSize: 20
lambda:
  memorySize: 256
  timeout: 60
monitoring:
  detailedMetrics: false
```

### Staging Environment
- **Account**: Staging AWS Account
- **Region**: us-east-1
- **Purpose**: Pre-production testing and validation
- **Elasticsearch**: Multi-node cluster with replication
- **Lambda**: Production-like resource allocation
- **Monitoring**: Enhanced monitoring with alarms

**Configuration**:
```yaml
environment: staging
elasticsearch:
  instanceType: t3.medium.elasticsearch
  instanceCount: 3
  volumeSize: 50
lambda:
  memorySize: 512
  timeout: 300
monitoring:
  detailedMetrics: true
  alarms: enabled
```

### Production Environment
- **Account**: Production AWS Account
- **Region**: us-east-1 (primary), us-west-2 (secondary)
- **Purpose**: Live production workloads
- **Elasticsearch**: High-availability cluster with cross-AZ deployment
- **Lambda**: Optimized resource allocation with provisioned concurrency
- **Monitoring**: Full observability stack with alerting

**Configuration**:
```yaml
environment: production
elasticsearch:
  instanceType: r5.large.elasticsearch
  instanceCount: 6
  volumeSize: 100
  multiAZ: true
lambda:
  memorySize: 1024
  timeout: 300
  provisionedConcurrency: 10
monitoring:
  detailedMetrics: true
  alarms: enabled
  xrayTracing: enabled
```

## CI/CD Pipeline

### Jenkins Pipeline Configuration

The deployment pipeline is managed through Jenkins with the following stages:

```groovy
pipeline {
    agent any
    
    environment {
        PNPM_HOME = "/usr/local/bin/pnpm"
        NODE_VERSION = "22"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'pnpm install --frozen-lockfile'
            }
        }
        
        stage('Build') {
            steps {
                sh 'pnpm build'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'pnpm test'
                    }
                }
                stage('CDK Tests') {
                    steps {
                        sh 'pnpm test:cdk'
                    }
                }
                stage('Lint') {
                    steps {
                        sh 'pnpm lint'
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'pnpm audit'
                sh 'pnpm test:sonar'
            }
        }
        
        stage('Deploy to Dev') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([aws(credentialsId: 'dev-aws-credentials')]) {
                    sh 'pnpm ci:setup'
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to staging?', ok: 'Deploy'
                withCredentials([aws(credentialsId: 'staging-aws-credentials')]) {
                    sh 'CVENT_ENVIRONMENT=staging pnpm ci:setup'
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                tag pattern: 'v\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                withCredentials([aws(credentialsId: 'prod-aws-credentials')]) {
                    sh 'CVENT_ENVIRONMENT=production pnpm ci:setup'
                }
            }
        }
    }
    
    post {
        always {
            publishTestResults testResultsPattern: 'test-results.xml'
            publishCoverageResults coverageResultsPattern: 'coverage/lcov.info'
        }
        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build failed. Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

### Octopus Deploy Integration

The project integrates with Octopus Deploy for release management:

```typescript
// CDK configuration for Octopus integration
import { OctopusDeployStack } from '@cvent/octopusdeploy-cdk';

const octopusStack = new OctopusDeployStack(this, 'OctopusIntegration', {
  projectName: 'passkey-event-bus',
  deploymentTargets: [
    {
      name: 'development',
      awsAccount: devAccount,
      awsRegion: 'us-east-1'
    },
    {
      name: 'staging',
      awsAccount: stagingAccount,
      awsRegion: 'us-east-1'
    },
    {
      name: 'production',
      awsAccount: prodAccount,
      awsRegion: 'us-east-1'
    }
  ]
});
```

## Configuration Management

### Hogan Integration

Configuration is managed through Hogan, Cvent's configuration management system:

```typescript
import { getHoganSecretUri, getElasticSearchConfig, getPasskeyEndpoints } from './utils/hogan-client';

const hoganConfigs = await getHoganConfigs(environment);
const elasticSearchConfig = getElasticSearchConfig(hoganConfigs);
const passkeyEndpoints = getPasskeyEndpoints(hoganConfigs);
```

### Environment-Specific Configuration

Each environment has its own configuration stored in Hogan:

**Development**:
```json
{
  "elasticsearch": {
    "endpoint": "https://dev-elasticsearch.cvent.com",
    "username": "dev-user",
    "indexPrefix": "passkey-dev"
  },
  "passkeyEndpoints": {
    "manageApi": "https://dev-passkey-manage.cvent.com",
    "authService": "https://dev-passkey-auth.cvent.com"
  }
}
```

**Production**:
```json
{
  "elasticsearch": {
    "endpoint": "https://prod-elasticsearch.cvent.com",
    "username": "prod-user",
    "indexPrefix": "passkey-prod"
  },
  "passkeyEndpoints": {
    "manageApi": "https://passkey-manage.cvent.com",
    "authService": "https://passkey-auth.cvent.com"
  }
}
```

### Secrets Management

Sensitive configuration is stored in AWS Secrets Manager:

```typescript
const secret = new Secret(this, 'PasskeyEventBusSecrets', {
  secretName: `passkey-event-bus-${environment}`,
  description: 'Secrets for Passkey Event Bus',
  generateSecretString: {
    secretStringTemplate: JSON.stringify({
      elasticsearchPassword: '',
      datadogApiKey: '',
      hoganApiKey: ''
    }),
    generateStringKey: 'password',
    excludeCharacters: '"@/\\'
  }
});
```

## Deployment Commands

### Local Development
```bash
# Setup local environment with LocalStack
pnpm local:setup

# Teardown local environment
pnpm local:teardown
```

### CI/CD Deployment
```bash
# Deploy to CI environment
pnpm ci:setup

# Destroy CI environment
pnpm ci:teardown
```

### Manual Deployment
```bash
# Deploy specific stack
cdk deploy PasskeyEventBusProducerStack --profile dev

# Deploy all stacks
cdk deploy --all --profile staging

# Deploy with approval
cdk deploy --require-approval never --profile prod
```

### CDK Commands
```bash
# Synthesize CloudFormation templates
cdk synth

# Show differences between deployed and local
cdk diff

# List all stacks
cdk list

# Destroy stacks
cdk destroy --all
```

## Rollback Procedures

### Automated Rollback
The deployment pipeline includes automated rollback triggers:

```typescript
const alarm = new Alarm(this, 'ErrorRateAlarm', {
  metric: lambda.metricErrors(),
  threshold: 10,
  evaluationPeriods: 2,
  treatMissingData: TreatMissingData.NOT_BREACHING
});

// Trigger rollback on high error rate
alarm.addAlarmAction(new SnsAction(rollbackTopic));
```

### Manual Rollback Steps

1. **Identify the Issue**:
   ```bash
   # Check CloudWatch logs
   aws logs filter-log-events --log-group-name /aws/lambda/passkey-reservation-consumer
   
   # Check metrics
   aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Errors
   ```

2. **Rollback to Previous Version**:
   ```bash
   # Get previous deployment
   git log --oneline -10
   
   # Checkout previous version
   git checkout <previous-commit>
   
   # Deploy previous version
   cdk deploy --all --profile prod
   ```

3. **Verify Rollback**:
   ```bash
   # Test critical functionality
   curl -X POST https://api.passkey.com/health
   
   # Check error rates
   aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Errors
   ```

### Database Rollback

For Elasticsearch schema changes:

```bash
# Create index alias for zero-downtime updates
PUT /passkey-reservations-v2
{
  "mappings": { /* new mapping */ }
}

# Update alias to point to new index
POST /_aliases
{
  "actions": [
    { "remove": { "index": "passkey-reservations-v1", "alias": "passkey-reservations" }},
    { "add": { "index": "passkey-reservations-v2", "alias": "passkey-reservations" }}
  ]
}
```

## Monitoring and Alerting

### CloudWatch Alarms

```typescript
// Lambda error rate alarm
const errorAlarm = new Alarm(this, 'LambdaErrorAlarm', {
  metric: lambda.metricErrors({
    period: Duration.minutes(5)
  }),
  threshold: 5,
  evaluationPeriods: 2
});

// Elasticsearch cluster health alarm
const esHealthAlarm = new Alarm(this, 'ESHealthAlarm', {
  metric: new Metric({
    namespace: 'AWS/ES',
    metricName: 'ClusterStatus.red',
    dimensionsMap: {
      DomainName: esDomain.domainName,
      ClientId: this.account
    }
  }),
  threshold: 0,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD
});
```

### Datadog Integration

```typescript
const datadogMetric = new Metric({
  namespace: 'PasskeyEventBus',
  metricName: 'EventsProcessed',
  dimensionsMap: {
    Environment: environment,
    Service: 'event-bus'
  }
});
```

## Disaster Recovery

### Backup Strategy
- **Elasticsearch**: Automated snapshots to S3
- **Configuration**: Version controlled in Git
- **Secrets**: Replicated across regions

### Recovery Procedures

1. **Regional Failover**:
   ```bash
   # Deploy to secondary region
   AWS_REGION=us-west-2 cdk deploy --all
   
   # Update DNS to point to secondary region
   aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch file://failover.json
   ```

2. **Data Recovery**:
   ```bash
   # Restore Elasticsearch from snapshot
   aws es restore-elasticsearch-domain --domain-name passkey-prod --snapshot-id snapshot-123
   ```

3. **Service Recovery**:
   ```bash
   # Redeploy all services
   pnpm ci:setup
   
   # Verify functionality
   pnpm test:integration
   ```

## Security Considerations

### Network Security
- VPC isolation for sensitive resources
- Security groups with minimal required access
- Private subnets for Lambda functions
- NAT gateways for outbound internet access

### Access Control
- IAM roles with least privilege principle
- Resource-based policies for cross-account access
- MFA required for production deployments
- Audit logging for all administrative actions

### Data Protection
- Encryption at rest for all data stores
- TLS 1.2+ for all network communication
- Secrets rotation policies
- Data retention and deletion policies

## Cost Optimization

### Resource Optimization
- Right-sizing Lambda memory allocation
- Elasticsearch instance type optimization
- Reserved instances for predictable workloads
- Spot instances for non-critical workloads

### Monitoring Costs
```typescript
const costAlarm = new Alarm(this, 'CostAlarm', {
  metric: new Metric({
    namespace: 'AWS/Billing',
    metricName: 'EstimatedCharges',
    dimensionsMap: {
      Currency: 'USD',
      ServiceName: 'AmazonES'
    }
  }),
  threshold: 1000,
  evaluationPeriods: 1
});
```

### Cost Allocation Tags
```typescript
Tags.of(this).add('Project', 'PasskeyEventBus');
Tags.of(this).add('Environment', environment);
Tags.of(this).add('CostCenter', 'Hospitality');
Tags.of(this).add('Owner', 'metre-stick');
```
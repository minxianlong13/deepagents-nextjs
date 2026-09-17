# Deployment

## Infrastructure

### AWS Architecture

The Passkey Autoblock NX application is deployed on AWS using a modern containerized architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cloud Infrastructure                 │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   CloudFront    │    │      Route53    │                │
│  │   (CDN/WAF)     │    │      (DNS)      │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           ▼                       ▼                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Application Load Balancer                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                │
│                           ▼                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                ECS Fargate Cluster                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │   Task 1    │  │   Task 2    │  │   Task N    │     │ │
│  │  │ (Container) │  │ (Container) │  │ (Container) │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                │
│                           ▼                                │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   ElastiCache   │    │  Systems Manager│                │
│  │    (Redis)      │    │  Parameter Store│                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Core Services

#### ECS Fargate
- **Service**: `passkey-autoblock-apollo`
- **Cluster**: `passkey-cluster`
- **Task Definition**: Auto-managed by CDK
- **CPU**: 512 units (0.5 vCPU)
- **Memory**: 1024 MB
- **Network Mode**: awsvpc

#### Application Load Balancer
- **Type**: Application Load Balancer (ALB)
- **Scheme**: Internet-facing
- **Health Check**: `/health` endpoint
- **SSL/TLS**: Managed certificates via ACM
- **Target Groups**: ECS service targets

#### ElastiCache Redis
- **Engine**: Redis 7.0
- **Node Type**: cache.t3.micro (dev), cache.r6g.large (prod)
- **Cluster Mode**: Disabled
- **Encryption**: In-transit and at-rest
- **Backup**: Automated daily backups

#### Systems Manager Parameter Store
- **Configuration**: Application configuration parameters
- **Secrets**: Sensitive configuration values
- **Hierarchy**: `/passkey/autoblock/{environment}/`
- **Encryption**: KMS encrypted secure strings

## Environments

### Development Environment

**URL**: `https://passkey-autoblock-apollo-dev.core.cvent.org`

**Configuration**:
- **AWS Account**: Development account
- **Region**: us-east-1
- **ECS Tasks**: 1 instance
- **Auto Scaling**: Disabled
- **Redis**: Single node, no backup
- **Logging Level**: DEBUG
- **Feature Flags**: Development environment

**Deployment**:
- **Trigger**: Automatic on merge to `main` branch
- **Pipeline**: Jenkins continuous deployment
- **Rollback**: Manual via Octopus Deploy
- **Monitoring**: Basic health checks

### Staging Environment

**URL**: `https://passkey-autoblock-apollo-staging.core.cvent.org`

**Configuration**:
- **AWS Account**: Staging account
- **Region**: us-east-1
- **ECS Tasks**: 2 instances
- **Auto Scaling**: CPU-based (2-4 instances)
- **Redis**: Single node with backup
- **Logging Level**: INFO
- **Feature Flags**: Staging environment

**Deployment**:
- **Trigger**: Manual promotion from development
- **Pipeline**: Jenkins with approval gates
- **Testing**: Automated integration tests
- **Rollback**: Automated rollback on failure

### Production Environment

**URL**: `https://passkey-autoblock-apollo.core.cvent.org`

**Configuration**:
- **AWS Account**: Production account
- **Region**: us-east-1 (primary), us-west-2 (DR)
- **ECS Tasks**: 3 instances minimum
- **Auto Scaling**: CPU and memory-based (3-10 instances)
- **Redis**: Multi-AZ cluster with backup
- **Logging Level**: WARN
- **Feature Flags**: Production environment

**Deployment**:
- **Trigger**: Manual promotion with approvals
- **Pipeline**: Blue-green deployment
- **Testing**: Full regression test suite
- **Rollback**: Instant blue-green switch

## CI/CD Pipeline

### Jenkins Pipeline

#### Pipeline Stages

```groovy
pipeline {
    agent any
    
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
        
        stage('Code Quality') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'pnpm nx affected --target=lint'
                    }
                }
                stage('Type Check') {
                    steps {
                        sh 'pnpm nx affected --target=type-check'
                    }
                }
                stage('Security Scan') {
                    steps {
                        sh 'pnpm audit --audit-level moderate'
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'pnpm nx affected --target=test --coverage'
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'coverage/junit.xml'
                            publishCoverageResults coverageResultsPattern: 'coverage/lcov.info'
                        }
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'pnpm nx affected --target=ci:test'
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'pnpm nx affected --target=build'
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("passkey-autoblock-apollo:${env.BUILD_NUMBER}")
                    docker.withRegistry('https://your-registry.com', 'docker-registry-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Development') {
            when {
                branch 'main'
            }
            steps {
                build job: 'deploy-to-development', parameters: [
                    string(name: 'IMAGE_TAG', value: env.BUILD_NUMBER)
                ]
            }
        }
    }
    
    post {
        always {
            cleanWs()
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

#### Build Artifacts

- **Docker Image**: Application container image
- **CDK Assets**: Infrastructure deployment artifacts
- **Test Reports**: Unit and integration test results
- **Coverage Reports**: Code coverage metrics
- **Security Scan Results**: Vulnerability assessment reports

### Octopus Deploy Integration

#### Deployment Process

1. **Package Creation**: Jenkins creates deployment package
2. **Environment Promotion**: Manual promotion between environments
3. **Variable Substitution**: Environment-specific configuration
4. **Health Checks**: Pre and post-deployment validation
5. **Rollback**: Automated rollback on failure

#### Deployment Variables

```yaml
# Environment-specific variables
Variables:
  Development:
    AWS_REGION: us-east-1
    ECS_CLUSTER: passkey-dev-cluster
    DESIRED_COUNT: 1
    LOG_LEVEL: DEBUG
    
  Staging:
    AWS_REGION: us-east-1
    ECS_CLUSTER: passkey-staging-cluster
    DESIRED_COUNT: 2
    LOG_LEVEL: INFO
    
  Production:
    AWS_REGION: us-east-1
    ECS_CLUSTER: passkey-prod-cluster
    DESIRED_COUNT: 3
    LOG_LEVEL: WARN
```

## Configuration Management

### AWS Systems Manager Parameter Store

#### Parameter Hierarchy

```
/passkey/autoblock/
├── dev/
│   ├── app/
│   │   ├── auth-service-url
│   │   ├── passkey-api-base-url
│   │   └── redis-url
│   └── secrets/
│       ├── jwt-secret
│       ├── launchdarkly-sdk-key
│       └── datadog-api-key
├── staging/
│   └── ... (same structure)
└── prod/
    └── ... (same structure)
```

#### Parameter Types

- **String**: Non-sensitive configuration values
- **SecureString**: Encrypted sensitive values (KMS)
- **StringList**: Comma-separated lists

#### Access Control

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/passkey-autoblock-task-role"
      },
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/passkey/autoblock/*"
    }
  ]
}
```

### Environment Configuration

#### Development
```bash
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# External Services
AUTH_SERVICE_URL=https://auth-dev.core.cvent.org
PASSKEY_API_BASE_URL=https://passkey-api-dev.core.cvent.org
REDIS_URL=redis://passkey-dev-redis.cache.amazonaws.com:6379

# Feature Flags
LAUNCHDARKLY_ENVIRONMENT=development
```

#### Production
```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn

# External Services
AUTH_SERVICE_URL=https://auth.core.cvent.org
PASSKEY_API_BASE_URL=https://passkey-api.core.cvent.org
REDIS_URL=redis://passkey-prod-redis.cache.amazonaws.com:6379

# Feature Flags
LAUNCHDARKLY_ENVIRONMENT=production
```

## Rollback Procedures

### Automated Rollback

#### Health Check Failures
```yaml
# Octopus Deploy health check configuration
HealthCheck:
  Endpoint: /health
  Timeout: 30s
  Interval: 10s
  HealthyThreshold: 2
  UnhealthyThreshold: 3
  
RollbackTriggers:
  - HealthCheckFailure
  - HighErrorRate (>5% for 5 minutes)
  - HighLatency (>2s p95 for 5 minutes)
```

#### Blue-Green Rollback
1. **Detection**: Monitoring alerts trigger rollback
2. **Traffic Switch**: Load balancer switches to previous version
3. **Verification**: Health checks confirm successful rollback
4. **Notification**: Team notified of rollback completion

### Manual Rollback

#### Emergency Rollback Process
1. **Access Octopus Deploy**: Navigate to deployment dashboard
2. **Select Environment**: Choose affected environment
3. **Rollback Action**: Click "Rollback to Previous Release"
4. **Confirm Rollback**: Verify rollback target version
5. **Monitor Progress**: Watch deployment progress and health checks
6. **Verify Success**: Confirm application functionality

#### Rollback Verification Checklist
- [ ] Application health endpoint returns 200 OK
- [ ] GraphQL endpoint responds to introspection query
- [ ] Authentication flow works correctly
- [ ] Feature flags are loading properly
- [ ] Monitoring dashboards show normal metrics
- [ ] No error spikes in application logs

### Database Rollback

Since the application doesn't maintain its own database, rollback considerations include:

#### Redis Cache
- **Strategy**: Cache invalidation and refresh
- **Impact**: Temporary performance degradation
- **Recovery**: Automatic cache warming

#### External Service Compatibility
- **API Versions**: Ensure backward compatibility
- **Schema Changes**: Coordinate with upstream services
- **Feature Flags**: Use flags to control new functionality

## Monitoring & Alerting

### Deployment Monitoring

#### Key Metrics
- **Deployment Success Rate**: Percentage of successful deployments
- **Deployment Duration**: Time from start to completion
- **Rollback Frequency**: Number of rollbacks per time period
- **Mean Time to Recovery (MTTR)**: Time to recover from failures

#### Alerts
```yaml
Alerts:
  - Name: Deployment Failure
    Condition: Deployment status = Failed
    Severity: Critical
    Notification: Slack + Email
    
  - Name: High Rollback Rate
    Condition: Rollbacks > 3 in 24 hours
    Severity: Warning
    Notification: Slack
    
  - Name: Long Deployment Duration
    Condition: Deployment time > 30 minutes
    Severity: Warning
    Notification: Slack
```

### Post-Deployment Validation

#### Automated Tests
- **Smoke Tests**: Basic functionality verification
- **Health Checks**: Endpoint availability and response time
- **Integration Tests**: External service connectivity
- **Performance Tests**: Load and response time validation

#### Manual Verification
- **UI Testing**: Critical user flows
- **API Testing**: GraphQL query execution
- **Authentication**: Login and authorization flows
- **Feature Flags**: New feature functionality

## Security Considerations

### Deployment Security

#### Container Security
- **Base Images**: Regularly updated minimal base images
- **Vulnerability Scanning**: Automated security scanning
- **Secrets Management**: No secrets in container images
- **Runtime Security**: Read-only file systems where possible

#### Network Security
- **VPC**: Isolated network environment
- **Security Groups**: Restrictive ingress/egress rules
- **WAF**: Web Application Firewall protection
- **TLS**: End-to-end encryption

#### Access Control
- **IAM Roles**: Least privilege access
- **Service Accounts**: Dedicated service accounts
- **Audit Logging**: All deployment actions logged
- **MFA**: Multi-factor authentication required

### Secrets Management

#### AWS Secrets Manager
```typescript
// Secrets retrieval in application
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

const getSecret = async (secretName: string) => {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
};
```

#### Secret Rotation
- **Automatic Rotation**: Enabled for database credentials
- **Manual Rotation**: API keys rotated quarterly
- **Notification**: Team notified of rotation events
- **Validation**: Automated testing after rotation
# Technical Details

## Technology Stack

- **Framework**: AWS CDK (Cloud Development Kit) v2.179.0
- **Language**: TypeScript 5.3.3
- **Runtime**: Node.js 18+
- **Build Tool**: pnpm (Package Manager)
- **Container**: Docker with official ClamAV base image
- **Infrastructure**: AWS ECS Fargate
- **Load Balancer**: AWS Network Load Balancer
- **Monitoring**: Datadog
- **Testing**: Jest 29.5.0

## Dependencies

### Core Dependencies
```json
{
  "@cvent/cdk-applications": "^1.25.0",     // Cvent CDK application framework
  "@cvent/cdk-lib": "^1.18.2",             // Cvent CDK utilities
  "@cvent/environments": "^1.45.12",        // Environment configuration
  "@cvent/octopusdeploy-cdk": "^4.3.0",    // Octopus Deploy integration
  "aws-cdk-lib": "^2.179.0",               // AWS CDK core library
  "constructs": "^10.4.0",                 // CDK constructs framework
  "source-map-support": "^0.5.21"          // Source map support for debugging
}
```

### Development Dependencies
```json
{
  "@cvent/builder-cdk": "^3.7.8",          // CDK build tools
  "@cvent/builder-docker": "^2.10.0",      // Docker build tools
  "@cvent/nucleus-eslint": "^4.0.0",       // ESLint configuration
  "@types/jest": "^29.5.1",                // Jest type definitions
  "@types/node": "^18.19.0",               // Node.js type definitions
  "jest": "^29.5.0",                       // Testing framework
  "typescript": "^5.3.3"                   // TypeScript compiler
}
```

## Configuration

### Environment Variables

The service configuration is managed through CDK parameters and environment-specific files:

#### Application Configuration
- `AWS_ACCOUNT`: Target AWS account ID
- `AWS_REGION`: Deployment region (us-east-1, us-west-2)
- `ENVIRONMENT`: Environment name (pr50, pr51, ci, etc.)
- `VERSION`: Application version from package.json

#### Resource Configuration
- `CPU_UNITS`: ECS task CPU allocation (1024 = 1 vCPU)
- `MEMORY_LIMIT`: ECS task memory allocation (3072 MB)
- `MIN_CAPACITY`: Minimum number of running tasks
- `MAX_CAPACITY`: Maximum number of running tasks
- `SECURITY_GROUP_ID`: VPC security group for network access

### ClamAV Configuration

#### Daemon Configuration (`clamav/clamd.conf`)
Key settings include:
- `TCPSocket 3310`: Listen on port 3310
- `MaxFileSize 100M`: Maximum file size for scanning
- `MaxScanSize 100M`: Maximum data to scan within archives
- `MaxRecursion 10`: Maximum archive extraction depth
- `ReadTimeout 30`: Socket read timeout in seconds

#### FreshClam Configuration (`clamav/freshclam.conf`)
Key settings include:
- `DatabaseMirror database.clamav.net`: Primary update server
- `UpdateLogFile /var/log/clamav/freshclam.log`: Update log location
- `Checks 24`: Check for updates every 24 hours
- `MaxAttempts 3`: Maximum download attempts

### Security Group Mappings

Environment-specific security groups by AWS account:

```typescript
const securityGroups = {
  'core-passkey-dev': {
    'us-east-1': 'sg-0924fe9ee4d112a13'
  },
  'core-passkey-intg': {
    'us-east-1': 'sg-0df19e1f16243c803'
  },
  'core-passkey-prod': {
    'us-east-1': 'sg-028cee558f92b50ec',
    'us-west-2': 'sg-06612e9d1645b75a5'
  },
  'na1-passkeypci-dev': {
    'us-east-1': 'sg-05338892769c50fa6'
  },
  'na1-passkeypci-prod': {
    'us-east-1': 'sg-0d2e1414a846f0339',
    'us-west-2': 'sg-061f98736f187b74d'
  }
};
```

## Container Configuration

### Dockerfile
```dockerfile
FROM clamav/clamav:stable

ADD clamav/clamd.conf /etc/clamav
ADD clamav/freshclam.conf /etc/clamav
```

### Container Resources
- **Base Image**: `clamav/clamav:stable`
- **CPU Allocation**: 1024 units (1 vCPU) minus monitoring overhead
- **Memory Allocation**: 3072 MB minus monitoring overhead
- **Port Exposure**: 3310 (ClamAV daemon)
- **Health Check**: TCP connection test on port 3310

### ECS Task Definition
- **Launch Type**: Fargate
- **Network Mode**: awsvpc
- **CPU**: 1024 (adjustable per environment)
- **Memory**: 3072 MB (adjustable per environment)
- **Platform Version**: LATEST

## Database Schema

This service does not use a traditional database. Instead, it relies on:

### ClamAV Virus Database
- **Format**: Binary signature files (.cvd, .cld)
- **Location**: `/var/lib/clamav/`
- **Update Mechanism**: FreshClam automatic updates
- **Files**:
  - `main.cvd`: Main virus database
  - `daily.cvd`: Daily updates
  - `bytecode.cvd`: Bytecode signatures

### Configuration Storage
- **CDK Parameters**: Stored in CDK context and environment files
- **Runtime Config**: Environment variables and mounted config files
- **Secrets**: AWS Systems Manager Parameter Store (if needed)

## Monitoring & Logging

### Datadog Integration

#### Logging Extension
```typescript
new DatadogLoggingExtension({
  source: 'clamav',
  service: 'passkey-clamav-service',
  environment: props.environment,
  version: props.version,
  tags: {
    account: props.deploymentTarget.awsAccountName
  }
})
```

#### Monitoring Extension
```typescript
new DatadogMonitoringExtension({
  service: 'passkey-clamav-service',
  environment: props.environment
})
```

### Key Metrics
- **Scan Rate**: Number of scans per minute
- **Scan Duration**: Average time per scan
- **Error Rate**: Percentage of failed scans
- **CPU Utilization**: Container CPU usage
- **Memory Utilization**: Container memory usage
- **Connection Count**: Active TCP connections

### Log Formats
- **Structured Logging**: JSON format for machine parsing
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Log Sources**: ClamAV daemon, FreshClam, CDK deployment

### Dashboards
- **Service Overview**: High-level service health and performance
- **Scan Analytics**: Detailed scan statistics and trends
- **Infrastructure**: ECS, load balancer, and network metrics
- **Error Analysis**: Error rates, types, and troubleshooting

## Build and Deployment

### Build Process
```bash
# TypeScript compilation
pnpm build:ts

# Docker image build
pnpm build:docker

# CDK synthesis
pnpm build:cdk

# Combined build
pnpm build
```

### Testing
```bash
# CDK unit tests
pnpm test:cdk

# TypeScript tests
pnpm test:ts

# All tests
pnpm test
```

### Deployment Pipeline
1. **Code Commit**: Changes pushed to repository
2. **Jenkins Build**: Automated build and test execution
3. **Docker Build**: Container image creation and push to registry
4. **CDK Deploy**: Infrastructure deployment via CDK
5. **Health Check**: Service health verification
6. **Monitoring**: Datadog alert activation

### Environment Promotion
- **CI**: Automatic deployment on PR creation
- **Development**: Manual deployment for testing
- **Staging**: Automated deployment from main branch
- **Production**: Manual approval required

## Performance Characteristics

### Throughput
- **Small Files** (<1MB): ~100 scans/second per task
- **Medium Files** (1-10MB): ~20 scans/second per task
- **Large Files** (>10MB): ~5 scans/second per task

### Latency
- **Network Latency**: <5ms within AWS region
- **Scan Latency**: 10-500ms depending on file size
- **Connection Setup**: <10ms for TCP connection

### Scaling
- **Auto-scaling**: Based on CPU utilization (>70% scale up)
- **Scale-up Time**: ~2 minutes for new tasks to be ready
- **Scale-down Time**: ~5 minutes after load decreases
- **Maximum Capacity**: Configurable per environment

### Resource Usage
- **CPU**: ~50% utilization during normal load
- **Memory**: ~1.5GB baseline + scan buffer
- **Network**: Minimal bandwidth for virus updates
- **Storage**: ~500MB for virus database
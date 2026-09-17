# Architecture

## System Overview

Passkey ClamAV is a cloud-native antivirus scanning service built using AWS CDK (Cloud Development Kit) and deployed on AWS ECS Fargate. The service provides a centralized malware scanning capability for Passkey applications through a containerized ClamAV daemon accessible via TCP protocol.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│  Network Load    │───▶│   ECS Fargate   │
│   (Passkey)     │    │   Balancer       │    │   ClamAV Pod    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   DNS Record     │    │   Datadog       │
                       │   (Route 53)     │    │   Monitoring    │
                       └──────────────────┘    └─────────────────┘
```

## Components

### CDK Application (`lib/application.ts`)
- **Purpose**: Main CDK application that orchestrates infrastructure deployment
- **Location**: `lib/application.ts`
- **Key Classes**: `Application`
- **Responsibilities**:
  - Environment-specific configuration management
  - Security group mapping across AWS accounts
  - Resource tagging and naming conventions
  - Ephemeral stack management for CI environments

### Infrastructure Stack (`lib/stack.ts`)
- **Purpose**: Defines all AWS resources and their configurations
- **Location**: `lib/stack.ts`
- **Key Classes**: `PasskeyClamavStack`
- **Responsibilities**:
  - ECS Fargate cluster and service configuration
  - Network Load Balancer setup
  - DNS record creation
  - Monitoring and logging extensions

### ClamAV Container
- **Purpose**: Containerized ClamAV antivirus engine
- **Location**: `Dockerfile`, `clamav/` directory
- **Key Components**:
  - ClamAV daemon (`clamd`)
  - FreshClam for virus definition updates
  - Custom configuration files

### Environment-Specific Deployments
- **Purpose**: Multi-environment deployment configurations
- **Location**: `bin/` directory
- **Key Files**: Environment-specific entry points (pr50.ts, pr51.ts, etc.)

## Data Flow

1. **File Scanning Request**: Client applications connect to the service via TCP on port 3310
2. **Load Balancing**: Network Load Balancer distributes requests across healthy ECS tasks
3. **Virus Scanning**: ClamAV daemon processes the file content and returns scan results
4. **Response**: Scan results (CLEAN/INFECTED) are returned to the client
5. **Monitoring**: All interactions are logged and monitored via Datadog

## Design Patterns

### Infrastructure as Code (IaC)
- Uses AWS CDK for declarative infrastructure definition
- TypeScript-based configuration for type safety
- Environment-specific parameter management

### Container Orchestration
- ECS Fargate for serverless container management
- Auto-scaling based on CPU and memory utilization
- Health check integration for service reliability

### Service Layer Pattern
- Clear separation between infrastructure (CDK) and application (ClamAV)
- Configuration externalization through environment variables
- Monitoring and logging as cross-cutting concerns

### Multi-Environment Deployment
- Environment-specific configuration files
- Consistent naming and tagging across environments
- Ephemeral environments for CI/CD testing

## Module Structure

```
passkey-clamav/
├── lib/                    # CDK Infrastructure Code
│   ├── application.ts      # Main CDK Application
│   └── stack.ts           # Infrastructure Stack Definition
├── bin/                    # Environment Entry Points
│   ├── ci.ts              # CI Environment
│   ├── pr50.ts            # Production Environment
│   ├── passkey-*.ts       # Passkey-specific Environments
│   └── pipeline.ts        # Deployment Pipeline
├── clamav/                # ClamAV Configuration
│   ├── clamd.conf         # ClamAV Daemon Configuration
│   └── freshclam.conf     # Virus Definition Update Config
├── test/                  # Unit Tests
│   └── stack.test.ts      # Infrastructure Tests
└── Dockerfile             # Container Definition
```

## Security Architecture

### Network Security
- Private subnets for ECS tasks
- Security groups restricting access to port 3310
- Internal Network Load Balancer (not internet-facing)

### Container Security
- Base image from official ClamAV repository
- Minimal container surface area
- Regular virus definition updates

### Access Control
- AWS IAM roles for ECS task execution
- Environment-specific security group configurations
- Account-level isolation between environments

## Scalability Design

### Horizontal Scaling
- ECS service auto-scaling based on metrics
- Configurable min/max capacity per environment
- Load balancer health checks ensure traffic routing to healthy instances

### Resource Allocation
- Environment-specific CPU and memory allocation
- Datadog monitoring overhead accounted for in resource planning
- Optimized container resource utilization

## Monitoring Architecture

### Observability Stack
- **Datadog Logging Extension**: Structured log collection and forwarding
- **Datadog Monitoring Extension**: Metrics collection and alerting
- **ECS Exec Extension**: Remote debugging and troubleshooting capabilities

### Health Monitoring
- ECS service health checks on port 3310
- Network Load Balancer target health monitoring
- Custom Datadog dashboards and alerts
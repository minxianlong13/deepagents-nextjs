# Architecture

## System Overview

Passkey Services implements a **Service Aggregator Pattern** where multiple independent Java microservices are consolidated into a single TypeScript monorepo for unified deployment and management. The architecture follows a hybrid approach combining monorepo benefits with microservice independence.

```
┌─────────────────────────────────────────────────────────────┐
│                    Passkey Services Monorepo                │
├─────────────────────────────────────────────────────────────┤
│  TypeScript/JavaScript Orchestration Layer                 │
│  ├── pnpm workspace management                             │
│  ├── Unified build system                                  │
│  ├── Changeset version management                          │
│  └── Jenkins CI/CD pipeline                                │
├─────────────────────────────────────────────────────────────┤
│                    Java Services Layer                      │
│  ├── GMLService (Guest Management)                         │
│  ├── ExchangeRates (Currency Updates)                      │
│  ├── GLResCRTSService (Reservation Processing)             │
│  ├── Nor1Processor (Third-party Integration)               │
│  ├── billing-report (Billing Reports)                      │
│  ├── roche-report (Roche Integration)                      │
│  └── exchange-rates (Alternative Currency Service)         │
├─────────────────────────────────────────────────────────────┤
│                  Deployment Infrastructure                  │
│  ├── Cron-based scheduling                                 │
│  ├── Shared logging directory                              │
│  ├── Environment-specific configurations                   │
│  └── Health monitoring                                     │
└─────────────────────────────────────────────────────────────┘
```

## Components

### TypeScript Orchestration Layer
- **Purpose**: Provides unified build, test, and deployment orchestration
- **Location**: Root `package.json` and `packages/app/package.json`
- **Key Classes**: Build scripts, changeset configuration, workspace management

**Responsibilities**:
- Coordinate Maven builds across all Java services
- Manage version bumps and releases
- Execute SonarQube analysis
- Orchestrate deployment pipeline

### Java Service Components

#### GMLService (Guest Management Layer)
- **Purpose**: Processes guest management operations
- **Location**: `packages/app/GMLService/`
- **Schedule**: Every minute (`*/1 * * * *`)
- **Key Classes**: Maven-based Java application with log4j logging

#### ExchangeRates Service
- **Purpose**: Updates currency exchange rates
- **Location**: `packages/app/ExchangeRates/`
- **Schedule**: Monthly on 1st at 9 AM (`0 9 1 * *`)
- **Key Classes**: Standalone Java application for currency data processing

#### GLResCRTSService
- **Purpose**: GL Reservation CRTS processing
- **Location**: `packages/app/GLResCRTSService/`
- **Key Classes**: Reservation data transformation and processing

#### Nor1Processor
- **Purpose**: Integration with Nor1 third-party service
- **Location**: `packages/app/Nor1Processor/`
- **Schedule**: Daily at 6 AM (`0 6 * * *`)
- **Key Classes**: API integration and data synchronization

#### Billing Report Services
- **Purpose**: Generate billing and financial reports
- **Location**: `packages/app/billing-report/` and `packages/app/roche-report/`
- **Schedule**: Monthly and daily respectively
- **Key Classes**: Report generation and data export

## Data Flow

### Service Execution Flow
```
1. Cron Scheduler → Service Shell Script → Java Application
2. Java Application → Database/External APIs → Data Processing
3. Data Processing → Log Files → Monitoring Systems
4. Results → Shared Log Directory → Centralized Logging
```

### Build and Deployment Flow
```
1. Developer Commit → Jenkins Pipeline → pnpm install
2. pnpm build → Maven builds (parallel) → JAR artifacts
3. SonarQube Analysis → Quality Gates → Deployment Approval
4. Octo Deployment → Environment Configuration → Service Restart
5. Cron Registration → Service Monitoring → Health Checks
```

## Design Patterns

### Service Aggregator Pattern
- **Implementation**: Single repository containing multiple independent services
- **Benefits**: Unified deployment, shared infrastructure, coordinated releases
- **Trade-offs**: Increased complexity, potential coupling between services

### Scheduled Service Pattern
- **Implementation**: Cron-based execution with shell script wrappers
- **Benefits**: Reliable scheduling, resource management, failure isolation
- **Components**: Cron configuration, shell scripts, Java executables

### Configuration Management Pattern
- **Implementation**: Environment-specific configuration files
- **Location**: `configs/` directories within each service
- **Benefits**: Environment isolation, secure credential management

## Module Structure

### Monorepo Organization
```
passkey-services/
├── packages/app/                    # Main application package
│   ├── package.json                # Build orchestration
│   ├── services_crontab            # Cron schedule definitions
│   ├── catalog-info.yaml           # Service catalog metadata
│   ├── GMLService/                 # Individual Java services
│   ├── ExchangeRates/
│   ├── GLResCRTSService/
│   ├── Nor1Processor/
│   ├── billing-report/
│   ├── roche-report/
│   └── exchange-rates/
├── .changeset/                     # Version management
├── docs/                          # Documentation
└── pipeline/                      # Deployment scripts
```

### Individual Service Structure
```
{ServiceName}/
├── src/main/java/                 # Java source code
├── src/main/resources/            # Configuration files
├── configs/                       # Environment configs
├── cronScript/                    # Cron execution scripts
├── pom.xml                       # Maven configuration
├── catalog-info.yaml             # Service metadata
└── README.MD                     # Service documentation
```

## Deployment Architecture

### Environment Separation
- **Development**: Local development with individual service execution
- **Alpha/Beta**: Pre-production environments with full cron scheduling
- **Production**: Full deployment with monitoring and alerting

### Service Isolation
- Each service runs in its own process space
- Shared logging directory: `/services/passkey/{env}/services/logs/json`
- Independent failure handling and recovery
- Resource allocation per service

## Scalability Considerations

### Horizontal Scaling
- Services are stateless and can be distributed across multiple nodes
- Cron scheduling can be load-balanced across deployment targets
- Database connections are service-specific

### Vertical Scaling
- Java heap sizes configurable per service
- Resource allocation managed through deployment configuration
- Monitoring and alerting for resource utilization

## Security Architecture

### Access Control
- Service-specific user accounts (`passkey` user)
- File system permissions for log directories
- Database connection security per service

### Configuration Security
- Environment-specific credential management
- Secure configuration file handling
- External API key management
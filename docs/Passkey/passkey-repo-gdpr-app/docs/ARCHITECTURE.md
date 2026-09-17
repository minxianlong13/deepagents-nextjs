# Architecture

## System Overview

The Passkey GDPR App follows a serverless microservices architecture built on AWS, utilizing Infrastructure as Code (IaC) principles with AWS CDK v2. The system is designed as a TypeScript monorepo using Nx workspace for efficient development and deployment.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Lambda Auth    │────│  GDPR Lambdas   │
│                 │    │   (Authorizer)  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  EventBridge    │    │   Parameter     │    │  passkey-gdpr   │
│   Scheduler     │    │     Store       │    │    -service     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Scheduler Lambda│
│                 │
└─────────────────┘
```

## Components

### Infrastructure Package (`packages/infra/`)
- **Purpose**: Defines and manages AWS infrastructure using CDK v2
- **Location**: `packages/infra/`
- **Key Classes**:
  - CDK Stack definitions
  - Lambda function constructs
  - API Gateway configurations
  - EventBridge scheduler setup

### GDPR Lambdas Package (`packages/gdpr-lambdas/`)
- **Purpose**: Core Lambda functions for GDPR data processing and API operations
- **Location**: `packages/gdpr-lambdas/src/`
- **Key Components**:
  - `handlers/authorizer/` - API Gateway authorization logic
  - `api/` - API endpoint handlers
  - Integration with AWS Parameter Store for secrets management

### Scheduler Lambda Package (`packages/scheduler-lambda/`)
- **Purpose**: Handles scheduled GDPR compliance tasks and workflows
- **Location**: `packages/scheduler-lambda/src/`
- **Key Components**:
  - Event-driven scheduling logic
  - Integration with EventBridge
  - Automated compliance task execution

## Data Flow

### GDPR Request Processing
1. **API Request**: External systems send GDPR requests to API Gateway
2. **Authorization**: Lambda Authorizer validates requests using Parameter Store secrets
3. **Processing**: GDPR Lambda functions process the requests
4. **Service Integration**: Calls to passkey-gdpr-service for business logic
5. **Response**: Structured response returned to caller

### Scheduled Operations
1. **EventBridge Trigger**: Scheduled events trigger Scheduler Lambda
2. **Task Execution**: Scheduler Lambda processes compliance tasks
3. **Service Coordination**: Coordinates with other Passkey services
4. **Monitoring**: Results logged and monitored via DataDog

## Design Patterns

### Serverless Architecture
- **Event-Driven**: Lambda functions triggered by API Gateway and EventBridge
- **Stateless**: Functions maintain no persistent state
- **Auto-Scaling**: Automatic scaling based on demand

### Infrastructure as Code (IaC)
- **CDK v2**: Modern AWS CDK for infrastructure definition
- **Type Safety**: TypeScript for infrastructure code
- **Version Control**: Infrastructure changes tracked in Git

### Monorepo Pattern
- **Nx Workspace**: Efficient build and dependency management
- **Shared Dependencies**: Common libraries and configurations
- **Independent Deployment**: Each package can be deployed independently

### Security Patterns
- **Parameter Store**: Secure storage of secrets and configuration
- **Lambda Authorizer**: Centralized API authorization
- **IAM Roles**: Least privilege access for Lambda functions

## Module Structure

### Root Level
```
passkey-gdpr-app/
├── package.json              # Workspace configuration
├── nx.json                   # Nx build system configuration
├── pnpm-workspace.yaml       # pnpm workspace definition
├── Jenkinsfile              # CI/CD pipeline
├── catalog-info.yaml        # Backstage service catalog
└── packages/                # Individual packages
```

### Package Organization
Each package follows a consistent structure:
```
packages/{package-name}/
├── src/                     # Source code
├── package.json            # Package dependencies
├── tsconfig.json           # TypeScript configuration
├── project.json            # Nx project configuration
├── jest.config.js          # Test configuration
└── README.md               # Package documentation
```

## Technology Stack Integration

### AWS Services
- **Lambda**: Serverless compute for business logic
- **API Gateway**: HTTP API endpoints
- **EventBridge**: Event scheduling and routing
- **Parameter Store**: Configuration and secrets management
- **CloudFormation**: Infrastructure deployment (via CDK)

### Development Tools
- **TypeScript**: Primary programming language
- **Nx**: Monorepo build system and task runner
- **pnpm**: Package manager with workspace support
- **Jest**: Testing framework
- **ESLint/Prettier**: Code quality and formatting

### CI/CD Integration
- **Jenkins**: Primary CI/CD pipeline
- **Checkmarx**: Security scanning
- **SonarQube**: Code quality analysis
- **Octopus Deploy**: Deployment orchestration

## Scalability Considerations

### Horizontal Scaling
- Lambda functions automatically scale with demand
- API Gateway handles traffic distribution
- EventBridge provides reliable event delivery

### Performance Optimization
- TypeScript compilation for faster cold starts
- Shared dependencies to reduce bundle size
- Parameter Store caching for configuration

### Monitoring and Observability
- DataDog integration for metrics and logging
- CloudWatch for AWS service monitoring
- Structured logging for debugging and analysis
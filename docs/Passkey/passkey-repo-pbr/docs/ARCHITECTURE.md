# Architecture

## System Overview

The Passkey PBR CDK implements a simple yet effective proxy architecture that provides custom domain routing for survey services. The system acts as a gateway layer between public-facing survey URLs and internal Passkey services, enabling clean, branded URLs for survey access while maintaining separation between public interfaces and internal service implementations.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐
│   Public User   │───▶│   Custom Domain  │───▶│    API Gateway         │
│                 │    │  pbr.passkey.com │    │  (CDK Managed)         │
└─────────────────┘    └──────────────────┘    └─────────────────────────┘
                                                            │
                                                            ▼
                                               ┌─────────────────────────┐
                                               │ passkey-pbr-survey-     │
                                               │ wrapper Service         │
                                               │ (Backend Java Service)  │
                                               └─────────────────────────┘
```

## Components

### Application Layer (`lib/application.ts`)
- **Purpose**: Main CDK application orchestrator and configuration manager
- **Location**: `packages/passkey-pbr-cdk/lib/application.ts`
- **Key Classes**: 
  - `Application`: Main CDK App class that initializes stacks
  - `ApplicationProps`: Configuration interface for deployment parameters
  - `PBRConfig`: Hogan configuration interface for service endpoints

**Responsibilities**:
- Fetches configuration from Hogan service
- Manages environment-specific settings
- Initializes the GatewayStack with proper configuration
- Handles ephemeral stack creation for CI environments

### Gateway Stack (`lib/api-gateway-stack.ts`)
- **Purpose**: AWS infrastructure definition for API Gateway and custom domain
- **Location**: `packages/passkey-pbr-cdk/lib/api-gateway-stack.ts`
- **Key Classes**:
  - `GatewayStack`: CDK Stack containing all AWS resources
  - `GatewayStackProps`: Configuration interface for stack parameters

**Responsibilities**:
- Creates AWS API Gateway with custom domain configuration
- Manages SSL certificate integration
- Defines HTTP integrations to backend services
- Handles legacy URL routing and redirects
- Outputs DNS configuration for domain setup

### Environment Entry Points (`bin/`)
- **Purpose**: Environment-specific deployment configurations
- **Location**: `packages/passkey-pbr-cdk/bin/`
- **Key Files**:
  - `passkey-pr50.ts`: Production environment configuration
  - `passkey-ct50.ts`: Staging environment configuration
  - `passkey-it50.ts`: Integration testing environment
  - `ci.ts`: Continuous integration environment

**Responsibilities**:
- Define environment-specific AWS account and region settings
- Configure certificate IDs for each environment
- Set deployment target parameters

## Data Flow

### Survey Request Flow
1. **User Access**: User navigates to `https://pbr.passkey.com/survey`
2. **DNS Resolution**: Domain resolves to API Gateway regional endpoint
3. **SSL Termination**: API Gateway handles SSL/TLS termination using ACM certificate
4. **Route Matching**: Gateway matches `/survey` path to configured resource
5. **HTTP Integration**: Gateway proxies request to backend service endpoint
6. **Response Proxy**: Backend response is returned through Gateway to user

### Configuration Flow
1. **Deployment Initialization**: CDK deployment starts with environment-specific entry point
2. **Hogan Configuration**: Application fetches service configuration from Hogan
3. **Stack Creation**: GatewayStack is created with resolved configuration
4. **Resource Provisioning**: AWS resources are created/updated via CloudFormation
5. **DNS Output**: Stack outputs DNS name for domain configuration

## Design Patterns

### Infrastructure as Code (IaC)
- Uses AWS CDK for declarative infrastructure definition
- TypeScript provides type safety and IDE support
- Constructs pattern for reusable infrastructure components

### Configuration Management
- External configuration via Hogan service
- Environment-specific parameter injection
- Separation of configuration from code

### Proxy Pattern
- API Gateway acts as proxy between public domain and internal services
- Transparent request/response forwarding
- SSL termination at proxy layer

### Factory Pattern
- `Application.build()` static factory method for async initialization
- Handles configuration fetching before object creation
- Ensures proper initialization order

## Module Structure

### Monorepo Organization
```
passkey-pbr/
├── packages/
│   └── passkey-pbr-cdk/          # Main CDK package
│       ├── bin/                  # Environment entry points
│       ├── lib/                  # CDK stack definitions
│       ├── test/                 # Unit tests
│       └── package.json          # Package dependencies
├── package.json                  # Root workspace configuration
├── pnpm-workspace.yaml          # pnpm workspace definition
└── pnpm-lock.yaml               # Dependency lock file
```

### CDK Package Structure
```
packages/passkey-pbr-cdk/
├── lib/
│   ├── application.ts           # Main application class
│   └── api-gateway-stack.ts     # Gateway infrastructure stack
├── bin/
│   ├── passkey-pr50.ts         # Production deployment
│   ├── passkey-ct50.ts         # Staging deployment
│   ├── passkey-it50.ts         # Integration deployment
│   └── ci.ts                   # CI deployment
└── test/
    └── passkey-pbr.test.ts     # Stack unit tests
```

## Deployment Architecture

### Multi-Environment Strategy
- Each environment has dedicated entry point file
- Environment-specific AWS accounts and regions
- Separate certificate management per environment
- Independent deployment pipelines

### Stack Naming Convention
- Format: `PasskeyPbrStack-{deploymentTarget}-{version}`
- Example: `PasskeyPbrStack-pr50-0.15.9`
- Enables parallel deployments and rollbacks

### Resource Tagging
- Consistent tagging strategy using `@cvent/environments`
- Business unit, platform, product, and environment tags
- Enables cost tracking and resource management

## Security Considerations

### SSL/TLS Configuration
- TLS 1.2 minimum security policy
- Regional endpoint type for better performance
- Certificate validation through AWS Certificate Manager

### Access Control
- API Gateway deployed in private Cvent AWS accounts
- No public API keys or authentication required for survey access
- Backend service handles any required authentication

### Network Architecture
- Regional API Gateway deployment
- HTTP integration to internal service endpoints
- No direct internet access to backend services
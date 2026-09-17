# Domain Model

## Glossary

### PBR (Public Block Request)
A system component that manages public-facing survey endpoints for Passkey services. PBR provides custom domain routing and acts as a gateway between public survey URLs and internal Passkey services.

### Custom Domain
A branded domain name (e.g., `pbr.passkey.com`) that provides a clean, professional URL for survey access instead of exposing internal AWS API Gateway URLs.

### API Gateway
AWS service that acts as a proxy and routing layer, handling HTTP requests from custom domains and forwarding them to backend services.

### HTTP Integration
A type of API Gateway integration that forwards HTTP requests to backend services without transformation, acting as a transparent proxy.

### Hogan
Cvent's configuration management service that provides environment-specific configuration data, including service endpoints and domain mappings.

### Deployment Target
An environment identifier (e.g., `pr50`, `ct50`, `it50`) that specifies which Cvent environment the infrastructure should be deployed to.

### CDK (Cloud Development Kit)
AWS's Infrastructure as Code framework that allows defining cloud resources using programming languages like TypeScript.

### Stack
A CDK/CloudFormation unit of deployment that contains a collection of AWS resources that are deployed together.

### Certificate Manager (ACM)
AWS service that manages SSL/TLS certificates for secure HTTPS connections.

### Regional Endpoint
An API Gateway endpoint type that is deployed in a specific AWS region for better performance and lower latency.

### Ephemeral Stack
A temporary infrastructure deployment, typically used for CI/CD testing that is automatically cleaned up after use.

## Core Entities

### Application
**Description**: The main CDK application class that orchestrates the deployment of infrastructure resources.

**Attributes**:
- `version`: string - Package version used for stack naming
- `awsEnvironment`: Environment - AWS account and region configuration
- `cventEnvironment`: string - Cvent environment name (e.g., 'production', 'ci')
- `cventSubEnv`: SubEnv - Sub-environment specification (e.g., 'production')
- `certificateId`: string - SSL certificate identifier for custom domain
- `deploymentTarget`: string - Target environment for deployment

**Relationships**:
- Contains one GatewayStack
- Fetches configuration from Hogan service
- Manages environment-specific settings

### GatewayStack
**Description**: CDK Stack that defines the API Gateway infrastructure and custom domain configuration.

**Attributes**:
- `domainName`: string - Custom domain name for the service
- `certId`: string - Certificate ID for SSL/TLS
- `envName`: string - Environment name for resource naming
- `stageName`: string - API Gateway stage name
- `pbrServiceUrl`: string - Backend service endpoint URL
- `pbrServiceVersion`: string - Backend service API version

**Relationships**:
- Contains RestApi resource
- References Certificate from ACM
- Integrates with backend service via HTTP integration

### PBRConfig
**Description**: Configuration object that contains service-specific settings retrieved from Hogan.

**Attributes**:
- `endpoint`: string - Internal service endpoint URL
- `version`: string - API version (typically 'v1')
- `customDomain`: string - Public-facing domain name
- `certificateId`: string - SSL certificate identifier

**Relationships**:
- Retrieved from Hogan configuration service
- Used by Application to configure GatewayStack
- Maps to backend service configuration

### RestApi
**Description**: AWS API Gateway REST API resource that handles HTTP requests and routing.

**Attributes**:
- `stageName`: string - Deployment stage name
- `domainName`: DomainName - Custom domain configuration
- `endpointType`: EndpointType - Regional endpoint configuration
- `securityPolicy`: SecurityPolicy - TLS security settings

**Relationships**:
- Contains API resources and methods
- References SSL certificate
- Integrates with backend services

### HttpIntegration
**Description**: API Gateway integration that forwards requests to HTTP endpoints.

**Attributes**:
- `httpMethod`: string - HTTP method for backend requests
- `uri`: string - Backend service endpoint URI

**Relationships**:
- Connects API Gateway methods to backend services
- Handles request/response proxying
- No request/response transformation

## Business Rules

### Domain Mapping Rules
1. **Production Domain**: `pbr.passkey.com` maps to production backend service
2. **Environment-Specific Domains**: Each environment gets its own subdomain (e.g., `ct50-pbr.passkey.com`)
3. **Legacy URL Support**: Production domain supports legacy paths for backward compatibility
4. **SSL Requirement**: All domains must use HTTPS with valid certificates

### Environment Configuration Rules
1. **Account Isolation**: Each environment deploys to separate AWS accounts
2. **Certificate Management**: Each environment uses environment-specific SSL certificates
3. **Configuration Source**: All service endpoints must be retrieved from Hogan
4. **Naming Convention**: Stack names include deployment target and version

### Routing Rules
1. **Path Matching**: `/survey` path routes to backend service `/v1/survey` endpoint
2. **Query Parameter Forwarding**: All query parameters are passed through to backend
3. **Header Preservation**: HTTP headers are forwarded without modification
4. **Response Proxying**: Backend responses are returned without transformation

### Deployment Rules
1. **Version Tagging**: All resources are tagged with version information
2. **Environment Tagging**: Resources include environment and business unit tags
3. **Ephemeral Handling**: CI environments are marked for automatic cleanup
4. **Stack Uniqueness**: Each deployment creates a uniquely named stack

### Security Rules
1. **TLS Minimum**: All endpoints must use TLS 1.2 or higher
2. **Certificate Validation**: SSL certificates must be valid and properly configured
3. **Regional Deployment**: API Gateway must use regional endpoints for security
4. **No Authentication**: Survey endpoints are publicly accessible

### Configuration Management Rules
1. **External Configuration**: Service endpoints must come from Hogan, not hardcoded
2. **Environment Separation**: Each environment has separate configuration
3. **Validation Required**: Configuration must be validated before deployment
4. **Error Handling**: Missing configuration should fail deployment

### Monitoring Rules
1. **CloudWatch Integration**: All API Gateway metrics must be available in CloudWatch
2. **Datadog Monitoring**: Service must be monitored in Datadog with proper service name
3. **Error Tracking**: 4XX and 5XX errors must be tracked and alerted
4. **Performance Monitoring**: Latency metrics must be collected and monitored

## Data Relationships

```
Application
    ├── fetches PBRConfig from Hogan
    ├── creates GatewayStack
    └── applies environment tags

GatewayStack
    ├── creates RestApi
    ├── references Certificate (ACM)
    ├── creates HttpIntegration
    └── outputs DNS configuration

RestApi
    ├── has custom DomainName
    ├── contains Resources (/survey)
    ├── contains Methods (GET)
    └── uses HttpIntegration

HttpIntegration
    └── connects to backend service endpoint
```

## Configuration Flow

```
Deployment Start
    ↓
Environment Entry Point (bin/*.ts)
    ↓
Application.build() - Async Factory
    ↓
Hogan Configuration Fetch
    ↓
PBRConfig Creation
    ↓
Application Constructor
    ↓
GatewayStack Creation
    ↓
AWS Resource Provisioning
    ↓
CloudFormation Stack Deployment
```
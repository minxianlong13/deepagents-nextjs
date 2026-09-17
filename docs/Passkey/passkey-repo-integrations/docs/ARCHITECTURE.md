# Architecture

## System Overview

Passkey Integrations follows a multi-module Java monorepo architecture with two primary services deployed as separate Wildfly applications. The system is designed to handle hotel booking integrations through both direct API access and GroupLink workflow processing.

```
┌─────────────────┐    ┌─────────────────┐
│   Passkey API   │    │  Passkey GL     │
│   (Inbound)     │    │  (GroupLink)    │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌─────────────────┐
         │  Shared Common  │
         │    Library      │
         └─────────────────┘
```

## Components

### Passkey API Service
- **Purpose**: Handles inbound API requests from external hotel systems and partners
- **Location**: `packages/passkey-api/app/`
- **Key Classes**:
  - `AmadeusAPI.java` - Amadeus travel system integration
  - JAX-RS resources in `API-war/src/main/java/com/passkey/api/web/receiver/`
  - EJB business logic in `API-ejb/`
- **Deployment**: Wildfly EAR (Enterprise Archive)

### Passkey GroupLink (GL) Service
- **Purpose**: Manages group booking workflows, hotel communications, and payment processing
- **Location**: `packages/passkey-gl/app/`
- **Key Classes**:
  - `RestService.java` - Main REST service coordinator
  - `GMLResource.java` - Group Management Layer API
  - `InboundTransfersResource.java` - Transfer processing
  - `EmailResource.java` - Email handling
  - `CallbackResource.java` - Webhook callbacks
  - `ARIResource.java` - Availability, Rates, and Inventory
  - `TransformationResource.java` - Data transformation
- **Deployment**: Wildfly EAR (Enterprise Archive)

### Shared Common Library
- **Purpose**: Provides shared utilities, models, and business logic
- **Location**: `packages/passkey-api-gl-common/`
- **Key Classes**:
  - `GMLGLRestClient.java` - Inter-service communication
  - `PBBGatewayClient.java` - Payment gateway integration
  - `CventAuthenticationClient.java` - Authentication services
  - `AccessTokenAuthClient.java` - Token-based authentication

### Parent Module
- **Purpose**: Maven parent POM for dependency management and build configuration
- **Location**: `packages/parent/`
- **Function**: Centralizes version management and build plugins

## Data Flow

### Inbound API Flow
1. **External Request** → Passkey API Service
2. **Authentication** → Cvent Authentication Service
3. **Business Logic** → Shared Common Library
4. **Data Processing** → Domain-specific handlers
5. **Response** → Formatted response to caller

### GroupLink Workflow
1. **Hotel System** → GroupLink Service (via REST/XML)
2. **Data Transformation** → Format conversion and validation
3. **Business Processing** → Reservation/payment logic
4. **External Integration** → Vendor services, payment gateways
5. **Notification** → Email service, callbacks
6. **Audit Logging** → Transfer log service

### Inter-Service Communication
```
API Service ←→ GroupLink Service
     ↓              ↓
  Shared Common Library
     ↓              ↓
External Services (Auth, Vendor, etc.)
```

## Design Patterns

### Enterprise Application Architecture
- **EAR Deployment**: Enterprise Archive packaging for Wildfly
- **EJB Pattern**: Enterprise Java Beans for business logic
- **WAR Modules**: Web Application Archives for REST endpoints
- **JAX-RS Resources**: RESTful web service endpoints

### Service Layer Pattern
- **Resource Layer**: JAX-RS endpoints handle HTTP requests
- **Business Layer**: EJB services contain business logic
- **Integration Layer**: Client classes manage external service calls
- **Data Layer**: Entity classes and data access objects

### Client-Server Integration
- **REST Clients**: HTTP-based service communication
- **Authentication Clients**: Centralized auth token management
- **Gateway Clients**: Payment and vendor system integration

## Module Structure

### Maven Multi-Module Layout
```
passkey-integrations/
├── packages/
│   ├── parent/                    # Maven parent POM
│   ├── passkey-api-gl-common/     # Shared library
│   │   └── core/                  # Core business logic
│   ├── passkey-api/               # API Service
│   │   └── app/
│   │       ├── API-ear/           # Enterprise Archive
│   │       ├── API-ejb/           # Business logic
│   │       ├── API-war/           # Web layer
│   │       └── API-wsr/           # Web service resources
│   └── passkey-gl/                # GroupLink Service
│       └── app/
│           ├── GL-ear/            # Enterprise Archive
│           ├── GL-ejb/            # Business logic
│           └── GL-war/            # Web layer
└── pom.xml                        # Root aggregator POM
```

### Package Organization
- **com.passkey.api**: API service specific classes
- **com.passkey.grouplink**: GroupLink service classes
- **com.passkey.core**: Shared core functionality
- **com.passkey.core.business**: Business logic components
- **com.passkey.core.client**: External service clients

## Deployment Architecture

### Wildfly Application Server
- **Java EE Container**: Full enterprise application support
- **EAR Deployment**: Both services deployed as separate EARs
- **Resource Management**: Connection pools, JMS, security
- **Clustering Support**: Multi-instance deployment capability

### Container Strategy
- **Docker Images**: Containerized deployment support
- **Base Image**: Wildfly with Java 17 runtime
- **Configuration**: Environment-specific property injection
- **Health Checks**: Application readiness and liveness probes

## Integration Points

### Internal Passkey Services
- **Authentication Service**: User and system authentication
- **Vendor Service**: Hotel system integrations
- **Transfer Log Service**: Audit and logging
- **Event Service**: Asynchronous event processing
- **Acknowledgment Service**: Booking confirmations

### External Systems
- **Amadeus**: Global travel technology platform
- **PBB Gateway**: Payment processing system
- **LaunchDarkly**: Feature flag management
- **Hotel PMSs**: Property Management Systems
- **Email Services**: SMTP and email template processing

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: Services can be replicated across instances
- **Load Balancing**: Multiple service instances behind load balancers
- **Database Separation**: Independent data stores per service domain

### Performance Optimization
- **Connection Pooling**: Efficient database and HTTP connections
- **Caching Strategy**: In-memory caching for frequently accessed data
- **Asynchronous Processing**: Non-blocking operations where possible

## Security Architecture

### Authentication Flow
1. **Token Validation**: JWT/OAuth token verification
2. **Service Authentication**: Inter-service authentication
3. **Authorization**: Role-based access control
4. **Audit Logging**: Security event tracking

### Data Protection
- **Encryption**: Sensitive data encryption at rest and in transit
- **PCI Compliance**: Payment data handling standards
- **GDPR Support**: Privacy and data protection compliance
# Architecture

## System Overview

The Passkey GDPR Service follows a multi-module Maven architecture built on Dropwizard framework. It implements a layered architecture pattern with clear separation of concerns between API contracts, business logic, data access, and service orchestration.

```
┌─────────────────────────────────────────────────────────────┐
│                    External Clients                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 JAX-RS Resources                            │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐   │
│  │   Admin     │ │ PasskeyGdpr  │ │ BatchObfuscation    │   │
│  │  Resource   │ │   Resource   │ │     Resource        │   │
│  └─────────────┘ └──────────────┘ └─────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Service Layer                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Business Logic Services                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Data Access Layer                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           MyBatis DAOs & Mappers                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              External Dependencies                          │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐   │
│  │  Oracle DB  │ │  DynamoDB    │ │  GDPR Mask Service  │   │
│  └─────────────┘ └──────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

### passkey-gdpr-api
- **Purpose**: API contracts and data transfer objects
- **Location**: `passkey-gdpr-api/`
- **Key Components**:
  - OpenAPI specifications (`openapi.json`, `openapi.yaml`)
  - Request/Response DTOs
  - API interface definitions

### passkey-gdpr-service
- **Purpose**: Main service implementation and REST endpoints
- **Location**: `passkey-gdpr-service/`
- **Key Classes**:
  - `PasskeyGdprServiceApplication.java` - Main application entry point
  - `PasskeyGdprServiceConfiguration.java` - Service configuration
  - Resources package - JAX-RS REST endpoints
  - Services package - Business logic implementation

### passkey-gdpr-data-access
- **Purpose**: Database access layer and data persistence
- **Location**: `passkey-gdpr-data-access/`
- **Key Components**:
  - MyBatis mappers and DAOs
  - Database entity models
  - SQL mapping files

### passkey-gdpr-shared
- **Purpose**: Common utilities and shared components
- **Location**: `passkey-gdpr-shared/`
- **Key Components**:
  - Utility classes
  - Common constants
  - Shared data models

### passkey-gdpr-java-client
- **Purpose**: Client library for service integration
- **Location**: `passkey-gdpr-java-client/`
- **Key Components**:
  - Service client interfaces
  - Client configuration
  - Integration utilities

### passkey-gdpr-integration-test
- **Purpose**: End-to-end integration testing
- **Location**: `passkey-gdpr-integration-test/`
- **Key Components**:
  - Karate test scenarios
  - Integration test configurations
  - Test data management

## Components

### REST Resources Layer
- **AdminResource**: Administrative operations and service management
- **PasskeyGdprResource**: Core GDPR functionality endpoints
- **BatchObfuscationResource**: Batch processing operations
- **OpenApiResource**: API documentation serving

### Service Layer
- **Business Logic Services**: Core GDPR processing logic
- **Integration Services**: External service communication
- **Validation Services**: Data validation and sanitization

### Data Access Layer
- **MyBatis Integration**: ORM for database operations
- **Connection Management**: Database connection pooling
- **Transaction Management**: ACID compliance for data operations

### Configuration Management
- **Multi-Environment Config**: Environment-specific configurations
- **Feature Flags**: LaunchDarkly integration for feature toggles
- **Security Configuration**: Authentication and authorization setup

## Data Flow

### GDPR Request Processing
1. **Request Reception**: JAX-RS resource receives GDPR request
2. **Authentication**: Auth service validates request credentials
3. **Business Logic**: Service layer processes obfuscation requirements
4. **Data Access**: Repository layer queries and updates data
5. **External Integration**: GDPR mask service performs obfuscation
6. **Response**: Processed result returned to client

### Batch Processing Flow
1. **Batch Initiation**: Admin triggers batch obfuscation process
2. **Queue Management**: DynamoDB stores batch processing state
3. **Parallel Processing**: Multiple workers process data chunks
4. **Progress Tracking**: Real-time status updates via monitoring
5. **Completion Notification**: Results aggregated and reported

## Design Patterns

### Repository Pattern
- Abstracts data access logic from business logic
- Provides consistent interface for data operations
- Enables easy testing with mock implementations

### Service Layer Pattern
- Encapsulates business logic in dedicated service classes
- Promotes code reusability and maintainability
- Facilitates transaction management

### Configuration Pattern
- Externalized configuration for different environments
- Type-safe configuration objects with validation
- Hot-reload capabilities for certain configurations

### Resource Pattern (JAX-RS)
- RESTful API design with proper HTTP semantics
- Clear separation of concerns between resources and services
- Consistent error handling and response formatting

## Security Architecture

### Authentication & Authorization
- Integration with Cvent's auth-service
- JWT token validation for API requests
- Role-based access control for administrative functions

### Data Protection
- Encryption at rest for sensitive data
- Secure communication channels (HTTPS/TLS)
- Audit logging for compliance tracking

## Monitoring & Observability

### Health Checks
- Application health endpoints
- Database connectivity checks
- External service dependency monitoring

### Metrics & Logging
- Structured logging with correlation IDs
- Performance metrics collection
- Error tracking and alerting

### Distributed Tracing
- Request tracing across service boundaries
- Performance bottleneck identification
- End-to-end request flow visualization
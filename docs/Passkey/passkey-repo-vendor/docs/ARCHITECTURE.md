# Architecture

## System Overview

The Passkey Vendor Service follows a multi-module Maven architecture built on the Dropwizard framework. It implements a layered architecture pattern with clear separation between API, service, and data access layers. The service is designed as a RAML-first microservice that provides vendor system management capabilities within the Cvent Passkey ecosystem.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  (Passkey Reservation, Commerce, Housing Library, etc.)    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST API
┌─────────────────────▼───────────────────────────────────────┐
│                 API Gateway / Load Balancer                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Passkey Vendor Service                         │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   API Layer     │  Service Layer  │  Data Layer     │   │
│  │  (Resources)    │   (Business)    │    (DAO/DB)     │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Database                                 │
│              (Vendor System Data)                           │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service is organized into five Maven modules:

### 1. passkey-vendor-api
- **Purpose**: API contracts and data models
- **Location**: `passkey-vendor-api/`
- **Key Components**:
  - RAML API specifications (`src/main/resources/api/`)
  - Domain models (`com.cvent.passkey.vendor.model`)
  - Request/Response DTOs
  - Search criteria classes

### 2. passkey-vendor-service
- **Purpose**: Main service implementation and REST endpoints
- **Location**: `passkey-vendor-service/`
- **Key Components**:
  - JAX-RS Resources (`com.cvent.passkey.vendor.resources`)
  - Service layer (`com.cvent.passkey.vendor.services`)
  - Application configuration (`PasskeyVendorServiceApplication`)
  - Configuration files (`configs/`)

### 3. passkey-vendor-data-access
- **Purpose**: Data persistence and database operations
- **Location**: `passkey-vendor-data-access/`
- **Key Components**:
  - DAO interfaces and implementations
  - Entity classes
  - MyBatis mappers
  - Database DTOs

### 4. passkey-vendor-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-vendor-java-client/`
- **Key Components**:
  - Client interfaces
  - HTTP client implementations
  - Client configuration

### 5. passkey-vendor-integration-test
- **Purpose**: End-to-end integration tests
- **Location**: `passkey-vendor-integration-test/`
- **Key Components**:
  - Karate test scenarios
  - Test data and fixtures
  - Integration test configurations

## Component Architecture

### API Layer (Resources)
- **PasskeyVendorResource**: Main v1 API endpoints
- **PasskeyVendorResourceV2**: Enhanced v2 API endpoints
- **PasskeyMessageTypeResource**: Message type management

**Responsibilities**:
- HTTP request/response handling
- Input validation and sanitization
- Authentication and authorization
- API versioning and backward compatibility

### Service Layer
- **VendorService**: Core business logic for vendor operations
- **MessageTypeService**: Message type management logic

**Responsibilities**:
- Business rule enforcement
- Data transformation and aggregation
- Cross-cutting concerns (logging, metrics)
- Integration with external services

### Data Access Layer
- **VendorDAO**: Database operations for vendor entities
- **MyBatis Mappers**: SQL query definitions

**Responsibilities**:
- Database connectivity and transaction management
- Data persistence and retrieval
- Query optimization and caching

## Data Flow

### Typical Request Flow
1. **Client Request**: External service makes HTTP request to API endpoint
2. **Authentication**: Auth service validates API key and permissions
3. **Resource Layer**: JAX-RS resource validates input and delegates to service
4. **Service Layer**: Business logic processes request and calls data layer
5. **Data Layer**: DAO executes database queries via MyBatis
6. **Response Assembly**: Data is transformed and returned through the layers
7. **Client Response**: JSON response sent back to client

### Search and Filtering Flow
1. Client provides search criteria (hotel ID, vendor system ID, etc.)
2. Service layer validates and sanitizes criteria
3. DAO builds dynamic queries based on criteria
4. Results are filtered and paginated
5. Optional extra data is fetched based on `fetchExtras` parameter

## Design Patterns

### Repository Pattern
- DAO classes abstract database operations
- Service layer interacts with repositories, not direct database access
- Enables easier testing and database technology changes

### Immutable Data Transfer Objects
- Uses Immutables library for generating immutable DTOs
- Ensures thread safety and prevents accidental mutations
- Provides builder patterns for object construction

### Strategy Pattern
- Different transporter implementations for various vendor systems
- Configurable retry strategies based on error types
- Pluggable message type handlers

### Factory Pattern
- Service and DAO instantiation through dependency injection
- Configuration-driven object creation
- Environment-specific implementations

## Security Architecture

### Authentication
- API key-based authentication via Auth Service
- JWT token validation for service-to-service communication
- Role-based access control (RBAC)

### Authorization
- Method-level security annotations
- Resource-level permissions
- Environment-based access restrictions

### Data Protection
- Input sanitization and validation
- SQL injection prevention via parameterized queries
- Sensitive data masking in logs

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables multiple instances
- Load balancer distributes requests across instances
- Database connection pooling for efficient resource usage

### Performance Optimization
- Optional data fetching via `fetchExtras` parameter
- Database query optimization and indexing
- Response caching for frequently accessed data

### Monitoring and Observability
- Dropwizard metrics for performance monitoring
- Structured logging with correlation IDs
- Health checks for service and dependency status

## Integration Points

### Internal Services
- **Auth Service**: Authentication and authorization
- **Passkey Transfer Log**: Audit logging and tracking
- **Passkey Microservices Common**: Shared utilities and configurations

### External Dependencies
- **Database**: Primary data storage
- **Datadog**: Monitoring and alerting
- **Jenkins**: CI/CD pipeline
- **Docker Registry**: Container image storage

## Error Handling

### Exception Hierarchy
- Custom exception types for different error scenarios
- Standardized error response format
- Proper HTTP status code mapping

### Retry Mechanisms
- Configurable retry settings per vendor system
- Different retry strategies for various error types
- Circuit breaker pattern for external service calls

## Configuration Management

### Environment-Specific Configs
- Development, testing, staging, and production configurations
- Environment variable overrides
- Secrets management integration

### Feature Flags
- Runtime configuration changes
- A/B testing capabilities
- Gradual feature rollouts
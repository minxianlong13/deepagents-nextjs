# Architecture

## System Overview

The Passkey Ecommerce Service follows a multi-module Maven architecture built on the Dropwizard framework. It serves as a legacy bridge service, providing synchronous API wrappers around asynchronous PBB (Passkey Business Backend) operations for backward compatibility with existing Commerce systems.

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│  Legacy         │    │  Passkey Ecommerce   │    │  PBB / Payment  │
│  Commerce       │───▶│  Service             │───▶│  Services       │
│  Systems        │    │  (Bridge Layer)      │    │                 │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────────┐
                       │  Cvent Payment       │
                       │  Gateway             │
                       └──────────────────────┘
```

## Module Structure

The service is organized as a Maven multi-module project:

### passkey-ecommerce-api
- **Purpose**: API contracts and OpenAPI specifications
- **Location**: `/passkey-ecommerce-api`
- **Key Files**:
  - `openapi.json` - OpenAPI 3.0 specification
  - `openapi.yaml` - YAML format API specification

### passkey-ecommerce-service
- **Purpose**: Main service implementation with REST resources
- **Location**: `/passkey-ecommerce-service`
- **Key Classes**:
  - `PasskeyEcommerceServiceApplication` - Dropwizard application entry point
  - `PasskeyEcommerceServiceConfiguration` - Service configuration
  - `AdminResource` - Administrative endpoints
  - `OrchestratedEcommerceResource` - Orchestrated payment operations
  - `PaymentGateResource` - Payment gateway integration

### passkey-ecommerce-data-access
- **Purpose**: Database access layer and data persistence
- **Location**: `/passkey-ecommerce-data-access`
- **Responsibilities**:
  - Database connection management
  - Data access objects (DAOs)
  - Transaction handling

### passkey-ecommerce-shared
- **Purpose**: Common utilities and shared components
- **Location**: `/passkey-ecommerce-shared`
- **Contains**:
  - Exception classes
  - Constants and enums
  - Utility functions
  - Logging utilities

### passkey-ecommerce-java-client
- **Purpose**: Java client library for service consumers
- **Location**: `/passkey-ecommerce-java-client`
- **Provides**: Type-safe client for external service integration

### passkey-ecommerce-integration-test
- **Purpose**: Integration test suite
- **Location**: `/passkey-ecommerce-integration-test`
- **Contains**: End-to-end test scenarios

## Components

### REST Layer
- **JAX-RS Resources**: Handle HTTP requests and responses
- **Authentication**: Integrated with auth-service for security
- **Validation**: Request/response validation using Bean Validation
- **Exception Handling**: Centralized error handling and mapping

### Service Layer
- **Business Logic**: Core ecommerce operations
- **Integration Logic**: Orchestration with external services
- **Transaction Management**: Ensures data consistency
- **Async-to-Sync Bridging**: Converts asynchronous PBB calls to synchronous responses

### Client Layer
- **Retrofit Clients**: HTTP clients for external service communication
- **Payment Gateway**: Integration with Cvent Payment API
- **Auth Service**: Authentication and authorization calls
- **PBB Integration**: Communication with Passkey Business Backend

### Data Layer
- **MyBatis**: SQL mapping framework
- **Connection Pooling**: Tomcat JDBC connection pool
- **Oracle Database**: Primary data store
- **Transaction Management**: Database transaction handling

## Data Flow

### Payment Processing Flow
1. **Request Reception**: Legacy Commerce system sends payment request
2. **Authentication**: Validate request using auth-service
3. **Business Logic**: Process payment rules and validations
4. **PBB Communication**: Make asynchronous calls to PBB services
5. **Synchronization**: Wait for and aggregate PBB responses
6. **Response**: Return synchronous response to caller

### Admin Operations Flow
1. **Admin Request**: Administrative operation request
2. **Authorization**: Verify admin permissions
3. **Operation Execution**: Perform requested admin function
4. **Audit Logging**: Log administrative actions
5. **Response**: Return operation results

## Design Patterns

### Repository Pattern
- Data access abstraction through DAO interfaces
- Separation of business logic from data persistence
- Testability through mock implementations

### Service Layer Pattern
- Business logic encapsulation in service classes
- Transaction boundary management
- Cross-cutting concern handling

### Bridge Pattern
- Legacy system compatibility through API bridging
- Async-to-sync operation conversion
- Protocol translation between systems

### Configuration Pattern
- Environment-specific configuration management
- Externalized configuration through YAML files
- Secret management through environment variables

## Integration Points

### External Dependencies
- **auth-service**: Authentication and authorization
- **cvent-payment-api**: Payment processing
- **PBB Services**: Passkey Business Backend operations
- **Oracle Database**: Data persistence

### Internal Dependencies
- **passkey-payment-service**: Primary payment processing
- **passkey-commerce**: Legacy commerce operations
- **passkey-microservices-common**: Shared utilities

## Scalability Considerations

- **Stateless Design**: Service instances can be horizontally scaled
- **Connection Pooling**: Efficient database connection management
- **Async Processing**: Non-blocking operations where possible
- **Circuit Breakers**: Fault tolerance for external service calls

## Security Architecture

- **API Key Authentication**: Service-to-service authentication
- **Request Validation**: Input sanitization and validation
- **Audit Logging**: Security event tracking
- **Secret Management**: Environment-based secret injection
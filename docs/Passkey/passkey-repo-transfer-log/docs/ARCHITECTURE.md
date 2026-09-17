# Architecture

## System Overview

The Passkey Transfer Log Service follows a multi-module Maven architecture pattern typical of Cvent's Dropwizard-based microservices. The service is designed as a layered application with clear separation of concerns, providing RESTful APIs for managing hotel reservation transfer operations within the Passkey ecosystem.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
├─────────────────────────────────────────────────────────────┤
│                     Load Balancer                           │
├─────────────────────────────────────────────────────────────┤
│              Passkey Transfer Log Service                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   REST API  │ │ Business    │ │   Data Access       │   │
│  │   Layer     │ │ Logic       │ │   Layer             │   │
│  │             │ │ Layer       │ │                     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Oracle Database                          │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service is organized into five distinct Maven modules:

### 1. passkey-transfer-log-api
- **Purpose**: Defines the public API contracts and data models
- **Location**: `passkey-transfer-log-api/`
- **Key Components**:
  - Request/Response DTOs
  - API interfaces
  - Data transfer objects
  - Validation annotations

### 2. passkey-transfer-log-service
- **Purpose**: Main service implementation with REST endpoints and business logic
- **Location**: `passkey-transfer-log-service/`
- **Key Components**:
  - `PasskeyTransferLogApplication.java` - Main Dropwizard application
  - REST Resource classes (`*Resource.java`)
  - Service layer implementations
  - Configuration classes
  - Exception handlers

### 3. passkey-transfer-log-data-access
- **Purpose**: Database access layer and data persistence
- **Location**: `passkey-transfer-log-data-access/`
- **Key Components**:
  - DAO (Data Access Object) implementations
  - Database entity mappings
  - SQL queries and database operations
  - Connection management

### 4. passkey-transfer-log-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-transfer-log-java-client/`
- **Key Components**:
  - Client interfaces and implementations
  - HTTP client configurations
  - Service discovery integration
  - Client-side DTOs

### 5. passkey-transfer-log-integration-test
- **Purpose**: End-to-end integration testing
- **Location**: `passkey-transfer-log-integration-test/`
- **Key Components**:
  - Karate-based API tests
  - Test data setup and teardown
  - Environment-specific test configurations

## Component Architecture

### REST API Layer
The service exposes multiple REST resources, each handling specific domain areas:

- **PasskeyTransferLogResource**: Core transfer logging operations
- **PasskeyReservationResource**: Reservation-specific transfer operations
- **PasskeyTransferDefinitionResource**: Transfer configuration management
- **PasskeyTransferHistoryResource**: Historical transfer data
- **PasskeyTransferResultResource**: Transfer result management (v2 API)
- **PasskeyMappingRulesResource**: Transfer mapping configurations
- **PasskeyExternalReservationResource**: External reservation integration

### Business Logic Layer
Service classes implement the core business logic:
- Transfer state management
- Reservation search and filtering
- Transfer validation and processing
- History tracking and audit trails
- Mapping rule application

### Data Access Layer
DAO pattern implementation for database operations:
- Oracle database connectivity
- CRUD operations for transfer entities
- Complex queries for transfer analytics
- Transaction management

## Data Flow

### Typical Transfer Operation Flow

1. **Transfer Definition Setup**
   ```
   Client → Transfer Definition Resource → Service Layer → DAO → Database
   ```

2. **Reservation Transfer Processing**
   ```
   Client → Reservation Resource → Transfer Service → 
   Reservation DAO → Database → Transfer State Generation
   ```

3. **Transfer History Tracking**
   ```
   Transfer Operation → History Service → History DAO → 
   Database → Audit Trail Creation
   ```

## Design Patterns

### Repository Pattern
- DAO classes abstract database access
- Clean separation between business logic and data persistence
- Testable data access layer

### Service Layer Pattern
- Business logic encapsulated in service classes
- Transaction boundaries defined at service level
- Reusable business operations

### Resource Pattern (JAX-RS)
- REST endpoints defined as resource classes
- HTTP method mapping with annotations
- Request/response handling and validation

### Dependency Injection
- Dropwizard's built-in DI container
- Constructor-based injection
- Configuration injection

## Integration Points

### External Dependencies
- **Auth Service**: Authentication and authorization
- **Oracle Database**: Primary data storage
- **Passkey Common Libraries**: Shared utilities and components
- **Notification Services**: Event notifications

### Internal Communication
- Synchronous REST API calls
- Database transactions for consistency
- Event-driven notifications for state changes

## Security Architecture

### Authentication
- Integration with Cvent's auth-service
- JWT token validation
- Role-based access control

### Authorization
- Endpoint-level security annotations
- Resource-based permissions
- User context propagation

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Load balancer compatible
- Database connection pooling

### Performance Optimization
- Efficient database queries
- Connection pooling
- Caching strategies for frequently accessed data

### Monitoring and Observability
- Dropwizard metrics integration
- Datadog APM monitoring
- Structured logging for debugging

## Configuration Management

### Environment-Specific Configs
- Development: `configs/dev.yaml`
- Staging: Environment-specific configurations
- Production: Secure configuration management

### Configuration Categories
- Database connection settings
- Authentication service endpoints
- Logging levels and appenders
- Performance tuning parameters
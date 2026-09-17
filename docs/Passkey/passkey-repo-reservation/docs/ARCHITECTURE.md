# Architecture

## System Overview

The Passkey Reservation Service follows a multi-module Maven architecture built on Dropwizard framework. It implements a layered architecture pattern with clear separation of concerns between API, business logic, data access, and integration layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 REST API Layer                              │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │ Group Booking   │ Reservation     │ Admin           │    │
│  │ Resources       │ Resources       │ Resources       │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Service Layer                                │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │ Reservation     │ Group Booking   │ Waitlist        │    │
│  │ Service         │ Service         │ Service         │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Data Access Layer                              │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │ Reservation     │ Attendee        │ Room            │    │
│  │ DAO             │ DAO             │ DAO             │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Database                                   │
│                 (Oracle)                                    │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service is organized into six Maven modules:

### passkey-reservation-api
- **Purpose**: API contracts and OpenAPI specifications
- **Location**: `passkey-reservation-api/`
- **Key Components**:
  - OpenAPI specification (`openapi.json`, `openapi.yaml`)
  - API model definitions
  - Request/Response DTOs

### passkey-reservation-service
- **Purpose**: Main service implementation and REST endpoints
- **Location**: `passkey-reservation-service/`
- **Key Components**:
  - `PasskeyReservationServiceApplication` - Main application class
  - REST Resources (JAX-RS endpoints)
  - Service configuration
  - Exception mappers

### passkey-reservation-data-access
- **Purpose**: Database access layer and data persistence
- **Location**: `passkey-reservation-data-access/`
- **Key Components**:
  - DAO implementations
  - Database entities
  - SQL queries and stored procedures
  - Database migrations

### passkey-reservation-shared
- **Purpose**: Shared utilities and common components
- **Location**: `passkey-reservation-shared/`
- **Key Components**:
  - Common utilities
  - Shared constants
  - Helper classes

### passkey-reservation-java-client
- **Purpose**: Java client library for external consumers
- **Location**: `passkey-reservation-java-client/`
- **Key Components**:
  - Client interfaces
  - HTTP client implementations
  - Client configuration

### passkey-reservation-integration-test
- **Purpose**: Integration tests and test utilities
- **Location**: `passkey-reservation-integration-test/`
- **Key Components**:
  - End-to-end tests
  - Test configurations
  - Test data setup

## Data Flow

### Reservation Creation Flow
1. **Client Request** → REST API endpoint receives reservation request
2. **Validation** → Request validation and authentication
3. **Business Logic** → Service layer processes business rules
4. **External Services** → Calls to inventory, payment, and event services
5. **Data Persistence** → Reservation data stored in database
6. **Event Publishing** → Reservation events published for downstream consumers
7. **Response** → Confirmation returned to client

### Orchestrated Reservation Flow
1. **Saga Initiation** → Reservation Saga orchestrates complex workflows
2. **Service Coordination** → Multiple services coordinated through saga pattern
3. **Compensation** → Rollback mechanisms for failed transactions
4. **Final State** → Consistent final state across all services

## Design Patterns

### Repository Pattern
- Data access abstracted through DAO interfaces
- Clean separation between business logic and data persistence
- Testable data access layer

### Service Layer Pattern
- Business logic encapsulated in service classes
- Transaction boundaries defined at service level
- Clear separation of concerns

### Resource Pattern (JAX-RS)
- REST endpoints implemented as resource classes
- HTTP concerns separated from business logic
- Consistent API structure

### Client Pattern
- External service integrations through client interfaces
- Retry and circuit breaker patterns for resilience
- Configuration-driven service discovery

## Integration Architecture

### Synchronous Integrations
- **Auth Service**: Authentication and authorization
- **Passkey Hotel Service**: Hotel configuration and details
- **Passkey Inventory Service**: Room availability and inventory
- **Payments Wallet Service**: Payment processing

### Asynchronous Integrations
- **Passkey Event Service**: Event publishing and notifications
- **Passkey Acknowledgment Service**: Confirmation handling

### Orchestration
- **Passkey Reservation Saga**: Complex workflow orchestration
- **Event-driven coordination**: Saga pattern implementation

## Security Architecture

### Authentication
- JWT token-based authentication through Auth Service
- API key authentication for service-to-service communication

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- Admin-specific endpoints with elevated privileges

### Data Protection
- Sensitive data encryption at rest
- PCI compliance for payment data
- GDPR compliance for personal data

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables horizontal scaling
- Load balancing across multiple instances
- Database connection pooling with HikariCP

### Caching Strategy
- Application-level caching for frequently accessed data
- Database query optimization
- External service response caching

### Performance Optimization
- Asynchronous processing for non-critical operations
- Bulk operations for batch processing
- Database indexing strategy

## Monitoring and Observability

### Metrics
- Application metrics through Dropwizard Metrics
- Custom business metrics
- Performance monitoring

### Logging
- Structured logging with correlation IDs
- Centralized log aggregation
- Error tracking and alerting

### Health Checks
- Application health endpoints
- Database connectivity checks
- External service dependency checks

## Technology Stack

- **Framework**: Dropwizard 4.0.x
- **Language**: Java 17
- **Build Tool**: Maven 3.x
- **Database**: Oracle Database
- **Connection Pool**: HikariCP
- **HTTP Client**: Retrofit2
- **Validation**: Hibernate Validator
- **Mapping**: MapStruct
- **Testing**: JUnit, Mockito
- **Documentation**: OpenAPI 3.0
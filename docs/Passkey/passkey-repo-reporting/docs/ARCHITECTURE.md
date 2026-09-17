# Architecture

## System Overview

The Passkey Reporting Service follows a layered architecture pattern built on the Dropwizard framework. It serves as a dedicated reporting and analytics service within the Passkey ecosystem, aggregating data from various sources to provide comprehensive reporting capabilities for hotels and event organizers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (Hotels, Organizers, Admin Tools)              │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS/REST API
┌─────────────────────────▼───────────────────────────────────┐
│                  API Gateway / Load Balancer                │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Passkey Reporting Service                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │   Resources     │ │    Services     │ │     Cache     │  │
│  │   (REST API)    │ │  (Business      │ │   (Redis)     │  │
│  │                 │ │   Logic)        │ │               │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │  Configuration  │ │   Data Access   │ │  Health       │  │
│  │                 │ │                 │ │  Checks       │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                External Dependencies                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │  Auth Service   │ │  Passkey Core   │ │   Database    │  │
│  │                 │ │   Services      │ │   Systems     │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components

### API Layer (Resources)
- **Purpose**: Handles HTTP requests and responses, input validation, and authentication
- **Location**: `passkey-reporting-service/src/main/java/com/cvent/passkeyreporting/resources/`
- **Key Classes**:
  - `BookingsReportResource` - Booking data endpoints
  - `EventsReportResource` - Event reporting endpoints
  - `RevenueReportResource` - Revenue analytics endpoints
  - `EventStatisticsResource` - Statistical data endpoints
  - `EventPaceDataResource` - Event pace analytics
  - `IncrementalRevenueReportResource` - Incremental revenue calculations
  - `ReservationMethodReportResource` - Reservation method analytics
  - `RootResource` - Service metadata and health endpoints

### Service Layer
- **Purpose**: Contains business logic, data processing, and orchestration
- **Location**: `passkey-reporting-service/src/main/java/com/cvent/passkeyreporting/service/`
- **Key Classes**:
  - `ReservationsReportService` - Core reporting business logic
  - `ValidationService` - Input validation and business rule enforcement

### Data Access Layer
- **Purpose**: Handles data retrieval and persistence operations
- **Location**: `passkey-reporting-data-access/`
- **Key Responsibilities**:
  - Database connectivity and query execution
  - Data transformation and mapping
  - Connection pooling and transaction management

### Configuration Layer
- **Purpose**: Manages application configuration and environment-specific settings
- **Location**: `passkey-reporting-service/src/main/java/com/cvent/passkeyreporting/configuration/`
- **Key Components**:
  - Environment-specific YAML configurations
  - Database connection settings
  - Authentication configuration
  - Caching configuration

### Caching Layer
- **Purpose**: Improves performance through intelligent data caching
- **Location**: `passkey-reporting-service/src/main/java/com/cvent/passkeyreporting/cache/`
- **Implementation**: Redis-based caching with configurable TTL

### Utility Layer
- **Purpose**: Common utilities and helper functions
- **Location**: `passkey-reporting-service/src/main/java/com/cvent/passkeyreporting/util/`
- **Key Classes**:
  - `LocalDateWrapper` - Date handling utilities
  - `MetadataUtil` - Authentication metadata processing

## Data Flow

### Typical Request Flow

1. **Authentication**: Client sends request with Bearer token or API key
2. **Authorization**: Auth service validates credentials and returns metadata
3. **Validation**: Input parameters are validated against business rules
4. **Cache Check**: System checks if requested data is available in cache
5. **Data Retrieval**: If cache miss, data is fetched from underlying data sources
6. **Processing**: Raw data is processed and transformed according to business logic
7. **Response**: Formatted response is returned to client
8. **Caching**: Results are cached for future requests

### Data Sources

The service aggregates data from multiple sources:
- **Booking Systems**: Reservation and booking data
- **Event Management**: Event details and configurations
- **Financial Systems**: Revenue and payment information
- **User Management**: Participant and organization data

## Design Patterns

### Repository Pattern
- Data access is abstracted through repository interfaces
- Enables easy testing and data source switching
- Separates business logic from data access concerns

### Service Layer Pattern
- Business logic is encapsulated in service classes
- Promotes code reuse and maintainability
- Enables transaction management and cross-cutting concerns

### Dependency Injection
- Uses Dropwizard's built-in DI container
- Promotes loose coupling and testability
- Configured through the main application class

### Exception Handling
- **Location**: `passkey-reporting-service/src/main/java/com/cvent/passkeyreporting/exception/`
- **Pattern**: Custom exception hierarchy with global exception mappers
- **Implementation**: JAX-RS exception mappers for consistent error responses

## Module Structure

### Multi-Module Maven Project

```
passkey-reporting/
├── passkey-reporting-parent/           # Parent POM with shared configuration
├── passkey-reporting-api/              # API contracts and models
├── passkey-reporting-service/          # Main service implementation
├── passkey-reporting-data-access/      # Data access layer
├── passkey-reporting-shared/           # Shared utilities and models
├── passkey-reporting-java-client/      # Java client library
├── passkey-reporting-integration-test/ # Integration tests
└── passkey-reporting-service-test/     # Service-level tests
```

### Module Dependencies

```
passkey-reporting-service
├── depends on: passkey-reporting-api
├── depends on: passkey-reporting-data-access
├── depends on: passkey-reporting-shared
└── depends on: external libraries (Dropwizard, Auth Service, etc.)

passkey-reporting-java-client
├── depends on: passkey-reporting-api
└── depends on: passkey-reporting-shared

passkey-reporting-integration-test
├── depends on: passkey-reporting-service
└── depends on: test frameworks (Karate, JUnit)
```

## Security Architecture

### Authentication Methods
- **API Key Authentication**: Preferred method for service-to-service communication
- **Bearer Token Authentication**: Legacy method (deprecated, will be removed)

### Authorization
- Role-based access control through Auth Service integration
- Participant-based data filtering (hotels can only see their data)
- Event category-based access restrictions

### Data Security
- All communication over HTTPS
- Sensitive data is not logged
- Database connections use encrypted channels
- API keys and tokens are validated on every request

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables easy horizontal scaling
- Load balancing across multiple instances
- Database connection pooling for efficient resource usage

### Caching Strategy
- Redis-based distributed caching
- Configurable cache TTL based on data volatility
- Cache invalidation strategies for data consistency

### Performance Optimization
- Lazy loading of data where appropriate
- Efficient database queries with proper indexing
- Asynchronous processing for non-critical operations

## Monitoring and Observability

### Health Checks
- **Location**: `passkey-reporting-service/src/main/java/com/cvent/passkeyreporting/health/`
- Database connectivity checks
- External service dependency checks
- Cache availability checks

### Logging
- Structured logging with correlation IDs
- Different log levels for different environments
- Integration with centralized logging systems

### Metrics
- Dropwizard metrics integration
- Custom business metrics
- Performance monitoring and alerting
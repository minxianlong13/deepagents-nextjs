# Architecture

## System Overview

The Passkey Business Text Service follows a multi-module Maven architecture using the Dropwizard framework. It implements a layered architecture pattern with clear separation of concerns between API, service, and data access layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│           (Passkey Frontend, Other Services)                │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST API
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 API Gateway / Load Balancer                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Passkey Business Text Service                  │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   Resources     │    Services     │  Data Access    │    │
│  │   (JAX-RS)      │   (Business)    │     (DAO)       │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Oracle Database                            │
│              (Business Text Storage)                        │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service is organized into five Maven modules:

### passkey-business-text-api
- **Purpose**: Defines the public API contracts and data models
- **Location**: `passkey-business-text-api/`
- **Key Classes**:
  - `BusinessText` - Core business text entity
  - `BusinessTextElement` - Element for ID generation
  - `Locale` - Locale information model
  - `Country` - Country information model
  - Various element types (Attendee, Campaign, Hotel, etc.)

### passkey-business-text-service
- **Purpose**: Main service implementation with REST endpoints
- **Location**: `passkey-business-text-service/`
- **Key Classes**:
  - `PasskeyBusinessTextServiceApplication` - Dropwizard application entry point
  - `BusinessTextResource` - Main REST resource
  - `LocaleResource` - Locale management endpoints
  - `CountryResource` - Country information endpoints
  - `CustomBusinessTextResource` - Custom text overrides
  - `BusinessTextService` - Core business logic

### passkey-business-text-data-access
- **Purpose**: Data access layer with database operations
- **Location**: `passkey-business-text-data-access/`
- **Key Classes**:
  - `BusinessTextDataAccess` - Main data access operations
  - `LocaleDataAccess` - Locale data operations
  - `CountryDataAccess` - Country data operations
  - `CustomBusinessTextDataAccess` - Custom text data operations

### passkey-business-text-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-business-text-java-client/`
- **Key Classes**:
  - `PasskeyBusinessTextClient` - Client interface
  - `PasskeyBusinessTextClientFactory` - Client factory

### passkey-business-text-integration-test
- **Purpose**: Integration tests using Karate framework
- **Location**: `passkey-business-text-integration-test/`
- **Key Components**:
  - Karate test scenarios
  - Test configuration files

## Components

### REST Layer (Resources)
- **Purpose**: Handles HTTP requests and responses
- **Location**: `passkey-business-text-service/src/main/java/.../resources/`
- **Key Classes**:
  - `BusinessTextResource` - Main business text operations
  - `LocaleResource` - Locale management
  - `CountryResource` - Country information
  - `CustomBusinessTextResource` - Custom text handling
  - `OpenApiResource` - API documentation

### Service Layer
- **Purpose**: Contains business logic and orchestration
- **Location**: `passkey-business-text-service/src/main/java/.../services/`
- **Key Classes**:
  - `BusinessTextService` - Core business operations
  - `LocaleService` - Locale management logic
  - `CountryService` - Country information logic

### Data Access Layer
- **Purpose**: Database operations and data persistence
- **Location**: `passkey-business-text-data-access/src/main/java/.../dataaccess/`
- **Key Classes**:
  - `BusinessTextDataAccess` - CRUD operations for business text
  - `LocaleDataAccess` - Locale data operations
  - `CountryDataAccess` - Country data operations

## Data Flow

### Business Text Retrieval Flow
1. Client sends GET request to `/passkey-business-text/v1/business-text`
2. `BusinessTextResource` validates request parameters
3. `BusinessTextService` processes the request
4. `BusinessTextDataAccess` queries the Oracle database
5. Results are transformed and returned through the layers
6. JSON response sent back to client

### Business Text Creation Flow
1. Client sends POST request with business text data
2. API key authentication is validated
3. Request payload is validated using Bean Validation
4. `BusinessTextService` processes the business logic
5. `BusinessTextDataAccess` persists data to database
6. Success/error response returned to client

### Bulk Operations Flow
1. Client sends bulk request with multiple business text entries
2. Service processes entries in batches
3. Database operations are performed efficiently
4. Consolidated response returned

## Design Patterns

### Repository Pattern
- Data access classes act as repositories
- Abstracts database operations from business logic
- Enables easier testing and maintenance

### Service Layer Pattern
- Business logic is centralized in service classes
- Resources delegate to services for processing
- Clear separation between HTTP handling and business logic

### Immutable Objects Pattern
- Domain models use Immutables library
- Thread-safe and predictable data structures
- Reduces bugs related to object mutation

### Factory Pattern
- Client factory for creating service clients
- Configuration factory for application setup
- Promotes loose coupling and testability

### Exception Mapping Pattern
- Custom exception mappers for consistent error responses
- Centralized error handling
- Proper HTTP status code mapping

## Security Architecture

### Authentication
- API key-based authentication using `@Authority` annotation
- Integration with auth-service for key validation
- All endpoints require valid API keys

### Authorization
- Method-level security using `AuthMethod.API_KEY`
- Granted API key validation for each request
- Private API visibility (internal use only)

## Configuration Management

### Environment-Specific Configs
- `configs/dev.yaml` - Development environment
- `configs/staging.yaml` - Staging environment  
- `configs/prod.yaml` - Production environment

### Configuration Structure
- Database connection settings
- Logging configuration
- Health check settings
- Metrics and monitoring setup

## Monitoring and Observability

### Health Checks
- `PasskeyBusinessTextHealthCheck` - Service health monitoring
- Database connectivity checks
- Dependency health validation

### Metrics
- Dropwizard metrics integration
- Request/response metrics
- Database operation metrics
- Custom business metrics

### Logging
- Structured logging using Logback
- Request/response logging
- Error and exception logging
- Performance monitoring logs

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Load balancer compatible
- Database connection pooling

### Performance Optimization
- Bulk operations for efficiency
- Database query optimization
- Caching strategies (future enhancement)

### Resource Management
- Connection pool management
- Memory usage optimization
- Thread pool configuration
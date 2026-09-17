# Architecture

## System Overview

The Passkey Housing Library Service follows a multi-module Maven architecture built on Dropwizard framework. It implements a layered architecture pattern with clear separation between API contracts, business logic, and data access layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                 JAX-RS Resources                            │
│  EventTemplates │ Images │ Participant │ RoomCategory │     │
│                 │        │             │ RoomLibrary  │     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Service Layer                               │
│  Business Logic │ Validation │ Orchestration │ Mapping     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Data Access Layer                           │
│      DAOs       │    Entities    │     Mappers             │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Oracle Database                             │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

### passkey-housing-library-api
- **Purpose**: API contracts and data transfer objects
- **Location**: `passkey-housing-library-api/`
- **Key Components**:
  - Request/Response models
  - Domain entities (Room, Bed, EventTemplate, etc.)
  - API interfaces and contracts

### passkey-housing-library-service
- **Purpose**: Main application and REST endpoints
- **Location**: `passkey-housing-library-service/`
- **Key Components**:
  - `PasskeyHousingLibraryServiceApplication` - Main Dropwizard application
  - `PasskeyHousingLibraryServiceConfiguration` - Service configuration
  - JAX-RS Resources (EventTemplatesResource, ImagesResource, etc.)
  - Service layer implementations
  - Health checks and providers

### passkey-housing-library-data-access
- **Purpose**: Database access and entity management
- **Location**: `passkey-housing-library-data-access/`
- **Key Components**:
  - JPA Entities
  - Data Access Objects (DAOs)
  - Database mappers and converters

### passkey-housing-library-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-housing-library-java-client/`
- **Key Components**:
  - Client interfaces
  - HTTP client implementations
  - Request/response handling

### passkey-housing-library-integration-test
- **Purpose**: End-to-end integration tests
- **Location**: `passkey-housing-library-integration-test/`
- **Key Components**:
  - Karate-based API tests
  - Test configurations
  - Test data management

### passkey-housing-library-load-test
- **Purpose**: Performance and load testing
- **Location**: `passkey-housing-library-load-test/`
- **Key Components**:
  - Load test scenarios
  - Performance benchmarks

## Components

### REST Resources Layer
- **EventTemplatesResource**: Manages event template operations
- **ImagesResource**: Handles image upload, retrieval, and metadata management
- **ParticipantResource**: Manages participant profile settings
- **RoomCategoryResource**: Handles room category operations
- **RoomLibraryResource**: Manages room library data
- **StubResource**: Basic health check endpoint

### Service Layer
- Business logic implementation
- Data validation and transformation
- Integration with external services
- Error handling and logging

### Data Access Layer
- JPA-based entity management
- Custom DAO implementations
- Database query optimization
- Transaction management

## Data Flow

### Typical Request Flow
1. **Client Request**: HTTP request received by JAX-RS resource
2. **Authentication**: Request validated through Auth Service integration
3. **Resource Processing**: Resource delegates to service layer
4. **Business Logic**: Service layer applies business rules and validation
5. **Data Access**: DAO layer queries/updates database
6. **Response Mapping**: Data mapped to response DTOs
7. **HTTP Response**: JSON response returned to client

### Image Upload Flow
1. **Multipart Upload**: Client uploads image via ImagesResource
2. **Validation**: File type, size, and metadata validation
3. **Storage**: Image stored in configured storage system
4. **Metadata**: Image metadata persisted to database
5. **Response**: Image URL and metadata returned

## Design Patterns

### Repository Pattern
- DAOs abstract database access
- Clean separation between business logic and data persistence
- Testable data access layer

### Service Layer Pattern
- Business logic encapsulated in service classes
- Transaction boundaries defined at service level
- Reusable business operations

### DTO Pattern
- Clear API contracts with request/response objects
- Data transformation between layers
- Version compatibility management

### Dependency Injection
- Dropwizard's built-in DI container
- Constructor-based injection
- Configuration injection

## Configuration Management

### Environment-Specific Configs
- `dev.yaml` - Local development
- `staging.yaml` - Staging environment
- `production.yaml` - Production environment

### Configuration Sources
- YAML configuration files
- Environment variables
- System properties
- External configuration management (Hogan)

## Security Architecture

### Authentication
- Integration with Cvent Auth Service
- JWT token validation
- API key authentication for service-to-service calls

### Authorization
- Role-based access control
- Resource-level permissions
- Organization-based data isolation

## Observability

### Monitoring
- Dropwizard metrics integration
- Custom business metrics
- Health check endpoints

### Logging
- Structured logging with SLF4J
- Request/response logging
- Error tracking and alerting

### Distributed Tracing
- Request correlation IDs
- Service call tracing
- Performance monitoring
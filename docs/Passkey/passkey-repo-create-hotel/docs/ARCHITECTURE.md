# Architecture

## System Overview

The Passkey Create Hotel Service is built using a multi-module Maven architecture with Dropwizard framework. It follows a layered architecture pattern with clear separation between API, business logic, and data access layers. The service integrates with external Passkey services and provides both standard and administrative endpoints for hotel management.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                 API Gateway / Load Balancer                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│            Passkey Create Hotel Service                     │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   Resources     │    Services     │  Data Access    │   │
│  │   (REST API)    │ (Business Logic)│   (Database)    │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              External Service Dependencies                   │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │ Passkey Hotel   │ Business Text   │  Auth Service   │   │
│  │    Service      │    Service      │                 │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

### passkey-create-hotel-api
- **Purpose**: Defines API contracts and data models
- **Location**: `passkey-create-hotel-api/`
- **Key Components**:
  - OpenAPI specifications (`openapi.yaml`, `openapi.json`)
  - Data transfer objects and request/response models
  - API documentation generation

### passkey-create-hotel-service
- **Purpose**: Core service implementation with business logic
- **Location**: `passkey-create-hotel-service/`
- **Key Classes**:
  - `PasskeyCreateHotelServiceApplication.java` - Main application entry point
  - `PasskeyCreateHotelServiceConfiguration.java` - Service configuration
  - `CreateHotelResource.java` - Primary REST endpoint
  - `AdminResource.java` - Administrative operations
  - `CreateHotelService.java` - Core business logic
  - `ParticipantService.java` - Participant management
  - `DeleteHotelService.java` - Hotel deletion operations

### passkey-create-hotel-data-access
- **Purpose**: Database operations and data persistence
- **Location**: `passkey-create-hotel-data-access/`
- **Key Components**:
  - Database access objects (DAOs)
  - Entity mappings
  - Database connection management

### passkey-create-hotel-java-client
- **Purpose**: Client library for service integration
- **Location**: `passkey-create-hotel-java-client/`
- **Key Components**:
  - HTTP client implementation
  - Service interface definitions
  - Client configuration

### passkey-create-hotel-shared
- **Purpose**: Shared utilities and common code
- **Location**: `passkey-create-hotel-shared/`
- **Key Components**:
  - Common utilities
  - Shared constants
  - Helper classes

### passkey-create-hotel-integration-test
- **Purpose**: End-to-end integration testing
- **Location**: `passkey-create-hotel-integration-test/`
- **Key Components**:
  - Integration test suites
  - Test data management
  - Environment-specific test configurations

## Component Architecture

### REST Layer (Resources)
```
CreateHotelResource
├── POST /passkey-create-hotel/v1
│   ├── Authentication: API Key
│   ├── Input: HotelSettings
│   └── Output: HotelInfo (201) | ErrorResponse (400)

AdminResource
├── POST /passkey-create-hotel/v1/admin
│   ├── Input: AutomationHotel
│   └── Output: HotelInfo (201)
└── DELETE /passkey-create-hotel/v1/admin/{participantId}
    └── Output: 204 No Content
```

### Service Layer
```
CreateHotelService
├── createHotel(HotelSettings) → Optional<HotelInfo>
├── validateHotelSettings()
├── integrateWithExternalServices()
└── persistHotelData()

ParticipantService
├── manageParticipantData()
└── handleParticipantOperations()

DeleteHotelService
├── deleteHotel(participantId)
└── cleanupRelatedData()
```

### Data Flow

1. **Hotel Creation Request**:
   ```
   Client → API Gateway → CreateHotelResource → CreateHotelService
   ```

2. **External Service Integration**:
   ```
   CreateHotelService → Passkey Hotel Service (hotel validation)
   CreateHotelService → Business Text Service (localization)
   ```

3. **Data Persistence**:
   ```
   CreateHotelService → Data Access Layer → Database
   ```

4. **Response Flow**:
   ```
   Database → Data Access → Service → Resource → Client
   ```

## Design Patterns

### Repository Pattern
- Data access is abstracted through repository interfaces
- Clean separation between business logic and data persistence
- Testable data access layer with mock implementations

### Service Layer Pattern
- Business logic encapsulated in service classes
- Clear separation of concerns between REST endpoints and business operations
- Reusable business logic across different endpoints

### Dependency Injection
- Dropwizard's built-in dependency injection for service wiring
- Configuration-driven service initialization
- Testable components with injectable dependencies

### Exception Handling
- Centralized exception mapping with custom exception mappers
- Consistent error response format across all endpoints
- Proper HTTP status code mapping for different error scenarios

## Configuration Management

### Environment-Specific Configurations
- `configs/dev.yaml` - Development environment
- `configs/alpha.yaml` - Alpha testing environment
- `configs/ts50.yaml` - Test environment
- `configs/sg50.yaml` - Staging environment

### Configuration Structure
```yaml
server:
  applicationConnectors:
    - type: http
      port: 8080
  adminConnectors:
    - type: http
      port: 8081

database:
  driverClass: oracle.jdbc.OracleDriver
  url: ${DATABASE_URL}
  user: ${DATABASE_USER}
  password: ${DATABASE_PASSWORD}

externalServices:
  passkeyHotelService:
    baseUrl: ${PASSKEY_HOTEL_SERVICE_URL}
  businessTextService:
    baseUrl: ${BUSINESS_TEXT_SERVICE_URL}
```

## Security Architecture

### Authentication
- API Key-based authentication using Cvent's auth-service
- Authority-based access control with role validation
- Secure API key management and rotation

### Authorization
- Role-based access control (RBAC)
- Endpoint-specific permission validation
- Administrative endpoints with elevated privileges

## Monitoring and Observability

### Health Checks
- Database connectivity checks
- External service dependency checks
- Application-specific health indicators

### Logging
- Structured logging with logback
- Request/response logging with correlation IDs
- Error tracking and alerting

### Metrics
- Dropwizard metrics integration
- Custom business metrics
- Performance monitoring and alerting

## Scalability Considerations

### Horizontal Scaling
- Stateless service design for easy horizontal scaling
- Load balancer compatibility
- Session-independent operations

### Performance Optimization
- Connection pooling for database operations
- Caching strategies for frequently accessed data
- Asynchronous processing for non-critical operations

### Resource Management
- Proper connection lifecycle management
- Memory-efficient data processing
- Graceful degradation under load
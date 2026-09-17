# Architecture

## System Overview

The Passkey Reservation SpringBoot service is designed as a modern microservice that provides unified reservation management capabilities within the Passkey ecosystem. It follows a layered architecture pattern with clear separation of concerns and integrates seamlessly with Cvent's infrastructure and other Passkey services.

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer / API Gateway              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Spring Boot Application                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Controller Layer                           ││
│  │  • ReservationController                               ││
│  │  • LegacyReservationsController                        ││
│  │  • Health Endpoints                                    ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │               Service Layer                             ││
│  │  • ReservationService                                  ││
│  │  • Legacy Migration Services                           ││
│  │  • Business Logic                                      ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Data Access Layer                          ││
│  │  • MyBatis Mappers                                     ││
│  │  • DAO Objects                                         ││
│  │  • Database Connections                                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Oracle Database                            │
│  • Reservation Tables                                       │
│  • Legacy Data Structures                                   │
│  • Audit and Logging Tables                                │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Controller Layer
- **Purpose**: Handles HTTP requests and responses, input validation, and API contract enforcement
- **Location**: `com.cvent.passkeyreservationsb.controllers`
- **Key Classes**:
  - `ReservationController` - Main reservation API endpoints
  - `LegacyReservationsController` - Legacy system compatibility endpoints
  - `Utils` - Common controller utilities

### Service Layer
- **Purpose**: Contains business logic, orchestrates data operations, and manages transactions
- **Location**: `com.cvent.passkeyreservationsb.service`
- **Key Classes**:
  - `ReservationService` - Core reservation business logic
  - Legacy migration services for backward compatibility

### Data Access Layer
- **Purpose**: Manages database interactions, query execution, and data mapping
- **Location**: `com.cvent.passkeyreservationsb.dao` and `com.cvent.passkeyreservationsb.mappers`
- **Key Classes**:
  - MyBatis mappers for database operations
  - DAO objects for data access patterns

### Authentication & Authorization
- **Purpose**: Handles OAuth-based security and access control
- **Location**: `com.cvent.passkeyreservationsb.auth`
- **Key Features**:
  - Cvent OAuth integration
  - Scope-based authorization (`RESERVATION_READ`)
  - JWT token validation

### Health Monitoring
- **Purpose**: Provides health checks and monitoring endpoints
- **Location**: `com.cvent.passkeyreservationsb.health`
- **Key Features**:
  - Spring Boot Actuator integration
  - Custom health indicators
  - Readiness and liveness probes

## Data Flow

### Reservation Retrieval Flow
1. **Client Request**: HTTP GET request to `/passkey-reservation-sb/v1/reservations/{confNumber}`
2. **Authentication**: OAuth token validation and scope verification
3. **Input Validation**: Confirmation number format validation (alphanumeric)
4. **Service Layer**: Business logic execution and data retrieval
5. **Data Access**: Database query via MyBatis mappers
6. **Response Mapping**: Entity to DTO conversion
7. **HTTP Response**: JSON response with reservation data or 404 if not found

### Legacy Migration Flow
1. **Legacy Request**: Incoming request from legacy systems
2. **Compatibility Layer**: Legacy format handling and conversion
3. **Modern Processing**: Standard service layer processing
4. **Response Conversion**: Modern format to legacy format conversion
5. **Legacy Response**: Response in expected legacy format

## Design Patterns

### Repository Pattern
- **Implementation**: MyBatis mappers act as repositories
- **Benefits**: Clean separation between business logic and data access
- **Location**: DAO and mapper classes

### Service Layer Pattern
- **Implementation**: Business logic encapsulated in service classes
- **Benefits**: Reusable business operations, transaction management
- **Location**: Service package classes

### Dependency Injection
- **Implementation**: Spring Framework's IoC container
- **Benefits**: Loose coupling, testability, configuration management
- **Usage**: Constructor injection throughout the application

### Builder Pattern
- **Implementation**: Immutable objects using Immutables library
- **Benefits**: Thread-safe, immutable data structures
- **Usage**: Model objects and DTOs

## Module Structure

### Multi-Module Maven Project
```
passkey-reservation-sb/
├── parent/           # Parent POM with shared configuration
├── model/            # Shared data models and DTOs
├── service/          # Main Spring Boot application
├── java-client/      # Client library for other services
├── it/              # Integration tests
└── infra/           # Infrastructure and deployment configs
```

### Service Module Structure
```
service/
├── src/main/java/com/cvent/passkeyreservationsb/
│   ├── PasskeyReservationSbApplication.java    # Main application class
│   ├── PasskeyReservationSbConfiguration.java  # Configuration
│   ├── controllers/                             # REST controllers
│   ├── service/                                # Business logic
│   ├── dao/                                    # Data access objects
│   ├── mappers/                                # MyBatis mappers
│   ├── auth/                                   # Authentication
│   ├── health/                                 # Health checks
│   └── legacy/                                 # Legacy compatibility
├── src/main/resources/
│   ├── application.yml                         # Spring configuration
│   ├── logback.xml                            # Logging configuration
│   └── mybatis/                               # MyBatis configurations
└── configs/                                   # Environment-specific configs
```

## Integration Points

### External Service Dependencies
- **Passkey Payment Service**: Payment processing operations
- **Passkey Addons Service**: Add-on management functionality  
- **Passkey Request Inventory Service**: Inventory availability checks
- **Legacy Passkey Reservation Service**: Migration and compatibility

### Infrastructure Dependencies
- **Oracle Database**: Primary data storage
- **Cvent OAuth Service**: Authentication and authorization
- **Datadog**: Monitoring and observability
- **AWS Infrastructure**: Hosting and deployment platform

## Scalability Considerations

### Horizontal Scaling
- Stateless application design enables multiple instances
- Load balancer distributes traffic across instances
- Database connection pooling manages concurrent access

### Performance Optimization
- MyBatis caching for frequently accessed data
- Connection pooling for database efficiency
- Async processing for non-blocking operations

### Monitoring and Observability
- Spring Boot Actuator for health and metrics
- Datadog integration for application monitoring
- Structured logging with correlation IDs
- Distributed tracing for request flow visibility

## Security Architecture

### Authentication Flow
1. Client presents OAuth token in Authorization header
2. Spring Security validates token with Cvent OAuth service
3. Token scopes are verified against required permissions
4. Request proceeds if authentication and authorization succeed

### Authorization Scopes
- `RESERVATION_READ`: Required for reading reservation data
- Additional scopes may be added for write operations

### Data Protection
- HTTPS encryption for all communications
- Database connection encryption
- Sensitive data logging restrictions
- Input validation and sanitization
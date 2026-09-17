# Architecture

## System Overview

The Passkey Admin Service follows a layered Spring Boot architecture within a TypeScript monorepo structure. It implements a clean separation of concerns with distinct layers for presentation, business logic, data access, and infrastructure.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                 Controller Layer                            │
│  AnalyticsController │ PasskeyContactController │ etc.      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Service Layer                               │
│  PasskeyContactService │ AnalyticsService │ etc.           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Data Access Layer                              │
│  JPA Repositories │ MyBatis Mappers │ DAO Layer            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Oracle Database                             │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Controller Layer
- **Purpose**: Handle HTTP requests and responses, input validation, and error handling
- **Location**: `com.cvent.passkeyadminservice.controllers`
- **Key Classes**:
  - `PasskeyContactController` - Contact management operations
  - `AnalyticsController` - Analytics data processing
  - `GdprController` - GDPR compliance operations
  - `EmailTypeController` - Email type management

### Service Layer
- **Purpose**: Implement business logic, orchestrate operations, and manage transactions
- **Location**: `com.cvent.passkeyadminservice.service`
- **Key Classes**:
  - `PasskeyContactService` - Core contact business logic
  - Business validation and processing
  - Integration with external services

### Data Access Layer
- **Purpose**: Manage database operations and data persistence
- **Location**: `com.cvent.passkeyadminservice.dao` and `com.cvent.passkeyadminservice.repositories`
- **Technologies**:
  - **JPA Repositories**: Spring Data JPA for standard CRUD operations
  - **MyBatis Mappers**: Custom SQL queries and complex data operations
  - **Entity Classes**: JPA entities representing database tables

### Entity Layer
- **Purpose**: Define domain models and database mappings
- **Location**: `com.cvent.passkeyadminservice.entities`
- **Key Entities**:
  - `Contact` - Contact information and relationships
  - `UserIdentity` - User identity and authentication data
  - `EmailType` - Email type definitions
  - `ContactEmailTypeAssociation` - Many-to-many relationships

## Data Flow

### Contact Creation Flow
1. **Request Reception**: `PasskeyContactController` receives POST request
2. **Validation**: Input validation using `PasskeyContactValidator`
3. **Business Logic**: `PasskeyContactService` processes business rules
4. **Data Persistence**: JPA repository saves to Oracle database
5. **Response**: Return created contact with HTTP 201 status

### User/Contact Details Retrieval
1. **Request Processing**: Controller receives filter criteria
2. **Service Orchestration**: Service layer applies business logic
3. **Data Aggregation**: Multiple repository calls to gather data
4. **Response Mapping**: MapStruct mappers convert entities to DTOs
5. **Response Delivery**: Structured response with user/contact details

## Design Patterns

### Repository Pattern
- **Implementation**: Spring Data JPA repositories
- **Purpose**: Abstract data access logic
- **Benefits**: Testability, maintainability, and separation of concerns

### Service Layer Pattern
- **Implementation**: `@Service` annotated classes
- **Purpose**: Encapsulate business logic
- **Benefits**: Transaction management, business rule enforcement

### DTO Pattern
- **Implementation**: Immutable model classes using Immutables library
- **Purpose**: Data transfer between layers
- **Benefits**: Type safety, immutability, and clear contracts

### Dependency Injection
- **Implementation**: Spring Framework IoC container
- **Purpose**: Manage component dependencies
- **Benefits**: Loose coupling, testability, and configuration flexibility

### Validation Pattern
- **Implementation**: Custom validators and Bean Validation
- **Purpose**: Input validation and business rule enforcement
- **Benefits**: Centralized validation logic, reusability

## Module Structure

The service is organized as part of a multi-module Maven project:

```
packages/passkey-admin-service/
├── parent/           # Parent POM with shared configuration
├── model/            # Shared model classes and DTOs
├── java-client/      # Client library for service integration
├── service/          # Main Spring Boot application
├── it/              # Integration tests
└── infra/           # Infrastructure as Code (CDK)
```

### Service Module Structure
```
service/
├── src/main/java/com/cvent/passkeyadminservice/
│   ├── controllers/     # REST controllers
│   ├── service/         # Business logic services
│   ├── repositories/    # JPA repositories
│   ├── dao/            # MyBatis mappers and DAOs
│   ├── entities/       # JPA entities
│   ├── mappers/        # MapStruct mappers
│   ├── validators/     # Custom validators
│   ├── exception/      # Exception handling
│   ├── health/         # Health check components
│   ├── common/         # Common utilities
│   └── util/           # Utility classes
├── src/main/resources/
│   ├── application.yml # Spring Boot configuration
│   └── mybatis/        # MyBatis mapper XML files
└── configs/            # Environment-specific configurations
```

## Security Architecture

### Authentication
- **OAuth Integration**: Cvent OAuth service integration
- **JWT Tokens**: Token-based authentication
- **Security Context**: Spring Security context management

### Authorization
- **Role-Based Access**: User role validation
- **Method Security**: `@PreAuthorize` annotations
- **Resource Protection**: Endpoint-level security

## Integration Points

### External Services
- **Login Service**: User authentication and identity management
- **Analytics Platform**: Data processing and reporting
- **GDPR Service**: Compliance and data privacy operations

### Database Integration
- **Oracle Database**: Primary data store
- **Connection Pooling**: HikariCP for connection management
- **Transaction Management**: Spring Transaction management

## Observability

### Logging
- **Structured Logging**: JSON-formatted logs
- **Access Logging**: Logback access valve for request logging
- **Correlation IDs**: Request tracing across services

### Monitoring
- **Spring Actuator**: Health checks and metrics endpoints
- **Datadog Integration**: Application performance monitoring
- **Custom Health Indicators**: Business-specific health checks

### Tracing
- **Observability Startup Tracer**: Application startup monitoring
- **Distributed Tracing**: Request flow across services
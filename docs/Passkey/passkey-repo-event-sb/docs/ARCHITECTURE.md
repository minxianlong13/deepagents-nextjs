# Architecture

## System Overview

The Passkey Event Spring Boot Service follows a layered architecture pattern typical of Spring Boot applications, with clear separation of concerns across presentation, business logic, data access, and infrastructure layers. The service is built as a multi-module Maven project within a pnpm monorepo structure, enabling both Java and TypeScript tooling integration.

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer / API Gateway              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Spring Boot Application                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Controller Layer                           ││
│  │  • PasskeyEventController                              ││
│  │  • AdminController                                     ││
│  │  • GroupTypeController                                 ││
│  │  • MailConfigurationController                         ││
│  └─────────────────────┬───────────────────────────────────┘│
│  ┌─────────────────────▼───────────────────────────────────┐│
│  │               Service Layer                             ││
│  │  • PasskeyEventService                                 ││
│  │  • AdminServiceSb                                      ││
│  │  • GroupTypeService                                    ││
│  │  • MailConfigurationService                            ││
│  └─────────────────────┬───────────────────────────────────┘│
│  ┌─────────────────────▼───────────────────────────────────┐│
│  │            Data Access Layer                            ││
│  │  • MyBatis Mappers                                     ││
│  │  • Repository Interfaces                               ││
│  │  • DAO Components                                      ││
│  └─────────────────────┬───────────────────────────────────┘│
└──────────────────────┬─┴───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                  Oracle Database                            │
│  • Event Tables                                            │
│  • Marketing Items                                         │
│  • Configuration Data                                      │
│  • Attendee Information                                    │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Controller Layer
- **Purpose**: Handles HTTP requests and responses, input validation, and API contract enforcement
- **Location**: `com.cvent.passkeyeventsb.controllers`
- **Key Classes**:
  - `PasskeyEventController`: Main event operations API
  - `AdminController`: Administrative operations
  - `GroupTypeController`: Group type management
  - `MailConfigurationController`: Email configuration management
  - `PasskeyEventSbController`: Service-specific operations

### Service Layer
- **Purpose**: Contains business logic, orchestrates data access, and implements domain rules
- **Location**: `com.cvent.passkeyeventsb.service`
- **Key Classes**:
  - `PasskeyEventService`: Core event business logic
  - `AdminServiceSb`: Administrative service operations
  - `GroupTypeService`: Group type business logic
  - `MailConfigurationService`: Email configuration logic

### Data Access Layer
- **Purpose**: Manages database interactions, query execution, and data mapping
- **Location**: `com.cvent.passkeyeventsb.dao`, `com.cvent.passkeyeventsb.repositories`
- **Key Components**:
  - MyBatis mappers for SQL query execution
  - Repository interfaces for data access abstraction
  - DAO components for complex data operations

### Model Layer
- **Purpose**: Defines data structures, DTOs, and domain entities
- **Location**: `com.cvent.passkeyeventsb.model` (separate module)
- **Key Components**:
  - Event domain models
  - Request/Response DTOs
  - Database entity mappings

### Infrastructure Layer
- **Purpose**: Cross-cutting concerns like security, logging, monitoring, and configuration
- **Location**: Various packages (`auth`, `health`, `exception`, `utils`)
- **Key Components**:
  - Authentication and authorization
  - Exception handling
  - Health checks
  - Utility classes

## Data Flow

### Typical Request Flow

1. **HTTP Request**: Client sends request to REST endpoint
2. **Controller**: Receives request, validates input, extracts parameters
3. **Service Layer**: Controller delegates to appropriate service method
4. **Business Logic**: Service applies business rules and validation
5. **Data Access**: Service calls DAO/Repository to fetch/persist data
6. **Database Query**: MyBatis executes SQL queries against Oracle DB
7. **Data Mapping**: Results mapped to domain objects/DTOs
8. **Response**: Data flows back through layers to HTTP response

### Event Information Retrieval Flow

```
Client Request → PasskeyEventController.getEventInfo()
    ↓
PasskeyEventService.getEventInfo(eventId, localeId)
    ↓
EventDAO.findEventById() + LocalizationDAO.getLocalizedData()
    ↓
Oracle Database Queries
    ↓
Event Domain Object Assembly
    ↓
HTTP Response with Event JSON
```

## Design Patterns

### Repository Pattern
- Abstracts data access logic behind interfaces
- Enables testing with mock implementations
- Provides consistent data access API

### Service Layer Pattern
- Encapsulates business logic in dedicated service classes
- Promotes reusability and testability
- Separates business concerns from presentation logic

### Dependency Injection
- Spring's IoC container manages object lifecycle
- Constructor injection for required dependencies
- Enables loose coupling and easier testing

### DTO Pattern
- Separate data transfer objects for API contracts
- Isolates internal domain models from external interfaces
- Enables API versioning and backward compatibility

### Exception Handling Pattern
- Centralized exception handling with `@ControllerAdvice`
- Custom exception types for different error scenarios
- Consistent error response format across APIs

## Module Structure

The project follows a multi-module Maven structure:

```
passkey-event-sb/
├── parent/                 # Parent POM with shared configuration
├── model/                  # Shared data models and DTOs
├── java-client/           # Java client library for service consumption
├── service/               # Main Spring Boot application
├── it/                    # Integration tests
└── infra/                 # Infrastructure as Code (CDK)
```

### Module Dependencies

```
service → model
service → parent
java-client → model
it → service
it → java-client
infra → (deployment artifacts)
```

## Security Architecture

### Authentication
- OAuth 2.0 integration with Cvent Auth Service
- JWT token validation for API requests
- Service-to-service authentication support

### Authorization
- Role-based access control (RBAC)
- Integration with Cvent Permission Service
- Method-level security annotations

### Data Protection
- Input validation and sanitization
- SQL injection prevention through parameterized queries
- Sensitive data logging exclusion

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables multiple instances
- Load balancing across service instances
- Database connection pooling for efficient resource usage

### Caching Strategy
- Application-level caching for frequently accessed data
- Database query result caching
- CDN integration for static content

### Performance Optimization
- Lazy loading for optional data
- Pagination for large result sets
- Asynchronous processing for non-critical operations

## Integration Points

### External Services
- **Cvent Auth Service**: Authentication and user management
- **Passkey Services**: Integration with other Passkey microservices
- **Oracle Database**: Primary data persistence
- **Observability Stack**: Monitoring, logging, and tracing

### Internal Components
- **Legacy Systems**: Backward compatibility layer
- **Configuration Management**: Environment-specific settings
- **Health Monitoring**: Application health and readiness checks

## Deployment Architecture

### Container Strategy
- Docker containerization with multi-stage builds
- Base images from Cvent's approved registry
- Optimized for AWS ECS deployment

### Infrastructure
- AWS ECS for container orchestration
- Application Load Balancer for traffic distribution
- RDS Oracle for managed database service
- CloudWatch for monitoring and alerting

### Configuration Management
- Environment-specific YAML configurations
- AWS Parameter Store for sensitive configuration
- Feature flags for gradual rollouts
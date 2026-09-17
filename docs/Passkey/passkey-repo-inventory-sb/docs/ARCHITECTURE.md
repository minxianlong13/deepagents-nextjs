# Architecture

## System Overview

The Passkey Inventory Spring Boot service follows a modern microservice architecture built on Spring Boot framework. It implements a multi-module Maven project structure with clear separation of concerns and follows enterprise-grade patterns for scalability and maintainability.

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
│              Passkey Inventory Service                      │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   Controllers   │    Services     │      DAOs       │    │
│  │   (REST API)    │ (Business Logic)│  (Data Access)  │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Oracle Database                           │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The project follows a multi-module Maven architecture:

### 1. Parent Module (`packages/passkey-inventory/parent`)
- **Purpose**: Defines common dependencies and build configuration
- **Key Components**: Maven parent POM with shared dependencies and plugins

### 2. Model Module (`packages/passkey-inventory/model`)
- **Purpose**: Contains data transfer objects and domain models
- **Key Classes**:
  - `BlockInfo` - Represents hotel room block information
  - `BlockInfoResponse` - Response wrapper for block data
  - `GetBlocksRequest` - Request model for block retrieval
- **Technologies**: Immutables library for immutable data structures

### 3. Service Module (`packages/passkey-inventory/service`)
- **Purpose**: Main Spring Boot application with business logic
- **Key Components**:
  - REST Controllers
  - Service layer implementations
  - Data access objects (DAOs)
  - Configuration classes

### 4. Java Client Module (`packages/passkey-inventory/java-client`)
- **Purpose**: Generated client library for consuming the service
- **Usage**: Allows other services to integrate easily

### 5. Integration Tests Module (`packages/passkey-inventory/it`)
- **Purpose**: End-to-end integration testing
- **Scope**: API testing and service integration validation

## Component Architecture

### Controller Layer
```
┌─────────────────────────────────────────────────────────┐
│                   Controller Layer                      │
├─────────────────────────────────────────────────────────┤
│  PasskeyInventoryController                             │
│  ├─ POST /passkey-inventory/v1/entity                   │
│  └─ GET  /passkey-inventory/v1/entity/{id}              │
│                                                         │
│  BlockController                                        │
│  └─ POST /passkey-inventory/v1/blocks                   │
└─────────────────────────────────────────────────────────┘
```

**Key Features**:
- RESTful API design
- OAuth-based authorization with `@CventAuthorization`
- Request/response validation with Bean Validation
- Structured error handling

### Service Layer
```
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                         │
├─────────────────────────────────────────────────────────┤
│  PasskeyInventoryService                                │
│  ├─ Entity management operations                        │
│  └─ Business logic implementation                       │
│                                                         │
│  BlockService                                           │
│  ├─ Block information retrieval                         │
│  └─ Block-related business operations                   │
│                                                         │
│  UsersService                                           │
│  └─ User-related operations                             │
└─────────────────────────────────────────────────────────┘
```

**Design Patterns**:
- Service Layer Pattern
- Dependency Injection
- Interface-based design for testability

### Data Access Layer
```
┌─────────────────────────────────────────────────────────┐
│                 Data Access Layer                       │
├─────────────────────────────────────────────────────────┤
│  MyBatis Integration                                    │
│  ├─ SQL mapping configuration                           │
│  ├─ Database connection management                      │
│  └─ Transaction management                              │
│                                                         │
│  DAO Implementations                                    │
│  ├─ Block data access                                   │
│  └─ Entity data access                                  │
└─────────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Layered Architecture
- **Presentation Layer**: REST Controllers
- **Business Layer**: Service implementations
- **Data Access Layer**: MyBatis DAOs
- **Model Layer**: Domain objects and DTOs

### 2. Dependency Injection
- Spring's IoC container manages all dependencies
- Constructor-based injection for required dependencies
- Interface-based design for loose coupling

### 3. Builder Pattern
- Immutables library generates builder patterns for data objects
- Ensures immutable and thread-safe data structures

### 4. Repository Pattern
- Data access abstraction through service interfaces
- MyBatis provides the implementation layer

## Security Architecture

### Authentication & Authorization
- **OAuth Integration**: Cvent OAuth for API security
- **Scope-based Authorization**: Different scopes for different operations
  - `ADMIN`: Full access for entity creation
  - `READ_ONLY`: Read access for entity retrieval
- **Request Validation**: Bean Validation for input sanitization

### Security Headers
- Standard security headers configured
- CORS configuration for cross-origin requests

## Observability & Monitoring

### Logging
- **SLF4J + Logback**: Structured logging framework
- **Access Logging**: Tomcat access logs with Logback valve
- **Request Tracing**: Correlation IDs for request tracking

### Monitoring
- **Spring Boot Actuator**: Health checks and metrics
- **Observability Startup Tracer**: Application startup monitoring
- **Datadog Integration**: Service monitoring and alerting

### Health Checks
- Database connectivity checks
- Custom health indicators for dependencies

## Configuration Management

### Environment-based Configuration
- **Development**: `configs/dev.yaml`
- **Template**: `configs/template.yaml` for environment-specific overrides
- **Base Override**: `configs/base-override.yaml` for common settings

### External Configuration
- Environment variables for sensitive data
- Spring profiles for environment-specific behavior

## Integration Patterns

### Service-to-Service Communication
- RESTful APIs for synchronous communication
- Standard HTTP status codes and error responses
- JSON-based request/response format

### Database Integration
- **MyBatis**: SQL mapping framework
- **Connection Pooling**: Efficient database connection management
- **Transaction Management**: Spring's declarative transaction support

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Load balancer compatible
- Database connection pooling

### Performance Optimization
- Efficient SQL queries through MyBatis
- Caching strategies where appropriate
- Asynchronous processing capabilities

## Deployment Architecture

### Containerization
- Docker-based deployment
- Multi-stage builds for optimized images
- Health check endpoints for container orchestration

### Infrastructure
- AWS ECS deployment
- CDK-based infrastructure as code
- Environment-specific configurations
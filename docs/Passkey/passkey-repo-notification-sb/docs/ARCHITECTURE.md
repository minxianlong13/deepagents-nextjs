# Architecture

## System Overview

The Passkey Notification Service follows a layered architecture pattern built on Spring Boot, designed for scalability, maintainability, and integration within the Cvent Passkey ecosystem.

## Architecture Patterns

### Layered Architecture

```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│         (REST Controllers)          │
├─────────────────────────────────────┤
│            Service Layer            │
│        (Business Logic)             │
├─────────────────────────────────────┤
│         Data Access Layer           │
│          (MyBatis DAOs)             │
├─────────────────────────────────────┤
│           Database Layer            │
│         (Oracle Database)           │
└─────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Spring Boot Application                  │
├─────────────────────────────────────────────────────────────┤
│  Controllers  │   Services   │   Configuration  │  Health   │
│               │              │                  │  Checks   │
├─────────────────────────────────────────────────────────────┤
│           Security Layer (OAuth2 + Spring Security)        │
├─────────────────────────────────────────────────────────────┤
│              Data Access Layer (MyBatis)                   │
├─────────────────────────────────────────────────────────────┤
│                    Oracle Database                         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Application Layer

**PasskeyNotificationSbApplication**
- Main Spring Boot application class
- Configures observability tracing
- Sets up Tomcat access logging
- Entry point for the service

### 2. Controller Layer

**PasskeyNotificationSbController**
- RESTful API endpoints
- Request/response handling
- Input validation
- OAuth2 authorization enforcement

### 3. Service Layer

**PasskeyNotificationSbService**
- Business logic implementation
- Entity processing
- Data transformation
- Service orchestration

### 4. Security Layer

**Authentication & Authorization**
- OAuth2 integration with Cvent Auth Service
- Scope-based authorization (`ADMIN`, `READ_ONLY`)
- JWT token validation
- Security configuration

### 5. Configuration Layer

**PasskeyNotificationSbConfiguration**
- Spring Bean configuration
- Environment-specific settings
- Database connection setup
- External service integration

### 6. Health Monitoring

**Health Checks**
- Application health indicators
- Database connectivity checks
- Custom health endpoints
- Metrics collection

## Data Flow

### Request Processing Flow

```
1. HTTP Request → Controller
2. Controller → Authentication Filter
3. Authentication Filter → OAuth2 Validation
4. Controller → Service Layer
5. Service Layer → Data Access Layer
6. Data Access Layer → Database
7. Response ← Controller ← Service ← DAO ← Database
```

### Entity Management Flow

```
POST /entity:
Client → Controller → Validation → Service → Database → Response

GET /entity/{id}:
Client → Controller → Authorization → Service → Database → Response
```

## Integration Points

### External Dependencies

1. **Cvent Auth Service**
   - OAuth2 token validation
   - User authentication
   - Scope authorization

2. **Oracle Database**
   - Entity persistence
   - Transaction management
   - Data consistency

3. **Cvent Platform Services**
   - Common utilities
   - Shared libraries
   - Platform integration

### Internal Dependencies

1. **Cvent Spring Boot Starters**
   - Service starter
   - OAuth starter
   - Common utilities

2. **Pangaea Common Libraries**
   - Shared models
   - Utility functions
   - Platform abstractions

## Deployment Architecture

### Multi-Environment Support

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ - Local DB      │    │ - Shared DB     │    │ - Prod DB       │
│ - Mock Auth     │    │ - Staging Auth  │    │ - Prod Auth     │
│ - Debug Logs    │    │ - Info Logs     │    │ - Error Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Infrastructure Components

1. **Application Server**
   - Embedded Tomcat
   - Connection pooling
   - Thread management

2. **Database Layer**
   - Oracle JDBC driver
   - HikariCP connection pool
   - Transaction management

3. **Monitoring & Observability**
   - Spring Boot Actuator
   - Micrometer metrics
   - Distributed tracing

## Security Architecture

### Authentication Flow

```
1. Client Request with Bearer Token
2. OAuth2 Filter intercepts request
3. Token validation against Auth Service
4. User context establishment
5. Scope-based authorization check
6. Request processing
```

### Authorization Model

- **ADMIN Scope**: Full CRUD operations
- **READ_ONLY Scope**: Read operations only
- **Environment-based**: Different auth configs per environment

## Scalability Considerations

### Horizontal Scaling

- Stateless service design
- Database connection pooling
- Load balancer compatibility
- Session-less architecture

### Performance Optimizations

- Connection pool tuning
- Database query optimization
- Caching strategies (future enhancement)
- Async processing capabilities

## Monitoring & Observability

### Metrics Collection

- Application metrics via Micrometer
- JVM metrics
- Database connection metrics
- Custom business metrics

### Health Monitoring

- Application health endpoints
- Database connectivity checks
- External service health
- Custom health indicators

### Logging Strategy

- Structured logging
- Environment-specific log levels
- Access logging via Logback
- Distributed tracing integration

## Design Principles

### SOLID Principles

- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable
- **Interface Segregation**: Many specific interfaces
- **Dependency Inversion**: Depend on abstractions

### Spring Boot Best Practices

- Configuration externalization
- Auto-configuration usage
- Actuator integration
- Profile-based configuration
- Bean lifecycle management

## Future Enhancements

### Planned Improvements

1. **Caching Layer**: Redis integration for performance
2. **Event Streaming**: Kafka integration for notifications
3. **API Versioning**: Enhanced version management
4. **Circuit Breakers**: Resilience patterns
5. **Rate Limiting**: API throttling capabilities
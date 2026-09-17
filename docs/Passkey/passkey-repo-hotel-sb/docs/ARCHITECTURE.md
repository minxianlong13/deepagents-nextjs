# Architecture

## System Overview

The Passkey Hotel Spring Boot Service follows a layered microservice architecture built on Spring Boot. It serves as a modernized replacement for legacy hotel services, providing REST APIs for hotel management, e-commerce rules, and event-hotel associations within the Cvent Passkey ecosystem.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (Web UI, Mobile Apps, Other Services)          │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────────┐
│                  Spring Boot Application                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │   Controllers   │ │   Auth Layer    │ │  Health Check │  │
│  │   (REST APIs)   │ │   (OAuth)       │ │   (Actuator)  │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │    Services     │ │   Converters    │ │   Legacy      │  │
│  │ (Business Logic)│ │ (Data Mapping)  │ │ Integration   │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
│  ┌─────────────────┐ ┌─────────────────┐                    │
│  │      DAOs       │ │    MyBatis      │                    │
│  │ (Data Access)   │ │   (ORM Layer)   │                    │
│  └─────────────────┘ └─────────────────┘                    │
└─────────────────────────┬───────────────────────────────────┘
                          │ JDBC
┌─────────────────────────▼───────────────────────────────────┐
│                    Oracle Database                          │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Controllers Layer
- **Purpose**: Handles HTTP requests and responses, implements REST API endpoints
- **Location**: `com.cvent.passkeyhotelsb.controllers`
- **Key Classes**:
  - `EventController`: Manages event-hotel relationships and e-commerce rules

### Service Layer
- **Purpose**: Contains business logic and orchestrates data operations
- **Location**: `com.cvent.passkeyhotelsb.service`
- **Key Classes**:
  - `ECommerceRuleService`: Handles e-commerce rule retrieval and processing

### Data Access Layer (DAO)
- **Purpose**: Provides data persistence and retrieval operations
- **Location**: `com.cvent.passkeyhotelsb.dao`
- **Key Classes**:
  - MyBatis mappers for database operations
  - Data access objects for entity management

### Configuration Layer
- **Purpose**: Application configuration and Spring Boot setup
- **Location**: `com.cvent.passkeyhotelsb.config`
- **Key Classes**:
  - `PasskeyHotelSbConfiguration`: Main configuration class
  - Security and database configurations

### Authentication Layer
- **Purpose**: Handles OAuth-based authentication and authorization
- **Location**: `com.cvent.passkeyhotelsb.auth`
- **Integration**: Cvent OAuth framework

### Legacy Integration
- **Purpose**: Bridges with existing Passkey services during migration
- **Location**: `com.cvent.passkeyhotelsb.legacy`
- **Function**: Maintains compatibility with legacy systems

## Data Flow

### Typical Request Flow

1. **Client Request**: External client sends HTTP request to REST endpoint
2. **Authentication**: OAuth layer validates request credentials
3. **Controller**: Request routed to appropriate controller method
4. **Service Layer**: Business logic executed, data validation performed
5. **Data Access**: MyBatis mappers query Oracle database
6. **Response Mapping**: Data converted to response DTOs
7. **HTTP Response**: JSON response returned to client

### E-Commerce Rules Retrieval Example

```
GET /passkey-hotel/v1/events/{eventId}/hotels/{hotelId}/attendee-types/{attendeeTypeId}/ecommerce-rules

1. EventController.getECommerceRules()
2. ECommerceRuleService.getECommerceRules()
3. Database query via MyBatis mappers
4. Data conversion and response formatting
5. Return ECommerceRules JSON response
```

## Design Patterns

### Layered Architecture
- **Controller → Service → DAO → Database**
- Clear separation of concerns
- Dependency injection via Spring

### Repository Pattern
- MyBatis mappers act as repositories
- Abstraction over database operations
- SQL mapping externalized in XML files

### Dependency Injection
- Spring Boot's IoC container
- Constructor-based injection preferred
- Configuration through annotations

### DTO Pattern
- Data Transfer Objects for API requests/responses
- Separation between internal entities and external contracts
- Model classes in separate module

## Module Structure

### Multi-Module Maven Project

```
passkey-hotel-sb/
├── parent/           # Parent POM with shared configuration
├── model/            # Shared data models and DTOs
├── service/          # Main Spring Boot application
├── java-client/      # Client library for other services
└── it/              # Integration tests
```

### Service Module Structure

```
service/
├── src/main/java/com/cvent/passkeyhotelsb/
│   ├── PasskeyHotelSbApplication.java    # Main application class
│   ├── controllers/                       # REST controllers
│   ├── service/                          # Business logic
│   ├── dao/                              # Data access layer
│   ├── config/                           # Configuration classes
│   ├── auth/                             # Authentication
│   ├── converter/                        # Data converters
│   ├── health/                           # Health checks
│   └── legacy/                           # Legacy integration
├── src/main/resources/
│   ├── application.yml                   # Spring Boot configuration
│   ├── logback.xml                       # Logging configuration
│   └── mybatis/                          # MyBatis SQL mappings
└── configs/                              # Environment-specific configs
```

## Integration Points

### External Dependencies
- **Passkey Hotel Service**: Legacy service being replaced
- **Passkey Housing Library**: Housing-related functionality
- **Passkey Create Hotel**: Hotel creation services
- **Cvent OAuth**: Authentication service
- **Oracle Database**: Primary data store

### Internal Framework Dependencies
- **CDF (Common Development Framework)**: Cvent's internal framework
- **Common Observability**: Monitoring and metrics
- **Common Tracing**: Distributed tracing
- **Spring Boot Starters**: Cvent-specific Spring Boot extensions

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Load balancer compatible
- Database connection pooling

### Performance Optimization
- MyBatis result caching
- Connection pooling with HikariCP
- Async logging with Logback

### Monitoring & Observability
- Spring Boot Actuator endpoints
- Datadog integration for metrics
- Distributed tracing support
- Structured logging with correlation IDs

## Security Architecture

### Authentication
- OAuth 2.0 integration
- JWT token validation
- Cvent identity provider integration

### Authorization
- Role-based access control
- Method-level security annotations
- Request context validation

### Data Protection
- HTTPS enforcement
- Database connection encryption
- Sensitive data masking in logs
# Architecture

## System Overview

The Passkey Addons Portal follows a traditional three-tier web application architecture built on the Spring Framework and deployed on WildFly application server. The system is designed as a monolithic web application with clear separation of concerns across presentation, business logic, and data access layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   JSP Views     │  │  Spring MVC     │  │   Filters    │ │
│  │   (Tiles)       │  │  Controllers    │  │ Interceptors │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    Services     │  │   Schedulers    │  │   Security   │ │
│  │ (Spring Beans)  │  │   (Tasks)       │  │  (Auth)      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │      DAOs       │  │   Repositories  │  │   Clients    │ │
│  │   (JDBC)        │  │   (Spring)      │  │ (External)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Oracle DB      │  │  Passkey Auth   │  │   Email      │ │
│  │  (Primary)      │  │   Service       │  │  Service     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Presentation Layer

#### Web Controllers (`com.passkey.addon.web.controller`)
- **Purpose**: Handle HTTP requests and coordinate response generation
- **Location**: `packages/app/src/main/java/com/passkey/addon/web/controller/`
- **Key Classes**:
  - `AccountController`: User account management and password reset
  - `BookingsController`: Reservation and booking data display
  - `ArrivalsController`: Guest arrival information management
  - `CompleteRegController`: Registration completion workflows
  - `HotelSearchController`: Hotel search and filtering
  - `HealthCheckController`: Application health monitoring
  - `PageController`: General page routing and navigation

#### View Layer
- **JSP Templates**: Server-side rendered views with Apache Tiles
- **Location**: `packages/app/src/main/webapp/`
- **Features**: Responsive design, internationalization support, security integration

#### Filters and Interceptors
- **ViewNameInterceptor**: Manages view name resolution
- **Security Filters**: Authentication and authorization enforcement
- **Request Processing**: Logging, session management, CSRF protection

### Business Logic Layer

#### Service Layer (`com.passkey.addon.service`)
- **Purpose**: Encapsulate business logic and coordinate data operations
- **Location**: `packages/app/src/main/java/com/passkey/addon/service/`
- **Key Services**:
  - `AccountService`: User account operations and authentication
  - `AddonHistoryService`: Addon transaction history management
  - `AddonService`: Core addon business logic
  - `HotelService`: Hotel information and search functionality
  - `TaskService`: Background task management
  - `AuthenticatedService`: Security context management

#### Scheduled Tasks (`com.passkey.addon.scheduler`)
- **Email Notifications**: Automated guest communications
- **Data Synchronization**: Periodic updates from external systems
- **Cleanup Operations**: Maintenance and housekeeping tasks

#### Security Layer (`com.passkey.addon.security`)
- **Spring Security Integration**: Authentication and authorization
- **Passkey Authentication Client**: External authentication service integration
- **Session Management**: User session lifecycle management

### Data Access Layer

#### Data Access Objects (`com.passkey.addon.dao`)
- **Purpose**: Abstract database operations and provide data persistence
- **Pattern**: Traditional DAO pattern with Spring JDBC
- **Features**: Connection pooling, transaction management, error handling

#### Repository Layer (`com.passkey.addon.repository`)
- **Purpose**: Higher-level data access abstraction
- **Integration**: Spring Data patterns for complex queries
- **Caching**: EhCache integration for performance optimization

#### External Clients (`com.passkey.addon.client`)
- **Passkey Authentication Client**: User authentication and profile management
- **Email Service Client**: SMTP integration for notifications
- **External API Clients**: Integration with other Passkey services

## Data Flow

### Request Processing Flow

1. **HTTP Request**: Client sends request to WildFly server
2. **Security Filter**: Spring Security validates authentication/authorization
3. **Controller**: Spring MVC controller processes request
4. **Service Layer**: Business logic execution and validation
5. **Data Access**: Repository/DAO layer queries database
6. **Response Generation**: View resolution and template rendering
7. **HTTP Response**: Rendered content returned to client

### Background Task Flow

1. **Scheduler Trigger**: Quartz scheduler initiates task execution
2. **Task Service**: Coordinates task execution and error handling
3. **Business Logic**: Service layer processes task requirements
4. **External Integration**: Calls to email service, authentication service
5. **Data Persistence**: Results stored in database
6. **Notification**: Success/failure notifications sent

## Design Patterns

### Model-View-Controller (MVC)
- **Controllers**: Handle HTTP requests and coordinate responses
- **Models**: Domain objects and data transfer objects
- **Views**: JSP templates with Tiles layout management

### Data Access Object (DAO)
- **Abstraction**: Database operations abstracted behind interfaces
- **Implementation**: Spring JDBC template for database connectivity
- **Transaction Management**: Declarative transactions with Spring

### Dependency Injection
- **Spring IoC Container**: Manages object lifecycle and dependencies
- **Configuration**: Annotation-based configuration with XML fallback
- **Scoping**: Singleton, request, and session scoped beans

### Template Method
- **Base Classes**: Common functionality in abstract base classes
- **Specialization**: Concrete implementations for specific use cases
- **Code Reuse**: Shared patterns across similar components

## Module Structure

### Monorepo Organization
```
passkey-addons-ng/
├── packages/
│   └── app/                    # Main application module
│       ├── src/main/java/      # Java source code
│       ├── src/main/resources/ # Configuration files
│       ├── src/main/webapp/    # Web assets and JSP files
│       ├── src/test/           # Unit and integration tests
│       └── pom.xml            # Maven build configuration
├── scripts/                   # Build and deployment scripts
├── docs/                      # Documentation
└── pnpm-workspace.yaml       # Workspace configuration
```

### Package Organization
```
com.passkey.addon/
├── bean/          # Domain models and DTOs
├── client/        # External service clients
├── common/        # Shared utilities and constants
├── dao/           # Data access objects
├── repository/    # Repository layer
├── scheduler/     # Background task scheduling
├── security/      # Security configuration and utilities
├── service/       # Business logic services
├── util/          # Utility classes
└── web/           # Web layer components
    ├── bean/      # Web-specific DTOs
    ├── controller/ # Spring MVC controllers
    ├── filter/    # Servlet filters
    ├── interceptor/ # Spring interceptors
    ├── listener/  # Event listeners
    ├── tags/      # Custom JSP tags
    ├── util/      # Web utilities
    └── view/      # View helpers
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: Controllers and services designed for stateless operation
- **Session Management**: Externalized session storage capability
- **Load Balancing**: Compatible with standard load balancing strategies

### Performance Optimization
- **Connection Pooling**: C3P0 connection pool for database efficiency
- **Caching**: EhCache for frequently accessed data
- **Lazy Loading**: Optimized data loading patterns
- **Query Optimization**: Efficient database query patterns

### Monitoring and Observability
- **Health Checks**: Built-in health check endpoints
- **Logging**: SLF4J with configurable log levels
- **Metrics**: Integration with Datadog for application monitoring
- **Error Tracking**: Comprehensive error handling and reporting

## Security Architecture

### Authentication Flow
1. **Initial Request**: User accesses protected resource
2. **Authentication Check**: Spring Security filter validates session
3. **External Authentication**: Passkey Authentication Service integration
4. **Session Creation**: Authenticated user session established
5. **Authorization**: Role-based access control enforcement

### Security Layers
- **Transport Security**: HTTPS enforcement
- **Session Security**: Secure session management
- **CSRF Protection**: Cross-site request forgery prevention
- **Input Validation**: Server-side validation of all inputs
- **SQL Injection Prevention**: Parameterized queries and prepared statements
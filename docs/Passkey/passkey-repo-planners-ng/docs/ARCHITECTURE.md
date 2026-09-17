# Architecture

## System Overview

The Passkey Planner Portal is a Java-based web application built using Spring Framework and deployed on WildFly application server. It follows a traditional layered architecture pattern with clear separation of concerns between presentation, business logic, and data access layers.

The application serves as a comprehensive event planning dashboard that integrates with multiple Passkey ecosystem services to provide a unified experience for event planners managing hotel reservations and housing logistics.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                WildFly Application Server                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Passkey Planner Portal                     ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │Presentation │  │   Service   │  │ Data Access │    ││
│  │  │   Layer     │  │    Layer    │  │    Layer    │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Oracle Database                            │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Presentation Layer

**Purpose**: Handles HTTP requests, user interface rendering, and client-side interactions

**Location**: `src/main/java/com/passkey/portal/web/controller/`

**Key Classes**:
- `PortalController` - Main dashboard and navigation
- `EventController` - Event management operations
- `ReportingController` - Report generation and analytics
- `AccountController` - User account management
- `AdminController` - Administrative functions
- `InventoryController` - Room inventory management
- `FileUploadController` - Secure file upload with malware scanning

**Technologies**:
- Spring MVC for request handling
- JSP with Apache Tiles for view templating
- Spring Security for authentication/authorization
- OWASP Encoder for XSS protection

### Service Layer

**Purpose**: Contains business logic, orchestrates operations, and integrates with external services

**Location**: `src/main/java/com/passkey/portal/service/`

**Key Responsibilities**:
- Event planning workflow management
- Reservation processing and validation
- Report generation and data aggregation
- External service integration
- Caching and performance optimization

**External Service Integrations**:
- Passkey Authentication Service
- Passkey Booking Service
- Passkey Reporting Service
- Experiments Service (A/B testing)
- AWS S3 for file storage

### Data Access Layer

**Purpose**: Manages database operations, caching, and data persistence

**Location**: `src/main/java/com/passkey/portal/dao/`

**Technologies**:
- Spring JDBC for database operations
- Connection pooling with C3P0
- EhCache for application-level caching
- Oracle database connectivity

### Core Infrastructure

**Purpose**: Provides cross-cutting concerns and foundational services

**Location**: `src/main/java/com/passkey/core/`

**Components**:
- Configuration management
- Logging and monitoring
- Security utilities
- Common data structures

## Data Flow

### Request Processing Flow

1. **Client Request**: User initiates action through web browser
2. **Load Balancer**: Routes request to available application server instance
3. **Spring Security**: Authenticates and authorizes the request
4. **Controller Layer**: Processes HTTP request and extracts parameters
5. **Service Layer**: Executes business logic and coordinates operations
6. **Data Access Layer**: Retrieves/persists data from Oracle database
7. **External Services**: Calls to Passkey ecosystem services as needed
8. **Response Generation**: Renders JSP view with processed data
9. **Client Response**: Returns HTML response to browser

### Event Management Workflow

1. **Event Creation**: Planner initiates new event through EventController
2. **Validation**: Service layer validates event parameters and constraints
3. **Persistence**: Event data stored in Oracle database
4. **Integration**: Notifications sent to related Passkey services
5. **Confirmation**: Success response returned to planner

## Design Patterns

### Model-View-Controller (MVC)
- **Controllers**: Handle HTTP requests and coordinate responses
- **Services**: Implement business logic and data processing
- **Views**: JSP templates render user interface

### Dependency Injection
- Spring Framework manages object lifecycle and dependencies
- Configuration-driven bean management
- Testable architecture with mock injection capabilities

### Repository Pattern
- Data access objects (DAOs) abstract database operations
- Consistent interface for data persistence
- Separation of business logic from data access concerns

### Template Method Pattern
- Base controller classes define common request processing flow
- Specialized controllers implement specific business operations
- Consistent error handling and response formatting

## Module Structure

### Portal Module (`com.passkey.portal`)
- **Controllers**: Web request handlers
- **Services**: Business logic implementation
- **Models**: Data transfer objects and form beans
- **Validators**: Input validation logic

### Core Module (`com.passkey.core`)
- **Configuration**: Application and environment settings
- **Security**: Authentication and authorization utilities
- **Utils**: Common utility classes and helpers
- **Constants**: Application-wide constants and enums

### Integration Module
- **Client Libraries**: External service integration
- **Message Handlers**: Asynchronous processing
- **Adapters**: Data format conversion and mapping

## Security Architecture

### Authentication
- Integration with Passkey Authentication Service
- Session-based authentication with secure cookies
- Multi-factor authentication support

### Authorization
- Role-based access control (RBAC)
- Method-level security annotations
- URL-based access restrictions

### Data Protection
- Input validation and sanitization
- OWASP encoding for output protection
- SQL injection prevention through parameterized queries
- File upload malware scanning with ClamAV

## Scalability Considerations

### Horizontal Scaling
- Stateless application design enables multiple instances
- Load balancer distributes traffic across instances
- Session data stored in database for instance independence

### Caching Strategy
- EhCache for frequently accessed data
- Database query result caching
- Static resource caching with appropriate headers

### Performance Optimization
- Connection pooling for database efficiency
- Lazy loading for large datasets
- Asynchronous processing for long-running operations

## Monitoring and Observability

### Application Monitoring
- Datadog integration for metrics and alerting
- Custom health check endpoints
- Performance monitoring and profiling

### Logging
- SLF4J with configurable log levels
- Structured logging for better searchability
- Centralized log aggregation

### Quality Assurance
- SonarQube integration for code quality
- JaCoCo for test coverage reporting
- Automated security scanning with Checkmarx

## Deployment Architecture

### Environment Separation
- **Development**: Local development with embedded services
- **Staging**: Production-like environment for testing
- **Production**: High-availability deployment with redundancy

### Infrastructure
- WildFly application servers in clustered configuration
- Oracle RAC database for high availability
- AWS infrastructure for cloud services integration

### Configuration Management
- Hogan-configs for environment-specific settings
- Octopus Deploy for automated deployments
- Secret management through secure configuration injection
# Architecture

## System Overview

Passkey Book follows a traditional Java web application architecture built on Spring Framework and deployed on Wildfly application server. The system is designed as a multi-module Maven project with clear separation of concerns across different layers.

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Browser   │────│   Load Balancer  │────│   Wildfly       │
└─────────────────┘    └──────────────────┘    │   Application   │
                                               │   Server        │
                                               └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   Oracle        │
                                               │   Database      │
                                               └─────────────────┘
```

## Components

### Web Application Module (war)
- **Purpose**: Handles HTTP requests, web UI rendering, and user interactions
- **Location**: `packages/app/war/`
- **Key Classes**:
  - Spring MVC Controllers for request handling
  - JSP views for UI rendering
  - Web beans for form binding
  - Validators for input validation
  - Custom JSP tags for UI components

### Passkey Core Module (passkey-core)
- **Purpose**: Core business logic specific to Passkey booking functionality
- **Location**: `packages/app/passkey-core/`
- **Key Classes**:
  - Business services for booking operations
  - Domain models and entities
  - Data access objects (DAOs)
  - Business rule implementations

### GroupMax Core Module (groupmax-core2)
- **Purpose**: Legacy integration with GroupMax systems
- **Location**: `packages/app/groupmax-core2/`
- **Key Classes**:
  - Legacy data models
  - Migration utilities
  - Compatibility layers
  - Legacy business logic

### Development Core Module (passkey-dev-core)
- **Purpose**: Development utilities and testing support
- **Location**: `packages/app/passkey-dev-core/`
- **Key Classes**:
  - Development tools
  - Test utilities
  - Mock implementations
  - Development-specific configurations

## Data Flow

### Booking Request Flow
1. **User Request** → Web browser sends booking request
2. **Load Balancer** → Routes request to available Wildfly instance
3. **Spring MVC Controller** → Processes HTTP request and validates input
4. **Service Layer** → Executes business logic and orchestrates operations
5. **Data Access Layer** → Interacts with Oracle database via Hibernate
6. **External Services** → Calls to payment, authentication, and other services
7. **Response Generation** → Renders JSP view with booking confirmation
8. **User Response** → Returns HTML response to browser

### Payment Processing Flow
1. **Payment Form Submission** → User submits credit card information
2. **Validation Layer** → Validates payment data and guest information
3. **Payment Service Integration** → Calls external payment processing service
4. **Reservation Creation** → Creates reservation record in database
5. **Confirmation Generation** → Generates booking confirmation
6. **Notification Trigger** → Sends confirmation emails via messaging service

## Design Patterns

### Layered Architecture
- **Presentation Layer**: Spring MVC controllers and JSP views
- **Service Layer**: Business logic and transaction management
- **Data Access Layer**: Hibernate entities and DAOs
- **Integration Layer**: External service clients and adapters

### Model-View-Controller (MVC)
- **Model**: Domain entities and business objects
- **View**: JSP templates and web resources
- **Controller**: Spring MVC controllers handling HTTP requests

### Dependency Injection
- **Spring IoC Container**: Manages object lifecycle and dependencies
- **Configuration**: XML and annotation-based configuration
- **Service Beans**: Business services injected into controllers

### Repository Pattern
- **Data Access Objects**: Encapsulate database operations
- **Entity Management**: Hibernate entities for ORM mapping
- **Transaction Management**: Spring transaction management

### Template Method Pattern
- **Base Controllers**: Common controller functionality
- **Service Templates**: Reusable service patterns
- **Validation Templates**: Common validation logic

## Module Structure

### Maven Multi-Module Organization
```
passkey-book (parent)
├── war (packaging: war)
│   ├── Dependencies: passkey-core, groupmax-core2
│   └── Artifacts: aws.war
├── passkey-core (packaging: jar)
│   ├── Dependencies: Spring, Hibernate
│   └── Artifacts: passkey-core.jar
├── groupmax-core2 (packaging: jar)
│   ├── Dependencies: Legacy libraries
│   └── Artifacts: groupmax-core2.jar
└── passkey-dev-core (packaging: jar)
    ├── Dependencies: Testing frameworks
    └── Artifacts: passkey-dev-core.jar
```

### Dependency Hierarchy
- **war** depends on all core modules
- **passkey-core** contains modern business logic
- **groupmax-core2** provides legacy compatibility
- **passkey-dev-core** supports development activities

## Configuration Management

### Environment-Specific Configuration
- **Hogan Templates**: Template-based configuration generation
- **Environment Profiles**: Dev, staging, production configurations
- **Property Files**: Environment-specific property overrides
- **Wildfly Configuration**: Server-specific settings

### Spring Configuration
- **Application Context**: Main Spring configuration
- **Security Configuration**: Spring Security setup
- **Data Source Configuration**: Database connection settings
- **Transaction Configuration**: Transaction management setup

## Security Architecture

### Authentication
- **Spring Security Integration**: Handles user authentication
- **External Auth Service**: Delegates to passkey-authentication-service
- **Session Management**: HTTP session-based authentication

### Authorization
- **Role-Based Access Control**: User roles and permissions
- **Method-Level Security**: Service method authorization
- **URL-Based Security**: Path-based access control

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries via Hibernate
- **XSS Protection**: Output encoding in JSP views
- **CSRF Protection**: Spring Security CSRF tokens

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: Session data stored externally
- **Load Balancing**: Multiple Wildfly instances
- **Database Connection Pooling**: Efficient database resource usage

### Performance Optimization
- **Caching Strategy**: Application-level caching with EhCache
- **Database Optimization**: Hibernate query optimization
- **Static Resource Optimization**: CDN for static assets
- **Lazy Loading**: Efficient data loading patterns

## Integration Points

### External Service Integration
- **Authentication Service**: User login and session management
- **Payment Services**: Credit card processing
- **Messaging Service**: Email notifications
- **Reservation Saga**: Workflow orchestration
- **Commerce Service**: Pricing and inventory

### Database Integration
- **Oracle Database**: Primary data store
- **Hibernate ORM**: Object-relational mapping
- **Connection Pooling**: Database connection management
- **Transaction Management**: ACID compliance
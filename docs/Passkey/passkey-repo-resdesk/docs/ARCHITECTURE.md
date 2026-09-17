# Architecture

## System Overview

Passkey Resdesk follows a traditional Java EE multi-tier architecture deployed on WildFly application server. The system is organized as a multi-module Maven project with clear separation of concerns across different layers.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
│  (Web Browsers, Call Center Apps, Mobile Clients)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Web Layer (WAR)                          │
│  • Servlets & JSPs                                          │
│  • REST Endpoints                                           │
│  • Web Resources & Static Content                           │
│  • XSS Protection                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Business Layer (EJB)                        │
│  • Session Beans                                            │
│  • Business Logic                                           │
│  • Transaction Management                                   │
│  • Service Integration                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Core Layer (JAR)                          │
│  • Domain Models                                            │
│  • Shared Utilities                                         │
│  • Common Interfaces                                        │
│  • Data Transfer Objects                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 External Services                           │
│  • Database (Oracle)                                        │
│  • Passkey Microservices                                    │
│  • Authentication Service                                   │
│  • Messaging Systems                                        │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

### Core Module (`packages/app/core`)
- **Purpose**: Contains shared domain models, utilities, and common interfaces
- **Key Components**:
  - Domain entities and DTOs
  - Utility classes
  - Common interfaces
  - Shared constants and enums

### EJB Module (`packages/app/ejb`)
- **Purpose**: Business logic layer with Enterprise Java Beans
- **Key Components**:
  - Session beans for business operations
  - Service layer implementations
  - Transaction management
  - Integration with external services
  - Message-driven beans for async processing

### Web Module (`packages/app/web`)
- **Purpose**: Web presentation layer
- **Key Components**:
  - Servlets for HTTP request handling
  - JSP pages for dynamic content
  - REST endpoints for API access
  - Static web resources (CSS, JavaScript, images)
  - Web security configurations
  - Call center interface components

### EAR Module (`packages/app/ear`)
- **Purpose**: Enterprise Application Archive for deployment
- **Key Components**:
  - Application deployment descriptor
  - Module packaging and dependencies
  - WildFly-specific configurations

### Additional Modules

#### Malware Scanner (`packages/app/malware-scanner`)
- **Purpose**: Provides malware scanning capabilities
- **Integration**: ClamAV-based virus scanning for uploaded files

#### Configs (`packages/app/configs`)
- **Purpose**: Environment-specific configurations
- **Components**: Hogan template configurations for different environments

## Design Patterns

### Layered Architecture
- Clear separation between presentation, business, and data access layers
- Each layer only communicates with adjacent layers
- Promotes maintainability and testability

### Service Layer Pattern
- Business logic encapsulated in service classes
- Transaction boundaries defined at service level
- Promotes reusability across different presentation layers

### Data Transfer Object (DTO) Pattern
- Separate objects for data transfer between layers
- Reduces coupling between layers
- Optimizes network communication

### Dependency Injection
- Uses Java EE CDI for dependency management
- Promotes loose coupling and testability
- Configured through annotations and XML

## Data Flow

### Typical Request Flow
1. **Web Request**: Client sends HTTP request to web layer
2. **Servlet Processing**: Servlet receives and validates request
3. **Business Logic**: EJB session beans process business operations
4. **Data Access**: Core layer entities interact with database
5. **External Services**: Integration with Passkey microservices as needed
6. **Response**: Results formatted and returned to client

### Asynchronous Processing
- Message-driven beans handle async operations
- Integration with messaging systems for event processing
- Background tasks for reservation processing and notifications

## Integration Architecture

### Microservices Integration
- RESTful API calls to Passkey services
- Service discovery through configuration
- Circuit breaker patterns for resilience
- Retry mechanisms for transient failures

### Database Integration
- Oracle database connectivity
- Connection pooling through WildFly data sources
- Transaction management via JTA
- Hibernate ORM for object-relational mapping

### Security Architecture
- Authentication through passkey-authentication-service
- Authorization based on user roles and permissions
- XSS protection for web inputs
- HTTPS encryption for all communications

## Deployment Architecture

### WildFly Application Server
- **Version**: 16.0.0.Final
- **Configuration**: Custom standalone configuration files
- **Modules**: Custom modules for shared libraries
- **Data Sources**: Configured Oracle database connections
- **Security Domains**: Custom security configurations

### Environment Configuration
- **Development**: Local WildFly with dev database
- **Staging**: Shared staging environment
- **Production**: Clustered production deployment
- **Configuration Management**: Hogan templates for environment-specific settings

## Monitoring and Observability

### Logging
- Log4j2 for application logging
- Structured logging with correlation IDs
- Separate log files for different components
- Centralized log aggregation

### Metrics
- JMX beans for application metrics
- WildFly management interface
- Custom business metrics
- Integration with Datadog for monitoring

### Health Checks
- Application health endpoints
- Database connectivity checks
- External service dependency checks
- Automated alerting on failures
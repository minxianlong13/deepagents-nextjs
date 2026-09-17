# Architecture

## System Overview

The Passkey Integration Spring Boot Service follows a layered architecture pattern within a TypeScript monorepo structure. The service is built using Spring Boot and provides RESTful APIs for integrating Passkey with hotel management systems.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (Hotel Management Systems)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                 API Gateway / Load Balancer                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│            Passkey Integration Service                       │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   Controllers   │    Services     │      DAOs       │    │
│  │   (REST API)    │ (Business Logic)│  (Data Access)  │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Oracle Database                             │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Controller Layer
- **Location**: `com.cvent.passkeyintegration.controllers`
- **Purpose**: Handles HTTP requests and responses, input validation, and API routing
- **Key Classes**:
  - `UserController` - Manages user-related API endpoints

### Service Layer
- **Location**: `com.cvent.passkeyintegration.service`
- **Purpose**: Contains business logic and orchestrates data operations
- **Key Classes**:
  - `UsersService` - Interface defining user operations
  - `UsersServiceImpl` - Implementation of user business logic

### Data Access Layer
- **Location**: `com.cvent.passkeyintegration.dao`
- **Purpose**: Handles database operations using MyBatis ORM
- **Key Classes**:
  - MyBatis mappers for database operations

### Configuration Layer
- **Location**: `com.cvent.passkeyintegration.config`
- **Purpose**: Application configuration and bean definitions
- **Key Classes**:
  - `PasskeyIntegrationConfiguration` - Main configuration class

### Authentication Layer
- **Location**: `com.cvent.passkeyintegration.auth`
- **Purpose**: Handles OAuth authentication and authorization
- **Integration**: Cvent OAuth framework

### Health Monitoring
- **Location**: `com.cvent.passkeyintegration.health`
- **Purpose**: Application health checks and monitoring endpoints

## Data Flow

### User Request Flow
1. **Client Request**: Hotel management system sends HTTP request
2. **Authentication**: OAuth token validation through Cvent framework
3. **Controller**: `UserController` receives and validates request
4. **Service Layer**: `UsersService` processes business logic
5. **Data Access**: DAO layer queries Oracle database via MyBatis
6. **Response**: Data flows back through layers to client

### Configuration Flow
1. **Startup**: Spring Boot loads configuration from YAML files
2. **Environment Detection**: Service determines runtime environment
3. **Bean Creation**: Spring context initializes service beans
4. **Database Connection**: MyBatis establishes Oracle database connection
5. **Health Checks**: Monitoring endpoints become available

## Design Patterns

### Layered Architecture
- **Presentation Layer**: Controllers handle HTTP concerns
- **Business Layer**: Services contain domain logic
- **Data Layer**: DAOs manage persistence operations
- **Cross-cutting**: Configuration, security, and monitoring

### Dependency Injection
- Spring Boot's IoC container manages bean lifecycle
- Constructor injection for required dependencies
- Interface-based design for testability

### Repository Pattern
- MyBatis mappers abstract database operations
- Service layer remains database-agnostic
- Enables easy testing with mock implementations

### Configuration Pattern
- Environment-specific YAML configurations
- Spring profiles for different deployment environments
- Externalized configuration for flexibility

## Module Structure

### Monorepo Organization
```
passkey-integration-sb/
├── packages/
│   └── passkey-integration/
│       ├── parent/           # Maven parent POM
│       ├── java-client/      # Java client library
│       ├── service/          # Main Spring Boot service
│       ├── it/              # Integration tests
│       └── infra/           # Infrastructure code
├── .github/                 # GitHub workflows
├── assets/                  # Static assets
└── docs/                   # Documentation
```

### Service Module Structure
```
service/
├── src/main/java/com/cvent/passkeyintegration/
│   ├── PasskeyIntegrationApplication.java    # Main application class
│   ├── PasskeyIntegrationConfiguration.java # Configuration
│   ├── controllers/         # REST controllers
│   ├── service/            # Business logic
│   ├── dao/               # Data access objects
│   ├── config/            # Configuration classes
│   ├── auth/              # Authentication components
│   └── health/            # Health check components
├── src/main/resources/     # Configuration files
├── configs/               # Environment configurations
└── pom.xml               # Maven configuration
```

## Security Architecture

### Authentication
- **OAuth 2.0**: Cvent's OAuth framework for token-based authentication
- **Scopes**: Role-based access control with READ_ONLY scope
- **Token Validation**: Automatic token validation on protected endpoints

### Authorization
- **Annotation-based**: `@CventAuthorization` for endpoint protection
- **Scope-based**: Fine-grained permissions using OAuth scopes
- **Environment-aware**: Different security configurations per environment

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables multiple instances
- Load balancer distributes requests across instances
- Database connection pooling for efficient resource usage

### Performance Optimization
- MyBatis for efficient database operations
- Connection pooling to minimize database overhead
- Caching strategies for frequently accessed data

### Monitoring and Observability
- Cvent Observability Framework integration
- Application metrics and health endpoints
- Distributed tracing for request flow analysis

## Integration Points

### External Systems
- **Hotel Management Systems**: Primary integration target
- **Cvent OAuth Service**: Authentication provider
- **Oracle Database**: Primary data store
- **Cvent Observability Platform**: Monitoring and logging

### Internal Services
- **Passkey Core Services**: Main platform integration
- **Cvent Common Libraries**: Shared functionality
- **CDF Framework**: Cvent Development Framework integration

## Deployment Architecture

### Container Strategy
- Docker-based containerization
- AWS ECS for container orchestration
- Environment-specific container configurations

### Infrastructure as Code
- AWS CDK for infrastructure provisioning
- TypeScript-based infrastructure definitions
- Environment-specific deployments

### CI/CD Pipeline
- Jenkins-based continuous integration
- Nx monorepo build optimization
- Automated testing and deployment
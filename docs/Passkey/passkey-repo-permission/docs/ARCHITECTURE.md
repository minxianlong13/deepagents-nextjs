# Architecture

## System Overview

The Passkey Permission Service follows a layered architecture pattern built on the Dropwizard framework. It implements a multi-module Maven structure that separates concerns across API definitions, business logic, data access, and service implementation.

**Dual Permission Architecture**: The service operates two coexisting permission systems:
1. **Legacy Database-Driven System**: Traditional Oracle database storage via data-access layer
2. **Modern Strategy Pattern System**: Code-driven contextual permissions using ContextStrategy implementations

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (Resdesk, Other Passkey Services)             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                 JAX-RS Resources                            │
│         (PasskeyPermissionResource, OpenApiResource)       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Service Layer                               │
│  PermissionService | ContextPermissionService |            │
│              GlobalNavigationService                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Context & Caching Layer                       │
│    PermissionContext | CacheManager | Decorators          │
│                 ContextStrategy Implementations            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Data Access Layer                           │
│              (passkey-permission-data-access)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              External Dependencies                         │
│           Auth Service | Database | Other APIs            │
└─────────────────────────────────────────────────────────────┘
```

## Components

### PasskeyPermissionServiceApplication
- **Purpose**: Main application entry point and Dropwizard configuration
- **Location**: `passkey-permission-service/src/main/java/com/cvent/passkey/permission/`
- **Key Classes**: 
  - `PasskeyPermissionServiceApplication.java` - Application bootstrap
  - `PasskeyPermissionServiceConfiguration.java` - Configuration management

### API Layer (passkey-permission-api)
- **Purpose**: Defines API contracts, data models, and OpenAPI specifications
- **Location**: `passkey-permission-api/`
- **Key Classes**:
  - Navigation models: `NavigationResponse`, `AppSwitcherItem`, `AppSwitcherSection`
  - Permission models: `Permission`, `ContextType`
  - User metadata: `UserMetadata`

### Resource Layer
- **Purpose**: REST endpoint implementations using JAX-RS
- **Location**: `passkey-permission-service/src/main/java/com/cvent/passkey/permission/resources/`
- **Key Classes**:
  - `PasskeyPermissionResource.java` - Main API endpoints
  - `OpenApiResource.java` - API documentation endpoints

### Service Layer
- **Purpose**: Business logic implementation and orchestration
- **Location**: `passkey-permission-service/src/main/java/com/cvent/passkey/permission/services/`
- **Key Classes**:
  - `PermissionService.java` - Core permission logic
  - `ContextPermissionService.java` - Context-aware permissions
  - `GlobalNavigationService.java` - Navigation menu generation

### Context Management
- **Purpose**: Handles different permission contexts and caching
- **Location**: `passkey-permission-service/src/main/java/com/cvent/passkey/permission/services/context/`
- **Key Classes**:
  - `PermissionContext.java` - Context abstraction
  - `CacheManager.java` - Caching implementation
  - Decorators: `UserDecorator`, `EventDecorator`, `HotelDecorator`, `ParticipantDecorator`

### Strategy Pattern Implementation
- **Purpose**: Modern code-driven contextual permission logic
- **Location**: `passkey-permission-service/src/main/java/com/cvent/passkey/permission/services/context/strategy/`
- **Key Components**:
  - `ContextStrategy.java` - Interface defining strategy contract
  - Context implementations: `event/`, `hotel/`, `reservation/`, `inventory/`, `reglink/`, `roomList/`, `waitList/`, `groupLink/`
  - Each strategy provides context-specific permission evaluation logic

### Data Access Layer (passkey-permission-data-access)
- **Purpose**: Database interactions and data persistence
- **Location**: `passkey-permission-data-access/`
- **Key Responsibilities**:
  - Database connection management
  - Data access objects (DAOs)
  - Query implementations

## Permission System Architectures

The service implements two coexisting permission architectures that serve different use cases:

### Legacy Database-Driven Architecture
- **Storage**: Oracle database via passkey-permission-data-access module
- **Use Cases**: Basic permission lookups, traditional role-based access control, module privileges
- **Flow**: Request → Service Layer → Data Access Layer → Database → Response
- **Characteristics**: Simple, reliable, well-established patterns
- **Status**: Legacy but actively maintained for existing functionality

### Modern Strategy Pattern Architecture
- **Storage**: Code-based implementations in strategy classes
- **Use Cases**: Complex contextual permissions, dynamic business rules, advanced authorization logic
- **Flow**: Request → Service Layer → ContextStrategy → Business Logic → Response
- **Location**: `services/context/strategy/` with implementations for:
  - `event/` - Event-specific permission logic
  - `hotel/` - Hotel management permissions
  - `reservation/` - Booking and reservation permissions
  - `inventory/` - Inventory management permissions
  - `reglink/` - Registration link permissions
  - `roomList/` - Room listing permissions
  - `waitList/` - Waitlist management permissions
  - `groupLink/` - Group booking permissions
- **Characteristics**: Flexible, maintainable, supports complex business rules
- **Status**: Modern approach for new features and complex authorization needs

### System Coexistence
Both systems operate simultaneously within the same service:
- **Routing**: Service layer determines which system to use based on request type and context
- **Caching**: Shared caching layer supports both architectures
- **Performance**: Strategy pattern system provides faster execution for complex logic
- **Maintenance**: Database system handles simple cases, strategy system handles complex cases

## Data Flow

### Permission Query Flow
1. **Client Request**: External service requests permissions via REST API
2. **Authentication**: Auth-service validates API key or bearer token
3. **Context Resolution**: Service determines the appropriate permission context
4. **Cache Check**: System checks if permissions are cached
5. **Data Retrieval**: If not cached, retrieves permissions from data source
6. **Context Decoration**: Applies context-specific decorators
7. **Response**: Returns formatted permission data

### Global Navigation Flow
1. **Authentication**: Bearer token validation and user metadata extraction
2. **Permission Resolution**: Determines user's available permissions
3. **Menu Generation**: Builds navigation structure based on permissions
4. **URL Generation**: Creates appropriate URLs with event context if provided
5. **Response**: Returns structured navigation response

## Design Patterns

### Layered Architecture
- Clear separation between presentation, business, and data layers
- Each layer has specific responsibilities and dependencies flow downward

### Strategy Pattern
- `ContextStrategy` interface with multiple implementations for different business contexts
- Enables flexible, maintainable permission logic without complex conditional statements
- Located in `services/context/strategy/` with context-specific implementations

### Decorator Pattern
- Context decorators (`UserDecorator`, `EventDecorator`, etc.) enhance permission contexts
- Allows flexible composition of permission logic based on context type

### Service Layer Pattern
- Business logic encapsulated in service classes
- Services orchestrate between resources and data access layers

### Repository Pattern (Implied)
- Data access layer abstracts database operations
- Provides clean interface for data persistence operations

### Caching Pattern
- `CacheManager` implements caching strategy for performance
- Reduces database load for frequently accessed permissions

## Module Structure

### passkey-permission-parent (Root)
- **Type**: Maven parent POM
- **Purpose**: Dependency management and build configuration
- **Key Files**: `pom.xml`

### passkey-permission-api
- **Type**: API definition module
- **Purpose**: Shared contracts and models
- **Dependencies**: Minimal - only core libraries
- **Artifacts**: JAR with API classes and OpenAPI specifications

### passkey-permission-service
- **Type**: Main service implementation
- **Purpose**: Business logic and REST endpoints
- **Dependencies**: API module, auth-service, passkey-microservices-common
- **Artifacts**: Executable JAR

### passkey-permission-data-access
- **Type**: Data layer module
- **Purpose**: Database interactions
- **Dependencies**: API module, database drivers
- **Artifacts**: JAR with DAO implementations

### passkey-permission-java-client
- **Type**: Client library
- **Purpose**: Java client for consuming the service
- **Dependencies**: API module, HTTP client libraries
- **Artifacts**: JAR for client applications

### passkey-permission-integration-test
- **Type**: Integration test module
- **Purpose**: End-to-end testing
- **Dependencies**: Service module, test frameworks
- **Artifacts**: Test reports

### passkey-permission-load-test
- **Type**: Performance test module
- **Purpose**: Load and performance testing
- **Dependencies**: Test frameworks, load testing tools
- **Artifacts**: Performance test reports

## Security Architecture

### Authentication
- API Key authentication for service-to-service calls
- Bearer token authentication for user-context operations
- Integration with Cvent's auth-service for token validation

### Authorization
- Context-aware permission checking
- Role-based access control through permission system
- Fine-grained permissions based on business contexts

### Data Protection
- Secure handling of user metadata
- Proper token validation and extraction
- Error handling that doesn't leak sensitive information
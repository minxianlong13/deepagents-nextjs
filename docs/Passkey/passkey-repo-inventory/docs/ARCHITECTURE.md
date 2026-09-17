# Architecture

## System Overview

The Passkey Inventory Service follows a multi-module Maven architecture built on the Dropwizard framework. It implements a layered architecture pattern with clear separation of concerns between API, business logic, data access, and shared components.

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
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   Resources     │    Services     │   Data Access   │   │
│  │   (REST API)    │  (Business      │   (Repository   │   │
│  │                 │   Logic)        │    Layer)       │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Database Layer                           │
│              (PostgreSQL/MySQL)                             │
└─────────────────────────────────────────────────────────────┘
```

## Components

### passkey-inventory-api
- **Purpose**: Defines API contracts, DTOs, and shared models
- **Location**: `passkey-inventory-api/`
- **Key Classes**: Request/Response models, API interfaces

### passkey-inventory-service
- **Purpose**: Main service implementation with REST endpoints
- **Location**: `passkey-inventory-service/`
- **Key Classes**:
  - `PasskeyInventoryServiceApplication` - Main application entry point
  - `PasskeyInventoryResource` - Primary REST resource
  - `BlockResource` - Block-specific operations
  - `AdminInventoryResource` - Administrative operations
  - `EventInventorySummaryResource` - Event summary operations

### passkey-inventory-data-access
- **Purpose**: Data access layer with repositories and DAOs
- **Location**: `passkey-inventory-data-access/`
- **Key Classes**: Repository implementations, database mappers

### passkey-inventory-shared
- **Purpose**: Shared utilities and common components
- **Location**: `passkey-inventory-shared/`
- **Key Classes**: Utility classes, shared configurations

### passkey-inventory-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-inventory-java-client/`
- **Key Classes**: Client interfaces and implementations

### passkey-inventory-integration-test
- **Purpose**: Integration test suite using Karate framework
- **Location**: `passkey-inventory-integration-test/`
- **Key Classes**: Karate feature files and test configurations

## Data Flow

### Inventory Request Flow
1. **Client Request**: External service makes REST call to inventory endpoint
2. **Authentication**: Auth service validates API key or bearer token
3. **Authorization**: Service checks user permissions for requested operation
4. **Validation**: Request parameters and payload validated
5. **Business Logic**: Service layer processes inventory logic
6. **Data Access**: Repository layer interacts with database
7. **Response**: Formatted response returned to client

### Availability Check Flow
1. **Availability Request**: Client requests room availability for date range
2. **Filter Processing**: Query parameters processed and validated
3. **Database Query**: Complex queries executed to check availability
4. **Business Rules**: Availability rules and constraints applied
5. **Response Assembly**: Availability data formatted and returned

## Design Patterns

### Repository Pattern
- Abstracts data access logic from business logic
- Provides clean interface for database operations
- Enables easier testing with mock repositories

### Service Layer Pattern
- Encapsulates business logic in dedicated service classes
- Provides transaction boundaries
- Coordinates between multiple repositories

### Resource Pattern (JAX-RS)
- REST endpoints defined as resource classes
- Clear separation of HTTP concerns from business logic
- Standardized request/response handling

### Dependency Injection
- Uses Dropwizard's built-in DI container
- Constructor injection for better testability
- Configuration-driven component wiring

## Module Structure

```
passkey-inventory/
├── passkey-inventory-api/           # API contracts and models
│   └── src/main/java/
│       └── com/cvent/passkey/inventory/
│           ├── model/               # Request/Response DTOs
│           └── api/                 # API interfaces
├── passkey-inventory-service/       # Main service implementation
│   ├── src/main/java/
│   │   └── com/cvent/passkey/inventory/
│   │       ├── resources/           # REST endpoints
│   │       ├── services/            # Business logic
│   │       └── configuration/       # Service configuration
│   └── configs/                     # Environment configurations
├── passkey-inventory-data-access/   # Data access layer
│   └── src/main/java/
│       └── com/cvent/passkey/inventory/
│           ├── repositories/        # Data repositories
│           └── mappers/             # Database mappers
├── passkey-inventory-shared/        # Shared utilities
├── passkey-inventory-java-client/   # Client library
└── passkey-inventory-integration-test/ # Integration tests
```

## Security Architecture

### Authentication
- API Key authentication for service-to-service calls
- Bearer token authentication for user-initiated requests
- Integration with Cvent's auth-service

### Authorization
- Role-based access control
- Resource-level permissions
- Environment-specific access controls

### Data Protection
- Input validation and sanitization
- SQL injection prevention through parameterized queries
- Sensitive data logging restrictions

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables horizontal scaling
- Load balancer distributes requests across instances
- Database connection pooling for efficient resource usage

### Caching Strategy
- Application-level caching for frequently accessed data
- Database query optimization
- Connection pooling and prepared statements

### Performance Optimization
- Pagination for large result sets
- Efficient database indexing
- Asynchronous processing where appropriate
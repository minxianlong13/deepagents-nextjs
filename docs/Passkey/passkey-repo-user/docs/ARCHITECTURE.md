# Architecture

## System Overview

The Passkey User Service follows a layered architecture pattern built on Dropwizard framework. It implements a multi-module Maven structure that separates concerns across API contracts, business logic, data access, and client libraries.

```
┌─────────────────────────────────────────────────────────────┐
│                    External Clients                         │
├─────────────────────────────────────────────────────────────┤
│                  JAX-RS Resources                           │
│  UserDetails | Favorites | Preferences | Participants      │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer                             │
│     UserDetailsService | FavoritesService                  │
├─────────────────────────────────────────────────────────────┤
│                  Data Access Layer                          │
│              UserDetailsDataAccess                          │
├─────────────────────────────────────────────────────────────┤
│                   Oracle Database                           │
└─────────────────────────────────────────────────────────────┘
```

## Components

### API Layer (`passkey-user-api`)
- **Purpose**: Defines API contracts, models, and DTOs
- **Location**: `passkey-user-api/src/main/java/com/cvent/passkeyuser/model/`
- **Key Classes**:
  - `UserDetails`: Core user information model
  - `UpdateUserDetailsRequest`: Request model for user updates
  - `UserPreferences`: User preference settings
  - `UserFavorites`: User favorite properties

### Service Layer (`passkey-user-service`)
- **Purpose**: Contains business logic, REST resources, and application configuration
- **Location**: `passkey-user-service/src/main/java/com/cvent/passkeyuser/`
- **Key Classes**:
  - `PasskeyUserServiceApplication`: Dropwizard application entry point
  - `UserDetailsResource`: REST endpoints for user details
  - `PasskeyUserFavouritesResource`: Favorites management endpoints
  - `PasskeyUserPreferencesResource`: User preferences endpoints
  - `UserDetailsService`: Business logic for user operations

### Data Access Layer (`passkey-user-data-access`)
- **Purpose**: Database interactions and data persistence
- **Location**: `passkey-user-data-access/src/main/java/com/cvent/passkeyuser/dataaccess/`
- **Key Classes**:
  - `UserDetailsDataAccess`: Database operations for user details
  - Database mappers and DAOs

### Client Library (`passkey-user-java-client`)
- **Purpose**: Java client for consuming the service
- **Location**: `passkey-user-java-client/src/main/java/com/cvent/passkeyuser/client/`
- **Key Classes**:
  - `PasskeyUserDetailsClient`: Client for user details operations
  - `PasskeyUserFavouritesClient`: Client for favorites operations

### Testing Modules
- **Integration Tests** (`passkey-user-integration-test`): Karate-based API tests
- **Load Tests** (`passkey-user-load-test`): Performance testing

## Data Flow

### User Details Retrieval
1. Client sends GET request to `/passkey-user/v1/user-details/{userId}`
2. `UserDetailsResource` validates request and extracts user ID
3. `UserDetailsService` processes business logic
4. `UserDetailsDataAccess` queries Oracle database
5. Response flows back through layers with proper error handling

### User Details Update
1. Client sends PUT request with user details payload
2. Resource layer validates request structure and authorization
3. Service layer applies business rules and validation
4. Data access layer persists changes to database
5. Success response returned to client

## Design Patterns

### Repository Pattern
- Data access layer abstracts database operations
- Service layer depends on interfaces, not concrete implementations
- Enables easier testing and database technology changes

### Immutable Objects
- Uses Immutables library for value objects
- Ensures thread safety and prevents accidental mutations
- Simplifies reasoning about data flow

### Dependency Injection
- Dropwizard's built-in DI container manages object lifecycle
- Constructor injection for better testability
- Configuration-driven service setup

### RESTful API Design
- Resource-oriented URLs
- HTTP methods map to CRUD operations
- Consistent error response format
- OpenAPI/Swagger documentation

## Module Structure

### Maven Multi-Module Layout
```
passkey-user-parent/
├── passkey-user-api/           # API contracts (JAR)
├── passkey-user-data-access/   # Data layer (JAR)
├── passkey-user-service/       # Main service (executable JAR)
├── passkey-user-java-client/   # Client library (JAR)
├── passkey-user-integration-test/  # Integration tests
└── passkey-user-load-test/     # Load tests
```

### Build Profiles
- **default**: Builds all modules except tests
- **run-it**: Runs integration tests
- **run-load**: Executes load tests
- **release**: Production build with optimizations

## Security Architecture

### Authentication
- API Key-based authentication via Auth Service integration
- `@Authority` annotations on resource methods
- `GrantedAPIKey` injection for request context

### Authorization
- Method-level security controls
- Private API visibility (`cvent-visibility: private`)
- Request validation and sanitization

## Configuration Management

### Environment-Specific Configs
- `configs/dev.yaml`: Development environment
- `configs/alpha.yaml`: Alpha testing environment
- `configs/ts50.yaml`: Test environment
- `configs/sg50.yaml`: Production environment

### Configuration Structure
- Database connection settings
- Service discovery configuration
- Logging and monitoring setup
- Feature flags and toggles

## Error Handling

### Standardized Error Responses
- Consistent `ErrorResponse` format across all endpoints
- HTTP status codes follow REST conventions
- Detailed error messages for debugging
- Error code enumeration for client handling

### Exception Handling Strategy
- Global exception mappers in Dropwizard
- Business logic exceptions mapped to appropriate HTTP status
- Database exceptions handled gracefully
- Validation errors provide specific field information

## Monitoring and Observability

### Health Checks
- Database connectivity checks
- Dependency service health validation
- Custom business logic health indicators

### Metrics and Logging
- Dropwizard metrics integration
- Structured logging with correlation IDs
- Performance monitoring via Datadog
- Request/response logging for debugging
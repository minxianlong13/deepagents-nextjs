# Architecture

## System Overview

The Passkey Bridge Service follows a multi-module Maven architecture using the Dropwizard framework. It implements a layered architecture pattern with clear separation between API contracts, business logic, data access, and service layers.

## Components

### passkey-bridge-api
- **Purpose**: Defines API contracts and data models
- **Location**: `passkey-bridge-api/`
- **Key Classes**: 
  - `Registration.java` - Core registration entity
  - `RegAssociation.java` - Registration-reservation association
  - `Guest.java`, `Address.java`, `PayInfo.java` - Supporting domain models

### passkey-bridge-service
- **Purpose**: Main service implementation with REST endpoints
- **Location**: `passkey-bridge-service/`
- **Key Classes**:
  - `RegistrationResource.java` - Registration CRUD operations
  - `AssociationResource.java` - Association management
  - `RegistrationService.java` - Business logic layer
  - `AssociationService.java` - Association business logic

### passkey-bridge-data-access
- **Purpose**: Database access layer and persistence logic
- **Location**: `passkey-bridge-data-access/`
- **Key Classes**: Repository and DAO implementations

### passkey-bridge-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-bridge-java-client/`
- **Key Classes**: `PasskeyBridgeClient.java`

### passkey-bridge-shared
- **Purpose**: Shared utilities and common code
- **Location**: `passkey-bridge-shared/`
- **Key Classes**: Constants, utilities, and shared configurations

### passkey-bridge-integration-test
- **Purpose**: Karate-based integration tests
- **Location**: `passkey-bridge-integration-test/`
- **Key Classes**: `PasskeyBridgeKarateTestIT.java`

## Data Flow

1. **Registration Creation**:
   - Client sends POST request to `/registrations`
   - RegistrationResource validates input
   - RegistrationService processes business logic
   - Data Access layer persists to database
   - Registration number returned to client

2. **Association Management**:
   - Client links registration to reservation via POST `/registrations/{regNum}/reservations/{confNum}`
   - AssociationResource handles the request
   - AssociationService manages the link/unlink logic
   - Database updated with association data

3. **Data Retrieval**:
   - GET requests retrieve registration data
   - Service layer applies business rules
   - Data transformed and returned as JSON

## Design Patterns

### Repository Pattern
- Data access abstracted through repository interfaces
- Separation of business logic from persistence concerns

### Service Layer Pattern
- Business logic encapsulated in service classes
- Clear separation between REST layer and business logic

### Immutable Objects
- Uses Immutables library for data models
- Thread-safe and predictable object behavior

### Dependency Injection
- Dropwizard's built-in DI for service composition
- Constructor injection for better testability

## Module Structure

```
passkey-bridge/
├── passkey-bridge-api/           # API contracts
│   └── src/main/java/com/cvent/passkey/bridge/model/
├── passkey-bridge-service/       # Main service
│   ├── src/main/java/com/cvent/passkey/bridge/resources/
│   ├── src/main/java/com/cvent/passkey/bridge/service/
│   └── configs/                  # Environment configurations
├── passkey-bridge-data-access/   # Data layer
├── passkey-bridge-java-client/   # Client library
├── passkey-bridge-shared/        # Shared utilities
└── passkey-bridge-integration-test/ # Integration tests
```

## Security Architecture

- **Authentication**: API Key-based authentication via Auth Service
- **Authorization**: Method-level security with `@Authority` annotations
- **Request Validation**: Jakarta validation on all input models
- **Logging**: Structured logging with request context

## Scalability Considerations

- **Stateless Design**: No server-side session state
- **Database Connection Pooling**: Efficient database resource management
- **Caching**: Potential for caching frequently accessed data
- **Horizontal Scaling**: Service can be scaled horizontally behind load balancer

## Integration Points

- **Auth Service**: For API key validation and user context
- **Database**: Primary data store for registrations and associations
- **Monitoring**: Datadog for APM and logging
- **CI/CD**: Jenkins for automated builds and deployments
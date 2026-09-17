# Architecture

## System Overview

The Passkey Addons Service follows a multi-module Maven architecture using the Dropwizard framework. It implements a layered architecture pattern with clear separation of concerns between API, service, and data access layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (Reservation Orchestrator, etc.)               │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────────┐
│                  Passkey Addons Service                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │   Resources     │ │    Services     │ │  Data Access  │  │
│  │   (REST API)    │ │  (Business      │ │   (DAO/       │  │
│  │                 │ │   Logic)        │ │   Repository) │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ JDBC
┌─────────────────────────▼───────────────────────────────────┐
│                    Oracle Database                          │
└─────────────────────────────────────────────────────────────┘
```

## Components

### API Layer (`passkey-addons-api`)
- **Purpose**: Defines data models and error types shared across modules
- **Location**: `passkey-addons-api/src/main/java/com/cvent/passkey/addons`
- **Key Classes**:
  - `Addon.java` - Core add-on entity
  - `MarketableAddon.java` - Add-ons available for purchase
  - `ReservationAddon.java` - Add-ons associated with reservations
  - Error types and validation models

### Service Layer (`passkey-addons-service`)
- **Purpose**: REST API endpoints and business logic orchestration
- **Location**: `passkey-addons-service/src/main/java/com/cvent/passkey/addons`
- **Key Classes**:
  - `PasskeyAddonsServiceApplication.java` - Dropwizard application entry point
  - `PasskeyAddonsResource.java` - Main REST endpoints
  - `AdminResource.java` - Administrative endpoints
  - `ReservationProcessingResource.java` - Reservation-specific operations
  - `AddonsService.java` - Core business logic

### Data Access Layer (`passkey-addons-data-access`)
- **Purpose**: Database interactions and data persistence
- **Location**: `passkey-addons-data-access/src/main/java/com/cvent/passkey/addons`
- **Key Components**:
  - DAO classes for database operations
  - Entity mappings
  - Database schema management

### Java Client (`passkey-addons-java-client`)
- **Purpose**: Provides a Java client library for consuming the service
- **Location**: `passkey-addons-java-client/src/main/java`
- **Features**:
  - Type-safe API client
  - Retrofit-based HTTP client
  - Request/response models

### Integration Tests (`passkey-addons-integration-test`)
- **Purpose**: End-to-end testing using Karate framework
- **Location**: `passkey-addons-integration-test/src/test`
- **Features**:
  - API contract testing
  - Environment-specific test configurations
  - Automated test execution in CI/CD

## Data Flow

### Marketable Add-on Creation
1. Client sends POST request to `/passkey-addons/v2/marketable-addons`
2. `PasskeyAddonsResource` validates the request
3. `AddonsService` processes business logic
4. Data Access layer persists to Oracle database
5. Response returned with created add-on details

### Reservation Add-on Association
1. Client sends POST request to `/passkey-addons/v2/reservation-addons/{confirmationNumber}`
2. Service validates reservation exists
3. Add-on associations are created in database
4. Response includes associated add-on details

### Add-on Retrieval
1. Client requests add-ons via GET endpoints
2. Service queries database through Data Access layer
3. Results are filtered and formatted
4. JSON response returned to client

## Design Patterns

### Repository Pattern
- Data Access layer implements repository pattern for database operations
- Separation of data access logic from business logic
- Testable and maintainable data operations

### Service Layer Pattern
- Business logic encapsulated in service classes
- Clear separation between REST controllers and business operations
- Reusable business logic across different endpoints

### Builder Pattern
- Immutable objects using builder pattern (e.g., `ImmutableMarketableAddonRequest`)
- Type-safe object construction
- Validation at build time

### Dependency Injection
- Dropwizard's built-in dependency injection
- Constructor-based injection for testability
- Configuration-driven service setup

## Module Structure

```
passkey-addons/
├── passkey-addons-api/              # Shared models and contracts
│   ├── src/main/java/
│   │   └── com/cvent/passkey/addons/
│   │       ├── model/               # Domain models
│   │       └── error/               # Error definitions
│   └── pom.xml
├── passkey-addons-service/          # Main service implementation
│   ├── src/main/java/
│   │   └── com/cvent/passkey/addons/
│   │       ├── resources/           # REST endpoints
│   │       ├── services/            # Business logic
│   │       ├── health/              # Health checks
│   │       └── exception/           # Exception handling
│   ├── configs/                     # Configuration files
│   └── pom.xml
├── passkey-addons-data-access/      # Database layer
│   ├── src/main/java/
│   └── pom.xml
├── passkey-addons-java-client/      # Client library
│   ├── src/main/java/
│   └── pom.xml
├── passkey-addons-integration-test/ # Integration tests
│   ├── src/test/
│   └── pom.xml
└── pom.xml                          # Parent POM
```

## Security Architecture

### Authentication
- API Key-based authentication using Cvent's Auth Service
- `@Authority` annotations on endpoints
- Token validation for all requests

### Authorization
- Role-based access control
- Private API endpoints (not publicly exposed)
- Service-to-service authentication

### Data Protection
- Sensitive configuration via environment variables
- API keys not committed to source control
- Secure database connections

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Database connection pooling
- Load balancer compatible

### Performance
- Efficient database queries
- Connection pooling with Tomcat JDBC
- Caching strategies where appropriate

### Monitoring
- Dropwizard metrics integration
- Health check endpoints
- Logging with structured context
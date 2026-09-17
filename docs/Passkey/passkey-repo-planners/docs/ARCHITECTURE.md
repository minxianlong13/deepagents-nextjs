# Architecture

## System Overview

The Passkey Planners Service follows a layered architecture pattern built on the Dropwizard framework. It implements a multi-module Maven structure that separates concerns across API contracts, business logic, data access, and client integration.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Load Balancer                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Passkey Planners Service                       │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   Resources     │    Services     │  Data Access    │    │
│  │   (JAX-RS)      │   (Business)    │     (DAO)       │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Database                                  │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Resource Layer (JAX-RS)
- **Purpose**: HTTP endpoint handling and request/response processing
- **Location**: `passkey-planners-service/src/main/java/com/cvent/passkey/planners/resources/`
- **Key Classes**:
  - `PlannersInfoResource`: Main planner CRUD operations
  - `PlannersEventsResource`: Event-planner association management
  - `AdminPlannersResource`: Administrative operations
  - `OdysseyPlannersResource`: Odyssey-specific endpoints

### Service Layer
- **Purpose**: Business logic implementation and orchestration
- **Location**: `passkey-planners-service/src/main/java/com/cvent/passkey/planners/services/`
- **Key Classes**:
  - `PlannersInfoService`: Core planner business logic
  - `AdminService`: Administrative operations
  - `PlannersEventsService`: Event association logic

### Data Access Layer
- **Purpose**: Database operations and data persistence
- **Location**: `passkey-planners-data-access/src/main/java/com/cvent/passkey/planners/dataaccess/`
- **Key Classes**:
  - `PlannersDataAccess`: Main data access operations
  - `AdminDataAccess`: Administrative data operations

### API Models
- **Purpose**: Request/response models and data contracts
- **Location**: `passkey-planners-api/src/main/java/com/cvent/passkey/planners/model/`
- **Key Classes**:
  - `PlannersInfo`: Core planner entity
  - `CreatePlannerRequest`: Planner creation request model
  - `PlannersInfoSearchRequest`: Search request parameters

### Client Library
- **Purpose**: Java client for service integration
- **Location**: `passkey-planners-java-client/src/main/java/com/cvent/passkey/planners/client/`
- **Key Classes**:
  - `PasskeyPlannersInfoClient`: Main client interface
  - `PasskeyPlannersEventsAssociationClient`: Event association client

## Data Flow

### Planner Creation Flow
1. Client sends POST request to `/passkey-planners/v1/planners-setup`
2. `PlannersInfoResource` validates request and extracts planner data
3. `PlannersInfoService` processes business logic and validation
4. `PlannersDataAccess` persists planner information to database
5. Response with created planner details returned to client

### Planner Search Flow
1. Client sends GET request to `/passkey-planners/v1/planners` with search parameters
2. `PlannersInfoResource` processes search request and query parameters
3. `PlannersInfoService` applies business rules and field filtering
4. `PlannersDataAccess` executes database query with filters
5. Results formatted and returned to client

### Event Association Flow
1. Client requests planners for specific event via `/passkey-planners/v1/events/{eventId}/planners`
2. `PlannersInfoResource` validates event ID and planner type filters
3. `PlannersInfoService` applies permission-level filtering (EVENT_LEVEL, SBG_LEVEL, ANY_LEVEL)
4. `PlannersDataAccess` retrieves associated planners with proper permissions
5. Sorted and filtered results returned to client

## Design Patterns

### Repository Pattern
- Data access is abstracted through dedicated DAO classes
- Business logic is separated from data persistence concerns
- Enables easier testing and database technology changes

### Service Layer Pattern
- Business logic is centralized in service classes
- Resources delegate to services for processing
- Promotes code reuse and maintainability

### Immutable Objects Pattern
- API models use immutable builders (e.g., `ImmutablePlannersInfoSearchRequest`)
- Reduces bugs and improves thread safety
- Leverages libraries like Immutables for code generation

### Exception Mapping Pattern
- Custom exception mappers handle different error scenarios
- `ApplicationExceptionMapper` and `DatabaseExceptionMapper` provide consistent error responses
- Proper HTTP status codes and error messages returned to clients

## Module Structure

### passkey-planners-parent
- **Type**: POM aggregator
- **Purpose**: Manages dependencies and build configuration
- **Key Features**: Multi-profile builds, dependency management, code coverage

### passkey-planners-api
- **Type**: JAR library
- **Purpose**: API contracts and models
- **Dependencies**: Minimal - only validation and serialization libraries

### passkey-planners-service
- **Type**: Executable JAR (Dropwizard application)
- **Purpose**: Main service implementation
- **Dependencies**: Dropwizard, auth-service, passkey-microservices-common

### passkey-planners-data-access
- **Type**: JAR library
- **Purpose**: Database access layer
- **Dependencies**: Database drivers, connection pooling

### passkey-planners-java-client
- **Type**: JAR library
- **Purpose**: Client library for service integration
- **Dependencies**: HTTP client libraries, API models

### passkey-planners-shared
- **Type**: JAR library
- **Purpose**: Shared utilities and common code
- **Dependencies**: Minimal utility libraries

### passkey-planners-integration-test
- **Type**: Test JAR
- **Purpose**: End-to-end integration testing
- **Dependencies**: Karate testing framework, test utilities

## Security Architecture

### Authentication
- API Key-based authentication using Cvent's auth-service
- `@Authority` annotations on resource methods
- `GrantedAPIKey` parameter injection for authenticated requests

### Authorization
- Permission-based access control
- Different planner types (EVENT_LEVEL, SBG_LEVEL) with appropriate scoping
- Admin endpoints with elevated permissions

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables multiple instances
- Load balancer distributes requests across instances
- Database connection pooling manages resource usage

### Performance Optimization
- Selective field fetching in search operations
- Pagination support for large result sets
- Efficient database queries with proper indexing

### Monitoring and Observability
- Dropwizard metrics integration
- Datadog monitoring and alerting
- Structured logging for troubleshooting
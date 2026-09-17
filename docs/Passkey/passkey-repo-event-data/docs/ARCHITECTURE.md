# Architecture

## System Overview

The Passkey Event Data Service follows a layered architecture pattern built on the Dropwizard framework. It serves as a data management microservice within the larger Passkey ecosystem, providing reliable storage and retrieval of event-related data.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  (Web Apps, Mobile Apps, Other Microservices)              │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                 API Gateway / Load Balancer                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Passkey Event Data Service                     │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   Resources     │    Services     │   Repository    │   │
│  │   (REST API)    │  (Business      │   (Data Access) │   │
│  │                 │   Logic)        │                 │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────┬───────────────────┬───────────────────┘
                      │                   │
        ┌─────────────▼─────────────┐    │
        │      External Services    │    │
        │   (Auth, Reglink, etc.)   │    │
        └───────────────────────────┘    │
                                         │
                              ┌──────────▼──────────┐
                              │     Data Layer      │
                              │   (DynamoDB, S3)    │
                              └─────────────────────┘
```

## Components

### API Layer (Resources)

**Purpose**: Handle HTTP requests and responses, input validation, and API contract enforcement

**Location**: `com.cvent.passkeyeventdata.resources`

**Key Classes**:
- `EventRequestsResource` - Main REST endpoint for event request operations
- Exception mappers for proper HTTP error responses

**Responsibilities**:
- Request/response serialization
- Input validation
- HTTP status code management
- API versioning and routing

### Service Layer (Business Logic)

**Purpose**: Implement business rules, orchestrate operations, and coordinate between different components

**Location**: `com.cvent.passkeyeventdata.services`

**Key Classes**:
- `EventRequestsService` - Core business logic for event request management
- Service interfaces and implementations

**Responsibilities**:
- Business rule enforcement
- Transaction coordination
- External service integration
- Data transformation and validation

### Repository Layer (Data Access)

**Purpose**: Abstract data storage operations and provide a clean interface to the persistence layer

**Location**: `com.cvent.passkeyeventdata.repository`

**Key Classes**:
- `EventRequestDataAccess` - Main data access interface
- `DynamoDBClient` - DynamoDB-specific implementation
- NoSQL cache configuration and management

**Responsibilities**:
- Data persistence operations (CRUD)
- Query optimization
- Caching strategy implementation
- Database connection management

### Client Integration Layer

**Purpose**: Facilitate communication with external services and provide client libraries

**Location**: `com.cvent.passkeyeventdata.clients`

**Key Classes**:
- `ClientUtil` - Utility for creating service clients
- External service client configurations

**Responsibilities**:
- Service discovery and connection
- Request/response handling for external APIs
- Circuit breaker and retry logic
- Authentication token management

## Data Flow

### Event Request Creation Flow

1. **Client Request**: External client sends POST request to `/api/v1/event-requests`
2. **Authentication**: Auth service validates the request token
3. **Input Validation**: Resource layer validates request payload
4. **Business Logic**: Service layer applies business rules and transformations
5. **External Validation**: Reglink service validates event metadata
6. **Data Persistence**: Repository layer stores data in DynamoDB
7. **Response**: Success/error response returned to client

### Event Request Retrieval Flow

1. **Client Request**: External client sends GET request with query parameters
2. **Authentication**: Auth service validates the request token
3. **Query Processing**: Service layer processes query parameters and filters
4. **Cache Check**: Repository layer checks NoSQL cache first
5. **Database Query**: If cache miss, query DynamoDB directly
6. **Data Transformation**: Service layer transforms data for response
7. **Response**: Formatted data returned to client

## Design Patterns

### Repository Pattern
- Abstracts data access logic from business logic
- Provides consistent interface regardless of storage technology
- Enables easy testing with mock implementations

### Service Layer Pattern
- Encapsulates business logic in dedicated service classes
- Provides transaction boundaries
- Facilitates code reuse across different endpoints

### Dependency Injection
- Uses Dropwizard's built-in DI container
- Promotes loose coupling between components
- Simplifies testing and configuration management

### Exception Mapping
- Centralized error handling with custom exception mappers
- Consistent error response format across all endpoints
- Proper HTTP status code mapping

## Module Structure

### Parent Module (`parent/`)
- Contains shared Maven configuration
- Defines common dependencies and versions
- Provides build profiles and plugin configurations

### Model Module (`model/`)
- Contains data transfer objects (DTOs)
- Request/response model definitions
- Immutable value objects using Immutables library
- Shared constants and enumerations

### Service Module (`service/`)
- Main Dropwizard application
- REST resource implementations
- Business logic services
- Configuration classes
- Health checks and monitoring

### Java Client Module (`java-client/`)
- Client library for external consumers
- Generated client code from API specifications
- Connection management and authentication
- Retry and error handling logic

### Integration Tests (`it/`)
- End-to-end integration tests
- Database integration testing
- External service mocking
- Performance and load testing

## Configuration Management

The service uses a hierarchical configuration approach:

1. **Base Configuration**: Common settings in `PasskeyEventDataConfiguration`
2. **Environment-Specific**: Override files for dev/staging/prod
3. **Runtime Parameters**: Environment variables and system properties
4. **Feature Flags**: Dynamic configuration through feature flag service

## Security Architecture

### Authentication
- Integration with Cvent's centralized auth service
- JWT token validation on all protected endpoints
- API key authentication for service-to-service communication

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- Environment-aware access controls

### Data Protection
- Encryption at rest (DynamoDB encryption)
- Encryption in transit (TLS/HTTPS)
- Sensitive data masking in logs

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables easy horizontal scaling
- Load balancer distributes requests across multiple instances
- Auto-scaling based on CPU and memory metrics

### Caching Strategy
- Multi-level caching (application cache + DynamoDB cache)
- Cache invalidation strategies
- Read-through and write-through patterns

### Database Optimization
- DynamoDB partition key design for even distribution
- Global secondary indexes for query optimization
- Connection pooling and query optimization

## Monitoring and Observability

### Health Checks
- Application health endpoint
- Database connectivity checks
- External service dependency checks

### Metrics and Logging
- Structured JSON logging
- Application metrics (response times, error rates)
- Business metrics (request volumes, data growth)
- Integration with Datadog for monitoring and alerting

### Distributed Tracing
- Request correlation IDs
- Cross-service trace propagation
- Performance bottleneck identification
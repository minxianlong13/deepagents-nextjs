# Architecture

## System Overview

The Passkey Create Event Service follows a layered architecture pattern built on the Dropwizard framework. It implements a multi-module Maven project structure that separates concerns across API contracts, business logic, data access, and service implementation layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                 JAX-RS Resources                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │CreateEvent  │ │CancelEvent  │ │    Admin/Affiliate      ││
│  │  Resource   │ │  Resource   │ │      Resources          ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Service Layer                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │         Business Logic Services                        ││
│  │  • Event Creation Logic                                ││
│  │  • Event Validation                                    ││
│  │  • Integration Orchestration                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              External Service Clients                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │Business Text│ │Event Housing│ │    Inventory Service    ││
│  │   Client    │ │   Client    │ │       Client            ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service is organized into six Maven modules, each with specific responsibilities:

### passkey-create-event-api
- **Purpose**: API contracts and data models
- **Location**: `/passkey-create-event-api`
- **Key Components**:
  - Request/Response DTOs
  - API interfaces
  - Validation annotations
  - Shared constants

### passkey-create-event-service
- **Purpose**: Main service implementation and REST endpoints
- **Location**: `/passkey-create-event-service`
- **Key Components**:
  - `PasskeyCreateEventServiceApplication` - Main application class
  - `PasskeyCreateEventServiceConfiguration` - Service configuration
  - JAX-RS Resources (CreateEventResource, CancelEventResource, etc.)
  - Business service implementations
  - Health checks and monitoring

### passkey-create-event-data-access
- **Purpose**: Data access layer and repository implementations
- **Location**: `/passkey-create-event-data-access`
- **Key Components**:
  - Database entities
  - Repository interfaces and implementations
  - Database migrations
  - Data access utilities

### passkey-create-event-shared
- **Purpose**: Shared utilities and common code
- **Location**: `/passkey-create-event-shared`
- **Key Components**:
  - Common utilities
  - Shared constants
  - Helper classes
  - Cross-cutting concerns

### passkey-create-event-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `/passkey-create-event-java-client`
- **Key Components**:
  - Client interfaces
  - HTTP client implementations
  - Client configuration
  - Response handling

### passkey-create-event-integration-test
- **Purpose**: Integration tests using Karate framework
- **Location**: `/passkey-create-event-integration-test`
- **Key Components**:
  - Karate feature files
  - Test configurations
  - Test data setup
  - Environment-specific test configs

## Components

### REST Layer (JAX-RS Resources)

#### CreateEventResource
- **Purpose**: Handles event creation operations
- **Location**: `com.cvent.passkey.createevent.resources.CreateEventResource`
- **Key Endpoints**:
  - Event creation from templates
  - Event copying operations
  - Bulk event operations

#### CancelEventResource
- **Purpose**: Manages event cancellation
- **Location**: `com.cvent.passkey.createevent.resources.CancelEventResource`
- **Key Operations**:
  - Event cancellation
  - Cancellation validation
  - Cleanup operations

#### AdminResource
- **Purpose**: Administrative operations and monitoring
- **Location**: `com.cvent.passkey.createevent.resources.AdminResource`
- **Key Features**:
  - Service health monitoring
  - Administrative controls
  - Operational metrics

#### AffiliateResource
- **Purpose**: Affiliate-specific event operations
- **Location**: `com.cvent.passkey.createevent.resources.AffiliateResource`
- **Key Features**:
  - Affiliate event creation
  - Partner-specific validations
  - Custom affiliate workflows

### Service Layer

The service layer contains the core business logic and orchestrates interactions between different components:

- **Event Creation Services**: Handle the complex logic of creating events
- **Validation Services**: Ensure data integrity and business rule compliance
- **Integration Services**: Manage communication with external services
- **Automation Services**: Handle automated workflows and processes

### Integration Layer

The service integrates with multiple external services through dedicated client libraries:

- **Business Text Service**: Localization and text management
- **Event Housing Service**: Housing inventory and management
- **Event Service**: Core event operations
- **Inventory Service**: Room and rate inventory
- **Auth Service**: Authentication and authorization

## Data Flow

### Event Creation Flow
1. **Request Reception**: JAX-RS resource receives creation request
2. **Authentication**: Auth service validates user permissions
3. **Validation**: Business rules and data validation
4. **External Service Calls**: Gather required data from dependent services
5. **Event Assembly**: Construct complete event object
6. **Persistence**: Store event data
7. **Response**: Return created event details

### Event Cancellation Flow
1. **Request Reception**: Cancellation request received
2. **Authorization**: Verify cancellation permissions
3. **Dependency Check**: Validate cancellation is allowed
4. **Cleanup Operations**: Remove associated data
5. **Notification**: Inform dependent services
6. **Confirmation**: Return cancellation confirmation

## Design Patterns

### Repository Pattern
- Abstracts data access logic
- Provides clean separation between business logic and data persistence
- Enables easier testing through mocking

### Service Layer Pattern
- Encapsulates business logic
- Provides transaction boundaries
- Enables reusability across different endpoints

### Client Pattern
- Standardized approach to external service communication
- Consistent error handling and retry logic
- Configuration-driven service discovery

### Configuration Pattern
- Environment-specific configurations
- Externalized configuration management
- Type-safe configuration binding

## Cross-Cutting Concerns

### Observability
- **Logging**: Structured logging with correlation IDs
- **Metrics**: Application and business metrics via Dropwizard Metrics
- **Tracing**: Distributed tracing for request flow analysis
- **Health Checks**: Service and dependency health monitoring

### Security
- **Authentication**: Integration with Cvent's auth service
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive request validation
- **Audit Logging**: Security event logging

### Error Handling
- **Exception Mapping**: Consistent error response format
- **Retry Logic**: Configurable retry mechanisms for external calls
- **Circuit Breaker**: Protection against cascading failures
- **Graceful Degradation**: Fallback mechanisms for non-critical failures

## Deployment Architecture

The service is deployed as a containerized application with the following characteristics:

- **Container**: Docker-based deployment
- **Orchestration**: Kubernetes-based container orchestration
- **Load Balancing**: Multiple instances behind load balancers
- **Service Discovery**: Integrated with Cvent's service registry
- **Configuration Management**: Environment-specific configuration injection

## Scalability Considerations

- **Horizontal Scaling**: Stateless design enables easy horizontal scaling
- **Caching**: Strategic caching of frequently accessed data
- **Async Processing**: Non-blocking operations where appropriate
- **Resource Optimization**: Efficient resource utilization and cleanup
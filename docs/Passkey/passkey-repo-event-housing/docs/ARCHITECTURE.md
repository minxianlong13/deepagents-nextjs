# Architecture

## System Overview

The Passkey Event Housing Service follows a multi-module Maven architecture built on the Dropwizard framework. It implements a layered architecture pattern with clear separation of concerns between API, service, data access, and shared components.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  REST API Layer                             │
│  EventResource │ BlockResource │ AdminResource │ etc.       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Service Layer                               │
│  Business Logic │ Validation │ Orchestration               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               Data Access Layer                             │
│  Repositories │ DAOs │ Database Operations                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Data Store                                │
│              Couchbase Database                             │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service is organized into six main modules:

### passkey-event-housing-api
- **Purpose**: Defines API contracts and data transfer objects
- **Location**: `passkey-event-housing-api/`
- **Key Components**:
  - Request/Response models
  - API interfaces
  - Data validation annotations

### passkey-event-housing-service
- **Purpose**: Main application module containing REST resources and business logic
- **Location**: `passkey-event-housing-service/`
- **Key Components**:
  - `PasskeyEventHousingServiceApplication.java` - Main application class
  - `PasskeyEventHousingServiceConfiguration.java` - Configuration management
  - REST Resources (EventResource, BlockResource, AdminResource, etc.)
  - Service layer implementations
  - Health checks and utilities

### passkey-event-housing-data-access
- **Purpose**: Data persistence layer with repository patterns
- **Location**: `passkey-event-housing-data-access/`
- **Key Components**:
  - Repository interfaces and implementations
  - Database entity mappings
  - Data access utilities

### passkey-event-housing-shared
- **Purpose**: Common utilities and shared components
- **Location**: `passkey-event-housing-shared/`
- **Key Components**:
  - Common utilities
  - Shared constants
  - Helper classes

### passkey-event-housing-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-event-housing-java-client/`
- **Key Components**:
  - Client interfaces
  - HTTP client implementations
  - Client configuration

### passkey-event-housing-integration-test
- **Purpose**: Integration test suite using Karate framework
- **Location**: `passkey-event-housing-integration-test/`
- **Key Components**:
  - Karate feature files
  - Test configurations
  - Test utilities

## Components

### REST Resources
The service exposes several REST endpoints through JAX-RS resources:

#### EventResource
- **Purpose**: Manages event housing data and operations
- **Location**: `com.cvent.passkeyeventhousing.resources.EventResource`
- **Key Operations**: Event housing CRUD operations

#### BlockResource
- **Purpose**: Handles room block management and operations
- **Location**: `com.cvent.passkeyeventhousing.resources.BlockResource`
- **Key Operations**: Room block creation, updates, transfers

#### AdminResource
- **Purpose**: Administrative operations and data management
- **Location**: `com.cvent.passkeyeventhousing.resources.AdminResource`
- **Key Operations**: Admin-level data operations

#### RoomCategoryResource
- **Purpose**: Room category management
- **Location**: `com.cvent.passkeyeventhousing.resources.RoomCategoryResource`
- **Key Operations**: Room category CRUD operations

#### ImagesResource
- **Purpose**: Image upload and management for properties
- **Location**: `com.cvent.passkeyeventhousing.resources.ImagesResource`
- **Key Operations**: Image upload, retrieval, management

#### ConnectionResource
- **Purpose**: External connection management
- **Location**: `com.cvent.passkeyeventhousing.resources.ConnectionResource`
- **Key Operations**: Connection handling and management

#### CallbackResource
- **Purpose**: Handles callbacks from external systems
- **Location**: `com.cvent.passkeyeventhousing.resources.CallbackResource`
- **Key Operations**: External system callback processing

#### GroupLinkResource
- **Purpose**: Group booking link management
- **Location**: `com.cvent.passkeyeventhousing.resources.GroupLinkResource`
- **Key Operations**: Group link creation and management

#### RoomBlockTransferStateResource
- **Purpose**: Room block transfer state management
- **Location**: `com.cvent.passkeyeventhousing.resources.RoomBlockTransferStateResource`
- **Key Operations**: Transfer state tracking and updates

### Service Layer
- **Purpose**: Contains business logic and orchestration
- **Location**: `com.cvent.passkeyeventhousing.service`
- **Key Classes**: Service implementations for each domain area

### Utilities and Support
- **Pagination**: Custom pagination support in `com.cvent.passkeyeventhousing.pagination`
- **Exception Handling**: Custom exceptions in `com.cvent.passkeyeventhousing.exceptions`
- **Health Checks**: Service health monitoring in `com.cvent.passkeyeventhousing.health`
- **Utilities**: Common utilities in `com.cvent.passkeyeventhousing.util`

## Data Flow

### Typical Request Flow
1. **Client Request**: External client makes HTTP request to REST endpoint
2. **Authentication**: Auth service validates request credentials
3. **Resource Layer**: JAX-RS resource receives and validates request
4. **Service Layer**: Business logic processes the request
5. **Data Access**: Repository layer interacts with Couchbase database
6. **Response**: Data flows back through layers to client

### External Integrations
- **Auth Service**: Authentication and authorization
- **Event Service**: Event-related operations
- **Inventory Service**: Room inventory management
- **External Housing Providers**: Third-party integrations via callbacks

## Design Patterns

### Repository Pattern
- Abstracts data access logic
- Provides clean separation between business logic and data persistence
- Enables easier testing and maintenance

### Service Layer Pattern
- Encapsulates business logic
- Provides transaction boundaries
- Coordinates between different repositories

### Configuration Pattern
- Externalized configuration using YAML files
- Environment-specific configurations
- Dropwizard configuration management

### Client Pattern
- Dedicated client modules for service consumption
- Type-safe client interfaces
- HTTP client abstraction

## Technology Stack

- **Framework**: Dropwizard (JAX-RS, Jersey, Jackson)
- **Language**: Java 21
- **Build Tool**: Maven
- **Database**: Couchbase
- **Testing**: JUnit, Karate (integration tests)
- **Containerization**: Docker
- **Observability**: Datadog integration

## Security Architecture

- **Authentication**: Integration with Cvent's auth-service
- **Authorization**: Role-based access control
- **Transport Security**: HTTPS/TLS encryption
- **Input Validation**: Request validation at API layer

## Scalability Considerations

- **Stateless Design**: Service maintains no session state
- **Database Optimization**: Efficient Couchbase queries and indexing
- **Caching**: Strategic caching for frequently accessed data
- **Load Balancing**: Horizontal scaling support

## Monitoring and Observability

- **Health Checks**: Built-in health check endpoints
- **Metrics**: Application and business metrics
- **Logging**: Structured logging with correlation IDs
- **Distributed Tracing**: Request tracing across services
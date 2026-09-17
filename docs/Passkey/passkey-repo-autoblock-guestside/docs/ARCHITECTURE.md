# Architecture

## System Overview

The Passkey Autoblock Guestside Service is designed as a web gateway service that bridges the gap between guest-facing autoblock interfaces and the Passkey microservices ecosystem. It follows a layered architecture pattern with clear separation of concerns between presentation, business logic, and data access layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Guest Web Interface                       │
│                   (Nucleus Views)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Autoblock Guestside Service                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │   Resources     │ │    Services     │ │    Utils      │ │
│  │   (JAX-RS)      │ │   (Business)    │ │  (Helpers)    │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Passkey Service Clients                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │   Hotel     │ │   Event     │ │ Inventory   │ │  ...   │ │
│  │  Service    │ │  Service    │ │  Service    │ │        │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Web Layer (Resources)

#### AutoblockGuestsideResource
- **Purpose**: Main resource handling autoblock guest-side web requests
- **Location**: `com.cvent.passkey.autoblockguestside.resources.AutoblockGuestsideResource`
- **Key Responsibilities**:
  - Serves Nucleus Views for autoblock interfaces
  - Handles survey request processing
  - Manages guest interaction workflows

#### AccessResource
- **Purpose**: Handles access control and authentication flows
- **Location**: `com.cvent.passkey.autoblockguestside.resources.AccessResource`
- **Key Responsibilities**:
  - Token validation and processing
  - Access control enforcement
  - Authentication state management

#### AdminResource
- **Purpose**: Administrative endpoints for service management
- **Location**: `com.cvent.passkey.autoblockguestside.resources.AdminResource`
- **Key Responsibilities**:
  - Administrative operations
  - Service health checks
  - Configuration management

### Business Logic Layer (Services)

#### AutoBlockGuestSideSiteService
- **Purpose**: Core business logic for autoblock guest-side operations
- **Location**: `com.cvent.passkey.autoblockguestside.services.AutoBlockGuestSideSiteService`
- **Key Responsibilities**:
  - Orchestrates data retrieval from multiple services
  - Implements business rules for autoblock workflows
  - Manages survey and booking logic

### Utility Layer

#### AccessTokenProcessorUtil
- **Purpose**: Handles access token processing and validation
- **Location**: `com.cvent.passkey.autoblockguestside.utils.AccessTokenProcessorUtil`
- **Key Responsibilities**:
  - Token parsing and validation
  - Security context management

#### RefreshTokenClientContainer
- **Purpose**: Manages refresh token lifecycle
- **Location**: `com.cvent.passkey.autoblockguestside.utils.RefreshTokenClientContainer`
- **Key Responsibilities**:
  - Token refresh operations
  - Client authentication management

### View Layer

#### AutoBlockGuestSideSiteView
- **Purpose**: Nucleus View implementation for rendering web pages
- **Location**: `com.cvent.passkey.autoblockguestside.resources.views.AutoBlockGuestSideSiteView`
- **Key Responsibilities**:
  - Template rendering
  - Data binding for web views
  - UI state management

### Exception Handling

The service includes comprehensive exception mappers:

- **AccessExceptionMapper**: Handles access-related exceptions
- **UnauthorizedExceptionMapper**: Manages authentication failures
- **TooManyRequestsExceptionMapper**: Rate limiting enforcement
- **RuntimeExceptionMapper**: General runtime error handling
- **WizardConfigurationExceptionMapper**: Configuration error handling

## Data Flow

### Guest Survey Request Flow

1. **Request Initiation**: Guest accesses autoblock survey URL
2. **Authentication**: Service validates access tokens and permissions
3. **Data Aggregation**: Service fetches required data from:
   - Hotel Service (property information)
   - Event Service (event details)
   - Inventory Service (room availability)
   - Business Text Service (localized content)
4. **View Rendering**: Nucleus View renders the complete survey interface
5. **Response Delivery**: Rendered HTML page served to guest

### Administrative Operations Flow

1. **Admin Request**: Administrative operation initiated
2. **Authorization**: Admin permissions validated
3. **Service Orchestration**: Required backend services called
4. **Result Processing**: Results aggregated and formatted
5. **Response**: JSON or view response returned

## Design Patterns

### Gateway Pattern
The service acts as a gateway, providing a single entry point for guest-side autoblock operations while orchestrating calls to multiple backend services.

### Service Layer Pattern
Business logic is encapsulated in dedicated service classes, separating concerns from the web layer.

### Repository Pattern (via Clients)
Data access is abstracted through service clients, providing clean interfaces to external services.

### Exception Mapping Pattern
Centralized exception handling through JAX-RS exception mappers ensures consistent error responses.

### View Pattern
Nucleus Views separate presentation logic from business logic, enabling server-side rendering of web interfaces.

## Module Structure

### passkey-autoblock-guestside-api
- **Purpose**: Shared API models and interfaces
- **Contents**: 
  - Data transfer objects (DTOs)
  - API interfaces
  - Common model classes
- **Dependencies**: Minimal external dependencies

### passkey-autoblock-guestside-service
- **Purpose**: Main service implementation
- **Contents**:
  - Dropwizard application class
  - JAX-RS resources
  - Business services
  - Configuration classes
- **Dependencies**: 
  - Dropwizard framework
  - Passkey service clients
  - Auth service integration

### passkey-autoblock-guestside-java-client
- **Purpose**: Client library for consuming this service
- **Contents**:
  - Client interfaces
  - HTTP client implementations
  - Client configuration
- **Dependencies**: HTTP client libraries

### passkey-autoblock-guestside-integration-test
- **Purpose**: End-to-end integration testing
- **Contents**:
  - Integration test scenarios
  - Test data setup
  - Service interaction tests
- **Dependencies**: Testing frameworks and test utilities

## Security Architecture

### Authentication Flow
1. **Token Validation**: Incoming requests validated against auth-service
2. **Context Establishment**: Security context established for request
3. **Authorization**: Permissions checked for requested operations
4. **Service Calls**: Authenticated calls made to downstream services

### Rate Limiting
- Built-in rate limiting prevents abuse
- Configurable limits per endpoint
- Graceful degradation under load

## Scalability Considerations

### Horizontal Scaling
- Stateless design enables horizontal scaling
- Load balancing across multiple instances
- Session state managed externally

### Caching Strategy
- Response caching for frequently accessed data
- Client-side caching headers
- Service-level caching for expensive operations

### Performance Optimization
- Asynchronous processing where applicable
- Connection pooling for service clients
- Efficient data serialization
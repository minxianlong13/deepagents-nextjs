# Architecture

## System Overview

The Passkey Vendor Mock Service is built as a Dropwizard-based Java microservice that simulates multiple hotel vendor systems. It follows a layered architecture pattern with clear separation of concerns between REST endpoints, business logic, and response generation.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (Passkey Integration Service)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────────┐
│                  JAX-RS Resources Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Amadeus   │ │    Opera    │ │      Hilton/IHG        ││
│  │  Resource   │ │  Resources  │ │      Resources         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Service Layer                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │           Mock Response Service                         ││
│  │    • Magic keyword processing                           ││
│  │    • Response template selection                        ││
│  │    • Delay simulation                                   ││
│  │    • Error scenario handling                            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Utility Layer                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   XML/XSL   │ │  Callback   │ │     Configuration       ││
│  │ Processing  │ │  Storage    │ │      Management         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Components

### JAX-RS Resources Layer

The REST API layer consists of vendor-specific resource classes that handle HTTP requests and responses.

#### Core Resource Classes
- **PasskeyVendorMockAsyncResource** - Handles asynchronous vendor operations
- **PasskeyVendorMockSyncResource** - Handles synchronous vendor operations
- **MessagesResource** - Manages callback message storage and retrieval

#### Vendor-Specific Resources
- **AmadeusResource** - Amadeus CRS authentication and OTA messaging
- **HiltonResource** - Hilton reservation transfers and DC operations
- **OhipHotelReservationResource** - Opera OHIP reservation management
- **OhipHotelBlockResource** - Opera OHIP block management
- **DerbySoftIndividualReservationResource** - DerbySoft individual reservations
- **GroupReservationResource** - DerbySoft group reservations
- **ChoiceResource** - Choice Hotels content management
- **IcePortalResource** - IcePortal service integration

**Purpose**: Handle HTTP requests, validate inputs, delegate to services
**Location**: `com.cvent.passkeyvendormock.resources`
**Key Classes**: 20+ resource classes for different vendors

### Service Layer

The business logic layer processes requests and generates appropriate mock responses.

#### Mock Response Service
- **Purpose**: Core business logic for response generation
- **Location**: `com.cvent.passkeyvendormock.service`
- **Key Responsibilities**:
  - Magic keyword detection and processing
  - Response template selection
  - Delay simulation for realistic timing
  - Error scenario generation
  - Async callback handling

#### Callback Management Service
- **Purpose**: In-memory storage for callback parameters
- **Location**: `com.cvent.passkeyvendormock.callback`
- **Key Features**:
  - URL parameter storage
  - Resource-based retrieval
  - Event ID mapping

### Model Layer

Domain objects and data transfer objects for vendor-specific data structures.

#### Core Models
- **Purpose**: Data structures for vendor requests/responses
- **Location**: `com.cvent.passkeyvendormock.model`
- **Key Classes**:
  - Reservation models
  - Guest information models
  - Block and inventory models
  - Authentication models

### Configuration Layer

Environment-specific configuration management using Dropwizard's configuration system.

#### Configuration Classes
- **PasskeyVendorMockServiceConfiguration** - Main configuration class
- **AsyncTransferConfiguration** - Async operation settings
- **Environment-specific properties** - Per-environment overrides

**Purpose**: Centralized configuration management
**Location**: `com.cvent.passkeyvendormock.config`

## Data Flow

### Synchronous Request Flow

```
1. Client Request → JAX-RS Resource
2. Resource → Service Layer (keyword processing)
3. Service → Template Selection
4. Template → Response Generation
5. Response → Client (immediate)
```

### Asynchronous Request Flow

```
1. Client Request → JAX-RS Resource
2. Resource → Service Layer (keyword processing)
3. Service → Async Processing Queue
4. Immediate Response → Client (202 Accepted)
5. Background Process → Callback to Integration API
```

### Callback Message Flow

```
1. POST /v1/messages/callbacks/{eventId} → Store parameters
2. In-memory storage → Key-value mapping
3. GET /v1/messages/callbacks/{eventId} → Retrieve parameters
4. Response → Stored parameter values
```

## Design Patterns

### Resource Pattern (JAX-RS)
Each vendor system has dedicated resource classes with clear endpoint mappings:
```java
@Path("/v1/sync/marriott")
public class MarriottResource {
    @POST
    public Response processReservation(String payload) { ... }
}
```

### Template Method Pattern
Response generation follows a consistent pattern across vendors:
1. Parse request payload
2. Extract magic keywords
3. Select response template
4. Apply transformations
5. Return formatted response

### Strategy Pattern
Different response strategies based on magic keywords:
- SuccessResponseStrategy
- ErrorResponseStrategy
- DelayedResponseStrategy
- RetryResponseStrategy

### Factory Pattern
Response factory creates appropriate response objects based on vendor type and keywords.

### Observer Pattern
Async operations use observer pattern for callback notifications.

## Module Structure

### Maven Multi-Module Layout
```
passkey-vendor-mock/
├── pom.xml (parent)
└── passkey-vendor-mock-service/
    ├── pom.xml (service module)
    ├── src/main/java/
    │   └── com/cvent/passkeyvendormock/
    │       ├── PasskeyVendorMockServiceApplication.java
    │       ├── resources/ (JAX-RS endpoints)
    │       ├── service/ (business logic)
    │       ├── model/ (data objects)
    │       ├── config/ (configuration)
    │       ├── utils/ (utilities)
    │       └── exception/ (error handling)
    ├── src/main/resources/ (templates, configs)
    └── configs/ (environment configurations)
```

### Package Organization
- **resources** - REST endpoint implementations
- **service** - Business logic and mock response generation
- **model** - Domain objects and DTOs
- **config** - Configuration classes
- **utils** - Utility classes for XML processing, date handling
- **exception** - Custom exception classes
- **constants** - Application constants
- **filter** - HTTP filters for request/response processing
- **health** - Health check implementations

## Scalability Considerations

### Stateless Design
- No persistent state between requests
- In-memory callback storage (suitable for testing)
- Horizontally scalable

### Performance Optimizations
- Template caching for response generation
- Efficient XML processing
- Minimal memory footprint per request

### Monitoring Integration
- Dropwizard metrics
- Health checks
- Request/response logging
- Datadog APM integration

## Security Architecture

### Authentication Simulation
- OAuth2 token generation for vendor systems
- Basic authentication support
- JWT token creation for testing

### Input Validation
- XML schema validation
- Request parameter sanitization
- Content-type verification

### Error Handling
- Graceful degradation
- Comprehensive error responses
- Security-conscious error messages

## Integration Points

### External Dependencies
- **Passkey Core Mapper** - Data transformation utilities
- **Passkey Inbound Model** - Message format definitions
- **Common Dropwizard** - Cvent's Dropwizard extensions

### Monitoring & Observability
- **Datadog APM** - Application performance monitoring
- **Dropwizard Metrics** - Built-in metrics collection
- **Structured Logging** - JSON-formatted logs

### CI/CD Integration
- **Jenkins Pipeline** - Automated build and deployment
- **Docker Containerization** - Consistent deployment packaging
- **Multi-environment Support** - Environment-specific configurations
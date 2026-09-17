# Architecture

## System Overview

The Passkey Reglink Service follows a multi-module Maven architecture built on Dropwizard framework. It implements a layered architecture pattern with clear separation of concerns, serving as an orchestration layer that coordinates between multiple Passkey microservices to provide unified registration and housing management capabilities.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (Event Planners, Registration Systems)         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────────┐
│                Passkey Reglink Service                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Resources │ │  Services   │ │    Client Adapters      ││
│  │   (JAX-RS)  │ │  (Business  │ │   (External Service     ││
│  │             │ │   Logic)    │ │    Integration)         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │ Service Calls
┌─────────────────────────▼───────────────────────────────────┐
│              Passkey Ecosystem Services                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Bridge    │ │ Reservation │ │      Hotel/Event        ││
│  │   Service   │ │   Service   │ │      Services           ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service is organized into 7 Maven modules, each with specific responsibilities:

### passkey-reglink-service
- **Purpose**: Main application module containing the Dropwizard application
- **Location**: `/passkey-reglink-service`
- **Key Classes**: 
  - `PasskeyReglinkServiceApplication` - Main application entry point
  - Resource classes for REST endpoints
  - Service classes for business logic
  - Client adapters for external service integration

### passkey-reglink-api
- **Purpose**: API contracts and data models
- **Location**: `/passkey-reglink-api`
- **Key Classes**: Request/Response DTOs, API interfaces

### passkey-reglink-data-access
- **Purpose**: Data access layer and persistence logic
- **Location**: `/passkey-reglink-data-access`
- **Key Classes**: Repository interfaces, data access objects

### passkey-reglink-shared
- **Purpose**: Common utilities and shared components
- **Location**: `/passkey-reglink-shared`
- **Key Classes**: Utility classes, common constants, shared models

### passkey-reglink-auth
- **Purpose**: Authentication and authorization components
- **Location**: `/passkey-reglink-auth`
- **Key Classes**: Security filters, authentication handlers

### passkey-reglink-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `/passkey-reglink-java-client`
- **Key Classes**: Client interfaces, HTTP client implementations

### passkey-reglink-integration-test
- **Purpose**: Integration tests using Karate framework
- **Location**: `/passkey-reglink-integration-test`
- **Key Classes**: Karate test scenarios, test configurations

## Component Architecture

### Resource Layer (JAX-RS)
The REST API is organized into functional resource classes:

- **EventResource**: Event availability and metadata operations
- **ReservationResource**: Individual reservation management
- **RoomBlockResource**: Room block lifecycle operations
- **HousingEventsResource**: Housing event management
- **HousingLibraryResource**: Template and reference data access
- **AssociationResource**: Registration link management
- **ConnectionResource**: Bridge operations
- **RegistrationResource**: Registration-specific operations
- **EventMetadataResource**: Event metadata management

### Service Layer
Business logic is encapsulated in service classes that orchestrate calls to external services:

- **CreateEventService**: Event creation and management logic
- **ReservationService**: Reservation business logic
- **RoomBlockService**: Room block management
- **HousingService**: Housing-specific operations

### Client Layer
External service integration through dedicated client classes:

- **PasskeyHousingClient**: Housing service integration
- **GroupReservationsClient**: Group reservation operations
- **HousingLibraryClient**: Library service access
- **HousingEventsClient**: Event service integration
- **HousingReservationClient**: Reservation service calls

## Data Flow

### Typical Request Flow
1. **Client Request**: HTTP request received by JAX-RS resource
2. **Authentication**: Request validated through auth filters
3. **Business Logic**: Resource delegates to appropriate service class
4. **External Calls**: Service orchestrates calls to multiple external services
5. **Data Aggregation**: Results from multiple services combined and transformed
6. **Response**: Unified response returned to client

### Example: Room Block Creation
```
Client → RoomBlockResource → RoomBlockService → [
  PasskeyHousingClient (availability check)
  ReservationClient (block creation)
  InventoryClient (inventory allocation)
] → Aggregated Response → Client
```

## Design Patterns

### Orchestration Pattern
The service acts as an orchestrator, coordinating multiple service calls to provide unified functionality. This pattern allows for:
- Simplified client integration
- Consistent error handling
- Transaction-like behavior across services

### Client Adapter Pattern
External service integration is abstracted through client adapters, providing:
- Consistent error handling
- Retry logic
- Circuit breaker patterns
- Service discovery abstraction

### Resource-Service-Client Layering
Clear separation of concerns through layered architecture:
- **Resources**: Handle HTTP concerns, validation, serialization
- **Services**: Implement business logic and orchestration
- **Clients**: Manage external service communication

### Configuration-Driven Behavior
Dropwizard configuration pattern allows for:
- Environment-specific settings
- Feature toggles
- Service endpoint configuration
- Timeout and retry configurations

## Integration Patterns

### Synchronous Integration
Most service calls are synchronous HTTP requests with:
- Timeout configurations
- Retry mechanisms
- Circuit breaker patterns
- Fallback strategies

### Event-Driven Integration
Some operations trigger asynchronous events through:
- Message queues
- Event publishing
- Saga pattern coordination

## Error Handling Strategy

### Exception Mapping
Custom exception mappers provide consistent error responses:
- `HousingWebApplicationExceptionMapper`
- `ReglinkJsonProcessingExceptionMapper`

### Fallback Mechanisms
Service degradation strategies:
- Default responses for non-critical failures
- Cached data when services are unavailable
- Graceful degradation of functionality

## Security Architecture

### Authentication
- Integration with Cvent's auth-service
- Bearer token validation
- Identity mapping service integration

### Authorization
- Role-based access control
- Resource-level permissions
- Service-to-service authentication

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Load balancer friendly
- Container-ready (Docker)

### Performance Optimization
- Connection pooling for external services
- Caching strategies for reference data
- Asynchronous processing where appropriate

## Monitoring and Observability

### Metrics Collection
- Dropwizard metrics integration
- Custom business metrics
- Performance counters

### Distributed Tracing
- API platform tracing integration
- Request correlation across services
- Performance bottleneck identification

### Health Checks
- Service health endpoints
- Dependency health monitoring
- Circuit breaker status reporting
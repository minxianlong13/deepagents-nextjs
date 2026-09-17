# Architecture

## System Overview

The Passkey Core Mapper Service implements a layered architecture designed to handle complex data transformations between Passkey's internal data structures and various external vendor formats. The service acts as a critical translation layer in the Passkey ecosystem, ensuring seamless data flow between different hotel property management systems and Passkey's core services.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                  JAX-RS Resources                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Hilton    │ │    OHIP     │ │        Shiji            ││
│  │  Resource   │ │  Resource   │ │      Resource           ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Service Layer                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Hilton    │ │    OHIP     │ │        Shiji            ││
│  │  Service    │ │  Service    │ │      Service            ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Mapping & Validation Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Mapping   │ │ Validation  │ │     Transformation      ││
│  │   Rules     │ │   Rules     │ │       Utilities         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                External Clients                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  Passkey    │ │   Hotel     │ │      Payment            ││
│  │  Services   │ │  Services   │ │     Services            ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Components

### Resource Layer (JAX-RS)
The REST API layer that exposes mapping functionality through HTTP endpoints.

- **Purpose**: Handle HTTP requests and responses for mapping operations
- **Location**: `com.cvent.passkeycoremapper.resources`
- **Key Classes**:
  - `PasskeyHiltonMapperResource` - Hilton-specific mapping endpoints
  - `PasskeyOhipMapperResource` - OHIP-specific mapping endpoints  
  - `PasskeyShijiMapperResource` - Shiji-specific mapping endpoints

### Service Layer
Contains the core business logic for data transformation and mapping operations.

- **Purpose**: Orchestrate mapping operations and apply business rules
- **Location**: `com.cvent.passkeycoremapper.services`
- **Key Classes**:
  - `HiltonService` - Hilton mapping business logic
  - `OhipService` - OHIP mapping business logic
  - `ShijiService` - Shiji mapping business logic
  - `VendorService` - Common vendor operations
  - `ReservationAddonsProvider` - Reservation addon handling
  - `RewardProgramProvider` - Loyalty program mappings

### Mapping Layer
Implements the actual data transformation logic between different formats.

- **Purpose**: Convert data structures between Passkey and vendor formats
- **Location**: `com.cvent.passkeycoremapper.services.{vendor}`
- **Key Components**:
  - Mapper classes for each vendor
  - Validation rules and constraints
  - Transformation utilities

### Client Layer
HTTP clients for communicating with external services.

- **Purpose**: Interface with Passkey services and external APIs
- **Location**: `com.cvent.passkeycoremapper.services.clients`
- **Key Classes**:
  - `Clients` - Client initialization and management

## Data Flow

### Inbound Mapping Flow
1. **Request Reception**: JAX-RS resource receives mapping request
2. **Validation**: Input data validated against vendor-specific rules
3. **Service Orchestration**: Appropriate service handles the mapping logic
4. **Data Transformation**: Mapper converts data to target format
5. **Response Generation**: Transformed data returned to client

### Outbound Integration Flow
1. **External Service Call**: Service makes calls to Passkey services
2. **Data Retrieval**: Additional data fetched as needed
3. **Enrichment**: Data enriched with vendor-specific information
4. **Format Conversion**: Data converted to vendor-required format
5. **Delivery**: Processed data delivered to requesting system

## Design Patterns

### Strategy Pattern
Each vendor (Hilton, OHIP, Shiji) implements its own mapping strategy, allowing the system to handle different transformation requirements while maintaining a consistent interface.

### Factory Pattern
Service and mapper instances are created through factory methods, enabling easy extension for new vendors.

### Template Method Pattern
Common mapping operations follow a template with vendor-specific implementations for variable steps.

### Dependency Injection
Dropwizard's built-in DI container manages service dependencies and lifecycle.

## Module Structure

### passkey-core-mapper-api
- **Purpose**: API contracts and data models
- **Contents**: Request/response DTOs, interfaces, common models
- **Dependencies**: Minimal external dependencies

### passkey-core-mapper-service
- **Purpose**: Main service implementation
- **Contents**: Application logic, resources, services, mappers
- **Dependencies**: Dropwizard, Passkey services, vendor libraries

### passkey-core-mapper-java-client
- **Purpose**: Client library for consuming the service
- **Contents**: Client interfaces, request builders, response handlers
- **Dependencies**: HTTP client libraries, API models

### passkey-core-mapper-integration-test
- **Purpose**: End-to-end testing
- **Contents**: Karate test scenarios, test data, test configurations
- **Dependencies**: Karate framework, test utilities

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables horizontal scaling
- Load balancing across multiple instances
- No shared state between service instances

### Performance Optimization
- Efficient mapping algorithms minimize processing time
- Connection pooling for external service calls
- Caching strategies for frequently accessed data

### Vendor Extensibility
- Modular architecture supports adding new vendors
- Plugin-style approach for vendor-specific logic
- Minimal impact on existing functionality when adding vendors

## Security Architecture

### Authentication
- Integration with Cvent Auth Service
- JWT token validation for all requests
- Role-based access control

### Data Protection
- Input validation and sanitization
- Secure handling of sensitive reservation data
- Audit logging for compliance

### Network Security
- HTTPS enforcement for all communications
- Secure service-to-service communication
- Network isolation in deployment environments

## Monitoring and Observability

### Health Checks
- Application health monitoring
- Dependency health verification
- Custom health check implementations

### Logging
- Structured logging with correlation IDs
- Request/response logging for debugging
- Performance metrics logging

### Metrics
- Datadog APM integration
- Custom business metrics
- Performance monitoring and alerting
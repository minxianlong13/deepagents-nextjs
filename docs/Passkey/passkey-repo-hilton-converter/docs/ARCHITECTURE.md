# Architecture

## System Overview

The Passkey Hilton Converter Service follows a layered architecture pattern built on the Dropwizard framework. It serves as a transformation gateway between Hilton's reservation system and Cvent's Passkey platform, converting JSON reservation data into XML format compatible with the Passkey API.

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Hilton        │    │  Passkey Hilton      │    │   Passkey       │
│   EventStays    │───▶│  Converter Service   │───▶│   API           │
│   (JSON)        │    │                      │    │   (XML)         │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────────┐
                       │  Auth Service        │
                       │  (Authentication)    │
                       └──────────────────────┘
```

## Components

### Resource Layer
**Location**: `com.cvent.passkeyhiltonconverter.resources`

- **PasskeyHiltonConverterResource**: Main API endpoint for stay record transformation
  - **Purpose**: Handles HTTP requests for converting Hilton stay records
  - **Path**: `/passkey-hilton-converter/v1/stayrecords`
  - **Authentication**: API Key-based authentication via `@Authority`

- **PasskeyHiltonLoggingResource**: Logging and monitoring endpoint
  - **Purpose**: Provides logging capabilities and operational insights
  - **Path**: `/passkey-hilton-converter/v1/logging`

### Service Layer
**Location**: `com.cvent.passkeyhiltonconverter.services`

- **StayRecordOrchestrator**: Main orchestration service
  - **Purpose**: Coordinates the transformation process and manages business logic
  - **Key Responsibilities**: 
    - Validates input data
    - Orchestrates transformation workflow
    - Handles error scenarios
    - Manages response formatting

- **HiltonToPasskeyTransformationService**: Core transformation engine
  - **Purpose**: Performs the actual data transformation from Hilton JSON to Passkey XML
  - **Key Responsibilities**:
    - Maps Hilton data structures to Passkey format
    - Handles data type conversions
    - Applies business rules during transformation
    - Generates valid XML output

- **CallService**: External service communication
  - **Purpose**: Manages calls to external services (Passkey API)
  - **Key Responsibilities**:
    - HTTP client management
    - Request/response handling
    - Error handling and retries

### Model Layer
**Location**: `com.cvent.passkeyhiltonconverter.model`

- **Configuration Models**:
  - `PasskeyAPIConfig`: Configuration for Passkey API connectivity
  - `PasskeyServiceConfig`: Service-level configuration settings

- **Domain Models** (in API module):
  - `PasskeyStayRecord`: Hilton stay record representation
  - `Result`: Response wrapper for transformation results
  - `MessageLog`: Logging and audit trail model

### Client Layer
**Location**: `com.cvent.passkeyhiltonconverter.clients`

- **External Service Clients**: HTTP clients for communicating with downstream services
- **Authentication Integration**: Integration with Cvent's auth-service

## Data Flow

### Request Processing Flow
1. **Authentication**: API key validation through auth-service
2. **Input Validation**: Validate incoming Hilton stay records
3. **Transformation**: Convert JSON to XML using transformation service
4. **External Call**: Send transformed data to Passkey API
5. **Response**: Return processing results to client

### Error Handling Flow
1. **Validation Errors**: Return 400 Bad Request with error details
2. **Transformation Errors**: Log error and return 500 Internal Server Error
3. **External Service Errors**: Retry logic and fallback handling
4. **Authentication Errors**: Return 401 Unauthorized

## Design Patterns

### Orchestrator Pattern
The `StayRecordOrchestrator` implements the orchestrator pattern to coordinate multiple services and manage the transformation workflow without tight coupling between components.

### Service Layer Pattern
Clear separation between resource (presentation), service (business logic), and model (data) layers following the service layer pattern.

### Configuration Pattern
Externalized configuration using Dropwizard's configuration management, allowing environment-specific settings without code changes.

### Client Wrapper Pattern
External service calls are wrapped in dedicated client classes to provide abstraction and centralized error handling.

## Module Structure

### Multi-Module Maven Project
```
passkey-hilton-converter/
├── passkey-hilton-converter-api/          # API models and contracts
├── passkey-hilton-converter-service/      # Main service implementation
├── passkey-hilton-converter-java-client/  # Java client library
└── passkey-hilton-converter-integration-test/ # Integration tests
```

### API Module (`passkey-hilton-converter-api`)
- **Purpose**: Contains shared data models and API contracts
- **Key Classes**: Domain models, DTOs, and interfaces
- **Dependencies**: Minimal - only essential libraries

### Service Module (`passkey-hilton-converter-service`)
- **Purpose**: Main service implementation with business logic
- **Key Classes**: Resources, services, configuration
- **Dependencies**: Dropwizard, auth-service, external clients

### Java Client Module (`passkey-hilton-converter-java-client`)
- **Purpose**: Provides Java client library for consuming the service
- **Key Classes**: Client interfaces and implementations
- **Dependencies**: HTTP client libraries, API module

### Integration Test Module (`passkey-hilton-converter-integration-test`)
- **Purpose**: End-to-end testing using Karate framework
- **Key Features**: API testing, contract validation, environment-specific tests
- **Dependencies**: Karate, test utilities

## Security Architecture

### Authentication
- **Method**: API Key-based authentication
- **Integration**: Cvent auth-service
- **Scope**: All API endpoints require valid API key

### Authorization
- **Model**: Role-based access control through auth-service
- **Granularity**: Service-level access control

### Data Security
- **In Transit**: HTTPS/TLS encryption
- **Logging**: Sensitive data masking in logs
- **Configuration**: Secure parameter store for secrets

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: Service is stateless and can be horizontally scaled
- **Load Balancing**: Can be deployed behind load balancers
- **Container Ready**: Docker containerization for easy deployment

### Performance Optimization
- **Batch Processing**: Supports multiple stay records per request
- **Connection Pooling**: HTTP client connection pooling
- **Caching**: Configuration caching to reduce external calls

## Monitoring and Observability

### Health Checks
- **Dropwizard Health Checks**: Built-in health monitoring
- **Dependency Checks**: Validates connectivity to external services

### Metrics and Logging
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Metrics Collection**: Dropwizard metrics integration
- **Distributed Tracing**: Request tracing across service boundaries

### External Monitoring
- **Datadog Integration**: APM and log aggregation
- **Alerting**: Automated alerts for service health and performance
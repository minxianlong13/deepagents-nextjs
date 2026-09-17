# Architecture

## System Overview

The Passkey File Import Service follows a layered architecture pattern built on the Dropwizard framework. It acts as an integration layer between Cvent's core file-import-service and the Passkey ecosystem, specifically handling reservation data imports and external confirmation number mapping.

```
┌─────────────────────────────────────────────────────────────┐
│                    File Import UI                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Core File Import Service                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│           Passkey File Import Service                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │   Resources     │ │    Services     │ │    Clients    │ │
│  │   (REST API)    │ │  (Business      │ │  (External    │ │
│  │                 │ │   Logic)        │ │   Services)   │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────┬───────────────────┬───────────────────┘
                      │                   │
        ┌─────────────▼─────────────┐    ┌▼──────────────────┐
        │  Passkey Reservation      │    │  Passkey Resdesk  │
        │       Service             │    │    (RezHub)       │
        └───────────────────────────┘    └───────────────────┘
```

## Components

### Resource Layer (REST API)
- **Purpose**: Handles HTTP requests and responses, implements REST endpoints
- **Location**: `com.cvent.passkeyfileimport.resources`
- **Key Classes**:
  - `PasskeyFileImportResource`: Main API endpoints for file import operations
  - `OpenApiResource`: Serves OpenAPI documentation

### Service Layer (Business Logic)
- **Purpose**: Contains core business logic for file import processing
- **Location**: `com.cvent.passkeyfileimport.services`
- **Key Classes**:
  - `PasskeyFileImportService`: Main service handling reservation processing and validation

### Client Layer (External Integrations)
- **Purpose**: Manages communication with external services
- **Location**: `com.cvent.passkeyfileimport.clients`
- **Key Classes**:
  - `ResdeskClient`: Integration with Passkey Resdesk for RezHub operations
  - Client configurations for external service communication

### Configuration Layer
- **Purpose**: Application and client configuration management
- **Location**: Root package
- **Key Classes**:
  - `PasskeyFileImportServiceApplication`: Main application class
  - `PasskeyFileImportServiceConfiguration`: Service configuration
  - `PasskeyFileImportServiceClientConfiguration`: Client configurations

## Data Flow

### Import Schema Request Flow
1. File Import UI requests available schemas
2. Core File Import Service calls `/schemas/{schemaName}` endpoint
3. Service returns schema definition with required/optional fields
4. UI presents mapping interface to user

### Import Strategy Flow
1. User initiates import after mapping validation
2. Core File Import Service calls `/import/{schemaName}` endpoint
3. Service responds with batch size configuration (100 records)
4. Core service prepares to send data in batches

### Data Import Flow
1. Core File Import Service sends batched data to `/importData/{schemaName}`
2. Service validates each record:
   - Extracts ACK number and external confirmation number
   - Validates ACK number against Passkey Reservation Service
   - Retrieves reservation ID for valid ACKs
3. Service processes valid records:
   - Creates mapping between ACK and external confirmation numbers
   - Sends mapping to Resdesk for RezHub processing
4. Service returns status for each record (SUCCESS/SKIPPED/FAILED)

## Design Patterns

### Repository Pattern
- External service clients act as repositories for data access
- Abstracts external service communication details
- Enables easier testing and mocking

### Service Layer Pattern
- Business logic encapsulated in service classes
- Clear separation between API layer and business logic
- Promotes reusability and testability

### Builder Pattern
- Extensive use of Immutable builders for data objects
- Ensures thread safety and immutability
- Simplifies object construction with complex parameters

### Strategy Pattern
- Different import strategies can be implemented
- Currently supports RezHub reservation import
- Extensible for future import types

## Module Structure

This is a multi-module Maven project with the following structure:

### passkey-file-import-api
- **Purpose**: API definitions and OpenAPI specifications
- **Contents**: OpenAPI JSON/YAML files
- **Consumers**: External clients and documentation tools

### passkey-file-import-service
- **Purpose**: Main service implementation
- **Contents**: REST resources, business logic, configurations
- **Dependencies**: API module, external service clients

### passkey-file-import-java-client
- **Purpose**: Java client library for consuming the service
- **Contents**: Generated client code
- **Consumers**: Other Java services needing to integrate

### passkey-file-import-integration-test
- **Purpose**: Integration tests for the service
- **Contents**: End-to-end test scenarios
- **Environment**: Runs against deployed service instances

### passkey-file-import-load-test
- **Purpose**: Performance and load testing
- **Contents**: Load test scenarios and configurations
- **Tools**: Performance testing frameworks

## Security Architecture

### Authentication
- API Key-based authentication via `@Authority` annotation
- Integration with Cvent's auth-service
- All endpoints require valid API keys

### Authorization
- Service-to-service communication secured
- Private API visibility (not exposed to external consumers)
- User context validation for reservation access

## Error Handling Strategy

### Validation Errors
- Schema validation at import time
- Business rule validation during processing
- Graceful handling of invalid data with status tracking

### External Service Failures
- Retry logic for transient failures
- Circuit breaker pattern for service resilience
- Comprehensive logging for troubleshooting

### Data Consistency
- Batch processing with individual record status tracking
- Partial success handling (some records succeed, others fail)
- Idempotent operations where possible
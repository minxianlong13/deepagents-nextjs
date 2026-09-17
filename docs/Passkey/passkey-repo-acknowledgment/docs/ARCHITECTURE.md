# Architecture

## System Overview

The Passkey Acknowledgment Service follows a layered architecture pattern built on the Dropwizard framework. It's designed as a stateless microservice that processes acknowledgment requests and coordinates with external systems to deliver reservation confirmations.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Auth Service   │    │ Email Services  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Passkey Acknowledgment Service                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Resource  │  │   Service   │  │      Data Access        │ │
│  │    Layer    │  │    Layer    │  │        Layer            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Database     │    │ Message Queue   │    │ External APIs   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### Resource Layer
- **Location**: `passkey-acknowledgment-service/src/main/java/com/cvent/passkey/acknowledgment/resources/`
- **Purpose**: Handles HTTP requests and responses, implements REST endpoints
- **Key Classes**:
  - `PasskeyAcknowledgmentResource`: Main REST resource for acknowledgment operations
  - `OpenApiResource`: Serves OpenAPI documentation

### Service Layer
- **Location**: `passkey-acknowledgment-service/src/main/java/com/cvent/passkey/acknowledgment/service/`
- **Purpose**: Contains business logic and orchestrates acknowledgment workflows
- **Key Classes**:
  - `AcknowledgementService`: Core business logic for processing acknowledgments

### Data Access Layer
- **Location**: `passkey-acknowledgment-data-access/`
- **Purpose**: Manages database interactions and data persistence
- **Key Classes**:
  - `AcknowledgementDao`: Database access operations
  - `AcknowledgementMapper`: Maps between domain objects and database entities

### API Models
- **Location**: `passkey-acknowledgment-api/src/main/java/com/cvent/passkey/acknowledgment/model/`
- **Purpose**: Defines request/response models and data transfer objects
- **Key Classes**:
  - `AcknowledgementRequest`: Single reservation acknowledgment request
  - `MasterAcknowledgementRequest`: Multi-reservation acknowledgment request
  - `AcknowledgementResponse`: Standard response model

## Data Flow

### Single Reservation Acknowledgment Flow
1. **Request Reception**: REST endpoint receives `AcknowledgementRequest`
2. **Authentication**: Auth service validates API key/bearer token
3. **Preference Check**: Service validates acknowledgment preferences if required
4. **Data Persistence**: Acknowledgment details stored in database
5. **Notification Trigger**: External notification services invoked
6. **Response**: `AcknowledgementResponse` returned with tracking information

### Multi-Reservation Acknowledgment Flow
1. **Request Reception**: REST endpoint receives `MasterAcknowledgementRequest`
2. **Authentication**: Auth service validates credentials
3. **Batch Processing**: Service processes multiple reservations under master acknowledgment
4. **Individual Acknowledgments**: Optionally creates individual acknowledgments
5. **Data Persistence**: Master and individual acknowledgment records stored
6. **Bulk Notification**: Coordinated notification delivery
7. **Response**: Consolidated response with master acknowledgment details

## Design Patterns

### Repository Pattern
- **Implementation**: `AcknowledgementDao` abstracts database operations
- **Benefits**: Separates data access logic from business logic
- **Usage**: All database interactions go through DAO layer

### Service Layer Pattern
- **Implementation**: `AcknowledgementService` encapsulates business logic
- **Benefits**: Centralizes business rules and workflow orchestration
- **Usage**: Resources delegate all business operations to service layer

### Data Transfer Object (DTO) Pattern
- **Implementation**: API models in `passkey-acknowledgment-api` module
- **Benefits**: Clean separation between internal models and external contracts
- **Usage**: All REST endpoints use DTOs for request/response

### Dependency Injection
- **Implementation**: Dropwizard's built-in DI container
- **Benefits**: Loose coupling between components
- **Usage**: Services and DAOs injected into resources

## Module Structure

### Multi-Module Maven Project
```
passkey-acknowledgment/
├── passkey-acknowledgment-api/           # API models and contracts
├── passkey-acknowledgment-service/       # Main service implementation
├── passkey-acknowledgment-data-access/   # Database layer
├── passkey-acknowledgment-java-client/   # Java client library
└── passkey-acknowledgment-integration-test/ # Integration tests
```

### Module Dependencies
- **Service Module**: Depends on API and Data Access modules
- **Data Access Module**: Depends on API module for models
- **Java Client Module**: Depends only on API module
- **Integration Test Module**: Depends on all modules for testing

## Security Architecture

### Authentication
- **API Key Authentication**: For service-to-service communication
- **Bearer Token Authentication**: For user-based access
- **Implementation**: Cvent Auth Service integration

### Authorization
- **Method-Level Security**: `@Authority` annotations on endpoints
- **Supported Methods**: `AuthMethod.BEARER`, `AuthMethod.API_KEY`
- **Visibility**: Private endpoints (not publicly accessible)

## Scalability Considerations

### Stateless Design
- No session state maintained in service
- All required data passed in requests
- Enables horizontal scaling

### Database Design
- Optimized for high-volume acknowledgment processing
- Indexed for efficient querying
- Supports concurrent operations

### Caching Strategy
- Preference data cached to reduce database load
- Configuration cached for performance
- Cache invalidation on updates
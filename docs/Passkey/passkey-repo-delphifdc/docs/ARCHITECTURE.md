# Architecture

## System Overview

The Passkey Delphi FDC Service implements a layered architecture pattern with clear separation between API, business logic, data access, and integration layers. The service acts as an integration bridge, receiving event notifications from Amadeus Delphi FDC and processing them for consumption by Passkey services.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Amadeus       │    │   Passkey       │    │   Passkey       │
│   Delphi FDC    │───▶│   DelphiFDC     │───▶│   Services      │
│                 │    │   Service       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   DynamoDB      │
                       │   Storage       │
                       └─────────────────┘
```

## Components

### API Layer (`passkey-delphifdc-api`)
- **Purpose**: Defines data contracts and models for external communication
- **Location**: `passkey-delphifdc-api/src/main/java/com/cvent/passkeydelphifdc/model/`
- **Key Classes**:
  - `NotificationRequest`: Primary event notification model
  - `EventDetail`: Event-specific information
  - `BookingFetch`: Booking data structure
  - `InnerNotification`: Internal notification representation

### Service Layer (`passkey-delphifdc-service`)
- **Purpose**: Contains REST endpoints, business logic, and application configuration
- **Location**: `passkey-delphifdc-service/src/main/java/com/cvent/passkeydelphifdc/`
- **Key Classes**:
  - `PasskeyDelphifdcServiceApplication`: Main application entry point
  - `PasskeyDelphifdcResource`: Primary REST endpoint
  - `CallbackResource`: Callback handling
  - `EmulationResource`: Testing and emulation endpoints
  - `NotificationProcessor`: Background processing engine
  - `ProcessingService`: Core business logic

### Data Access Layer (`passkey-delphifdc-data-access`)
- **Purpose**: Handles data persistence and external service integration
- **Location**: `passkey-delphifdc-data-access/src/main/java/com/cvent/passkeydelphifdc/`
- **Key Classes**:
  - `NotificationDynamoDBService`: Notification persistence
  - `TaskDynamoDBService`: Task management
  - `LogDynamoDBService`: Audit logging
  - `ErrorDynamoDBService`: Error tracking
  - `UserDetailesDataAccess`: User data access

### Client Layer (`passkey-delphifdc-java-client`)
- **Purpose**: Provides client libraries for service consumption
- **Location**: `passkey-delphifdc-java-client/src/main/java/`
- **Key Classes**: Client interfaces and implementations

### Shared Components (`passkey-delphifdc-shared`)
- **Purpose**: Common utilities and shared configurations
- **Location**: `passkey-delphifdc-shared/src/main/java/`
- **Key Classes**: Utility classes and shared models

## Data Flow

### Notification Processing Flow

1. **Event Reception**
   - Amadeus sends event notifications to `/api/v1/events` endpoint
   - `PasskeyDelphifdcResource.notifyEvent()` receives and validates requests
   - Notifications are persisted to DynamoDB via `NotificationService`

2. **Background Processing**
   - `NotificationProcessor` runs on scheduled intervals (every 5 minutes)
   - Retrieves pending notifications from DynamoDB
   - Processes notifications through `ProcessingService`

3. **Event Processing**
   - `ProcessingService` orchestrates the processing workflow
   - Authenticates with external services via `AuthService`
   - Fetches additional data from Amadeus via `AmadeusService`
   - Transforms data using `GMLMessageService`
   - Sends processed events to Passkey services

4. **Error Handling**
   - Failed processing attempts are logged to `ErrorDynamoDBService`
   - Retry logic handles transient failures
   - Comprehensive logging for debugging and monitoring

### Authentication Flow

1. **API Key Validation**
   - Incoming requests validated against Cvent Auth Service
   - Supports API Key, JWT, and Bearer token authentication
   - Role-based authorization (AMADEUS_USER, delphifdc-notifications:write)

2. **Service-to-Service Authentication**
   - `AuthService` manages credentials for external service calls
   - `CredentialsService` provides environment-specific credentials
   - Secure token management for Amadeus and Passkey integrations

## Design Patterns

### Repository Pattern
- Data access abstracted through service interfaces
- `NotificationService`, `TaskService`, `LogService` provide data operations
- DynamoDB implementations handle persistence details

### Service Layer Pattern
- Business logic encapsulated in service classes
- Clear separation between REST controllers and business logic
- Dependency injection for service composition

### Provider Pattern
- `AmadeusProvider` and `EventHousingProvider` abstract external service access
- Configurable endpoints and authentication
- Centralized client management

### Scheduled Processing Pattern
- Background processor runs on fixed intervals
- Timeout protection prevents long-running operations
- Graceful error handling and recovery

## Module Structure

```
passkey-delphifdc/
├── passkey-delphifdc-api/           # Data models and contracts
├── passkey-delphifdc-service/       # REST endpoints and business logic
├── passkey-delphifdc-data-access/   # Data persistence and external services
├── passkey-delphifdc-java-client/   # Client libraries
├── passkey-delphifdc-shared/        # Common utilities
└── passkey-delphifdc-integration-test/ # Integration tests
```

### Dependency Flow
```
Service Layer
    ↓
Data Access Layer ← API Layer
    ↓
Shared Components
```

## Configuration Management

### Multi-Environment Support
- `MultiEnvConfig` provides environment-specific configurations
- Database connections, service endpoints, and credentials per environment
- Template-based configuration resolution

### External Service Configuration
- Amadeus Integration Service endpoints
- Passkey Event Housing Service configuration
- CSN IBK Config SKU Service integration
- DynamoDB region and table configuration

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables multiple instances
- Shared DynamoDB storage for coordination
- Random delay in scheduled processing prevents thundering herd

### Performance Optimization
- Asynchronous notification processing
- Batch processing capabilities
- Connection pooling for external services
- Efficient DynamoDB queries with proper indexing

### Monitoring and Observability
- Comprehensive logging with MDC context
- Datadog APM integration
- Health checks for service monitoring
- Distributed tracing support
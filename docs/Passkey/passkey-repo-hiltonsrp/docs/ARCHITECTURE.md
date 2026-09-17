# Architecture

## System Overview

The Passkey Hilton SRP Service follows a multi-module Maven architecture built on the Dropwizard framework. It implements a scheduled integration pattern that periodically synchronizes event data with Hilton's reservation systems through RESTful API calls.

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Cvent Events  │    │  Passkey Hilton SRP  │    │  Hilton APIs    │
│                 │───▶│      Service         │───▶│                 │
│   (Event Codes) │    │                      │    │ (Reservations)  │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │  Auth Service │
                       │ (OAuth Tokens)│
                       └──────────────┘
```

## Components

### passkey-hiltonsrp-service
- **Purpose**: Main service module containing business logic and REST endpoints
- **Location**: `passkey-hiltonsrp-service/`
- **Key Classes**:
  - `PasskeyHiltonSRPServiceApplication`: Main Dropwizard application
  - `HiltonSRPResource`: REST endpoints for manual operations
  - `PasskeyHiltonSRPResource`: Core SRP processing endpoints
  - `HiltonSRPClient`: HTTP client for Hilton API integration

### passkey-hiltonsrp-api
- **Purpose**: API contracts and data transfer objects
- **Location**: `passkey-hiltonsrp-api/`
- **Key Classes**: Request/response models for Hilton API interactions

### passkey-hiltonsrp-data-access
- **Purpose**: Data access layer and repository patterns
- **Location**: `passkey-hiltonsrp-data-access/`
- **Key Classes**: Database entities and data access objects

### passkey-hiltonsrp-java-client
- **Purpose**: Client library for other services to interact with this service
- **Location**: `passkey-hiltonsrp-java-client/`
- **Key Classes**: Java client interfaces and implementations

### passkey-hiltonsrp-integration-test
- **Purpose**: End-to-end integration tests
- **Location**: `passkey-hiltonsrp-integration-test/`
- **Key Classes**: Integration test suites for Hilton API workflows

## Data Flow

1. **Scheduled Execution**: Service runs on an hourly schedule (configurable)
2. **Event Code Retrieval**: Fetches event codes from Cvent's event management system
3. **Authentication**: Obtains OAuth tokens from auth-service for Hilton API access
4. **SRP Mapping Push**: Sends event codes to Hilton's SRP mapping endpoint
5. **Reservation Retrieval**: Receives inbound reservation data from Hilton
6. **Data Processing**: Processes and validates reservation data
7. **Downstream Integration**: Forwards processed reservations to relevant Passkey services

## Design Patterns

### Service Layer Pattern
- Clear separation between REST resources and business logic
- Service classes handle core business operations
- Resources act as thin controllers

### Client Pattern
- Dedicated HTTP client classes for external API integration
- Centralized error handling and retry logic
- Configuration-driven endpoint management

### Repository Pattern
- Data access abstraction through repository interfaces
- Separation of data persistence concerns from business logic

### Configuration Pattern
- Environment-specific configuration files
- Externalized secrets management through parameter store
- Profile-based configuration for different environments

## Module Structure

```
passkey-hiltonsrp/
├── passkey-hiltonsrp-api/           # API contracts
├── passkey-hiltonsrp-data-access/   # Data layer
├── passkey-hiltonsrp-service/       # Main service
│   ├── src/main/java/
│   │   └── com/cvent/passkeyhiltonsrp/
│   │       ├── clients/             # External API clients
│   │       ├── resources/           # REST endpoints
│   │       ├── services/            # Business logic
│   │       └── PasskeyHiltonSRPServiceApplication.java
│   └── configs/                     # Environment configurations
├── passkey-hiltonsrp-java-client/   # Client library
└── passkey-hiltonsrp-integration-test/ # Integration tests
```

## Deployment Architecture

The service is deployed as a containerized application using Docker:

- **Base Image**: Java 21 runtime
- **Deployment Target**: Kubernetes clusters
- **Configuration**: Environment-specific YAML files
- **Secrets**: AWS Parameter Store integration
- **Monitoring**: Datadog APM and logging

## Security Considerations

- OAuth 2.0 client credentials flow for Hilton API authentication
- Separate credentials for staging and production environments
- Secrets managed through AWS Parameter Store
- HTTPS-only communication with external APIs
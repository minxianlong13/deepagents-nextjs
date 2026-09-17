# Architecture

## System Overview

The Passkey Ledger Service follows a multi-module Maven architecture built on the Dropwizard framework. It implements a layered architecture pattern with clear separation between API contracts, business logic, data access, and service layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    External Clients                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 REST API Layer                              │
│  BalanceResource | CreditCardResource | OperationResource   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Service Layer                                │
│     Business Logic & Transaction Management                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Data Access Layer                              │
│         Database Operations & External APIs                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│            External Dependencies                            │
│  Oracle DB | Payment APIs | Wallet Services | Auth Service │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service is organized into six main modules:

### passkey-ledger-api
- **Purpose**: Defines API contracts and data models
- **Location**: `passkey-ledger-api/`
- **Key Components**:
  - Data transfer objects (DTOs)
  - API model classes
  - Enums and constants
  - Request/response models

### passkey-ledger-service
- **Purpose**: Main service implementation with REST endpoints
- **Location**: `passkey-ledger-service/`
- **Key Components**:
  - `PasskeyLedgerServiceApplication.java` - Main application entry point
  - `PasskeyLedgerServiceConfiguration.java` - Service configuration
  - REST resource classes (BalanceResource, CreditCardResource, etc.)
  - Business service implementations
  - Health checks and utilities

### passkey-ledger-data-access
- **Purpose**: Database operations and data persistence
- **Location**: `passkey-ledger-data-access/`
- **Key Components**:
  - DAO (Data Access Object) implementations
  - Database entity mappings
  - SQL queries and database operations
  - Connection management

### passkey-ledger-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-ledger-java-client/`
- **Key Components**:
  - Client interface definitions
  - HTTP client implementations
  - Client configuration
  - Response handling utilities

### passkey-ledger-integration-test
- **Purpose**: End-to-end integration testing
- **Location**: `passkey-ledger-integration-test/`
- **Key Components**:
  - Karate-based API tests
  - Test scenarios and feature files
  - Test data management
  - Environment-specific test configurations

### passkey-ledger-load-test
- **Purpose**: Performance and load testing
- **Location**: `passkey-ledger-load-test/`
- **Key Components**:
  - Load test scenarios
  - Performance benchmarks
  - Stress testing configurations

## Components

### REST Resources
- **BalanceResource**: Manages account balance operations
- **CreditCardResource**: Handles credit card processing
- **CreditCardVerificationResource**: Validates credit card information
- **OperationResource**: Manages general ledger operations
- **TransactionDetailsResource**: Provides transaction detail queries
- **SBGCreditCardResource**: Subblock Group credit card operations
- **PBBCallbackResource**: Pay By Bank callback handling

### Service Layer
- **Purpose**: Implements business logic and orchestrates operations
- **Location**: `passkey-ledger-service/src/main/java/com/cvent/passkeyledger/services/`
- **Responsibilities**:
  - Transaction processing logic
  - Business rule enforcement
  - External service integration
  - Data validation and transformation

### Data Access Layer
- **Purpose**: Abstracts database operations and external API calls
- **Technologies**: 
  - Oracle JDBC for database connectivity
  - HikariCP for connection pooling
  - Apache DbUtils for database operations

### Configuration Management
- **Development**: `configs/dev.yaml`
- **Environment Variables**: Loaded from `dev.env` file
- **External Dependencies**: API keys and service endpoints

## Data Flow

### Payment Processing Flow
1. **Request Reception**: REST endpoint receives payment request
2. **Authentication**: Auth service validates request credentials
3. **Business Logic**: Service layer processes business rules
4. **External Validation**: Credit card verification through external services
5. **Ledger Update**: Transaction recorded in database
6. **Response**: Success/failure response returned to client

### Balance Query Flow
1. **Balance Request**: Client requests account balance
2. **Authorization**: Request validated against auth service
3. **Data Retrieval**: Balance information fetched from database
4. **Response Formatting**: Data formatted and returned

## Design Patterns

### Repository Pattern
- Data access abstracted through DAO interfaces
- Separation of business logic from data persistence
- Testable data layer with mock implementations

### Service Layer Pattern
- Business logic encapsulated in service classes
- Transaction management at service boundaries
- Clear separation of concerns

### Configuration Pattern
- Externalized configuration through YAML files
- Environment-specific settings
- Secure handling of sensitive data (API keys)

### Client Pattern
- Dedicated client module for service consumption
- Standardized error handling
- Retry and circuit breaker patterns

## Security Architecture

### Authentication
- Integration with Cvent Auth Service
- API key-based authentication
- Request validation and authorization

### Data Protection
- Sensitive data encryption
- Secure API key management
- PCI compliance considerations for payment data

### Network Security
- HTTPS-only communication
- Internal service mesh integration
- Firewall and network isolation

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Load balancer compatibility
- Database connection pooling

### Performance Optimization
- Efficient database queries
- Connection reuse
- Caching strategies for frequently accessed data

### Monitoring and Observability
- Dropwizard metrics integration
- Health check endpoints
- Distributed tracing support
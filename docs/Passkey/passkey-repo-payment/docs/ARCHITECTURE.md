# Architecture

## System Overview

The Passkey Payment Service follows a layered architecture pattern built on Dropwizard framework. It's designed as a multi-module Maven project that separates concerns across API, service logic, data access, and client libraries.

```
┌─────────────────────────────────────────────────────────────┐
│                    External Clients                         │
├─────────────────────────────────────────────────────────────┤
│                  JAX-RS Resources                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Payment   │ │   Pricing   │ │      Wallet         │   │
│  │  Resources  │ │  Resources  │ │    Resources        │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Payment   │ │   Pricing   │ │     Commerce        │   │
│  │   Service   │ │   Service   │ │     Service         │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                  Data Access Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Payment   │ │    Rate     │ │      Admin          │   │
│  │     DAO     │ │    DAO      │ │       DAO           │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                External Dependencies                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Wallet    │ │   Event     │ │      Hotel          │   │
│  │   Service   │ │   Service   │ │     Service         │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service is organized into the following Maven modules:

### passkey-payment-api
- **Purpose**: Defines the public API contracts and data models
- **Location**: `passkey-payment-api/`
- **Key Classes**:
  - Request/Response models
  - API interfaces
  - OpenAPI specifications

### passkey-payment-service
- **Purpose**: Main service implementation with REST resources
- **Location**: `passkey-payment-service/`
- **Key Classes**:
  - `PasskeyPaymentServiceApplication` - Main application entry point
  - `PasskeyPaymentServiceConfiguration` - Service configuration
  - Resource classes (JAX-RS endpoints)
  - Service layer implementations

### passkey-payment-data-access
- **Purpose**: Data access layer and database operations
- **Location**: `passkey-payment-data-access/`
- **Key Classes**:
  - DAO implementations
  - Database entity mappings
  - Data access utilities

### passkey-payment-shared
- **Purpose**: Shared utilities and common code
- **Location**: `passkey-payment-shared/`
- **Key Classes**:
  - Common utilities
  - Shared constants
  - Helper classes

### passkey-payment-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-payment-java-client/`
- **Key Classes**:
  - `PasskeyPaymentClient` - Main client interface
  - Client configuration
  - Request builders

### passkey-payment-integration-test
- **Purpose**: Integration tests for the service
- **Location**: `passkey-payment-integration-test/`

### passkey-payment-load-test
- **Purpose**: Load testing scenarios
- **Location**: `passkey-payment-load-test/`

## Components

### Payment Processing Component
- **Purpose**: Handles payment transactions and lifecycle management
- **Location**: `passkey-payment-service/src/main/java/com/cvent/passkey/payment/resources/PasskeyPaymentsResource.java`
- **Key Classes**:
  - `PasskeyPaymentsResource` - Payment operations endpoint
  - `PasskeyGroupPaymentsResource` - Group payment handling
  - Payment service implementations

### Pricing Component
- **Purpose**: Calculates pricing for reservations and rooms
- **Location**: `passkey-payment-service/src/main/java/com/cvent/passkey/payment/resources/PasskeyPricingResource.java`
- **Key Classes**:
  - `PasskeyPricingResource` - Pricing calculations endpoint
  - `PasskeyRatesResource` - Rate management
  - Pricing service implementations

### Wallet Management Component
- **Purpose**: Manages payment methods and tokenization
- **Location**: `passkey-payment-service/src/main/java/com/cvent/passkey/payment/resources/PasskeyWalletResource.java`
- **Key Classes**:
  - `PasskeyWalletResource` - Wallet operations endpoint
  - Wallet service implementations
  - Tokenization handlers

### Commerce Component
- **Purpose**: E-commerce functionality and order management
- **Location**: `passkey-payment-service/src/main/java/com/cvent/passkey/payment/resources/PasskeyCommerceResource.java`
- **Key Classes**:
  - `PasskeyCommerceResource` - Commerce operations endpoint
  - `DepPasskeyCommerceResource` - Deprecated commerce endpoints
  - Commerce service implementations

### Admin Component
- **Purpose**: Administrative operations and management
- **Location**: `passkey-payment-service/src/main/java/com/cvent/passkey/payment/resources/AdminResource.java`
- **Key Classes**:
  - `AdminResource` - Administrative endpoints
  - `AdminTokenizeResource` - Admin tokenization operations
  - Admin service implementations

## Data Flow

### Payment Processing Flow
1. **Request Reception**: JAX-RS resource receives payment request
2. **Validation**: Request validation and authentication
3. **Business Logic**: Service layer processes payment logic
4. **External Calls**: Integration with wallet service and payment gateways
5. **Data Persistence**: Payment data stored via DAO layer
6. **Response**: Formatted response returned to client

### Pricing Calculation Flow
1. **Rate Request**: Client requests pricing for specific dates/rooms
2. **Rate Lookup**: Service queries rate data from database
3. **Calculation**: Pricing algorithms applied based on business rules
4. **External Data**: Integration with hotel service for room information
5. **Response**: Calculated pricing returned to client

### Wallet Operations Flow
1. **Wallet Request**: Client requests wallet operations
2. **Authentication**: User/session validation
3. **Tokenization**: Payment method tokenization via external service
4. **Storage**: Wallet data persistence
5. **Response**: Wallet information returned

## Design Patterns

### Repository Pattern
- **Implementation**: DAO classes provide data access abstraction
- **Benefits**: Separates business logic from data access concerns
- **Location**: `passkey-payment-data-access` module

### Service Layer Pattern
- **Implementation**: Service classes contain business logic
- **Benefits**: Encapsulates business rules and coordinates operations
- **Location**: Service implementations in `passkey-payment-service`

### Dependency Injection
- **Implementation**: Dropwizard's built-in DI container
- **Benefits**: Loose coupling and testability
- **Configuration**: Application class and configuration files

### Client-Server Pattern
- **Implementation**: JAX-RS resources expose REST endpoints
- **Benefits**: Clear separation of concerns and protocol independence
- **Location**: Resource classes in `passkey-payment-service`

### Configuration Pattern
- **Implementation**: YAML-based configuration with environment-specific overrides
- **Benefits**: Environment-specific deployments without code changes
- **Location**: `passkey-payment-service/configs/`

## Integration Architecture

### Upstream Dependencies
- **Auth Service**: Authentication and authorization
- **Passkey Event Service**: Event notifications and messaging
- **Passkey Hotel Service**: Hotel and room information
- **Payments Wallet Service**: Payment method storage
- **Ecommerce Tokenizer**: Payment tokenization

### Downstream Consumers
- **Reservation Orchestrator**: Primary consumer for payment operations
- **Passkey Commerce Service**: Commerce-related operations
- **Admin Tools**: Administrative interfaces

### Communication Patterns
- **Synchronous**: REST API calls for real-time operations
- **Asynchronous**: Event-driven communication for notifications
- **Circuit Breaker**: Resilience patterns for external service calls

## Security Architecture

### Authentication
- Integration with Cvent Auth Service
- JWT token validation
- Service-to-service authentication

### Authorization
- Role-based access control
- Resource-level permissions
- Admin operation restrictions

### Data Protection
- Payment data tokenization
- Encrypted data transmission
- PCI compliance considerations

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Load balancer compatibility
- Database connection pooling

### Performance Optimization
- Caching strategies for rate data
- Async processing for non-critical operations
- Database query optimization

### Monitoring and Observability
- Dropwizard metrics integration
- Health check endpoints
- Distributed tracing support
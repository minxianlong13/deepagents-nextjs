# Architecture

## System Overview

The Passkey Request Inventory Service follows a layered architecture pattern built on the Dropwizard framework. It implements a multi-module Maven structure that separates concerns across API definitions, business logic, data access, and service layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                  API Gateway / Load Balancer                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Passkey Request Inventory Service              │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   Resources     │    Services     │      DAOs       │    │
│  │   (REST API)    │  (Business      │  (Data Access)  │    │
│  │                 │   Logic)        │                 │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Database (PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

The service is organized into six Maven modules:

### 1. passkey-request-inventory-api
- **Purpose**: Contains API models, DTOs, and contracts
- **Location**: `passkey-request-inventory-api/`
- **Key Classes**:
  - `InventoryAllocationRequest` - Request model for inventory allocation
  - `InventoryAllocationResponse` - Response model with allocation details
  - `InventoryLockRequest` - Request model for inventory locking
  - `ErrorResponse` - Standardized error response format

### 2. passkey-request-inventory-service
- **Purpose**: Main service implementation with REST resources and business logic
- **Location**: `passkey-request-inventory-service/`
- **Key Classes**:
  - `PasskeyRequestInventoryServiceApplication` - Main application class
  - `RequestInventoryResource` - REST endpoints for inventory operations
  - `BulkRequestInventoryResource` - Bulk operation endpoints
  - `LockInventoryResource` - Inventory locking endpoints

### 3. passkey-request-inventory-data-access
- **Purpose**: Data access layer with DAOs and database interactions
- **Location**: `passkey-request-inventory-data-access/`
- **Key Classes**:
  - `RequestInventoryDao` - Primary inventory data access
  - `AllocationRecordDao` - Allocation record management
  - `LockDao` - Inventory lock management
  - `InventoryAcquisitionDao` - Inventory acquisition operations

### 4. passkey-request-inventory-java-client
- **Purpose**: Java client library for consuming the service
- **Location**: `passkey-request-inventory-java-client/`

### 5. passkey-request-inventory-integration-test
- **Purpose**: Integration tests using Karate framework
- **Location**: `passkey-request-inventory-integration-test/`

### 6. passkey-request-inventory-load-test
- **Purpose**: Performance and load testing
- **Location**: `passkey-request-inventory-load-test/`

## Component Architecture

### Resource Layer (REST API)
- **RequestInventoryResource**: Handles individual inventory allocation operations
- **BulkRequestInventoryResource**: Processes multiple inventory requests
- **LockInventoryResource**: Manages temporary inventory locks
- **Filters**: Request ID tracking, environment identification, authentication

### Service Layer (Business Logic)
- **RequestInventoryService**: Core inventory allocation business logic
- **BulkRequestInventoryService**: Bulk operation coordination
- **LockInventoryService**: Inventory locking and unlocking logic
- **ValidationServices**: Input and business rule validation
- **AllocationRecordService**: Allocation record management
- **InventoryAcquisitionService**: Inventory acquisition operations

### Data Access Layer
- **TransactionManager**: Database transaction management
- **DAOs**: Data access objects for different entity types
- **Database Connection**: PostgreSQL connection management

## Data Flow

### 1. Inventory Allocation Request Flow
```
Client Request → RequestInventoryResource → RequestInventoryService
    ↓
ValidationServices (Input & Business Rules)
    ↓
InventoryAcquisitionService → InventoryAcquisitionDao
    ↓
AllocationRecordService → AllocationRecordDao
    ↓
Database Transaction Commit → Response to Client
```

### 2. Bulk Operation Flow
```
Bulk Request → BulkRequestInventoryResource → BulkRequestInventoryService
    ↓
For Each Item: RequestInventoryService (Individual Processing)
    ↓
Aggregate Results → Bulk Response to Client
```

### 3. Lock Operation Flow
```
Lock Request → LockInventoryResource → LockInventoryService
    ↓
LockRecordService → LockDao
    ↓
Temporary Lock Creation → Lock Response
```

## Design Patterns

### 1. Layered Architecture
- Clear separation between presentation, business, and data layers
- Each layer only communicates with adjacent layers
- Promotes maintainability and testability

### 2. Repository Pattern
- DAOs abstract database access details
- Service layer works with domain objects, not database specifics
- Enables easier testing with mock repositories

### 3. Transaction Script Pattern
- Business logic organized around transactions
- TransactionManager ensures ACID properties
- Service methods represent complete business operations

### 4. Dependency Injection
- Services injected into resources
- DAOs injected into services
- Promotes loose coupling and testability

### 5. Proxy Pattern
- Transaction proxies wrap service instances
- Automatic transaction management
- Cross-cutting concerns handled transparently

## Security Architecture

### Authentication & Authorization
- **Auth Service Integration**: Uses Cvent's centralized auth service
- **API Key Authentication**: All endpoints require valid API keys
- **Authority Annotations**: Method-level security declarations
- **Request Filtering**: Authentication filters process all requests

### Data Security
- **Database Encryption**: Sensitive data encrypted at rest
- **Connection Security**: Secure database connections
- **Audit Logging**: All operations logged for compliance

## Scalability Considerations

### Horizontal Scaling
- Stateless service design enables multiple instances
- Load balancer distributes requests across instances
- Database connection pooling manages concurrent access

### Performance Optimization
- **Bulk Operations**: Reduce network overhead for multiple requests
- **Connection Pooling**: Efficient database connection management
- **Caching**: Strategic caching of frequently accessed data
- **Asynchronous Processing**: Non-blocking operations where possible

## Monitoring & Observability

### Logging
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Log Context**: Automatic injection of request metadata
- **Business Event Logging**: Key business operations tracked

### Metrics
- **Dropwizard Metrics**: Built-in application metrics
- **Custom Metrics**: Business-specific measurements
- **Database Metrics**: Connection pool and query performance

### Health Checks
- **Application Health**: Service availability monitoring
- **Database Health**: Database connectivity verification
- **Dependency Health**: External service availability

## Error Handling

### Exception Management
- **Global Exception Mappers**: Consistent error response format
- **Multi-Environment Support**: Environment-aware error handling
- **Validation Errors**: Detailed validation failure information

### Resilience Patterns
- **Circuit Breaker**: Protection against cascading failures
- **Retry Logic**: Automatic retry for transient failures
- **Timeout Management**: Configurable operation timeouts

## Configuration Management

### Environment-Specific Configuration
- **YAML Configuration**: Environment-specific settings
- **Hogan Templates**: Configuration template management
- **Secret Management**: Secure handling of sensitive configuration

### Feature Flags
- **Runtime Configuration**: Dynamic feature enablement
- **A/B Testing**: Gradual feature rollout capability
- **Emergency Switches**: Quick feature disable capability
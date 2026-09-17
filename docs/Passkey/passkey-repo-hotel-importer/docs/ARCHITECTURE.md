# Architecture

## System Overview

The Passkey Hotel Importer follows a modular, strategy-based architecture designed to handle multiple hotel data providers through a unified interface. The system is built as a Spring Boot microservice with a hybrid Java/TypeScript monorepo structure using Maven and pnpm for dependency management.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   Hotel         │    │   Passkey       │
│   Providers     │───▶│   Importer      │───▶│   Platform      │
│ (Choice, etc.)  │    │   Service       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AWS S3        │
                       │   (Media)       │
                       └─────────────────┘
```

## Components

### Core Application Layer

#### HotelImporterApplication
- **Purpose**: Spring Boot application entry point
- **Location**: `com.cvent.passkey.hotelimporter.HotelImporterApplication`
- **Key Features**: Auto-configuration, component scanning

#### HotelDataImportController
- **Purpose**: REST API controller for hotel import operations
- **Location**: `com.cvent.passkey.hotelimporter.controllers.HotelDataImportController`
- **Key Classes**: Main controller handling all import endpoints
- **Security**: Role-based access control (ADMIN only)

### Strategy Pattern Implementation

#### ImportStrategyFactory
- **Purpose**: Factory for creating appropriate import strategies
- **Location**: `com.cvent.passkey.hotelimporter.strategies.ImportStrategyFactory`
- **Key Features**: Provider-specific strategy selection

#### ImportStrategy Interface
- **Purpose**: Defines contract for hotel data import operations
- **Key Methods**:
  - `importHotel()` - Import hotel data
  - `importRooms()` - Import room information
  - `importRoomImages()` - Import media assets
  - `assignHotel()` - Assign hotel to venue
  - `unassignHotel()` - Remove hotel assignment

#### Provider Implementations
- **Choice Hotels Strategy**: Handles Choice Hotels data format
- **Ice Portal Strategy**: Handles Ice Portal integration
- **Extensible**: New providers can be added by implementing ImportStrategy

### Data Access Layer

#### Repositories
- **Purpose**: Data persistence and retrieval
- **Location**: `com.cvent.passkey.hotelimporter.repositories`
- **Technology**: Spring Data JPA with Oracle database

#### Entities
- **Purpose**: Domain model representations
- **Location**: `com.cvent.passkey.hotelimporter.entities`
- **Key Features**: JPA annotations, Lombok integration

### External Integration Layer

#### CviiClient
- **Purpose**: Integration with Cvent Venue Information Integration
- **Key Features**: Provider external ID management, venue data retrieval

#### Passkey Service Clients
- **Create Hotel Client**: Hotel creation in Passkey
- **Vendor Client**: Vendor management operations
- **Booking Supplier Match**: Hotel matching and validation

#### Media Processing
- **MediaProcessor**: Handles image processing and S3 storage
- **Location**: `com.cvent.passkey.hotelimporter.MediaProcessor`
- **Key Features**: Image validation, S3 upload, metadata extraction

## Data Flow

### Hotel Import Process

1. **Request Validation**
   - Validate request parameters
   - Check user authorization (ADMIN role)
   - Verify provider support

2. **Provider ID Resolution**
   - Query CVII for venue provider mappings
   - Validate source and target provider IDs exist

3. **Strategy Selection**
   - Factory selects appropriate import strategy
   - Based on source and target provider types

4. **Data Import Execution**
   - Strategy executes provider-specific import logic
   - Handles data transformation and validation
   - Manages error conditions and rollback

5. **Response Generation**
   - Return success/failure status
   - Include provider ID mappings
   - Log operation details

### Room Import Process

1. **Hotel Validation**
   - Verify hotel exists in target system
   - Check import prerequisites

2. **Room Data Processing**
   - Extract room information from source
   - Transform to target format
   - Validate room configurations

3. **Image Processing** (if applicable)
   - Download images from source
   - Process and validate media
   - Upload to S3 storage
   - Update room image references

## Design Patterns

### Strategy Pattern
- **Implementation**: ImportStrategy interface with provider-specific implementations
- **Benefits**: Easy addition of new providers, separation of concerns
- **Usage**: Factory selects strategy based on provider combination

### Factory Pattern
- **Implementation**: ImportStrategyFactory
- **Benefits**: Centralized strategy creation, loose coupling
- **Usage**: Controller delegates strategy selection to factory

### Repository Pattern
- **Implementation**: Spring Data JPA repositories
- **Benefits**: Data access abstraction, testability
- **Usage**: Entities managed through repository interfaces

### Builder Pattern
- **Implementation**: ImportMapping, ImportResponse builders
- **Benefits**: Immutable objects, fluent API
- **Usage**: Request/response object construction

## Module Structure

### Maven Multi-Module Project

```
passkey-hotel-importer/
├── parent/           # Parent POM with shared configuration
├── model/            # Shared data models
├── java-client/      # Java client library
├── service/          # Main Spring Boot application
└── it/              # Integration tests
```

### Service Module Structure

```
service/
├── src/main/java/com/cvent/passkey/hotelimporter/
│   ├── HotelImporterApplication.java
│   ├── controllers/     # REST endpoints
│   ├── strategies/      # Import strategy implementations
│   ├── clients/         # External service clients
│   ├── entities/        # JPA entities
│   ├── repositories/    # Data access
│   ├── configs/         # Configuration classes
│   ├── model/          # DTOs and request/response models
│   ├── exceptions/     # Custom exceptions
│   └── media/          # Media processing
├── src/main/resources/
│   └── application.yml
└── configs/            # Environment-specific configs
```

## Configuration Management

### Environment-Specific Configs
- **Development**: `configs/dev.yaml`
- **Staging**: `configs/staging.yaml`
- **Production**: `configs/prod.yaml`

### Configuration Classes
- **WebSecurityConfig**: Security configuration
- **Database Configuration**: JPA and Oracle setup
- **Client Configuration**: External service clients

## Error Handling

### Exception Hierarchy
- **HotelImporterException**: Base service exception
- **S3StorageException**: Media storage errors
- **Validation Exceptions**: Request validation failures

### Error Response Strategy
- Structured error responses with HTTP status codes
- Detailed logging for troubleshooting
- Graceful degradation for partial failures

## Observability

### Logging
- **Framework**: SLF4J with Logback
- **Context**: Venue ID tagging for request tracing
- **Levels**: INFO for operations, ERROR for failures

### Monitoring
- **DataDog Integration**: Service metrics and traces
- **Health Checks**: Spring Boot Actuator endpoints
- **Performance Metrics**: Import operation timing

## Security

### Authentication & Authorization
- **OAuth Integration**: Cvent OAuth provider
- **Role-Based Access**: ADMIN role required for all operations
- **Security Configuration**: Spring Security with JWT

### Data Protection
- **Encryption**: TLS for all external communications
- **Secrets Management**: Environment-based configuration
- **Audit Logging**: All operations logged with user context
# Architecture

## System Overview

The Passkey Reservation Orchestrator Client is designed as a lightweight Java library that provides a clean abstraction layer over the Reservation Orchestrator REST API. The architecture follows a layered approach with clear separation of concerns between client interfaces, domain models, and HTTP communication.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ ReservationClient│  │BatchReservation  │  │CommerceClient│ │
│  │                 │  │Client            │  │             │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Base Client                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              BaseClient                                 │ │
│  │  - HTTP Communication                                   │ │
│  │  - JSON Serialization/Deserialization                  │ │
│  │  - Error Handling                                       │ │
│  │  - Authentication                                       │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Domain Models                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Reservation │  │ Guest       │  │ Batch Models        │  │
│  │ Room        │  │ Payment     │  │ Commerce Models     │  │
│  │ RoomNight   │  │ Address     │  │ Group Booking       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│              Reservation Orchestrator API                   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Client Layer

#### ReservationClient
- **Purpose**: Handles single reservation operations (create, modify, cancel, get)
- **Location**: `com.cvent.passkey.reservationorchestratorclient.ReservationClient`
- **Key Features**:
  - Asynchronous operation monitoring with `ReservationOperation`
  - Automatic retry and timeout handling
  - Status polling until completion

#### BatchReservationClient
- **Purpose**: Manages bulk reservation operations for improved performance
- **Location**: `com.cvent.passkey.reservationorchestratorclient.BatchReservationClient`
- **Key Features**:
  - Batch creation and management
  - Chunked submission for large batches
  - Client reference ID tracking for individual operations

#### CommerceClient
- **Purpose**: Handles payment and commerce-related operations
- **Location**: `com.cvent.passkey.reservationorchestratorclient.CommerceClient`
- **Key Features**:
  - Payment processing integration
  - Transaction management
  - Financial operation support

#### GroupBookingClient
- **Purpose**: Specialized client for group reservation operations
- **Location**: `com.cvent.passkey.reservationorchestratorclient.GroupBookingClient`
- **Key Features**:
  - Group-specific reservation handling
  - Bulk group operations
  - Group booking lifecycle management

#### ApplyGuaranteeTypeClient
- **Purpose**: Manages guarantee type application for reservations
- **Location**: `com.cvent.passkey.reservationorchestratorclient.ApplyGuaranteeTypeClient`
- **Key Features**:
  - Guarantee type validation and application
  - Payment method verification

### Base Infrastructure

#### BaseClient
- **Purpose**: Provides common HTTP communication and utility functions
- **Location**: `com.cvent.passkey.reservationorchestratorclient.BaseClient`
- **Key Responsibilities**:
  - HTTP request/response handling
  - JSON serialization using Jackson
  - Authentication header management
  - Error response processing
  - Retry logic and timeout handling

## Data Flow

### Single Reservation Flow
1. **Client Request**: Application creates reservation request through `ReservationClient`
2. **Validation**: Client validates request parameters and authentication
3. **HTTP Call**: `BaseClient` sends HTTP request to Reservation Orchestrator API
4. **Async Response**: API returns operation ID for asynchronous processing
5. **Monitoring**: `ReservationOperation` polls status until completion
6. **Result**: Final reservation result returned to application

### Batch Processing Flow
1. **Batch Creation**: Application creates batch through `BatchReservationClient`
2. **Operation Accumulation**: Multiple operations added to batch locally
3. **Chunked Submission**: Large batches split into manageable chunks
4. **Parallel Processing**: API processes batch operations asynchronously
5. **Status Aggregation**: Client monitors overall batch status
6. **Result Collection**: Individual operation results retrieved by client reference ID

## Design Patterns

### Builder Pattern
- Used extensively in domain models with Immutables library
- Provides type-safe object construction
- Ensures immutability of domain objects

### Template Method Pattern
- `BaseClient` provides common HTTP handling template
- Specific clients override behavior for their use cases
- Consistent error handling and authentication across all clients

### Strategy Pattern
- Different client implementations for various operation types
- Pluggable serialization/deserialization strategies
- Configurable retry and timeout strategies

### Observer Pattern
- Operation monitoring through status polling
- Event-driven status updates
- Callback mechanisms for completion handling

## Module Structure

The library follows a single-module Maven structure:

```
src/main/java/com/cvent/passkey/reservationorchestratorclient/
├── client/                    # HTTP client utilities
├── model/                     # Domain models and DTOs
│   ├── applyguarantee/       # Guarantee type models
│   ├── batch/                # Batch operation models
│   ├── commerce/             # Commerce and payment models
│   └── groupbooking/         # Group booking models
├── BaseClient.java           # Common HTTP functionality
├── ReservationClient.java    # Single reservation operations
├── BatchReservationClient.java # Batch operations
├── CommerceClient.java       # Commerce operations
├── GroupBookingClient.java   # Group booking operations
└── ApplyGuaranteeTypeClient.java # Guarantee operations
```

## Key Architectural Decisions

### Immutable Domain Models
- All domain objects are immutable using the Immutables library
- Provides thread safety and prevents accidental mutations
- Builder pattern for object construction

### Asynchronous Operation Handling
- All reservation operations are asynchronous by design
- Built-in monitoring and polling mechanisms
- Configurable timeouts and retry policies

### Type-Safe API Design
- Strong typing throughout the API
- Compile-time validation of parameters
- Clear separation between request/response models

### Minimal Dependencies
- Lightweight design with minimal external dependencies
- Leverages Cvent's common-client for HTTP operations
- Uses Jackson for JSON processing

### Error Handling Strategy
- Comprehensive exception hierarchy
- Detailed error information preservation
- Graceful degradation for non-critical failures
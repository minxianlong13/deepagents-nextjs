# Domain Model

## Glossary

### Transfer
The process of moving reservation data from one system to another, typically from a hotel's Property Management System (PMS) to Cvent's Passkey system or vice versa.

### Transfer State
The current status of a reservation transfer operation, indicating whether the transfer is pending, in progress, completed, or failed.

### Transfer Definition
Configuration settings that define how transfers should be handled for a specific event and hotel combination, including rules, mappings, and automation settings.

### Transfer Log
A record of transfer operations and their outcomes, providing an audit trail of all transfer activities.

### Transfer History
Historical records of all transfer-related actions and state changes for reservations, providing a complete audit trail.

### Folio
A detailed record of charges and payments associated with a hotel reservation, including room charges, taxes, and additional services.

### Folio Transfer State
The transfer status specifically for folio data, which may be transferred separately from reservation data.

### Reservation Acknowledgement Number (ResAckNumber)
A unique identifier assigned to a reservation that serves as a reference across different systems.

### Folio Acknowledgement Number (FolioAckNumber)
A unique identifier for folio records that enables tracking and referencing across systems.

### Combine Queue
A processing queue that manages the combination and consolidation of multiple transfer operations for efficiency.

### Mapping Rules
Configuration rules that define how data fields should be mapped between different systems during transfer operations.

### External Reservation
Reservation data that originates from or is synchronized with external systems such as hotel PMS or third-party booking platforms.

### Transfer Result
The outcome and details of a completed transfer operation, including success/failure status and any relevant metrics.

## Core Entities

### TransferState
**Description**: Represents the current state of a reservation transfer operation.

**Attributes**:
- `reservationId`: Long - Unique identifier for the reservation
- `resAckNumber`: String - Reservation acknowledgement number
- `transferState`: String - Current state (PENDING, IN_PROGRESS, COMPLETED, FAILED)
- `transferResult`: String - Result of the transfer (SUCCESS, FAILURE, PARTIAL)
- `createdDate`: DateTime - When the transfer state was created
- `lastModifiedDate`: DateTime - When the transfer state was last updated
- `extendedInfo`: Map<String, Object> - Additional transfer metadata

**Relationships**:
- Related to Reservation (1:1)
- Related to TransferHistory (1:many)

### FolioTransferState
**Description**: Represents the transfer state specifically for folio data.

**Attributes**:
- `reservationId`: Long - Associated reservation identifier
- `suffix`: String - Folio suffix for multiple folios per reservation
- `folioAckNumber`: String - Folio acknowledgement number
- `transferState`: String - Current folio transfer state
- `createdDate`: DateTime - Creation timestamp
- `lastModifiedDate`: DateTime - Last modification timestamp

**Relationships**:
- Related to TransferState (many:1)
- Related to Reservation (many:1)

### TransferDefinition
**Description**: Configuration that defines how transfers should be handled for specific event-hotel combinations.

**Attributes**:
- `eventId`: Long - Event identifier
- `hotelId`: Long - Hotel identifier
- `transferEnabled`: Boolean - Whether transfers are enabled
- `autoTransfer`: Boolean - Whether transfers should be automatic
- `transferDelay`: Integer - Delay in hours before transfer
- `transferSettings`: Map<String, Object> - Additional configuration settings
- `active`: Boolean - Whether the definition is active

**Relationships**:
- Related to Event (many:1)
- Related to Hotel (many:1)
- Related to MappingRules (1:many)

### TransferHistory
**Description**: Historical record of transfer-related actions and state changes.

**Attributes**:
- `historyId`: Long - Unique history record identifier
- `reservationId`: Long - Associated reservation
- `action`: String - Action performed (INITIATED, COMPLETED, FAILED, etc.)
- `timestamp`: DateTime - When the action occurred
- `userId`: String - User who performed the action
- `details`: String - Additional details about the action
- `previousState`: String - State before the action
- `newState`: String - State after the action

**Relationships**:
- Related to TransferState (many:1)
- Related to User (many:1)

### CombineQueueRecord
**Description**: Represents an entry in the combine processing queue.

**Attributes**:
- `resAckNumber`: String - Reservation acknowledgement number
- `status`: String - Queue status (PENDING, PROCESSING, COMPLETED)
- `priority`: Integer - Processing priority
- `createdDate`: DateTime - When queued
- `processedDate`: DateTime - When processed
- `retryCount`: Integer - Number of retry attempts
- `errorMessage`: String - Error details if processing failed

**Relationships**:
- Related to TransferState (1:1)

### MappingRule
**Description**: Rules for mapping data fields between different systems.

**Attributes**:
- `ruleId`: Long - Unique rule identifier
- `eventId`: Long - Associated event
- `hotelId`: Long - Associated hotel
- `ruleType`: String - Type of mapping (ROOM_TYPE, RATE_CODE, etc.)
- `sourceValue`: String - Value in source system
- `targetValue`: String - Corresponding value in target system
- `active`: Boolean - Whether the rule is active
- `priority`: Integer - Rule application priority

**Relationships**:
- Related to TransferDefinition (many:1)

### ReservationIdentifiers
**Description**: Key identifiers for reservations across different systems.

**Attributes**:
- `reservationId`: Long - Internal reservation ID
- `resAckNumber`: String - Reservation acknowledgement number
- `eventId`: Long - Associated event
- `hotelId`: Long - Associated hotel
- `externalReservationId`: String - ID in external system
- `folioAckNumbers`: List<String> - Associated folio acknowledgement numbers

**Relationships**:
- Related to TransferState (1:1)
- Related to ExternalReservation (1:1)

### TransferResult
**Description**: Detailed results and metrics from completed transfer operations.

**Attributes**:
- `transferId`: String - Unique transfer identifier
- `reservationId`: Long - Associated reservation
- `status`: String - Transfer status (SUCCESS, FAILURE, PARTIAL)
- `transferDate`: DateTime - When transfer was performed
- `foliosTransferred`: Integer - Number of folios transferred
- `totalAmount`: BigDecimal - Total monetary amount transferred
- `currency`: String - Currency code
- `errorDetails`: String - Error information if failed
- `metrics`: Map<String, Object> - Additional transfer metrics

**Relationships**:
- Related to TransferState (1:1)
- Related to TransferHistory (1:many)

### ExternalReservation
**Description**: Information about reservations in external systems.

**Attributes**:
- `reservationId`: Long - Internal reservation ID
- `externalSystemId`: String - External system identifier
- `externalReservationId`: String - Reservation ID in external system
- `syncStatus`: String - Synchronization status
- `lastSyncDate`: DateTime - Last synchronization timestamp
- `syncErrors`: String - Synchronization error details

**Relationships**:
- Related to ReservationIdentifiers (1:1)
- Related to TransferState (1:1)

## Business Rules

### Transfer State Management
1. **State Transitions**: Transfer states must follow valid transition paths:
   - PENDING → IN_PROGRESS → COMPLETED/FAILED
   - Failed transfers can be reset to PENDING for retry
   - Completed transfers cannot be modified

2. **Concurrency Control**: Only one transfer operation can be active per reservation at a time

3. **Audit Trail**: All state changes must be recorded in transfer history

### Folio Transfer Rules
1. **Multiple Folios**: A single reservation can have multiple folios, each with independent transfer states
2. **Folio Dependencies**: Some folios may have dependencies that affect transfer order
3. **Partial Transfers**: Folio transfers can succeed partially, requiring detailed result tracking

### Transfer Definition Rules
1. **Event-Hotel Scope**: Transfer definitions are scoped to specific event-hotel combinations
2. **Inheritance**: Hotel-level settings can be overridden at the event level
3. **Activation**: Definitions must be explicitly activated before transfers can occur

### Combine Queue Processing
1. **Priority Processing**: Higher priority items are processed first
2. **Retry Logic**: Failed items are retried with exponential backoff
3. **Dead Letter Queue**: Items that fail repeatedly are moved to a dead letter queue

### Mapping Rule Application
1. **Rule Priority**: Higher priority rules override lower priority ones
2. **Fallback Values**: Default mappings are used when no specific rule matches
3. **Validation**: Mapped values must be validated against target system constraints

### Data Consistency
1. **Referential Integrity**: All foreign key relationships must be maintained
2. **Temporal Consistency**: Timestamps must be consistent across related entities
3. **Business Logic Validation**: All business rules must be enforced at the service layer

## Entity Relationships

```
TransferDefinition (1) ←→ (many) MappingRule
       ↓
TransferState (1) ←→ (many) TransferHistory
       ↓
FolioTransferState (many) ←→ (1) TransferState
       ↓
TransferResult (1) ←→ (1) TransferState
       ↓
CombineQueueRecord (1) ←→ (1) TransferState
       ↓
ReservationIdentifiers (1) ←→ (1) ExternalReservation
```

## Data Flow Patterns

### Transfer Initiation Flow
1. Transfer Definition is evaluated for event-hotel combination
2. TransferState is created with PENDING status
3. TransferHistory entry is created for initiation
4. CombineQueueRecord may be created for batch processing

### Transfer Processing Flow
1. TransferState is updated to IN_PROGRESS
2. Mapping Rules are applied to transform data
3. External system integration is performed
4. FolioTransferState records are created/updated
5. TransferResult is generated with outcome details

### Transfer Completion Flow
1. TransferState is updated to COMPLETED/FAILED
2. TransferHistory entry is created for completion
3. CombineQueueRecord is marked as processed
4. Notifications may be sent to interested parties

## Validation Rules

### Data Validation
- Reservation IDs must be positive integers
- Acknowledgement numbers must follow specific format patterns
- Dates must be in valid ISO format
- Currency codes must be valid ISO 4217 codes

### Business Validation
- Transfer operations cannot be performed on cancelled reservations
- Folio transfers require valid reservation context
- Mapping rules must have valid source and target values
- Transfer definitions must be active to allow transfers

### Security Validation
- All operations require valid API key authentication
- Users must have appropriate permissions for transfer operations
- Sensitive data must be properly encrypted in transit and at rest
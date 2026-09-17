# Domain Model

## Glossary

### Transfer
A reservation data exchange operation between Cvent's Passkey system and an external vendor system. Transfers can be synchronous or asynchronous and include create, update, or cancel operations.

### Vendor
An external hotel management system or booking platform that integrates with Passkey for reservation data exchange. Examples include Amadeus, DerbySoft, Hilton, OHIP, and Shiji.

### Reservation
A hotel booking record containing guest information, room details, dates, and payment information that needs to be synchronized with vendor systems.

### Block Transfer
A bulk operation that transfers room inventory blocks rather than individual reservations, typically used for group bookings or event-based room allocations.

### Scheduled Transfer
A transfer operation that is queued for execution at a specific future time, allowing for batch processing and optimal timing coordination.

### Callback
An asynchronous response from a vendor system indicating the status or result of a previously initiated transfer operation.

### Step Function Workflow
An AWS orchestration service that manages complex multi-step transfer processes, providing state management and error handling.

### Audit Trail
A comprehensive log of all transfer operations, including requests, responses, errors, and state changes for compliance and debugging purposes.

### Vendor Authorization
The process of authenticating and authorizing access to vendor systems using credentials, API keys, or tokens.

### Transfer State
The current status of a transfer operation (e.g., pending, processing, completed, failed) tracked throughout its lifecycle.

## Core Entities

### Transfer Request
**Description**: Represents a request to transfer reservation data to a vendor system

**Attributes**:
- `transferId`: string - Unique identifier for the transfer
- `reservationId`: string - Identifier of the reservation to transfer
- `eventId`: number - Event associated with the reservation
- `hotelId`: number - Hotel identifier
- `vendorType`: VendorType - Target vendor system
- `transferType`: TransferType - Operation type (create, update, cancel)
- `status`: TransferStatus - Current transfer status
- `priority`: Priority - Transfer priority level
- `scheduledDate`: Date - When the transfer should be executed
- `createdAt`: Date - Transfer request creation timestamp
- `updatedAt`: Date - Last modification timestamp
- `attempts`: number - Number of execution attempts
- `lastError`: string - Last error message if failed

**Relationships**:
- Belongs to a Reservation
- Associated with a Hotel
- Part of an Event
- May have multiple Transfer Attempts

### Bulk Transfer Request
**Description**: Represents a request to transfer multiple reservations in a single operation

**Attributes**:
- `bulkTransferId`: string - Unique identifier for the bulk transfer
- `eventId`: number - Event identifier
- `hotelId`: number - Hotel identifier
- `vendorType`: VendorType - Target vendor system
- `transferType`: TransferType - Operation type
- `totalReservations`: number - Total number of reservations
- `completedReservations`: number - Number of completed transfers
- `failedReservations`: number - Number of failed transfers
- `status`: BulkTransferStatus - Overall bulk transfer status
- `createdAt`: Date - Creation timestamp
- `completedAt`: Date - Completion timestamp

**Relationships**:
- Contains multiple Transfer Requests
- Associated with an Event and Hotel

### Block Transfer
**Description**: Represents a room inventory block transfer to a vendor system

**Attributes**:
- `blockTransferId`: string - Unique identifier
- `eventId`: number - Event identifier
- `hotelId`: number - Hotel identifier
- `vendorType`: VendorType - Target vendor system
- `blockId`: string - Block identifier
- `roomType`: string - Type of rooms in the block
- `quantity`: number - Number of rooms
- `startDate`: Date - Block start date
- `endDate`: Date - Block end date
- `status`: TransferStatus - Block transfer status
- `vendorBlockId`: string - Vendor-assigned block identifier

**Relationships**:
- Associated with an Event and Hotel
- May contain multiple Room Allocations

### Vendor Configuration
**Description**: Configuration settings for integrating with specific vendor systems

**Attributes**:
- `vendorType`: VendorType - Vendor system type
- `hotelId`: number - Hotel identifier
- `endpoint`: string - Vendor API endpoint
- `credentials`: VendorCredentials - Authentication credentials
- `settings`: VendorSettings - Vendor-specific configuration
- `isActive`: boolean - Whether integration is active
- `lastUpdated`: Date - Last configuration update

**Relationships**:
- Associated with a Hotel
- Used by Transfer Requests

### Transfer Audit
**Description**: Audit record of transfer operations for compliance and debugging

**Attributes**:
- `auditId`: string - Unique audit identifier
- `transferId`: string - Associated transfer identifier
- `operation`: string - Operation performed
- `requestData`: object - Request payload
- `responseData`: object - Response payload
- `timestamp`: Date - Operation timestamp
- `userId`: string - User who initiated the operation
- `ipAddress`: string - Source IP address
- `userAgent`: string - Client user agent

**Relationships**:
- Associated with Transfer Requests
- May reference User records

### Callback Event
**Description**: Asynchronous response from vendor systems

**Attributes**:
- `callbackId`: string - Unique callback identifier
- `transferId`: string - Associated transfer identifier
- `vendorType`: VendorType - Source vendor system
- `eventType`: CallbackEventType - Type of callback event
- `payload`: object - Callback data payload
- `receivedAt`: Date - When callback was received
- `processedAt`: Date - When callback was processed
- `status`: CallbackStatus - Processing status

**Relationships**:
- Associated with Transfer Requests
- May trigger Transfer State updates

## Enumerations

### VendorType
- `AMADEUS` - Amadeus hospitality platform
- `DERBYSOFT` - DerbySoft distribution system
- `HILTON` - Hilton hotel management system
- `OHIP` - Oracle Hospitality Integration Platform
- `SHIJI` - Shiji hotel technology platform

### TransferType
- `CREATE` - Create new reservation in vendor system
- `UPDATE` - Update existing reservation
- `CANCEL` - Cancel reservation in vendor system

### TransferStatus
- `PENDING` - Transfer queued for processing
- `PROCESSING` - Transfer currently being executed
- `COMPLETED` - Transfer completed successfully
- `FAILED` - Transfer failed with error
- `CANCELLED` - Transfer cancelled before execution
- `RETRYING` - Transfer being retried after failure

### Priority
- `HIGH` - High priority transfer (processed immediately)
- `NORMAL` - Normal priority transfer
- `LOW` - Low priority transfer (processed during off-peak)

### CallbackEventType
- `CONFIRMATION` - Vendor confirmation of transfer
- `STATUS_UPDATE` - Status change notification
- `ERROR` - Error notification from vendor
- `COMPLETION` - Transfer completion notification

## Business Rules

### Transfer Processing Rules
1. **Priority Ordering**: High priority transfers are processed before normal and low priority transfers
2. **Retry Logic**: Failed transfers are automatically retried up to 3 times with exponential backoff
3. **Timeout Handling**: Transfers that don't complete within 5 minutes are marked as failed
4. **Duplicate Prevention**: Duplicate transfers for the same reservation are prevented within a 24-hour window

### Vendor Integration Rules
1. **Authentication**: All vendor communications must use valid authentication credentials
2. **Rate Limiting**: Vendor API calls are rate-limited to prevent overwhelming external systems
3. **Data Validation**: All transfer data is validated against vendor-specific schemas before transmission
4. **Error Handling**: Vendor errors are categorized as retryable or non-retryable

### Scheduling Rules
1. **Future Scheduling**: Transfers can be scheduled up to 30 days in advance
2. **Batch Processing**: Scheduled transfers are processed in batches every 5 minutes
3. **Holiday Handling**: Transfer scheduling considers vendor system maintenance windows
4. **Timezone Handling**: All scheduled times are converted to vendor system timezones

### Audit Requirements
1. **Complete Logging**: All transfer operations must be logged with full request/response data
2. **Retention Policy**: Audit logs are retained for 7 years for compliance purposes
3. **Data Privacy**: Sensitive data in audit logs is encrypted and access-controlled
4. **Integrity**: Audit logs are immutable and tamper-evident

### Data Consistency Rules
1. **Idempotency**: Transfer operations are idempotent to handle duplicate requests safely
2. **State Consistency**: Transfer state changes are atomic and consistent
3. **Rollback Capability**: Failed transfers can be rolled back to previous state
4. **Conflict Resolution**: Concurrent transfer attempts are serialized to prevent conflicts

## Domain Events

### Transfer Events
- `TransferInitiated` - Transfer request created
- `TransferStarted` - Transfer processing began
- `TransferCompleted` - Transfer completed successfully
- `TransferFailed` - Transfer failed with error
- `TransferRetried` - Transfer retry attempted
- `TransferCancelled` - Transfer cancelled

### Vendor Events
- `VendorResponseReceived` - Response received from vendor
- `VendorCallbackProcessed` - Callback from vendor processed
- `VendorAuthenticationFailed` - Vendor authentication failed
- `VendorConfigurationChanged` - Vendor configuration updated

### System Events
- `BulkTransferStarted` - Bulk transfer operation initiated
- `BulkTransferCompleted` - Bulk transfer operation completed
- `ScheduledTransferTriggered` - Scheduled transfer executed
- `AuditLogCreated` - New audit log entry created
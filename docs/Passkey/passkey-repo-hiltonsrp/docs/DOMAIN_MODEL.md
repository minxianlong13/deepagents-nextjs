# Domain Model

## Glossary

### SRP (Single Rate Plan)
A hotel pricing and inventory management concept where a single rate applies to all room types for a specific event or group booking. In the context of this service, SRP mapping refers to the association between Cvent event codes and Hilton's internal rate plan identifiers.

### Event Code
A unique identifier assigned to each event in Cvent's system. This code is used to link hotel reservations to specific events and is shared with hotel partners like Hilton for inventory management.

### Inbound Reservation
A hotel reservation created through Hilton's systems that needs to be synchronized back to Cvent's Passkey platform. These reservations are typically made by event attendees using special event rates.

### Sync Operation
A batch process that pushes event codes to Hilton's SRP mapping system and retrieves any new or updated reservations. This operation runs on a scheduled basis (typically hourly).

### OAuth Client Credentials
An authentication flow used to obtain access tokens for server-to-server communication with Hilton's APIs. The service maintains separate credentials for staging and production environments.

### Passkey Reservation ID
A unique identifier assigned by Cvent's Passkey system to track reservations internally. This ID is used to link Hilton reservations with Cvent's reservation management system.

## Core Entities

### HiltonSRPMapping
**Description**: Represents the mapping between a Cvent event code and Hilton's internal rate plan

**Attributes**:
- `eventCode`: String - Cvent event identifier
- `hiltonRatePlanId`: String - Hilton's internal rate plan identifier
- `propertyCode`: String - Hilton property identifier
- `startDate`: LocalDate - Effective start date for the mapping
- `endDate`: LocalDate - Effective end date for the mapping
- `status`: MappingStatus - Current status (ACTIVE, INACTIVE, PENDING)
- `createdAt`: Instant - Timestamp when mapping was created
- `lastSyncAt`: Instant - Last successful synchronization timestamp

**Relationships**:
- One-to-many with HiltonReservation
- Associated with Event (external entity)

### HiltonReservation
**Description**: Represents a hotel reservation received from Hilton's system

**Attributes**:
- `reservationId`: String - Hilton's reservation identifier
- `passkeyReservationId`: String - Cvent's internal reservation ID
- `eventCode`: String - Associated event code
- `guestName`: String - Primary guest name
- `guestEmail`: String - Guest email address
- `checkInDate`: LocalDate - Reservation check-in date
- `checkOutDate`: LocalDate - Reservation check-out date
- `roomType`: String - Type of room reserved
- `rate`: BigDecimal - Nightly rate
- `currency`: String - Currency code (ISO 4217)
- `status`: ReservationStatus - Current reservation status
- `confirmationNumber`: String - Hilton confirmation number
- `createdAt`: Instant - When reservation was first received
- `lastModifiedAt`: Instant - Last modification timestamp

**Relationships**:
- Many-to-one with HiltonSRPMapping
- Associated with Guest (external entity)

### SyncOperation
**Description**: Tracks the execution of SRP synchronization operations

**Attributes**:
- `syncId`: String - Unique identifier for the sync operation
- `operationType`: SyncType - Type of sync (SCHEDULED, MANUAL, WEBHOOK)
- `eventCodes`: List<String> - Event codes processed in this sync
- `status`: SyncStatus - Current operation status
- `startTime`: Instant - When the sync operation began
- `endTime`: Instant - When the sync operation completed
- `successCount`: Integer - Number of successful operations
- `errorCount`: Integer - Number of failed operations
- `errors`: List<SyncError> - Details of any errors encountered

**Relationships**:
- One-to-many with SyncError

### AuthToken
**Description**: Manages OAuth tokens for Hilton API authentication

**Attributes**:
- `tokenId`: String - Unique token identifier
- `accessToken`: String - OAuth access token (encrypted)
- `tokenType`: String - Token type (typically "Bearer")
- `expiresAt`: Instant - Token expiration timestamp
- `scope`: String - Token scope/permissions
- `environment`: Environment - Target environment (STAGING, PRODUCTION)
- `createdAt`: Instant - Token creation timestamp

## Business Rules

### SRP Mapping Rules
1. Each event code can have multiple SRP mappings for different properties
2. SRP mappings must have non-overlapping date ranges for the same property
3. Only ACTIVE mappings are included in synchronization operations
4. Mappings automatically become INACTIVE after their end date

### Reservation Processing Rules
1. Reservations must be associated with a valid, active SRP mapping
2. Duplicate reservations (same Hilton reservation ID) are updated, not created
3. Cancelled reservations in Hilton are marked as CANCELLED in Passkey
4. Guest information is validated against basic format requirements

### Synchronization Rules
1. Sync operations run every hour during business hours (configurable)
2. Failed sync operations are retried up to 3 times with exponential backoff
3. Sync operations timeout after 10 minutes
4. Only one sync operation can run at a time per environment

### Authentication Rules
1. OAuth tokens are refreshed automatically when they expire
2. Separate credentials are maintained for staging and production
3. Token refresh failures trigger alerts to the operations team
4. All API calls to Hilton must include valid authentication headers

## Data Validation

### Event Code Format
- Must be alphanumeric with optional hyphens and underscores
- Length: 3-20 characters
- Case-insensitive but stored in uppercase

### Reservation Data
- Guest names must be non-empty and contain only valid characters
- Email addresses must follow RFC 5322 format
- Dates must be in ISO 8601 format
- Rates must be positive decimal values
- Currency codes must be valid ISO 4217 codes

### API Integration
- All external API calls include request/response logging
- Sensitive data (tokens, guest PII) is masked in logs
- API timeouts are configured per endpoint
- Circuit breaker pattern is implemented for external calls

## State Transitions

### Reservation Status Flow
```
PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT
    ↓         ↓           ↓
CANCELLED ← CANCELLED ← CANCELLED
    ↓
NO_SHOW
```

### Sync Operation Status Flow
```
INITIATED → RUNNING → COMPLETED
     ↓         ↓         ↑
   FAILED ← FAILED ← RETRYING
```

### SRP Mapping Status Flow
```
PENDING → ACTIVE → INACTIVE
    ↓        ↓
REJECTED  EXPIRED
```
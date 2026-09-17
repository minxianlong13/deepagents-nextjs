# Domain Model

## Glossary

### Room List Manager (RLM)
A system component that processes bulk room assignments and reservations through spreadsheet uploads, enabling efficient management of large-scale hotel bookings for events.

### Event
A specific occasion or gathering (conference, wedding, corporate meeting) that requires hotel room reservations. Events have associated date ranges, hotels, and room blocks.

### Room Block
A pre-negotiated set of hotel rooms reserved for an event, including specific room types, rates, and availability periods.

### Guest Record
Individual guest information including personal details, contact information, and accommodation preferences extracted from uploaded spreadsheets.

### Reservation
A confirmed hotel room booking for a specific guest, including check-in/check-out dates, room type, and rate information.

### Upload Session
A single file upload operation that includes the uploaded file, processing status, validation results, and any generated reservations or modifications.

### Rate Limiting
System controls that manage the volume and frequency of processing operations to prevent system overload and ensure fair resource allocation.

### Modification Flow
The process of updating existing reservations through RLM, including changes to dates, room types, guest information, or cancellations.

### Malware Scanning
Security validation process that checks uploaded files for malicious content before processing begins.

### Processing Queue
A managed queue system that handles bulk operations in batches to maintain system performance and reliability.

## Core Entities

### Event
**Description**: Represents a hotel event requiring room reservations

**Attributes**:
- `eventId`: String - Unique identifier for the event
- `eventName`: String - Display name of the event
- `hotelId`: String - Associated hotel identifier
- `hotelName`: String - Hotel display name
- `startDate`: LocalDate - Event start date
- `endDate`: LocalDate - Event end date
- `organizationId`: String - Owning organization
- `status`: EventStatus - Current event status (active, cancelled, completed)
- `rlmEnabled`: Boolean - Whether RLM processing is enabled
- `modificationEnabled`: Boolean - Whether modifications are allowed

**Relationships**:
- Has many RoomBlocks
- Has many Reservations
- Has many UploadSessions
- Belongs to Organization

### RoomBlock
**Description**: A collection of rooms reserved for an event

**Attributes**:
- `blockId`: String - Unique block identifier
- `eventId`: String - Associated event
- `roomTypeCode`: String - Type of rooms in the block
- `roomTypeName`: String - Display name for room type
- `totalRooms`: Integer - Total rooms in the block
- `availableRooms`: Integer - Currently available rooms
- `rate`: BigDecimal - Room rate per night
- `currency`: String - Currency code
- `blockStartDate`: LocalDate - Block availability start
- `blockEndDate`: LocalDate - Block availability end

**Relationships**:
- Belongs to Event
- Has many Reservations

### Guest
**Description**: Individual guest information

**Attributes**:
- `guestId`: String - Unique guest identifier
- `firstName`: String - Guest first name
- `lastName`: String - Guest last name
- `email`: String - Email address
- `phoneNumber`: String - Contact phone number
- `company`: String - Company affiliation
- `specialRequests`: String - Accommodation requests
- `vipStatus`: Boolean - VIP designation
- `loyaltyNumber`: String - Hotel loyalty program number

**Relationships**:
- Has many Reservations
- Associated with UploadSessions

### Reservation
**Description**: A confirmed room booking

**Attributes**:
- `reservationId`: String - Unique reservation identifier
- `confirmationNumber`: String - Hotel confirmation number
- `eventId`: String - Associated event
- `guestId`: String - Primary guest
- `roomTypeCode`: String - Reserved room type
- `checkInDate`: LocalDate - Check-in date
- `checkOutDate`: LocalDate - Check-out date
- `numberOfNights`: Integer - Length of stay
- `rate`: BigDecimal - Nightly rate
- `totalAmount`: BigDecimal - Total reservation cost
- `status`: ReservationStatus - Current status
- `createdDate`: LocalDateTime - Creation timestamp
- `modifiedDate`: LocalDateTime - Last modification
- `source`: String - Creation source (RLM, manual, etc.)

**Relationships**:
- Belongs to Event
- Belongs to Guest
- Associated with RoomBlock
- Tracked in UploadSession

### UploadSession
**Description**: A file upload and processing session

**Attributes**:
- `uploadId`: String - Unique upload identifier
- `filename`: String - Original filename
- `fileSize`: Long - File size in bytes
- `fileType`: String - File format (xlsx, csv)
- `eventId`: String - Target event
- `uploadedBy`: String - User who uploaded
- `uploadTime`: LocalDateTime - Upload timestamp
- `status`: UploadStatus - Current processing status
- `processType`: ProcessType - Type of operation
- `totalRows`: Integer - Total rows in file
- `processedRows`: Integer - Rows processed so far
- `successfulRows`: Integer - Successfully processed rows
- `errorRows`: Integer - Rows with errors
- `startTime`: LocalDateTime - Processing start time
- `completionTime`: LocalDateTime - Processing completion time

**Relationships**:
- Belongs to Event
- Has many ProcessingErrors
- Has many ReservationChanges

### ProcessingError
**Description**: Errors encountered during file processing

**Attributes**:
- `errorId`: String - Unique error identifier
- `uploadId`: String - Associated upload session
- `rowNumber`: Integer - Row where error occurred
- `columnName`: String - Column with the error
- `errorCode`: String - Error classification code
- `errorMessage`: String - Human-readable error description
- `severity`: ErrorSeverity - Error severity level
- `timestamp`: LocalDateTime - When error occurred

**Relationships**:
- Belongs to UploadSession

### RateLimitConfig
**Description**: Configuration for rate limiting rules

**Attributes**:
- `configId`: String - Configuration identifier
- `eventId`: String - Associated event (optional)
- `organizationId`: String - Associated organization (optional)
- `maxConcurrentProcesses`: Integer - Max simultaneous processes
- `maxRowsPerBatch`: Integer - Max rows per processing batch
- `requestsPerMinute`: Integer - API request limit
- `maxFileSize`: Long - Maximum upload file size
- `cooldownPeriod`: Duration - Wait time between operations

**Relationships**:
- May belong to Event
- May belong to Organization

## Business Rules

### File Upload Rules
1. **File Size Limit**: Maximum 10MB per upload
2. **File Format**: Only Excel (.xlsx) and CSV (.csv) files accepted
3. **Malware Scanning**: All files must pass ClamAV scan before processing
4. **Authentication**: User must be authenticated and authorized for the event
5. **Event Status**: Event must be active and RLM-enabled

### Data Validation Rules
1. **Required Fields**: Guest first name, last name, and email are mandatory
2. **Email Format**: Must be valid email address format
3. **Date Validation**: Check-in date must be before check-out date
4. **Date Range**: Dates must fall within event date range
5. **Room Type**: Must match available room types for the event
6. **Duplicate Detection**: Prevent duplicate reservations for same guest/dates

### Rate Limiting Rules
1. **Concurrent Processing**: Maximum 3 simultaneous processes per event
2. **Batch Size**: Maximum 1000 rows processed per batch
3. **API Limits**: 60 requests per minute per user for status checks
4. **Upload Limits**: 10 file uploads per minute per user
5. **Queue Management**: Requests queued when limits exceeded

### Reservation Rules
1. **Availability Check**: Room must be available for requested dates
2. **Block Allocation**: Reservations must fit within allocated room blocks
3. **Modification Window**: Modifications allowed only within configured timeframe
4. **Cancellation Policy**: Cancellations subject to hotel policy
5. **Payment Requirements**: Payment processing required for confirmed reservations

### Security Rules
1. **Data Encryption**: All personal data encrypted in transit and at rest
2. **Access Control**: Users can only access events they're authorized for
3. **Audit Trail**: All operations logged for compliance
4. **Data Retention**: Personal data purged according to retention policy
5. **PCI Compliance**: Payment data handled according to PCI DSS standards

## State Transitions

### Upload Status Flow
```
uploaded → scanning → parsing → processing → completed
    ↓         ↓          ↓          ↓          ↓
  failed    failed    failed    failed    failed
    ↓         ↓          ↓          ↓
cancelled cancelled cancelled cancelled
```

### Reservation Status Flow
```
pending → confirmed → checked_in → checked_out
    ↓         ↓           ↓
cancelled cancelled  cancelled
    ↓         ↓
 refunded  refunded
```

### Processing Error Severity
- **ERROR**: Prevents row processing, requires correction
- **WARNING**: Allows processing but flags potential issues
- **INFO**: Informational messages, no action required

## Data Relationships

### Event-Centric Model
```
Event (1) ←→ (N) RoomBlock
Event (1) ←→ (N) Reservation
Event (1) ←→ (N) UploadSession
Event (N) ←→ (1) Organization
```

### Guest-Centric Model
```
Guest (1) ←→ (N) Reservation
Guest (N) ←→ (N) Event (through Reservations)
```

### Processing Model
```
UploadSession (1) ←→ (N) ProcessingError
UploadSession (1) ←→ (N) ReservationChange
UploadSession (N) ←→ (1) Event
```

## Integration Points

### External Service Dependencies
- **Authentication Service**: User validation and session management
- **Inventory Service**: Room availability and pricing
- **Commerce Service**: Payment processing and financial operations
- **ClamAV Service**: File malware scanning
- **Reservation Saga**: Orchestrated reservation workflows

### Data Synchronization
- **Real-time Updates**: Status changes propagated via WebSocket
- **Batch Processing**: Large operations handled in manageable chunks
- **Event Sourcing**: All changes tracked for audit and replay capability
- **Eventual Consistency**: Some operations may have delayed consistency across services
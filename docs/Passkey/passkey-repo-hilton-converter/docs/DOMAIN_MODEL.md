# Domain Model

## Glossary

### Passkey
A hotel booking and event management platform by Cvent that enables event organizers to manage hotel room blocks and reservations for their events.

### Hilton EventStays
Hilton's reservation system that manages hotel bookings specifically for events and group reservations.

### Stay Record
A complete reservation record containing all details about a guest's hotel stay, including dates, room details, guest information, and associated event data.

### Transformation
The process of converting data from one format to another - in this case, from Hilton's JSON format to Passkey's XML format.

### Orchestrator
A service component that coordinates multiple operations and manages the workflow of complex business processes.

### API Key Authentication
A security mechanism where clients authenticate using a unique key that identifies and authorizes them to access specific API endpoints.

### Reservation Status
The current state of a hotel reservation (e.g., CONFIRMED, PENDING, CANCELLED, MODIFIED).

### Rate Code
A hotel industry term for pricing categories or special rates (e.g., CORP for corporate rates, RACK for standard rates).

### Hotel Code
A unique identifier assigned to each hotel property within the system.

### Event Block
A group of hotel rooms reserved specifically for an event, managed through the Passkey platform.

## Core Entities

### PasskeyStayRecord
**Description**: Represents a hotel reservation record from Hilton that needs to be transformed for Passkey.

**Attributes**:
- `reservationId`: String - Unique identifier for the reservation
- `guestName`: String - Name of the primary guest
- `checkInDate`: LocalDate - Date when guest checks in
- `checkOutDate`: LocalDate - Date when guest checks out
- `hotelCode`: String - Identifier for the hotel property
- `roomType`: String - Type of room reserved (e.g., DELUXE, SUITE)
- `rateCode`: String - Pricing category for the reservation
- `totalAmount`: BigDecimal - Total cost of the reservation
- `currency`: String - Currency code (ISO 4217)
- `status`: ReservationStatus - Current status of the reservation
- `eventDetails`: EventDetails - Associated event information
- `guestDetails`: GuestDetails - Detailed guest information
- `additionalServices`: List<AdditionalService> - Extra services booked

**Relationships**:
- Contains one EventDetails object
- Contains one GuestDetails object
- Contains zero or more AdditionalService objects

### EventDetails
**Description**: Information about the event associated with the hotel reservation.

**Attributes**:
- `eventId`: String - Unique identifier for the event
- `eventName`: String - Name of the event
- `organizationId`: String - ID of the organization hosting the event
- `eventStartDate`: LocalDate - When the event begins
- `eventEndDate`: LocalDate - When the event ends
- `eventType`: String - Category of event (conference, wedding, etc.)

**Relationships**:
- Belongs to one PasskeyStayRecord
- Associated with one Organization (external reference)

### GuestDetails
**Description**: Detailed information about the guest making the reservation.

**Attributes**:
- `firstName`: String - Guest's first name
- `lastName`: String - Guest's last name
- `email`: String - Guest's email address
- `phone`: String - Guest's phone number
- `address`: Address - Guest's address information
- `loyaltyNumber`: String - Hotel loyalty program number
- `specialRequests`: String - Any special accommodation requests

**Relationships**:
- Belongs to one PasskeyStayRecord
- Contains one Address object

### AdditionalService
**Description**: Extra services or amenities added to the reservation.

**Attributes**:
- `serviceId`: String - Unique identifier for the service
- `serviceType`: String - Category of service (parking, breakfast, etc.)
- `description`: String - Detailed description of the service
- `amount`: BigDecimal - Cost of the service
- `currency`: String - Currency for the service cost
- `quantity`: Integer - Number of units of the service

**Relationships**:
- Belongs to one PasskeyStayRecord

### Result
**Description**: Represents the outcome of processing a stay record transformation.

**Attributes**:
- `reservationId`: String - ID of the processed reservation
- `status`: ProcessingStatus - SUCCESS, FAILURE, or PARTIAL
- `passkeyXml`: String - Generated XML for Passkey API
- `message`: String - Human-readable processing message
- `timestamp`: Instant - When the processing completed
- `errors`: List<ValidationError> - Any errors encountered
- `warnings`: List<String> - Non-fatal issues during processing

**Relationships**:
- References one PasskeyStayRecord (by reservationId)
- Contains zero or more ValidationError objects

### MessageLog
**Description**: Audit trail and logging information for transformation operations.

**Attributes**:
- `logId`: String - Unique identifier for the log entry
- `correlationId`: String - Request correlation identifier
- `operation`: String - Type of operation performed
- `inputData`: String - Original input data (may be truncated)
- `outputData`: String - Generated output data
- `processingTimeMs`: Long - Time taken to process
- `timestamp`: Instant - When the operation occurred
- `userId`: String - ID of the user/system making the request
- `errors`: List<String> - Any errors that occurred

**Relationships**:
- May reference one or more PasskeyStayRecord objects
- Contains processing metadata and audit information

## Business Rules

### Reservation Validation Rules

1. **Date Validation**:
   - Check-in date must be in the future or today
   - Check-out date must be after check-in date
   - Maximum stay duration is 30 days

2. **Amount Validation**:
   - Total amount must be non-negative
   - Currency must be a valid ISO 4217 code
   - Additional service amounts must be non-negative

3. **Guest Information**:
   - At least one of firstName or lastName must be provided
   - Email must be in valid format if provided
   - Phone number must be in valid format if provided

4. **Hotel and Event Validation**:
   - Hotel code must exist in the Passkey system
   - Event ID must be valid if provided
   - Organization ID must be valid if provided

### Transformation Rules

1. **Data Mapping**:
   - Hilton JSON fields map to specific Passkey XML elements
   - Date formats converted from ISO 8601 to Passkey format
   - Currency amounts formatted according to Passkey requirements

2. **Default Values**:
   - Missing room type defaults to "STANDARD"
   - Missing rate code defaults to "RACK"
   - Missing currency defaults to "USD"

3. **Data Enrichment**:
   - System adds transformation timestamp
   - Correlation IDs added for tracking
   - Validation status included in output

### Processing Rules

1. **Batch Processing**:
   - Multiple stay records processed in single request
   - Each record processed independently
   - Partial failures allowed (some succeed, some fail)

2. **Error Handling**:
   - Validation errors prevent transformation
   - Business rule violations logged but may allow processing
   - System errors result in retry logic

3. **Audit Requirements**:
   - All transformations logged for audit trail
   - Input and output data preserved
   - Processing metrics captured

## Data Flow Patterns

### Input Processing Flow
1. **Validation**: Incoming JSON validated against schema
2. **Enrichment**: Missing data filled with defaults
3. **Business Rules**: Applied to ensure data integrity
4. **Transformation**: JSON converted to XML format
5. **Output Validation**: Generated XML validated
6. **Logging**: Results logged for audit

### Error Handling Flow
1. **Validation Errors**: Return immediately with error details
2. **Transformation Errors**: Log error, attempt recovery
3. **External Service Errors**: Retry with exponential backoff
4. **System Errors**: Log error, return generic error message

### Audit Flow
1. **Request Logging**: Log incoming request with correlation ID
2. **Processing Logging**: Log each transformation step
3. **Result Logging**: Log final outcome and metrics
4. **Error Logging**: Log all errors with context

## Integration Patterns

### Hilton Integration
- **Format**: JSON over HTTP
- **Authentication**: API key-based
- **Data Structure**: Nested JSON with reservation details
- **Frequency**: Real-time as reservations are made/modified

### Passkey Integration
- **Format**: XML over HTTP
- **Authentication**: Service-to-service authentication
- **Data Structure**: Structured XML following Passkey schema
- **Frequency**: Real-time transformation and forwarding

### Auth Service Integration
- **Purpose**: API key validation and authorization
- **Method**: HTTP calls to auth service endpoints
- **Caching**: API key validation results cached temporarily
- **Fallback**: Graceful degradation if auth service unavailable

## State Management

### Stateless Design
- Service maintains no persistent state between requests
- Each request processed independently
- Configuration loaded at startup and cached

### Temporary State
- Request correlation IDs maintained during processing
- Transformation context preserved within single request
- Error context maintained for proper error reporting

### External State Dependencies
- Hotel codes validated against external Passkey database
- Event information retrieved from external event service
- User authentication state managed by auth service
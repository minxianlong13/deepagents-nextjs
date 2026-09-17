# Domain Model

## Glossary

### Vendor System
A hotel technology system (PMS, CRS, or specialized platform) that manages reservations, inventory, and guest data. Examples include Opera, Amadeus, Hilton OnQ, and Marriott systems.

### Mock Service
A testing service that simulates the behavior of real vendor systems, providing predictable responses for integration testing and development.

### Magic Keywords
Special text patterns embedded in request payloads that control the mock service's response behavior, enabling testing of various scenarios including success, error, and delay conditions.

### Reservation Transfer
The process of sending reservation data from Passkey to a hotel vendor system, either synchronously (immediate response) or asynchronously (queued processing).

### OTA (Open Travel Alliance)
Industry standard XML messaging format used for communication between travel technology systems, particularly for reservation and inventory management.

### PMS (Property Management System)
Hotel software that manages property operations including reservations, guest check-in/out, room assignments, and billing.

### CRS (Central Reservation System)
Centralized system that manages hotel inventory and reservations across multiple properties or brands.

### GL Integration (Guest List Integration)
The process of transferring guest reservation data from Passkey to hotel vendor systems for room block management and guest services.

### Async Transfer
Asynchronous reservation transfer where the request is accepted immediately (202 status) and processed in the background, with results delivered via callback.

### Sync Transfer
Synchronous reservation transfer where the response is returned immediately within the same HTTP request/response cycle.

### Callback Message
A mechanism for storing and retrieving test parameters used in asynchronous operations, simulating real-world callback scenarios.

### Vendor System ID
Unique identifier for a specific vendor system instance, used to route requests to the appropriate mock behavior.

### Partner ID
Identifier for the integration partner (typically Passkey) in vendor system communications.

### Block Code
Hotel industry term for a group reservation or room block identifier, often containing special instructions for inventory and pricing.

### GNR (Guest Name Record)
Unique identifier for a guest reservation within a hotel system, similar to a PNR in airline systems.

### OHIP (Oracle Hospitality Integration Platform)
Oracle's integration platform for hospitality systems, providing APIs for reservation, inventory, and guest management.

### HTNG (Hotel Technology Next Generation)
Industry consortium that develops standards for hotel technology integration and messaging protocols.

## Core Entities

### Reservation
**Description**: Represents a hotel reservation with guest information, dates, and booking details.

**Attributes**:
- `confirmationNumber`: String - Unique reservation identifier
- `guestName`: String - Primary guest name
- `checkInDate`: Date - Arrival date
- `checkOutDate`: Date - Departure date
- `roomType`: String - Type of room reserved
- `adults`: Integer - Number of adult guests
- `children`: Integer - Number of child guests
- `status`: ReservationStatus - Current reservation state
- `guaranteeCode`: String - Payment guarantee method
- `specialRequests`: String - Guest special requests

**Relationships**:
- Associated with Guest entities
- Linked to Hotel Block (for group reservations)
- Connected to Vendor System

### Guest
**Description**: Individual guest information within a reservation.

**Attributes**:
- `firstName`: String - Guest first name
- `lastName`: String - Guest last name
- `email`: String - Contact email address
- `phone`: String - Contact phone number
- `address`: Address - Guest address information
- `loyaltyNumber`: String - Hotel loyalty program number
- `specialNeeds`: String - Accessibility or special requirements

**Relationships**:
- Belongs to Reservation
- May have multiple Contact methods

### Hotel Block
**Description**: Group reservation or room block allocation for events.

**Attributes**:
- `blockCode`: String - Unique block identifier
- `blockName`: String - Descriptive block name
- `hotelCode`: String - Hotel property identifier
- `startDate`: Date - Block start date
- `endDate`: Date - Block end date
- `cutoffDate`: Date - Reservation cutoff date
- `totalRooms`: Integer - Total rooms allocated
- `availableRooms`: Integer - Remaining available rooms
- `baseRate`: Decimal - Starting room rate
- `inventoryType`: InventoryType - BLOCK or CONTRACT

**Relationships**:
- Contains multiple Room Types
- Associated with Event
- Linked to Hotel Property

### Room Type
**Description**: Specific room category within a hotel block or reservation.

**Attributes**:
- `roomTypeCode`: String - Room type identifier (e.g., "KING", "DOUBLE")
- `description`: String - Room type description
- `rate`: Decimal - Nightly rate
- `inventory`: Integer - Available rooms of this type
- `maxOccupancy`: Integer - Maximum guests per room

**Relationships**:
- Belongs to Hotel Block
- Used in Reservations

### Vendor System
**Description**: External hotel technology system being mocked.

**Attributes**:
- `vendorSystemId`: String - Unique system identifier
- `vendorName`: String - Vendor company name (e.g., "Opera", "Amadeus")
- `systemType`: VendorType - PMS, CRS, or specialized system
- `authenticationMethod`: AuthMethod - OAuth2, Basic, API Key
- `endpointUrl`: String - Base URL for vendor system
- `isAsync`: Boolean - Supports asynchronous operations

**Relationships**:
- Processes Reservations
- Connected to Hotel Properties
- Has Authentication Configuration

### Mock Response
**Description**: Generated response based on magic keywords and vendor system behavior.

**Attributes**:
- `responseType`: ResponseType - Success, Error, Delay, etc.
- `statusCode`: Integer - HTTP status code
- `responseBody`: String - XML or JSON response content
- `delaySeconds`: Integer - Simulated processing delay
- `errorMessage`: String - Error description (if applicable)

**Relationships**:
- Generated for specific Vendor System
- Based on Magic Keywords in request

### Callback Message
**Description**: Stored parameters for asynchronous operation testing.

**Attributes**:
- `eventId`: String - Unique event identifier
- `parameters`: Map<String, String> - Key-value parameter pairs
- `timestamp`: DateTime - Storage timestamp
- `retrievalCount`: Integer - Number of times retrieved

**Relationships**:
- Associated with Async Operations
- Linked to specific Event ID

### Authentication Token
**Description**: Mock OAuth2 or API tokens for vendor system authentication.

**Attributes**:
- `accessToken`: String - Token value
- `tokenType`: String - Bearer, API Key, etc.
- `expiresIn`: Integer - Token lifetime in seconds
- `scope`: String - Token permissions
- `clientId`: String - Client identifier

**Relationships**:
- Issued for specific Vendor System
- Used in authenticated requests

## Business Rules

### Magic Keyword Processing
1. **Keyword Priority**: If multiple magic keywords exist in a request, the last one encountered takes precedence
2. **Keyword Location**: Magic keywords can appear in any text field within the request payload
3. **Case Sensitivity**: Magic keywords are case-sensitive and must match exactly
4. **Delay Limits**: Delay values are capped at 300 seconds to prevent test timeouts

### Reservation Validation
1. **Date Logic**: Check-out date must be after check-in date
2. **Guest Count**: At least one adult must be specified for each reservation
3. **Room Availability**: Mock systems simulate inventory constraints based on block configuration

### Block Management
1. **Cutoff Date**: Reservations cannot be made after the block cutoff date
2. **Inventory Tracking**: Available rooms decrease with each reservation (simulated)
3. **Rate Progression**: Room rates can increase based on special instructions in block codes

### Async Operation Rules
1. **Immediate Response**: Async endpoints always return 202 Accepted immediately
2. **Callback Timing**: Callback messages are sent after specified delay periods
3. **Retry Logic**: "succeedOnRetry" keyword fails first attempt, succeeds on second

### Authentication Rules
1. **Token Expiration**: OAuth2 tokens expire after specified duration
2. **Scope Validation**: Tokens are validated against required scopes (simulated)
3. **Client Credentials**: Client ID and secret validation for token generation

### Error Simulation Rules
1. **Error Consistency**: Same magic keyword produces consistent error responses
2. **Status Code Mapping**: Specific keywords map to specific HTTP status codes
3. **Error Message Format**: Error responses follow vendor-specific formats

## Data Relationships

### Reservation Hierarchy
```
Event
├── Hotel Block
│   ├── Room Type 1
│   ├── Room Type 2
│   └── Room Type N
└── Reservations
    ├── Reservation 1
    │   ├── Guest 1 (Primary)
    │   └── Guest 2 (Additional)
    └── Reservation N
```

### Vendor System Integration
```
Passkey Integration Service
├── Async Transfer
│   ├── Request → Mock Service
│   ├── 202 Response ← Mock Service
│   └── Callback → Integration API
└── Sync Transfer
    ├── Request → Mock Service
    └── Response ← Mock Service
```

### Mock Response Generation
```
Request Payload
├── Magic Keyword Detection
├── Vendor System Identification
├── Response Template Selection
├── Parameter Substitution
└── Response Generation
```

## State Management

### Stateless Operations
- Individual reservation transfers
- Authentication token generation
- Health checks and monitoring

### Stateful Operations (In-Memory)
- Callback message storage
- Token expiration tracking
- Request retry counting for "succeedOnRetry" scenarios

### Persistence
- No persistent storage required
- All state is ephemeral and suitable for testing
- Configuration loaded from YAML files at startup

## Integration Patterns

### Request-Response Pattern
Used for synchronous vendor operations where immediate response is expected.

### Fire-and-Forget Pattern
Used for asynchronous operations where request is queued and processed separately.

### Callback Pattern
Used for async operations that require result notification back to the calling system.

### Template Pattern
Response generation follows consistent template-based approach across all vendor systems.

## Validation Rules

### Input Validation
1. **XML Schema**: Request payloads validated against vendor-specific schemas
2. **Required Fields**: Mandatory fields enforced based on vendor requirements
3. **Data Types**: Field types validated (dates, numbers, strings)
4. **Length Limits**: String fields have maximum length constraints

### Business Validation
1. **Date Ranges**: Logical date validation for reservations
2. **Capacity Limits**: Room and guest count validation
3. **Rate Validation**: Positive rate values required
4. **Code Formats**: Vendor-specific code format validation

### Response Validation
1. **Schema Compliance**: Generated responses conform to vendor schemas
2. **Required Elements**: All mandatory response elements included
3. **Data Consistency**: Response data matches request context
4. **Error Format**: Error responses follow vendor-specific formats
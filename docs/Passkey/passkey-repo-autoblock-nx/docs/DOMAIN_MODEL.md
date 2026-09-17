# Domain Model

## Glossary

### Autoblock
A hotel room inventory management system that allows event organizers to reserve blocks of rooms at hotels for their attendees. The system manages room availability, pricing, and booking processes for group events.

### Block Request
A formal request to reserve a block of hotel rooms for a specific event. Contains configuration details such as dates, participating hotels, and booking rules.

### Event
A gathering or conference that requires hotel accommodations for attendees. Events have specific dates, locations, and accommodation requirements.

### Hotel Configuration
Settings that define how a specific hotel participates in an autoblock request, including which room types are available and display preferences.

### Inventory
The available room capacity for specific dates and room types. Represents the maximum number of rooms that can be booked for a given date.

### Participating Hotel
A hotel that has agreed to provide rooms for an autoblock request. Each hotel can have different configurations and inventory allocations.

### Room Type Configuration
Settings that define how specific room types (e.g., standard, deluxe, suite) are presented and managed within an autoblock request.

### Survey Configuration
Settings that control how booking surveys and forms are presented to potential guests, including which hotels and room types to display.

### Guarantee Type
The level of commitment required for room reservations, determining payment and cancellation policies.

### Free Sell DateTime
The date and time when any remaining unbooked rooms in the block become available for general public booking.

### Site State
The current operational status of the booking site (e.g., ACTIVE, INACTIVE, PREVIEW).

### Campaign
Marketing or communication campaigns associated with the autoblock request, used for tracking and targeting purposes.

### Organization Field
A customizable field that captures the attendee's organization or company information during the booking process.

### Rollup Guaranteed Blocks
A feature that combines guaranteed room blocks across multiple hotels or room types for simplified management.

## Core Entities

### AutoblockRequestConfigProperties

**Description**: The primary configuration entity that defines all aspects of an autoblock request.

**Attributes**:
- `requestName: String` - Human-readable name for the block request
- `eventId: Integer` - Unique identifier linking to the associated event
- `startDate: String` - ISO 8601 formatted start date of the event
- `endDate: String` - ISO 8601 formatted end date of the event
- `deadlineDate: String` - Last date for making reservations in the block
- `publishOnDate: String` - Date when the booking site becomes available to attendees
- `participatingHotels: [Integer]` - Array of hotel IDs participating in the block
- `freeSellDateTime: String` - Optional date/time when unused inventory becomes publicly available
- `isPreview: Boolean` - Flag indicating if the request is in preview mode
- `siteState: String` - Current operational status of the booking site
- `requestCampaignIds: [Integer]` - Associated marketing campaign identifiers
- `approveCampaignIds: [Integer]` - Campaign identifiers for approval workflows
- `organizingParticipantId: Integer` - ID of the primary organizing entity
- `organizingUserId: Integer` - ID of the user who created/manages the request
- `requestId: Integer` - Unique identifier for the block request

**Relationships**:
- Has one AutoConfigProperties
- Associated with multiple Hotels via participatingHotels
- Linked to one Event via eventId
- Connected to multiple Campaigns via campaign IDs

### AutoConfigProperties

**Description**: Extended configuration properties that control autoblock behavior and user experience.

**Attributes**:
- `autoApprove: Boolean` - Whether reservations are automatically approved
- `organizationFieldLabel: String` - Localized label for the organization input field
- `confirmationMessage: String` - Localized message shown after successful booking
- `guaranteeTypeId: Integer` - Type of guarantee required for reservations
- `maxReservationsPerAttendeeTx: Integer` - Maximum rooms one attendee can book per transaction
- `showAdditionalReservationsLink: Boolean` - Whether to display link for additional bookings
- `guaranteedBlocks: Boolean` - Whether room blocks are guaranteed by the hotel
- `rollupGuaranteedBlocks: Boolean` - Whether to combine guaranteed blocks across properties
- `bookingSitesCustomizable: Boolean` - Whether booking sites can be customized
- `requestIntroductionMessage: String` - Localized welcome message for the booking site
- `displayAvailableRoomNumber: Boolean` - Whether to show available room counts

**Relationships**:
- Belongs to one AutoblockRequestConfigProperties
- References one GuaranteeType via guaranteeTypeId

### SurveyConfigProperties

**Description**: Configuration entity that controls survey presentation and data collection during the booking process.

**Attributes**:
- `blockRequestId: Integer` - Unique identifier for the associated block request
- `eventId: Integer` - Unique identifier for the associated event

**Relationships**:
- Contains multiple HotelConfig entities
- Contains multiple Inventory entities
- Linked to one AutoblockRequestConfigProperties via blockRequestId
- Associated with one Event via eventId

### HotelConfig

**Description**: Configuration settings for individual hotels participating in an autoblock request.

**Attributes**:
- `hotelId: Integer` - Unique identifier for the hotel
- `displayInRequest: Boolean` - Whether this hotel should be shown to users

**Relationships**:
- Belongs to one SurveyConfigProperties
- Contains multiple RoomTypeConfig entities
- Contains multiple Inventory entities
- References one Hotel via hotelId

### RoomTypeConfig

**Description**: Configuration settings for specific room types within a hotel.

**Attributes**:
- `roomTypeId: Integer` - Unique identifier for the room type
- `displayInRequest: Boolean` - Whether this room type should be shown to users

**Relationships**:
- Belongs to one HotelConfig
- Contains multiple Inventory entities
- References one RoomType via roomTypeId

### Inventory

**Description**: Represents available room capacity for specific dates and contexts.

**Attributes**:
- `date: String` - ISO 8601 formatted date for the inventory
- `maxInventory: Integer` - Maximum number of rooms available for this date

**Relationships**:
- Can belong to SurveyConfigProperties (global inventory)
- Can belong to HotelConfig (hotel-specific inventory)
- Can belong to RoomTypeConfig (room type-specific inventory)

## Business Rules

### Block Request Lifecycle

1. **Creation**: Block requests are created with initial configuration
2. **Configuration**: Hotels, room types, and inventory are configured
3. **Preview**: Requests can be previewed before going live
4. **Publication**: Requests become available to attendees on the publishOnDate
5. **Active Booking**: Attendees can make reservations until the deadlineDate
6. **Free Sell**: After deadlineDate, unused inventory may become publicly available

### Inventory Management

- Inventory is hierarchical: Global → Hotel → Room Type
- More specific inventory settings override general ones
- Maximum inventory cannot exceed hotel capacity
- Inventory must be defined for all dates between startDate and endDate

### Hotel Participation

- Hotels must explicitly opt-in to participate in block requests
- Each hotel can configure which room types to offer
- Hotels can set different inventory levels for different dates
- Display preferences control user-facing presentation

### Reservation Rules

- Maximum reservations per transaction is enforced
- Guarantee requirements must be met before confirmation
- Auto-approval can bypass manual review processes
- Organization information may be required based on configuration

### Localization

- All user-facing text supports localization
- Locale parameters determine language/region-specific content
- Default locale is used when specific locale is not available
- Localized content includes labels, messages, and instructions

### Caching Strategy

- Configuration data is cached for 5 minutes to improve performance
- Cache invalidation occurs when configuration changes
- Different cache keys are used for different locales
- Inventory data has shorter cache duration due to frequent updates

### Authorization Model

- All operations require authentication
- FULL_SITE_ACCESS role is required for configuration access
- Role-based permissions control data visibility
- User context determines available operations

### Data Consistency

- Event dates must be logically consistent (start < end < deadline)
- Participating hotels must exist and be active
- Room types must be available at specified hotels
- Inventory dates must fall within event date range

### Error Handling

- Invalid configurations are rejected with descriptive errors
- Missing required fields result in validation errors
- Authorization failures return appropriate HTTP status codes
- System errors are logged and monitored

## Entity Relationships Diagram

```
AutoblockRequestConfigProperties
├── AutoConfigProperties (1:1)
├── Event (via eventId) (N:1)
├── Hotels (via participatingHotels) (N:N)
└── Campaigns (via campaignIds) (N:N)

SurveyConfigProperties
├── AutoblockRequestConfigProperties (via blockRequestId) (1:1)
├── Event (via eventId) (N:1)
├── HotelConfig[] (1:N)
└── Inventory[] (1:N)

HotelConfig
├── SurveyConfigProperties (N:1)
├── Hotel (via hotelId) (N:1)
├── RoomTypeConfig[] (1:N)
└── Inventory[] (1:N)

RoomTypeConfig
├── HotelConfig (N:1)
├── RoomType (via roomTypeId) (N:1)
└── Inventory[] (1:N)

Inventory
├── SurveyConfigProperties (N:1) [optional]
├── HotelConfig (N:1) [optional]
└── RoomTypeConfig (N:1) [optional]
```

## Data Flow Patterns

### Configuration Retrieval
1. Client requests block configuration
2. System validates user permissions
3. Configuration data is retrieved from cache or database
4. Localized content is resolved based on requested locale
5. Response is formatted and returned to client

### Survey Data Assembly
1. Client requests survey configuration
2. System retrieves base survey configuration
3. Hotel configurations are loaded and filtered
4. Room type configurations are loaded for each hotel
5. Inventory data is aggregated across all levels
6. Complete survey structure is returned

### Inventory Calculation
1. Base inventory is retrieved from global configuration
2. Hotel-specific inventory overrides are applied
3. Room type-specific inventory overrides are applied
4. Final inventory numbers are calculated per date
5. Availability is determined based on existing reservations
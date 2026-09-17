# Domain Model

## Glossary

### Bridge
A connection entity that links event registrations to hotel reservations. Acts as an intermediary that maintains the relationship between a registrant's event participation and their accommodation needs.

### Bridge Registration Number
A unique identifier assigned to each bridge, used to track and manage the connection between event registration and hotel reservation systems.

### Event
A business gathering, conference, or meeting that requires accommodation coordination. Events have associated metadata including dates, location, and housing requirements.

### Group Reservation
A reservation request for multiple rooms, typically made by event organizers or group leaders for attendees. Requires special handling and approval workflows.

### Housing Event
A specialized event configuration that enables self-service hotel booking for event attendees. Provides a public interface for reservation management.

### Housing Library
A repository of standardized templates, hotel information, and room configurations that can be reused across multiple events and organizations.

### Reglink (Registration Link)
The core concept representing the linkage between event registration systems and hotel reservation platforms. Enables seamless integration between registration and accommodation booking.

### Reservation
An individual hotel booking for specific dates, room type, and guest information. Can be linked to event registrations through bridges.

### Room Block
A pre-negotiated allocation of hotel rooms reserved for an event, typically at special rates with specific terms and conditions.

### Room Type
A classification of hotel accommodations with specific characteristics such as bed configuration, amenities, and capacity.

## Core Entities

### Event
**Description**: Represents a business event requiring accommodation coordination

**Attributes**:
- `eventId`: String - Unique identifier for the event
- `name`: String - Display name of the event
- `description`: String - Detailed event description
- `startDate`: Date - Event start date
- `endDate`: Date - Event end date
- `location`: Location - Event venue information
- `status`: EventStatus - Current event status (DRAFT, ACTIVE, COMPLETED, CANCELLED)
- `settings`: EventSettings - Configuration options for the event

**Relationships**:
- Has many Housing Events
- Has many Room Blocks
- Has many Reservations (through bridges)
- Has many Bridges

**Business Rules**:
- Event dates must be in the future when created
- End date must be after start date
- Active events cannot be deleted, only cancelled

### Bridge
**Description**: Links event registrations to hotel reservations

**Attributes**:
- `bridgeRegistrationNumber`: String - Unique identifier
- `eventId`: String - Associated event identifier
- `status`: BridgeStatus - Current status (ACTIVE, INACTIVE, CANCELLED)
- `registrantInfo`: RegistrantInfo - Information about the registrant
- `preferences`: Preferences - Booking preferences and special requests
- `createdAt`: DateTime - Creation timestamp
- `modifiedAt`: DateTime - Last modification timestamp

**Relationships**:
- Belongs to one Event
- Can be linked to multiple Reservations
- Has one Registrant

**Business Rules**:
- Bridge registration number must be unique across the system
- Cannot be deleted once linked to confirmed reservations
- Status changes must follow defined state transitions

### Reservation
**Description**: Individual hotel booking for event attendees

**Attributes**:
- `reservationId`: String - Unique identifier
- `confirmationNumber`: String - Hotel confirmation number
- `eventId`: String - Associated event identifier
- `hotelId`: String - Hotel identifier
- `roomTypeId`: String - Room type identifier
- `checkIn`: Date - Check-in date
- `checkOut`: Date - Check-out date
- `guest`: GuestInfo - Primary guest information
- `status`: ReservationStatus - Current status (PENDING, CONFIRMED, CANCELLED)
- `totalAmount`: Money - Total reservation cost
- `createdAt`: DateTime - Creation timestamp

**Relationships**:
- Belongs to one Event
- Belongs to one Hotel
- Belongs to one Room Type
- Can be linked to one Bridge
- May belong to one Group Reservation

**Business Rules**:
- Check-out date must be after check-in date
- Cannot modify confirmed reservations within 24 hours of check-in
- Cancellation policies vary by hotel and rate type

### Room Block
**Description**: Pre-allocated hotel room inventory for events

**Attributes**:
- `roomBlockId`: String - Unique identifier
- `eventId`: String - Associated event identifier
- `hotelId`: String - Hotel identifier
- `name`: String - Block name for identification
- `description`: String - Block description
- `blockDates`: DateRange - Date range for the block
- `rooms`: List<RoomAllocation> - Room type allocations
- `cutoffDate`: Date - Last date for reservations
- `releaseDate`: Date - Date when unused rooms are released
- `status`: RoomBlockStatus - Current status (PENDING, CONFIRMED, ACTIVE, EXPIRED, CANCELLED)

**Relationships**:
- Belongs to one Event
- Belongs to one Hotel
- Contains multiple Room Allocations
- May have multiple Reservations

**Business Rules**:
- Cutoff date must be before block start date
- Release date must be before cutoff date
- Cannot exceed hotel's available inventory
- Rates are locked once confirmed

### Housing Event
**Description**: Self-service booking interface for event attendees

**Attributes**:
- `housingEventId`: String - Unique identifier
- `eventId`: String - Associated event identifier
- `name`: String - Housing event name
- `description`: String - Description for attendees
- `housingDates`: DateRange - Available booking dates
- `settings`: HousingSettings - Configuration options
- `status`: HousingEventStatus - Current status (DRAFT, ACTIVE, CLOSED)
- `publicUrl`: String - Public booking URL
- `statistics`: HousingStatistics - Booking statistics

**Relationships**:
- Belongs to one Event
- Has many associated Hotels
- Generates multiple Reservations

**Business Rules**:
- Must have at least one associated hotel
- Cannot be activated without confirmed room blocks
- Public URL becomes inactive when event is closed

### Hotel
**Description**: Accommodation provider participating in events

**Attributes**:
- `hotelId`: String - Unique identifier
- `name`: String - Hotel name
- `brand`: String - Hotel brand/chain
- `starRating`: Integer - Star rating (1-5)
- `address`: Address - Physical location
- `amenities`: List<String> - Available amenities
- `policies`: HotelPolicies - Check-in/out times, cancellation policies
- `status`: HotelStatus - Current status (ACTIVE, INACTIVE)

**Relationships**:
- Has many Room Types
- Has many Room Blocks
- Has many Reservations
- Participates in many Housing Events

**Business Rules**:
- Must have at least one active room type
- Policies must be clearly defined for booking
- Star rating must be between 1 and 5

### Room Type
**Description**: Classification of hotel accommodations

**Attributes**:
- `roomTypeId`: String - Unique identifier
- `hotelId`: String - Associated hotel identifier
- `name`: String - Room type name
- `description`: String - Detailed description
- `maxOccupancy`: Integer - Maximum number of guests
- `bedConfiguration`: String - Bed setup description
- `amenities`: List<String> - Room-specific amenities
- `baseRate`: Money - Standard nightly rate
- `images`: List<String> - Room images URLs

**Relationships**:
- Belongs to one Hotel
- Used in many Room Blocks
- Used in many Reservations

**Business Rules**:
- Maximum occupancy must be at least 1
- Base rate must be positive
- Room type names must be unique within a hotel

### Group Reservation
**Description**: Multi-room reservation request for groups

**Attributes**:
- `groupReservationId`: String - Unique identifier
- `eventId`: String - Associated event identifier
- `groupName`: String - Name of the group
- `contactInfo`: ContactInfo - Group contact information
- `roomRequirements`: List<RoomRequirement> - Requested room allocations
- `status`: GroupReservationStatus - Current status (PENDING, CONFIRMED, CANCELLED)
- `totalRooms`: Integer - Total number of rooms requested
- `totalAmount`: Money - Total estimated cost
- `specialRequests`: String - Additional requirements

**Relationships**:
- Belongs to one Event
- Contains multiple Room Requirements
- Generates multiple individual Reservations when confirmed

**Business Rules**:
- Must request at least 5 rooms to qualify as group
- Requires approval workflow for confirmation
- Special rates may apply based on group size

## Value Objects

### Money
**Attributes**:
- `amount`: BigDecimal - Monetary amount
- `currency`: String - Currency code (ISO 4217)

### Address
**Attributes**:
- `street`: String - Street address
- `city`: String - City name
- `state`: String - State/province
- `zipCode`: String - Postal code
- `country`: String - Country code (ISO 3166)

### DateRange
**Attributes**:
- `startDate`: Date - Range start date
- `endDate`: Date - Range end date

### ContactInfo
**Attributes**:
- `name`: String - Contact person name
- `email`: String - Email address
- `phone`: String - Phone number

## Business Rules

### Reservation Management
1. **Date Validation**: Check-in date must be before check-out date
2. **Availability Check**: Room must be available for requested dates
3. **Occupancy Limits**: Number of guests cannot exceed room maximum occupancy
4. **Modification Windows**: Confirmed reservations cannot be modified within 24 hours of check-in
5. **Cancellation Policies**: Cancellation rules vary by hotel and rate type

### Room Block Management
1. **Inventory Allocation**: Cannot allocate more rooms than hotel availability
2. **Date Sequencing**: Release date < Cutoff date < Block start date
3. **Rate Locking**: Confirmed blocks have locked rates that cannot be changed
4. **Utilization Tracking**: System tracks room pickup against allocated inventory
5. **Automatic Release**: Unused rooms are automatically released on release date

### Group Reservation Rules
1. **Minimum Size**: Groups must request at least 5 rooms
2. **Approval Workflow**: All group reservations require manual approval
3. **Rate Negotiation**: Groups may qualify for special negotiated rates
4. **Rooming Lists**: Groups must provide rooming lists before confirmation
5. **Payment Terms**: Groups may have different payment terms than individual reservations

### Bridge Association Rules
1. **Unique Linking**: Each bridge can only be linked to one primary reservation
2. **Status Synchronization**: Bridge status must reflect linked reservation status
3. **Modification Restrictions**: Cannot modify bridge once linked to confirmed reservation
4. **Cancellation Cascade**: Cancelling bridge may trigger reservation cancellation

### Event Lifecycle Rules
1. **Status Progression**: Events follow defined status progression (DRAFT → ACTIVE → COMPLETED/CANCELLED)
2. **Date Constraints**: Event dates cannot be in the past when activated
3. **Housing Window**: Housing events must be within event date range
4. **Capacity Management**: Total reservations cannot exceed event capacity limits

### Financial Rules
1. **Currency Consistency**: All amounts within an event must use same currency
2. **Rate Calculation**: Total amounts must include all applicable taxes and fees
3. **Refund Processing**: Refunds follow hotel-specific cancellation policies
4. **Payment Timing**: Payment collection timing varies by reservation type

### Data Integrity Rules
1. **Referential Integrity**: All foreign key relationships must be maintained
2. **Audit Trail**: All modifications must be logged with timestamp and user
3. **Soft Deletion**: Critical entities use soft deletion to maintain history
4. **Data Retention**: Historical data must be retained per compliance requirements
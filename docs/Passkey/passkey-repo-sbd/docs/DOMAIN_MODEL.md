# Domain Model

## Glossary

### Sub-Block
A reserved group of hotel rooms allocated for a specific event, conference, or group booking. Sub-blocks are the primary entity managed by the dashboard and represent a portion of a hotel's inventory dedicated to a particular customer or event.

### Room Block
The parent allocation of rooms from which sub-blocks are carved out. A room block represents the total inventory commitment between a hotel and an organization.

### Inventory
The total available room capacity at a hotel, including different room types, rates, and availability periods.

### Occupancy Rate
The percentage of available rooms that are occupied during a specific time period. Calculated as (Occupied Rooms / Total Available Rooms) × 100.

### Pick-up Rate
The percentage of reserved rooms that are actually booked by guests. Indicates the effectiveness of room block utilization.

### Attrition
The difference between the committed room block size and the actual rooms booked, often subject to contractual penalties.

### Cut-off Date
The deadline by which guests must book their rooms within the sub-block before unused rooms are released back to general inventory.

### Rooming List
A detailed list of guests assigned to specific rooms within a sub-block, including guest names, room preferences, and special requirements.

### Rate Code
A unique identifier for specific room rates and packages associated with a sub-block, often including group discounts or special amenities.

### Passkey Platform
The comprehensive hotel booking and inventory management system that encompasses multiple services including housing, reservations, and commerce operations.

## Core Entities

### SubBlock
**Description**: Represents a reserved group of hotel rooms for a specific event or organization

**Attributes**:
- `id`: String - Unique identifier for the sub-block
- `name`: String - Human-readable name for the sub-block
- `description`: String - Detailed description of the sub-block purpose
- `hotelId`: String - Reference to the associated hotel
- `organizationId`: String - Reference to the owning organization
- `eventId`: String - Reference to the associated event (optional)
- `status`: Enum - Current status (PENDING, ACTIVE, INACTIVE, CANCELLED)
- `roomCount`: Integer - Total number of rooms in the sub-block
- `availableRooms`: Integer - Currently available rooms for booking
- `reservedRooms`: Integer - Rooms currently reserved by guests
- `startDate`: Date - Check-in date for the sub-block period
- `endDate`: Date - Check-out date for the sub-block period
- `cutoffDate`: Date - Deadline for room bookings
- `createdAt`: DateTime - Timestamp of sub-block creation
- `updatedAt`: DateTime - Timestamp of last modification
- `createdBy`: String - User who created the sub-block
- `modifiedBy`: String - User who last modified the sub-block

**Relationships**:
- Belongs to one Hotel
- Belongs to one Organization
- May belong to one Event
- Has many RoomAllocations
- Has many Reservations
- Has many AuditLogs

### Hotel
**Description**: Represents a hotel property that provides rooms for sub-blocks

**Attributes**:
- `id`: String - Unique hotel identifier
- `name`: String - Hotel name
- `brandId`: String - Hotel brand/chain identifier
- `address`: Address - Physical location details
- `contactInfo`: ContactInfo - Phone, email, and other contact details
- `amenities`: Array<String> - Available hotel amenities
- `starRating`: Integer - Hotel star rating (1-5)
- `totalRooms`: Integer - Total room capacity
- `roomTypes`: Array<RoomType> - Available room categories
- `policies`: HotelPolicies - Cancellation, payment, and other policies
- `isActive`: Boolean - Whether hotel is currently accepting bookings

**Relationships**:
- Has many SubBlocks
- Has many RoomTypes
- Belongs to one HotelBrand
- Has many Contracts

### RoomAllocation
**Description**: Defines the specific room types and quantities within a sub-block

**Attributes**:
- `id`: String - Unique allocation identifier
- `subBlockId`: String - Reference to parent sub-block
- `roomTypeId`: String - Reference to room type
- `allocatedCount`: Integer - Number of rooms allocated
- `availableCount`: Integer - Number of rooms still available
- `baseRate`: Decimal - Base room rate per night
- `currency`: String - Currency code (USD, EUR, etc.)
- `rateCode`: String - Special rate code for this allocation
- `inclusions`: Array<String> - Included amenities or services

**Relationships**:
- Belongs to one SubBlock
- Belongs to one RoomType
- Has many Reservations

### RoomType
**Description**: Categorizes different types of rooms available at a hotel

**Attributes**:
- `id`: String - Unique room type identifier
- `hotelId`: String - Reference to parent hotel
- `name`: String - Room type name (e.g., "Standard King", "Executive Suite")
- `description`: String - Detailed room description
- `maxOccupancy`: Integer - Maximum number of guests
- `bedConfiguration`: String - Bed setup description
- `squareFootage`: Integer - Room size in square feet
- `amenities`: Array<String> - Room-specific amenities
- `baseRate`: Decimal - Standard nightly rate
- `images`: Array<String> - URLs to room images

**Relationships**:
- Belongs to one Hotel
- Has many RoomAllocations
- Has many Reservations

### Reservation
**Description**: Represents an individual guest booking within a sub-block

**Attributes**:
- `id`: String - Unique reservation identifier
- `subBlockId`: String - Reference to parent sub-block
- `roomAllocationId`: String - Reference to specific room allocation
- `guestInfo`: GuestInfo - Primary guest details
- `additionalGuests`: Array<GuestInfo> - Additional guests in room
- `checkInDate`: Date - Guest check-in date
- `checkOutDate`: Date - Guest check-out date
- `numberOfNights`: Integer - Length of stay
- `roomNumber`: String - Assigned room number (if available)
- `totalAmount`: Decimal - Total reservation cost
- `status`: Enum - Reservation status (CONFIRMED, PENDING, CANCELLED)
- `specialRequests`: String - Guest special requests or notes
- `confirmationNumber`: String - Booking confirmation code
- `createdAt`: DateTime - Reservation creation timestamp
- `modifiedAt`: DateTime - Last modification timestamp

**Relationships**:
- Belongs to one SubBlock
- Belongs to one RoomAllocation
- Has one PrimaryGuest
- Has many AdditionalGuests
- Has many PaymentTransactions

### Organization
**Description**: Represents a company or entity that manages sub-blocks. This is a Participant entity in Passkey - an organizational entity, NOT a person attending an event.

**Attributes**:
- `id`: String - Unique organization identifier
- `name`: String - Organization name
- `type`: Enum - Organization type (CORPORATE, ASSOCIATION, AGENCY)
- `contactInfo`: ContactInfo - Primary contact information
- `billingAddress`: Address - Billing address details
- `taxId`: String - Tax identification number
- `contractTerms`: ContractTerms - Default contract terms
- `isActive`: Boolean - Whether organization is active
- `createdAt`: DateTime - Organization creation date

**Relationships**:
- Has many SubBlocks
- Has many Users
- Has many Contracts
- Has many Events

### Event
**Description**: Represents a conference, meeting, or gathering associated with sub-blocks

**Attributes**:
- `id`: String - Unique event identifier
- `name`: String - Event name
- `description`: String - Event description
- `organizationId`: String - Reference to organizing entity
- `eventType`: Enum - Type of event (CONFERENCE, MEETING, WEDDING, etc.)
- `startDate`: Date - Event start date
- `endDate`: Date - Event end date
- `expectedAttendees`: Integer - Estimated number of attendees
- `venue`: String - Event venue information
- `status`: Enum - Event status (PLANNING, ACTIVE, COMPLETED, CANCELLED)

**Relationships**:
- Belongs to one Organization
- Has many SubBlocks
- Has many Attendees

## Business Rules

### Sub-Block Creation Rules
1. **Minimum Lead Time**: Sub-blocks must be created at least 30 days before the start date
2. **Maximum Duration**: Sub-blocks cannot exceed 30 consecutive days
3. **Room Availability**: Cannot allocate more rooms than hotel has available for the specified dates
4. **Cut-off Date**: Must be at least 7 days before the start date
5. **Organization Validation**: Only active organizations can create sub-blocks

### Reservation Rules
1. **Booking Window**: Reservations can only be made between sub-block creation and cut-off date
2. **Occupancy Limits**: Cannot exceed room type maximum occupancy
3. **Date Validation**: Check-in date must be within sub-block date range
4. **Availability Check**: Room must be available in the allocation before booking
5. **Guest Information**: Primary guest information is required for all reservations

### Status Transition Rules
1. **Sub-Block Status Flow**: PENDING → ACTIVE → INACTIVE (or CANCELLED at any point)
2. **Reservation Status Flow**: PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT (or CANCELLED)
3. **Automatic Status Updates**: Sub-blocks automatically become INACTIVE after end date
4. **Cancellation Rules**: Active sub-blocks with confirmed reservations require special approval to cancel

### Rate and Pricing Rules
1. **Rate Consistency**: All rooms in a sub-block allocation must use the same base rate
2. **Currency Matching**: All rates within a sub-block must use the same currency
3. **Minimum Rate**: Rates cannot be below hotel's minimum acceptable rate
4. **Rate Changes**: Rate modifications require approval and affect only future reservations
5. **Group Discounts**: Discounts are applied at the allocation level, not individual reservations

### Inventory Management Rules
1. **Overbooking Prevention**: System prevents allocation of more rooms than available
2. **Real-time Updates**: Room availability is updated immediately upon reservation changes
3. **Release Rules**: Unbooked rooms are released back to general inventory after cut-off date
4. **Attrition Tracking**: System tracks pick-up rates and attrition for reporting
5. **Waitlist Management**: Oversold allocations automatically create waitlists

### Data Integrity Rules
1. **Audit Trail**: All changes to sub-blocks and reservations are logged
2. **Referential Integrity**: Foreign key relationships are enforced
3. **Data Validation**: All input data is validated against business rules
4. **Soft Deletes**: Sub-blocks and reservations are soft-deleted to maintain history
5. **Backup Requirements**: Critical data changes trigger automatic backups
# Domain Model

## Glossary

### Event Housing
The comprehensive management of accommodation arrangements for event attendees, including hotel partnerships, room allocations, and booking processes.

### Room Block
A pre-negotiated allocation of hotel rooms reserved for event attendees at a specific rate, typically with a cut-off date for reservations.

### Room Category
A classification of hotel rooms based on amenities, size, bed type, and other characteristics (e.g., Standard, Deluxe, Suite).

### Group Link
A specialized booking URL that allows event attendees to make reservations within allocated room blocks using group rates.

### Housing Library
Reusable library of hotel and housing configurations for event management, providing standardized templates and settings.

### Room Block Transfer
The process of moving room allocations between different blocks, hotels, or room categories to optimize availability and demand.

### Connection
Integration points with external housing providers, including API connections and data synchronization mechanisms.

### Callback
Asynchronous notifications received from external systems to update booking status, availability, or other housing-related information.

### Passkey
Cvent's hospitality technology platform that connects event planners with hotels and manages group bookings.

### Cut-off Date
The deadline by which attendees must make reservations to secure group rates and room availability.

### Attrition
The difference between the number of rooms contracted in a room block and the actual number of rooms booked by attendees.

## Core Entities

### Event
**Description**: Represents an event that requires housing accommodations

**Attributes**:
- `eventId`: string - Unique identifier for the event
- `name`: string - Event name
- `startDate`: date - Event start date
- `endDate`: date - Event end date
- `location`: string - Event location
- `expectedAttendees`: integer - Estimated number of attendees
- `housingRequired`: boolean - Whether housing is needed for this event

**Relationships**:
- Has many RoomBlocks
- Has many GroupLinks
- Associated with Hotels through RoomBlocks

### AttendeeGroupType
**Description**: Categories of attendees within an event (VIP, general, staff, speakers)

**Attributes**:
- `groupTypeId`: string - Unique identifier for the attendee group type
- `eventId`: string - Associated event identifier
- `name`: string - Group type name (e.g., "VIP", "General Attendees", "Staff")
- `accessCode`: string - 20-character globally unique code for booking URLs
- `cutoffDate`: date - Group-specific cutoff date (overrides event default)
- `maxRoomAllocation`: integer - Maximum rooms allocated to this group
- `rollupFlag`: boolean - Whether counts aggregate to parent totals
- `subBlockGroupId`: string - SBG ID for planner access control
- `active`: boolean - Whether group type is active

**Relationships**:
- Belongs to Event
- Has many RoomBlocks
- Associated with Sub-Block Group for planner access

### Hotel
**Description**: Accommodation property providing rooms for event attendees

**Attributes**:
- `hotelId`: string - Unique identifier for the hotel
- `name`: string - Hotel name
- `address`: Address - Hotel location details
- `starRating`: integer - Hotel star rating (1-5)
- `amenities`: array[string] - List of hotel amenities
- `contactInfo`: ContactInfo - Hotel contact details
- `images`: array[Image] - Hotel property images
- `active`: boolean - Whether hotel is active for bookings

**Relationships**:
- Has many RoomBlocks
- Has many RoomCategories
- Has many Images

### Room Block
**Description**: An allocation of hotel rooms linking Event + Hotel + Attendee Group Type + Room Type at negotiated rates for specific date ranges

**Attributes**:
- `blockId`: string - Unique identifier for the room block
- `eventId`: string - Associated event identifier
- `hotelId`: string - Associated hotel identifier
- `attendeeGroupTypeId`: string - Associated attendee group type identifier
- `roomCategoryId`: string - Type of rooms in this block
- `totalQuantity`: integer - Total number of rooms allocated
- `reservedQuantity`: integer - Number of rooms currently reserved
- `availableQuantity`: integer - Number of rooms still available
- `rate`: decimal - Negotiated room rate
- `currency`: string - Currency code (e.g., USD)
- `checkInDate`: date - Check-in date for the block
- `checkOutDate`: date - Check-out date for the block
- `cutOffDate`: date - Reservation deadline
- `status`: enum - Block status (active, inactive, expired, cancelled)
- `createdAt`: timestamp - Block creation time
- `updatedAt`: timestamp - Last modification time

**Relationships**:
- Belongs to Event
- Belongs to Hotel
- Belongs to AttendeeGroupType
- Belongs to RoomCategory
- Has many RoomBlockTransfers (as source or target)

### WebInfo
**Description**: Hotel-specific event configuration controlling booking site behavior

**Attributes**:
- `webInfoId`: string - Unique identifier for the WebInfo record
- `eventId`: string - Associated event identifier
- `hotelId`: string - Associated hotel identifier
- `visible`: boolean - Whether hotel appears on booking site
- `displayRank`: integer - Hotel display order on booking site
- `distanceFromVenue`: decimal - Distance from event venue
- `isHQHotel`: boolean - Headquarters hotel flag (typically displayed first)
- `closedFlag`: boolean - Prevents new bookings regardless of inventory
- `marketingMessage`: string - Hotel-specific promotional text
- `webOpenDate`: date - When web booking opens for this hotel
- `webCloseDate`: date - When web booking closes for this hotel

**Relationships**:
- Belongs to Event
- Belongs to Hotel

### RoomCategory
**Description**: Classification of hotel rooms based on features and amenities

**Attributes**:
- `categoryId`: string - Unique identifier for the room category
- `hotelId`: string - Associated hotel identifier
- `name`: string - Category name (e.g., "Standard Room", "Deluxe Suite")
- `description`: string - Detailed description of the room type
- `maxOccupancy`: integer - Maximum number of guests
- `bedType`: string - Type of bed (King, Queen, Twin, etc.)
- `roomSize`: integer - Room size in square feet
- `amenities`: array[string] - Room-specific amenities
- `images`: array[Image] - Room category images
- `baseRate`: decimal - Standard room rate
- `active`: boolean - Whether category is available for booking

**Relationships**:
- Belongs to Hotel
- Has many RoomBlocks
- Has many Images

### GroupLink
**Description**: Booking URL that provides access to group rates and room blocks

**Attributes**:
- `linkId`: string - Unique identifier for the group link
- `eventId`: string - Associated event identifier
- `groupName`: string - Name of the group (e.g., "Conference Attendees")
- `url`: string - Booking URL for attendees
- `expirationDate`: date - Link expiration date
- `maxReservations`: integer - Maximum number of reservations allowed
- `currentReservations`: integer - Current number of reservations made
- `roomBlocks`: array[string] - Associated room block identifiers
- `active`: boolean - Whether link is active
- `createdAt`: timestamp - Link creation time
- `accessCode`: string - Optional access code for the link

**Relationships**:
- Belongs to Event
- Associated with multiple RoomBlocks

### RoomBlockTransfer
**Description**: Record of room allocations moved between blocks

**Attributes**:
- `transferId`: string - Unique identifier for the transfer
- `sourceBlockId`: string - Origin room block identifier
- `targetBlockId`: string - Destination room block identifier
- `quantity`: integer - Number of rooms transferred
- `reason`: string - Reason for the transfer
- `status`: enum - Transfer status (pending, completed, failed, cancelled)
- `initiatedBy`: string - User who initiated the transfer
- `initiatedAt`: timestamp - Transfer initiation time
- `completedAt`: timestamp - Transfer completion time
- `notes`: string - Additional transfer notes

**Relationships**:
- References source RoomBlock
- References target RoomBlock

### Image
**Description**: Visual content associated with hotels or room categories

**Attributes**:
- `imageId`: string - Unique identifier for the image
- `propertyId`: string - Associated property (hotel or room category) identifier
- `imageType`: enum - Type of image (hotel_exterior, hotel_lobby, room, amenity)
- `url`: string - Image URL
- `altText`: string - Alternative text for accessibility
- `caption`: string - Image caption
- `displayOrder`: integer - Order for displaying multiple images
- `active`: boolean - Whether image is active
- `uploadedAt`: timestamp - Image upload time

**Relationships**:
- Belongs to Hotel or RoomCategory

### Connection
**Description**: Integration configuration with external housing providers

**Attributes**:
- `connectionId`: string - Unique identifier for the connection
- `providerId`: string - External provider identifier
- `connectionType`: enum - Type of connection (api, webhook, file_transfer)
- `configuration`: object - Provider-specific configuration
- `status`: enum - Connection status (active, inactive, error)
- `lastSyncAt`: timestamp - Last successful synchronization
- `createdAt`: timestamp - Connection creation time

**Relationships**:
- Associated with external provider systems

### Callback
**Description**: Asynchronous notification from external systems

**Attributes**:
- `callbackId`: string - Unique identifier for the callback
- `providerId`: string - Source provider identifier
- `eventType`: string - Type of event (booking_confirmed, availability_updated, etc.)
- `payload`: object - Callback data payload
- `processedAt`: timestamp - Processing timestamp
- `status`: enum - Processing status (pending, processed, failed)

**Relationships**:
- Associated with Connection

## Business Rules

### Room Block Management
1. **Allocation Limits**: Total reserved quantity cannot exceed total quantity in a room block
2. **Cut-off Enforcement**: Reservations cannot be made after the cut-off date unless explicitly allowed
3. **Rate Consistency**: All reservations within a room block use the same negotiated rate
4. **Status Transitions**: Room blocks can only transition between valid status states

### Room Block Transfers
1. **Availability Check**: Source block must have sufficient available rooms for transfer
2. **Compatibility**: Transfers can only occur between compatible room categories
3. **Event Consistency**: Both source and target blocks must belong to the same event
4. **Audit Trail**: All transfers must be logged with user attribution and timestamps

### Group Link Access
1. **Expiration Enforcement**: Links cannot be used after expiration date
2. **Capacity Limits**: Number of reservations cannot exceed maximum allowed
3. **Block Association**: Links can only access rooms from associated room blocks
4. **Access Control**: Links may require access codes for restricted groups

### Image Management
1. **File Validation**: Only approved image formats and sizes are accepted
2. **Content Moderation**: Images must comply with content guidelines
3. **Display Order**: Images are displayed according to specified order
4. **Accessibility**: All images must have appropriate alternative text

### Data Integrity
1. **Referential Integrity**: All foreign key relationships must be maintained
2. **Audit Logging**: All significant changes must be logged with user and timestamp
3. **Soft Deletion**: Critical entities use soft deletion to maintain historical data
4. **Validation**: All input data must pass validation rules before persistence

### External Integration
1. **Connection Health**: System monitors and reports connection status
2. **Callback Processing**: All callbacks must be processed within defined timeframes
3. **Error Handling**: Failed integrations must be logged and retried appropriately
4. **Data Synchronization**: External data must be synchronized regularly

## Entity Relationships

```
Event (1) ──── (M) AttendeeGroupType (1) ──── (M) RoomBlock (M) ──── (1) Hotel
  │                                                │                    │
  │                                                │                    │
  └── (M) GroupLink                               └── (1) RoomCategory ├── (M) Image
                                                       │               │
                                                       └── (M) Image   └── (M) RoomCategory

Event (1) ──── (M) WebInfo ──── (1) Hotel

RoomBlock (1) ──── (M) RoomBlockTransfer ──── (1) RoomBlock
                        (source)              (target)

Connection (1) ──── (M) Callback

Hotel ──── (M) Connection (external integrations)
```

## Data Validation Rules

### Event Validation
- Event dates must be in the future
- End date must be after start date
- Expected attendees must be positive integer

### Room Block Validation
- Check-in date must be before check-out date
- Cut-off date must be before check-in date
- Room rates must be positive values
- Reserved quantity cannot exceed total quantity

### Hotel Validation
- Star rating must be between 1 and 5
- Contact information must include valid email and phone
- Address must include required fields (street, city, state/province, country)

### Image Validation
- File size must not exceed 10MB
- Supported formats: JPEG, PNG, WebP
- Minimum resolution: 800x600 pixels
- Maximum resolution: 4000x3000 pixels
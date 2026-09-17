# Domain Model

## Glossary

### Room Block
An allocation of hotel rooms reserved for an event linking Event + Hotel + Attendee Group Type + Room Type. Room Blocks define the inventory available to event attendees at negotiated rates.

### Six-Pool Inventory System
Passkey tracks inventory across six pools with priority allocation:
1. **Block Inventory** — Rooms allocated to a specific block (INVENTORY.totalnumber)
2. **Hotel Pool** — Shared across blocks at a hotel (INVENTORY.numberreservedhotelpool)  
3. **Room Pool** — Shared across room types (INVENTORY.numberreservedroompool)
4. **Overbook Pool** — Beyond allocated inventory (INVENTORY.numberreservedoverbook)
5. **Waitlist Pool** — When all pools exhausted (INVENTORY.waitlistedpool)
6. **Primary Pool** — Hotel's base inventory (HOTELROOMTYPEINVENTORY.primarypool)

### Inventory Tracking Levels
Inventory is tracked at three levels:
- **Daily per block**: PADLOCK.INVENTORY — the most granular level
- **Per event-hotel-room**: EVENTPROFILE.ROOMTYPEINVENTORY  
- **Hotel base**: EVENTPROFILE.HOTELROOMTYPEINVENTORY

### Room Type
A category of hotel room with specific characteristics (e.g., Standard King, Deluxe Suite). Each room type has its own inventory and pricing.

### Event
A gathering or conference that requires hotel accommodations. Events are associated with one or more hotels and room blocks.

### Reservation
A booking made by an attendee for specific dates and room type. Reservations consume available inventory.

### Inventory Controls
- **Release to Free Sell (R2FS)**: Automatically releases unused block inventory back to the hotel
- **Sell-Only-From-Primary**: Restricts sales to primary inventory pool only
- **Sell-Highest-Rate**: Prioritize highest rate rooms when multiple options exist
- **Pull From Higher Pool**: Allow booking from higher-tier pools when lower ones are exhausted
- **Closed Status**: Prevents bookings regardless of available inventory
- **Hide Rate**: Suppress rate display on booking site
- **Min Length of Stay (MNS)**: Minimum nights required for a booking

### Availability
The number of rooms that can still be booked, calculated across the six-pool system as rooms flow from Block → Hotel Pool → Room Pool → Overbook → Waitlist → Primary Pool.

### Pickup Rate
The percentage of allocated rooms that have been reserved by attendees. Used to measure demand and booking success.

### Waitlist
A queue for attendees when no inventory is available. Waitlisted requests are fulfilled when inventory becomes available.

### Group Type
A classification system for events that determines pricing, availability rules, and booking policies.

### Attendee Type
A categorization of event participants that may affect room allocation and pricing (e.g., speaker, sponsor, general attendee).

### Sub-Block Group
A subdivision within a room block that allows for more granular inventory management and reporting.

### Inventory Lock
A temporary hold on inventory to prevent race conditions during the reservation process. Locks expire automatically.

### Rate
The price per night for a specific room type. Rates can vary by date, event, and attendee type.

### Occupancy Rate
The percentage of total hotel rooms that are occupied on a given date.

### Arrival Date
The date when a guest checks into the hotel (start of stay).

### Departure Date
The date when a guest checks out of the hotel (end of stay).

## Core Entities

### Inventory
**Description**: Represents the available room inventory across the six-pool system for a specific date, hotel, and room type.

**Attributes**:
- `blockId`: Long - Unique identifier for the room block
- `hotelId`: Long - Hotel identifier
- `roomTypeId`: Integer - Room type identifier
- `inventoryDate`: LocalDate - Date for which inventory applies
- `totalInventory`: Integer - Total rooms allocated (Block pool)
- `hotelPoolInventory`: Integer - Hotel pool allocation
- `roomPoolInventory`: Integer - Room pool allocation  
- `overbookInventory`: Integer - Overbook pool allocation
- `waitlistInventory`: Integer - Waitlist pool allocation
- `primaryPoolInventory`: Integer - Primary pool allocation
- `availableInventory`: Integer - Rooms available across all pools

**Relationships**:
- Belongs to a Room Block
- Associated with a Hotel and RoomType
- Related to multiple Reservations across pools

### Room Block
**Description**: An allocation of hotel rooms reserved for an event linking Event + Hotel + Attendee Group Type + Room Type.

**Attributes**:
- `blockId`: Long - Unique block identifier
- `eventId`: Long - Associated event identifier  
- `hotelId`: Long - Hotel where block is allocated
- `attendeeGroupTypeId`: Long - Attendee group type identifier
- `roomTypeId`: Integer - Room type identifier
- `startDate`: LocalDate - Block start date
- `endDate`: LocalDate - Block end date
- `totalRooms`: Integer - Total rooms in block (INVENTORY.totalnumber)
- `groupRate`: BigDecimal - Negotiated group rate

**Relationships**:
- Contains multiple Inventory records across six pools
- Belongs to an Event, Hotel, Attendee Group Type, and Room Type
- Has multiple Reservations

### Reservation
**Description**: An individual booking within a room block.

**Attributes**:
- `reservationId`: Long - Unique reservation identifier
- `blockId`: Long - Associated block identifier
- `userId`: Long - User who made the reservation
- `arrivalDate`: LocalDate - Check-in date
- `departureDate`: LocalDate - Check-out date
- `numberOfRooms`: Integer - Number of rooms reserved
- `roomTypeId`: Integer - Type of room reserved
- `status`: ReservationStatus - Current reservation status
- `totalCost`: BigDecimal - Total cost of reservation

**Relationships**:
- Belongs to a Block
- Consumes Inventory
- Associated with a User

### RoomTypeInventory
**Description**: Detailed inventory information for a specific room type.

**Attributes**:
- `eventId`: Long - Event identifier
- `hotelId`: Long - Hotel identifier
- `roomTypeId`: Long - Room type identifier
- `inventoryDate`: LocalDate - Inventory date
- `totalRooms`: Integer - Total rooms available
- `availableRooms`: Integer - Rooms available for booking
- `blockedRooms`: Integer - Rooms blocked/held
- `reservedRooms`: Integer - Rooms already reserved
- `rate`: BigDecimal - Rate per night

**Relationships**:
- Associated with Event, Hotel, and RoomType
- Aggregated from Inventory records

### InventoryLock
**Description**: Temporary hold on inventory to prevent concurrent booking conflicts.

**Attributes**:
- `lockId`: String - Unique lock identifier
- `blockId`: Long - Block being locked
- `arrivalDate`: LocalDate - Start of locked period
- `departureDate`: LocalDate - End of locked period
- `numberOfRooms`: Integer - Number of rooms locked
- `userId`: Long - User who created the lock
- `expirationTime`: Instant - When lock expires
- `status`: LockStatus - Current lock status

**Relationships**:
- Temporarily reserves Inventory
- Created by a User

### AvailabilitySearch
**Description**: Search criteria for checking room availability.

**Attributes**:
- `groupTypeId`: Long - Group type for search
- `arrivalDate`: Optional<LocalDate> - Desired arrival date
- `departureDate`: Optional<LocalDate> - Desired departure date
- `blockId`: Optional<Long> - Specific block to search

**Relationships**:
- Queries multiple Inventory records
- Returns BlockAvailability results

### BlockAvailability
**Description**: Availability information for a specific block and date.

**Attributes**:
- `blockId`: Long - Block identifier
- `hotelId`: Long - Hotel identifier
- `roomTypeId`: Integer - Room type identifier
- `availableRooms`: Integer - Rooms available
- `totalRooms`: Integer - Total rooms in block
- `inventoryDate`: LocalDate - Date of availability

**Relationships**:
- Derived from Inventory data
- Associated with Block and RoomType

## Business Rules

### Six-Pool Inventory Rules
1. **Pool Priority**: Block → Hotel Pool → Room Pool → Overbook → Waitlist → Primary Pool
2. **Pool Allocation**: Booking decrements from appropriate pool based on availability and controls
3. **Pool Release**: Cancellation increments inventory back to appropriate pool
4. **R2FS Processing**: Unused block inventory automatically released to hotel
5. **Sell-Only-From-Primary**: When enabled, restricts sales to primary pool only
6. **Pull From Higher Pool**: Allows booking from higher-tier pools when lower exhausted

### Room Block Rules
1. **Block Definition**: Must link Event + Hotel + Attendee Group Type + Room Type
2. **Inventory Allocation**: Block inventory (INVENTORY.totalnumber) is most specific level
3. **Date Boundaries**: Reservations must fall within block date range
4. **Closed Override**: Closed flag prevents bookings regardless of available inventory

### Reservation Rules
1. **Availability Check**: Sufficient inventory must be available before reservation
2. **Lock Requirement**: Inventory must be locked during reservation process
3. **Modification Constraints**: Modifications must maintain inventory constraints
4. **Cancellation Policy**: Cancelled reservations return inventory to available pool

### Lock Management Rules
1. **Lock Duration**: Locks automatically expire after configured timeout
2. **Lock Scope**: Locks apply to specific date range and room count
3. **Concurrent Locks**: Multiple locks allowed if inventory permits
4. **Lock Release**: Locks must be explicitly released or allowed to expire

### Pricing Rules
1. **Rate Inheritance**: Room rates inherit from block configuration
2. **Date-Based Pricing**: Rates can vary by inventory date
3. **Attendee Type Pricing**: Different rates may apply to different attendee types
4. **Group Rate Priority**: Block group rates override standard hotel rates

### Availability Calculation Rules
1. **Six-Pool Calculation**: Availability flows through Block → Hotel Pool → Room Pool → Overbook → Waitlist → Primary Pool
2. **Real-Time Calculation**: Availability = Sum of available inventory across applicable pools
3. **Control Override**: Sell-Only-From-Primary restricts calculation to primary pool only
4. **Closed Override**: Closed status prevents booking regardless of calculated availability
5. **Lock Consideration**: Locked inventory temporarily reduces availability
6. **Three-Level Tracking**: Daily per block (most granular) → per event-hotel-room → hotel base

### Data Consistency Rules
1. **Transactional Updates**: All inventory changes must be atomic
2. **Audit Trail**: All inventory modifications must be logged
3. **Reconciliation**: Regular reconciliation between inventory and reservations
4. **Rollback Capability**: Failed operations must not leave partial state

## State Transitions

### Reservation States
- **PENDING** → **CONFIRMED**: Successful payment and inventory allocation
- **CONFIRMED** → **MODIFIED**: Changes to dates or room count
- **CONFIRMED** → **CANCELLED**: Reservation cancelled, inventory released
- **PENDING** → **WAITLISTED**: No inventory available, added to waitlist
- **WAITLISTED** → **CONFIRMED**: Inventory becomes available

### Lock States
- **ACTIVE**: Lock is currently holding inventory
- **EXPIRED**: Lock has timed out and released inventory
- **RELEASED**: Lock was explicitly released
- **CONSUMED**: Lock was used to complete a reservation

### Inventory States
- **AVAILABLE**: Can be reserved by attendees
- **RESERVED**: Allocated to confirmed reservations
- **BLOCKED**: Temporarily held (maintenance, VIP, etc.)
- **LOCKED**: Temporarily held during reservation process
# Domain Model

## Glossary

### Block
Allocation linking Event + Hotel + Attendee Group + Room Type with negotiated rates for specific date ranges. Contains room availability, rates, and booking constraints for a defined time period.

### Block ID
A unique identifier for a hotel room block within the passkey inventory system. Used to reference and manage specific block allocations.

### Entity
A generic business object within the passkey inventory system that represents various types of inventory items, configurations, or business data.

### Inventory
The collection of available hotel rooms tracked across six pools with priority allocation: Block Inventory, Hotel Pool, Room Pool, Overbook Pool, Waitlist Pool, and Primary Pool. Tracked at three levels: Daily per block, Per event-hotel-room, and Hotel base.

### Locale ID
An identifier that specifies the language and regional settings for data presentation, following standard locale conventions (e.g., "en-US", "fr-FR").

### Passkey
Cvent's hotel booking platform that connects event planners with hotels for group reservations and room blocks.

### Room Block
See "Block" - allocation linking Event + Hotel + Attendee Group + Room Type with negotiated rates.

### Room Type
A classification of hotel rooms based on features, size, amenities, and pricing (e.g., "Standard Double", "Executive Suite", "Deluxe King").

## Core Entities

### BlockInfo
**Description**: Represents comprehensive information about a hotel room block, including availability, pricing, and metadata.

**Attributes**:
- `blockId`: String - Unique identifier for the block
- `blockName`: String - Human-readable name for the block
- `hotelId`: String - Identifier of the associated hotel
- `hotelName`: String - Name of the hotel
- `startDate`: LocalDate - Block availability start date
- `endDate`: LocalDate - Block availability end date
- `totalRooms`: Integer - Total number of rooms in the block
- `availableRooms`: Integer - Currently available rooms for booking
- `blockedRooms`: Integer - Rooms currently reserved or blocked
- `roomType`: String - Type/category of rooms in the block
- `rate`: RateInfo - Pricing information for the block
- `status`: BlockStatus - Current status of the block
- `localeId`: String - Locale for data presentation
- `createdAt`: Instant - Block creation timestamp
- `updatedAt`: Instant - Last modification timestamp

**Relationships**:
- Associated with a Hotel entity (via hotelId)
- Contains RateInfo for pricing details
- May have multiple BookingInfo records for individual reservations

**Business Rules**:
- `availableRooms + blockedRooms ≤ totalRooms`
- `startDate` must be before `endDate`
- Block status transitions: ACTIVE → INACTIVE → EXPIRED
- Rate information is required for active blocks

### BlockInfoResponse
**Description**: Response wrapper for block information queries, providing a consistent API response structure.

**Attributes**:
- `data`: List<BlockInfo> - Collection of block information objects

**Usage**:
- Used as the response format for block retrieval operations
- Provides consistent structure for API responses
- Supports returning multiple blocks in a single response

### GetBlocksRequest
**Description**: Request model for retrieving block information by IDs and locale.

**Attributes**:
- `blockIds`: List<String> - List of block identifiers to retrieve
- `localeId`: String - Locale identifier for response formatting

**Validation Rules**:
- `blockIds` cannot be null or empty
- `localeId` must be a valid locale format
- Maximum of 100 block IDs per request (performance constraint)

### Entity
**Description**: Generic business entity representing various types of inventory items and business objects.

**Attributes**:
- `id`: String - Unique entity identifier
- `name`: String - Human-readable entity name
- `type`: String - Entity type classification
- `properties`: Map<String, Object> - Flexible key-value properties

**Relationships**:
- Can be associated with other entities through properties
- May have audit trail information

### RateInfo (Embedded)
**Description**: Pricing information for hotel room blocks.

**Attributes**:
- `amount`: BigDecimal - Rate amount
- `currency`: String - Currency code (ISO 4217)

**Business Rules**:
- Amount must be positive
- Currency must be a valid ISO 4217 code
- Rates may vary by date range within a block

## Enumerations

### BlockStatus
**Values**:
- `ACTIVE`: Block is currently available for booking
- `INACTIVE`: Block is temporarily unavailable
- `EXPIRED`: Block has passed its end date or been permanently closed

**Transitions**:
- ACTIVE ↔ INACTIVE (can be toggled based on business needs)
- ACTIVE → EXPIRED (automatic when end date passes)
- INACTIVE → EXPIRED (automatic when end date passes)

### EntityType
**Common Values**:
- `INVENTORY_ITEM`: Standard inventory item
- `CONFIGURATION`: System configuration entity
- `METADATA`: Metadata or reference data

## Data Relationships

```
Hotel (1) ←→ (N) BlockInfo
BlockInfo (1) ←→ (1) RateInfo
BlockInfo (1) ←→ (N) BookingInfo
Entity (1) ←→ (N) EntityProperty
```

## Business Rules

### Block Management Rules

1. **Block Structure**:
   - Must link Event + Hotel + Attendee Group + Room Type
   - Contains negotiated rates for specific date ranges
   - Multiple blocks can exist for same event-hotel (different room types/groups)

2. **Six-Pool Inventory System**:
   - Block Inventory → Hotel Pool → Room Pool → Overbook → Waitlist → Primary Pool
   - Booking decrements from appropriate pool with priority allocation
   - Cancellation increments inventory back to appropriate pool

3. **Inventory Controls**:
   - R2FS (Release to Free Sell): Auto-release unused inventory to hotel
   - Sell-Only-From-Primary: Restrict sales to primary pool only
   - Pull From Higher Pool: Allow booking from higher-tier pools when lower exhausted
   - Closed Status: Prevents bookings regardless of available inventory

4. **Availability Constraints**:
   - Available rooms cannot exceed total rooms
   - Blocked rooms cannot exceed total rooms
   - Available + Blocked rooms should not exceed total rooms

2. **Date Validation**:
   - Start date must be before end date
   - Blocks cannot be created for past dates (business rule)
   - End date determines automatic expiration

3. **Status Management**:
   - Only ACTIVE blocks can accept new bookings
   - INACTIVE blocks preserve existing bookings but prevent new ones
   - EXPIRED blocks are read-only

4. **Rate Management**:
   - Rates must be positive values
   - Currency must be consistent within a block
   - Rate changes may require approval workflow

### Entity Management Rules

1. **Identifier Uniqueness**:
   - Entity IDs must be unique across the system
   - Block IDs must be unique within the inventory domain

2. **Data Integrity**:
   - Required fields must be populated
   - Foreign key relationships must be valid
   - Audit trails must be maintained

3. **Localization**:
   - All user-facing text should support localization
   - Locale-specific formatting for dates, numbers, and currency
   - Default locale fallback for missing translations

## Domain Events

### Block Events
- `BlockCreated`: New block added to inventory
- `BlockUpdated`: Block information modified
- `BlockStatusChanged`: Block status transition
- `BlockExpired`: Block automatically expired

### Booking Events
- `RoomBooked`: Room reserved within a block
- `BookingCancelled`: Room booking cancelled
- `AvailabilityChanged`: Room availability updated

## Data Validation Rules

### Input Validation
- All string fields are trimmed and validated for length
- Numeric fields must be within acceptable ranges
- Date fields must be valid and within business constraints
- Email addresses must follow RFC 5322 format

### Business Validation
- Block dates must be logical (start < end)
- Room counts must be consistent
- Rate information must be complete for active blocks
- Locale IDs must be supported by the system

## Integration Patterns

### Data Synchronization
- Block information may be synchronized with external hotel systems
- Rate updates may trigger notifications to dependent services
- Availability changes are propagated to booking systems

### Event Sourcing
- All domain changes are captured as events
- Event history provides audit trail
- Events enable eventual consistency across services

## Performance Considerations

### Caching Strategy
- Block information is cached for frequently accessed data
- Cache invalidation on block updates
- Locale-specific caching for internationalization

### Query Optimization
- Indexed queries for block retrieval by ID
- Efficient pagination for large result sets
- Optimized joins for related data retrieval
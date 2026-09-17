# Domain Model

## Glossary

### Allocation
The process of assigning specific hotel room inventory to a reservation for particular dates. An allocation represents a commitment of inventory that reduces available capacity.

### Block
A group of hotel rooms reserved for a specific event or group. Blocks contain inventory that can be allocated to individual reservations within the event.

### Inventory
The available hotel room capacity for specific dates and room types. Inventory represents the total number of rooms that can be booked.

### Lock
A temporary hold on inventory that prevents other reservations from accessing the same rooms. Locks have expiration times and are used during the booking process to prevent double-booking.

### Reservation
A booking request or confirmed booking for hotel accommodations. Each reservation has a unique identifier and can have inventory allocated to it.

### Room Type
A category of hotel room with specific characteristics (e.g., Standard Room, Deluxe Suite, Executive Floor). Different room types have separate inventory pools.

### Session Key
A unique identifier that tracks a series of related operations. Session keys ensure consistency across multiple API calls and enable rollback operations.

### Wait List
A mechanism for handling requests when inventory is not immediately available. Wait-listed requests can be fulfilled when inventory becomes available.

## Core Entities

### InventoryAllocationRequest

**Description**: Represents a request to allocate hotel room inventory for a specific reservation.

**Attributes**:
- `sessionKey`: String - Unique session identifier for tracking related operations
- `blockId`: String - Identifier of the block containing the inventory
- `startDate`: LocalDate - Check-in date for the reservation
- `endDate`: LocalDate - Check-out date for the reservation
- `dates`: List<InventoryAllocationRequestDate> - Specific date and room requirements
- `allowWaitList`: Boolean - Whether to allow wait-listing if inventory unavailable
- `allowPrimary`: Boolean - Whether to allow allocation from primary inventory
- `allowOverBook`: Boolean - Whether to allow overbooking beyond capacity
- `allowExternalRates`: Boolean - Whether to include external rate sources
- `ignoreCapRules`: Boolean - Whether to bypass capacity validation rules
- `ignoreValidations`: Boolean - Whether to skip business rule validations

**Relationships**:
- Contains multiple `InventoryAllocationRequestDate` objects
- Associated with a specific reservation via reservation ID
- Links to a block through block ID

### InventoryAllocationResponse

**Description**: Contains the result of an inventory allocation operation, including allocated rooms and rates.

**Attributes**:
- `reservationId`: Long - Unique identifier for the reservation
- `sessionKey`: String - Session identifier used for the operation
- `blockId`: String - Block containing the allocated inventory
- `startDate`: LocalDate - Check-in date
- `endDate`: LocalDate - Check-out date
- `dates`: List<InventoryAllocationResponseDate> - Allocated inventory by date
- `totalNights`: Integer - Total number of nights in the allocation
- `totalRooms`: Integer - Total number of rooms allocated

**Relationships**:
- Contains multiple `InventoryAllocationResponseDate` objects
- Each date contains multiple room allocations
- Links back to the original request through session key

### InventoryAllocationRequestDate

**Description**: Specifies inventory requirements for a specific date.

**Attributes**:
- `date`: LocalDate - The specific date for inventory allocation
- `roomTypeId`: String - Identifier for the type of room requested
- `quantity`: Integer - Number of rooms requested for this date and room type

**Relationships**:
- Part of an `InventoryAllocationRequest`
- References a specific room type
- Maps to corresponding response date objects

### InventoryAllocationResponseDate

**Description**: Contains the allocated inventory details for a specific date.

**Attributes**:
- `date`: LocalDate - The date for which inventory was allocated
- `rooms`: List<AcquiredNight> - Details of allocated rooms
- `totalRooms`: Integer - Total rooms allocated for this date

**Relationships**:
- Part of an `InventoryAllocationResponse`
- Contains multiple `AcquiredNight` objects
- Corresponds to request date specifications

### AcquiredNight

**Description**: Represents a successfully allocated room for a specific night.

**Attributes**:
- `roomTypeId`: String - Type of room that was allocated
- `quantity`: Integer - Number of rooms allocated
- `rate`: Money - Rate information for the allocated room
- `nightStatus`: NightStatus - Status of the allocation (ALLOCATED, WAIT_LISTED, etc.)

**Relationships**:
- Part of an `InventoryAllocationResponseDate`
- References room type and pricing information
- Contains rate details through `Money` object

### InventoryLockRequest

**Description**: Request to temporarily lock inventory to prevent concurrent access.

**Attributes**:
- `sessionKey`: String - Session identifier for the lock operation
- `blockId`: String - Block containing the inventory to lock
- `dates`: List<InventoryLockRequestDate> - Specific dates and rooms to lock
- `lockDurationMinutes`: Integer - How long the lock should remain active

**Relationships**:
- Contains multiple `InventoryLockRequestDate` objects
- Associated with a reservation through reservation ID
- Links to inventory through block and room type identifiers

### InventoryLockResponse

**Description**: Result of an inventory lock operation.

**Attributes**:
- `reservationId`: Long - Reservation associated with the lock
- `sessionKey`: String - Session identifier
- `lockId`: String - Unique identifier for the created lock
- `expiresAt`: Instant - When the lock will automatically expire
- `dates`: List<InventoryLockResponseDate> - Details of locked inventory

**Relationships**:
- Contains multiple `InventoryLockResponseDate` objects
- References the lock through lock ID
- Associated with specific reservation and session

### LockRecord

**Description**: Internal representation of an active inventory lock.

**Attributes**:
- `lockId`: String - Unique identifier for the lock
- `reservationId`: Long - Associated reservation
- `sessionKey`: String - Session that created the lock
- `expiresAt`: Instant - Lock expiration timestamp
- `createdAt`: Instant - When the lock was created

**Relationships**:
- Links to specific inventory items
- Associated with reservation and session
- Managed by `LockRecordService`

### Money

**Description**: Represents monetary amounts with currency information.

**Attributes**:
- `amount`: BigDecimal - The monetary amount
- `currency`: String - Currency code (e.g., "USD", "EUR")

**Relationships**:
- Used in rate information for allocated rooms
- Part of pricing calculations
- Standardized across all monetary representations

### EventSettings

**Description**: Configuration settings that control inventory allocation behavior for specific events.

**Attributes**:
- `allowWaitList`: Boolean - Default wait list policy
- `allowOverBook`: Boolean - Default overbooking policy
- `maxAdvanceBookingDays`: Integer - Maximum days in advance for bookings
- `cutoffHours`: Integer - Hours before arrival when bookings close

**Relationships**:
- Applied to inventory allocation requests
- Influences validation and business rule enforcement
- Can be overridden by request-specific settings

## Business Rules

### Inventory Allocation Rules

1. **Capacity Constraints**: Total allocated rooms cannot exceed available inventory unless overbooking is explicitly allowed
2. **Date Continuity**: All dates between start and end date must have inventory allocated for a valid reservation
3. **Room Type Consistency**: Room type must be available in the specified block for all requested dates
4. **Session Consistency**: All operations within a session must use the same session key for tracking

### Lock Management Rules

1. **Lock Expiration**: Locks automatically expire after the specified duration to prevent indefinite holds
2. **Session Ownership**: Only the session that created a lock can modify or release it
3. **Lock Conflicts**: Cannot create overlapping locks on the same inventory
4. **Automatic Cleanup**: Expired locks are automatically removed from the system

### Validation Rules

1. **Date Validation**: Start date must be before end date, and both must be in the future
2. **Quantity Validation**: Room quantities must be positive integers
3. **Block Validation**: Block must exist and be active for the requested dates
4. **Rate Validation**: Rates must be positive and in valid currency format

### Business Logic Constraints

1. **Wait List Priority**: Wait-listed requests are fulfilled in first-come, first-served order
2. **Overbooking Limits**: Overbooking cannot exceed configured thresholds
3. **Cancellation Windows**: Cancellations must occur within allowed time windows
4. **Rate Source Priority**: Internal rates take precedence over external rates unless explicitly overridden

## State Transitions

### Allocation States

```
REQUESTED → ALLOCATED → CONFIRMED
    ↓           ↓
WAIT_LISTED → ALLOCATED
    ↓
CANCELLED
```

### Lock States

```
REQUESTED → ACTIVE → EXPIRED
    ↓         ↓
FAILED    RELEASED
```

## Data Relationships

### Primary Relationships

- **Reservation** ←→ **InventoryAllocation** (1:1)
- **InventoryAllocation** ←→ **AllocationDate** (1:N)
- **AllocationDate** ←→ **AcquiredNight** (1:N)
- **Reservation** ←→ **InventoryLock** (1:N)
- **InventoryLock** ←→ **LockDate** (1:N)

### Reference Relationships

- **Block** ←→ **InventoryAllocation** (1:N)
- **RoomType** ←→ **AcquiredNight** (1:N)
- **Session** ←→ **Operations** (1:N)

## Integration Points

### External Systems

1. **Auth Service**: Validates API keys and permissions
2. **Inventory Service**: Provides real-time inventory availability
3. **Reservation Service**: Supplies reservation context and validation
4. **Rate Service**: Provides pricing information for allocated rooms
5. **Event Service**: Supplies block and event configuration

### Data Consistency

1. **Transactional Integrity**: All allocation operations are wrapped in database transactions
2. **Eventual Consistency**: Some operations may have eventual consistency with external systems
3. **Conflict Resolution**: Last-writer-wins for concurrent modifications
4. **Audit Trail**: All operations are logged for compliance and debugging
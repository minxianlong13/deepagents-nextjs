# Domain Model

## Glossary

### Autoblock
A pre-allocated group of hotel rooms reserved for a specific event or time period, automatically created based on demand patterns and business rules.

### Autoprovision
The automated process of creating, allocating, and managing room blocks without manual intervention, using predefined algorithms and business logic.

### Block Group
A collection of related room blocks that are managed together, typically for the same event but potentially across different room types or date ranges.

### Sub-block
A smaller division within a larger room block, allowing for more granular inventory management and allocation strategies.

### Orchestration
The coordination and management of complex, multi-step workflows that involve multiple services and decision points in the provisioning process.

### Step Function Workflow
An AWS-managed state machine that defines the sequence of operations, decision points, and error handling for the autoprovision process.

### Execution Context
The runtime state and data that flows through a workflow execution, containing all necessary information for decision-making and processing.

### Smart Campaign
An intelligent marketing and inventory management campaign that uses data analytics to optimize room block creation and pricing strategies.

### Planner Orchestration
The high-level coordination logic that determines when, where, and how many room blocks should be created based on demand forecasting and business rules.

### Tracking Context
The monitoring and audit trail system that records all actions, decisions, and state changes throughout the provisioning workflow.

### WebSocket Session
A persistent, bidirectional communication channel that provides real-time updates on workflow execution status to connected clients.

## Core Entities

### AutoblockRequest
**Description**: Represents a request to create one or more room blocks through the autoprovision system.

**Attributes**:
- `requestId`: string - Unique identifier for the provisioning request
- `eventId`: string - Associated event requiring room inventory
- `hotelId`: string - Target hotel for block creation
- `checkInDate`: Date - Start date for room availability
- `checkOutDate`: Date - End date for room availability
- `roomTypeId`: string - Specific room type to be blocked
- `blockSize`: number - Total number of rooms requested
- `priority`: Priority - Processing priority level (HIGH, MEDIUM, LOW)
- `autoProvision`: boolean - Whether to use automated provisioning rules
- `campaignId`: string - Associated smart campaign identifier
- `requestedBy`: string - User or system initiating the request
- `createdAt`: Date - Timestamp of request creation
- `status`: RequestStatus - Current processing status

**Relationships**:
- Has many `ExecutionLog` entries
- May have one `SmartCampaign`
- Results in one or more `RoomBlock` entities

### RoomBlock
**Description**: Represents a specific allocation of hotel rooms for a defined period.

**Attributes**:
- `blockId`: string - Unique identifier for the room block
- `hotelId`: string - Hotel where rooms are blocked
- `roomTypeId`: string - Type of rooms in the block
- `startDate`: Date - Block start date
- `endDate`: Date - Block end date
- `totalRooms`: number - Total rooms in the block
- `availableRooms`: number - Currently available rooms
- `reservedRooms`: number - Rooms already reserved
- `blockStatus`: BlockStatus - Current block status
- `createdBy`: string - System or user that created the block
- `createdAt`: Date - Block creation timestamp
- `expiresAt`: Date - Block expiration timestamp
- `metadata`: object - Additional block properties

**Relationships**:
- Belongs to one `Hotel`
- Belongs to one `RoomType`
- May belong to one `BlockGroup`
- Has many `SubBlock` entities
- Has many `Reservation` entities

### SubBlock
**Description**: A subdivision of a larger room block, allowing for more granular management and allocation.

**Attributes**:
- `subBlockId`: string - Unique identifier for the sub-block
- `parentBlockId`: string - Parent room block identifier
- `roomCount`: number - Number of rooms in this sub-block
- `purpose`: string - Intended use or allocation purpose
- `priority`: number - Priority within the parent block
- `status`: SubBlockStatus - Current sub-block status
- `allocatedAt`: Date - When the sub-block was allocated
- `releasedAt`: Date - When the sub-block was released (if applicable)

**Relationships**:
- Belongs to one `RoomBlock`
- May have many `Reservation` entities

### ExecutionLog
**Description**: Audit trail and tracking information for workflow executions.

**Attributes**:
- `executionId`: string - Unique workflow execution identifier
- `requestId`: string - Associated autoprovision request
- `stepName`: string - Current or completed workflow step
- `status`: ExecutionStatus - Current execution status
- `startTime`: Date - Execution start timestamp
- `endTime`: Date - Execution completion timestamp
- `input`: object - Input data for the execution
- `output`: object - Output data from the execution
- `errorDetails`: object - Error information if execution failed
- `retryCount`: number - Number of retry attempts
- `metadata`: object - Additional execution context

**Relationships**:
- Belongs to one `AutoblockRequest`
- Has many `ExecutionEvent` entries

### ExecutionEvent
**Description**: Individual events and state changes within a workflow execution.

**Attributes**:
- `eventId`: string - Unique event identifier
- `executionId`: string - Parent execution identifier
- `eventType`: EventType - Type of event (START, STEP_COMPLETE, ERROR, etc.)
- `timestamp`: Date - When the event occurred
- `stepName`: string - Workflow step associated with the event
- `eventData`: object - Event-specific data and context
- `severity`: Severity - Event severity level

**Relationships**:
- Belongs to one `ExecutionLog`

### SmartCampaign
**Description**: Configuration and rules for intelligent room block management campaigns.

**Attributes**:
- `campaignId`: string - Unique campaign identifier
- `name`: string - Human-readable campaign name
- `description`: string - Campaign description and purpose
- `rules`: object - Business rules and algorithms
- `targetHotels`: string[] - List of applicable hotel IDs
- `dateRange`: DateRange - Campaign active date range
- `priority`: number - Campaign priority level
- `isActive`: boolean - Whether the campaign is currently active
- `createdBy`: string - Campaign creator
- `createdAt`: Date - Campaign creation timestamp
- `lastModified`: Date - Last modification timestamp

**Relationships**:
- May be associated with many `AutoblockRequest` entities
- Has configuration for multiple `Hotel` entities

### WebSocketSession
**Description**: Active WebSocket connection for real-time updates.

**Attributes**:
- `connectionId`: string - Unique connection identifier
- `userId`: string - Connected user identifier
- `subscribedExecutions`: string[] - List of execution IDs being monitored
- `connectedAt`: Date - Connection establishment timestamp
- `lastActivity`: Date - Last activity timestamp
- `metadata`: object - Connection metadata and context

**Relationships**:
- May monitor many `ExecutionLog` entities

### Hotel
**Description**: Hotel entity with basic information for block management.

**Attributes**:
- `hotelId`: string - Unique hotel identifier
- `name`: string - Hotel name
- `location`: object - Hotel location information
- `timezone`: string - Hotel timezone
- `properties`: object - Hotel-specific properties and configurations

**Relationships**:
- Has many `RoomType` entities
- Has many `RoomBlock` entities

### RoomType
**Description**: Specific type of room available at a hotel.

**Attributes**:
- `roomTypeId`: string - Unique room type identifier
- `hotelId`: string - Associated hotel identifier
- `name`: string - Room type name
- `capacity`: number - Maximum occupancy
- `amenities`: string[] - List of room amenities
- `baseRate`: number - Base nightly rate
- `properties`: object - Room type specific properties

**Relationships**:
- Belongs to one `Hotel`
- Has many `RoomBlock` entities

## Business Rules

### Autoblock Creation Rules
1. **Minimum Lead Time**: Blocks must be created at least 24 hours before check-in date
2. **Maximum Block Size**: Single blocks cannot exceed 500 rooms without approval
3. **Date Range Limits**: Blocks cannot span more than 30 consecutive days
4. **Hotel Capacity**: Total blocks cannot exceed 80% of hotel capacity for any given date
5. **Priority Processing**: HIGH priority requests are processed within 5 minutes, MEDIUM within 15 minutes, LOW within 1 hour

### Block Allocation Rules
1. **First Come, First Served**: Blocks are allocated based on request timestamp when resources are limited
2. **Priority Override**: Higher priority requests can preempt lower priority blocks if necessary
3. **Campaign Preferences**: Smart campaign rules take precedence over standard allocation logic
4. **Seasonal Adjustments**: Block sizes may be automatically adjusted based on seasonal demand patterns
5. **Minimum Viable Block**: Blocks smaller than 5 rooms are automatically rejected unless manually approved

### Sub-block Management Rules
1. **Proportional Division**: Sub-blocks are created proportionally based on demand forecasting
2. **Dynamic Reallocation**: Sub-blocks can be merged or split based on real-time demand
3. **Expiration Cascade**: When parent blocks expire, all sub-blocks are automatically released
4. **Priority Inheritance**: Sub-blocks inherit priority from their parent block
5. **Minimum Sub-block Size**: Sub-blocks must contain at least 2 rooms

### Workflow Execution Rules
1. **Timeout Limits**: Workflow executions timeout after 1 hour
2. **Retry Policy**: Failed steps are retried up to 3 times with exponential backoff
3. **Error Escalation**: Critical errors are immediately escalated to monitoring systems
4. **State Persistence**: All workflow state is persisted for audit and recovery purposes
5. **Concurrent Execution Limits**: Maximum 100 concurrent executions per hotel

### Data Consistency Rules
1. **Eventual Consistency**: System accepts eventual consistency for non-critical operations
2. **Strong Consistency**: Financial and inventory operations require strong consistency
3. **Conflict Resolution**: Last-write-wins for configuration updates, manual resolution for inventory conflicts
4. **Audit Trail**: All state changes must be logged with timestamp and actor information
5. **Data Retention**: Execution logs are retained for 90 days, audit logs for 7 years

### Integration Rules
1. **Service Timeouts**: External service calls timeout after 30 seconds
2. **Circuit Breaker**: Services are marked unavailable after 5 consecutive failures
3. **Fallback Strategies**: Degraded functionality is provided when external services are unavailable
4. **Rate Limiting**: External API calls are rate-limited to prevent service overload
5. **Authentication**: All service-to-service communication requires valid authentication tokens
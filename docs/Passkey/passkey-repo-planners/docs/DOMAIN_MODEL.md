# Domain Model

## Glossary

### Planner
A user who organizes and manages event housing within Passkey. Planners are NOT tied to specific hotels - they're tied to events or sub-block groups. Planners have specific permissions and associations with events, and can operate at different privilege levels.

### Email User ID
A unique identifier for a planner within the Cvent system, typically corresponding to their email-based user account. This serves as the primary key for planner identification.

### Event Association
The relationship between a planner and an event, defining the planner's level of access and permissions for that specific event.

### Permission Level
The scope of access a planner has within an event, determining what actions they can perform and what data they can access.

### Sub-Block Group (SBG)
A subdivision used for planner access control. Multiple attendee groups can share the same SBG ID - same planners manage all of them. Also known as Planner Groups.

### Event-Level Planner
A planner with full access to all aspects of an event - all hotels, all attendee groups, all sub-block groups. They can access and manage all aspects of the event without restriction to specific sub-groups.

### SBG-Level Planner
A planner with restricted access to only specific sub-block groups they're assigned to. They can manage reservations for their assigned attendee groups across all hotels, but cannot see other groups.

### Planner Setup
The comprehensive process of creating a planner that includes both the planner's basic information and their event associations in a single operation.

### Search Request
A query mechanism that allows filtering and retrieving planners based on various criteria with optional field selection for optimized responses.

---

## Core Entities

### PlannersInfo
**Description**: The central entity representing a planner in the system, containing all personal and contact information.

**Attributes**:
- `emailUserId`: Long - Unique identifier for the planner
- `emailAddress`: String - Primary email address (required)
- `firstName`: String - Planner's first name
- `lastName`: String - Planner's last name
- `companyName`: String - Associated company or organization
- `phoneNumber`: String - Contact phone number
- `createdDate`: DateTime - When the planner record was created
- `lastModifiedDate`: DateTime - When the planner record was last updated

**Relationships**:
- One-to-many with Event Associations
- Many-to-many with Events (through associations)

**Business Rules**:
- Email address must be unique across the system
- Email user ID is auto-generated and immutable
- At least one of firstName or lastName must be provided
- Phone numbers should follow international format standards

### CreatePlannerRequest
**Description**: Request model for comprehensive planner creation including associations

**Attributes**:
- `plannerInfo`: PlannersInfo - The planner's basic information
- `eventAssociations`: List<EventAssociation> - Initial event associations to create

**Business Rules**:
- Planner info is required
- Event associations are optional but if provided must be valid
- All associated events must exist in the system

### PlannersInfoSearchRequest
**Description**: Search criteria for finding planners with flexible filtering options

**Attributes**:
- `emailAddress`: String - Filter by email address (partial match supported)
- `firstName`: String - Filter by first name (partial match supported)
- `lastName`: String - Filter by last name (partial match supported)
- `companyName`: String - Filter by company name (partial match supported)
- `fetchedFields`: List<PlannerInfoFields> - Specify which fields to return
- `page`: Integer - Page number for pagination
- `size`: Integer - Number of results per page

**Business Rules**:
- At least one search criterion must be provided
- Partial matches are case-insensitive
- Field selection optimizes response size and performance

### EventAssociation
**Description**: Represents the relationship between a planner and an event with specific permission levels

**Attributes**:
- `eventId`: Long - Identifier of the associated event
- `emailUserId`: Long - Identifier of the associated planner
- `permissionLevel`: EventPlannerTypeFilter - Level of access granted
- `roomListAccess`: Integer - Room List Access (100=ALLOW_REQUEST_UPDATES, 101=ALLOW_DIRECT_UPDATES)
- `dashboardAccess`: Integer - Dashboard Access (0=READ_ONLY, 1=FULL)
- `createdDate`: DateTime - When the association was created
- `subBlockGroups`: List<Long> - Specific SBG IDs for SBG-level planners

**Relationships**:
- Many-to-one with PlannersInfo
- Many-to-one with Event (external entity)

**Business Rules**:
- Each planner-event combination must be unique
- Permission level determines access scope
- SBG-level planners must have specific sub-block groups assigned
- Event-level planners cannot have sub-block group associations

### EventPlannerTypeFilter
**Description**: Enumeration defining the different levels of planner permissions within an event

**Values**:
- `EVENT_LEVEL`: Full access to all aspects of the event
- `SBG_LEVEL`: Limited access to specific sub-block groups
- `ANY_LEVEL`: Used for queries to include all permission levels

**Business Rules**:
- EVENT_LEVEL planners can access all event data
- SBG_LEVEL planners are restricted to their assigned sub-block groups
- Permission levels are hierarchical with EVENT_LEVEL having broader access

### PlannerInfoFields
**Description**: Enumeration of available fields in planner information for selective fetching

**Values**:
- `emailUserId`: The unique identifier
- `emailAddress`: Primary email address
- `firstName`: First name
- `lastName`: Last name
- `companyName`: Company or organization
- `phoneNumber`: Contact phone number
- `createdDate`: Creation timestamp
- `lastModifiedDate`: Last update timestamp

**Business Rules**:
- Field selection reduces response payload size
- All fields are optional in responses when using selective fetching
- emailUserId is typically included by default for identification

### RoomListAccessType
**Description**: Enumeration defining room list access permissions for planners

**Values**:
- `ALLOW_REQUEST_UPDATES(100)`: Planner can request changes but cannot make direct updates
- `ALLOW_DIRECT_UPDATES(101)`: Planner can make direct changes to room lists

**Business Rules**:
- Integer values are used in database storage and API responses
- Direct updates provide more privileges than request-only access

### DashboardAccessType
**Description**: Enumeration defining dashboard access permissions for planners

**Values**:
- `READ_ONLY(0)`: Planner has read-only access to dashboard
- `FULL(1)`: Planner has full access to dashboard functionality

**Business Rules**:
- Integer values are used in database storage and API responses
- Full access includes all read-only capabilities plus modification rights

### PlannerLevel
**Description**: Enumeration defining the association level of planners with events

**Values**:
- `EVENT_LEVEL_PLANNER`: Planner with event-wide responsibilities
- `SBG_LEVEL_PLANNER`: Planner with sub-block group level responsibilities
- `PLANNER_NOT_ASSOCIATED_WITH_EVENT`: Planner not associated with the event

**Business Rules**:
- Used internally for planner level determination
- Affects scope of planner permissions and access

---

## Business Rules

### Planner Creation Rules
1. **Email Uniqueness**: Each email address can only be associated with one planner record. Email addresses are stored in lowercase
2. **Required Information**: Email address is mandatory; at least one name field (first or last) should be provided
3. **Validation**: Email addresses must follow standard email format validation
4. **Auto-generation**: Email user IDs are automatically generated and cannot be manually set
5. **Update Behavior**: Creating a planner with an existing email updates the existing record

### Event Association Rules
1. **Unique Associations**: A planner can only have one association per event
2. **Permission Hierarchy**: EVENT_LEVEL permissions supersede SBG_LEVEL permissions
3. **SBG Requirements**: SBG_LEVEL planners must have at least one sub-block group assigned
4. **Event Validation**: Associated events must exist and be active in the system
5. **Hotel Independence**: Planners are NOT tied to specific hotels - they're tied to events or sub-block groups
6. **Access Permissions**: Each association defines Room List Access (100=ALLOW_REQUEST_UPDATES, 101=ALLOW_DIRECT_UPDATES) and Dashboard Access (0=READ_ONLY, 1=FULL)
7. **Cascade Deletion**: Deleting a planner cascades to all associations (events, groups)

### Search and Retrieval Rules
1. **Partial Matching**: Text-based searches support partial, case-insensitive matching
2. **Field Selection**: Clients can optimize responses by selecting only needed fields
3. **Pagination**: Large result sets are paginated with configurable page sizes
4. **Sorting**: Results can be sorted by any planner field in ascending or descending order

### Data Integrity Rules
1. **Referential Integrity**: Event associations must reference valid events
2. **Audit Trail**: All create and update operations are timestamped
3. **Soft Deletion**: Planner records may be soft-deleted to preserve historical associations
4. **Data Consistency**: Updates to planner information are atomic across all related entities

### Permission and Security Rules
1. **API Authentication**: All operations require valid API key authentication
2. **Data Privacy**: Planner information is considered sensitive and access is logged
3. **Permission Validation**: Event associations are validated against the requester's permissions
4. **Admin Operations**: Certain operations require elevated administrative privileges

### Performance and Scalability Rules
1. **Selective Loading**: Large datasets support field selection to reduce bandwidth
2. **Caching Strategy**: Frequently accessed planner data may be cached for performance
3. **Batch Operations**: Multiple planner operations can be batched for efficiency
4. **Rate Limiting**: API usage is subject to rate limiting based on client tier
# Domain Model

## Glossary

### Event Request
A formal request to process event-related data, typically involving room lists or group meeting lists. Event requests track the lifecycle of data processing from initial submission through completion or failure.

### Participant
An entity (organization or business) that participates in the Passkey platform and owns event requests. Each participant has a unique identifier and can have multiple event requests associated with them. Participant types include Event Organizer, Hotel, Sister Property Org, Vendor/Sponsor, and Passkey itself. Note: Participants are organizations/entities, NOT people attending events. Note: Participant refers to organizations/entities, NOT people attending events.

### Room List
A collection of hotel room inventory data that needs to be processed for event planning purposes. Room lists are typically provided as files (Excel, CSV) containing room types, availability, and pricing information.

### GML (Group Meeting List)
A specialized type of event request that handles group meeting data. GML requests are identified by a combination of GL Code and UUID, allowing for more complex group event scenarios.

### File ID
A unique identifier for uploaded files that serve as the source data for room list event requests. File IDs are used to track and reference specific data uploads.

### GL Code
A Group List code used in GML event requests to categorize and identify different types of group events or meetings.

### Request Type
An enumeration that categorizes the type of event request being processed. Currently supports ROOM_LIST and GML types.

### Status
The current state of an event request in its processing lifecycle. Can be individual statuses or group statuses for filtering purposes.

### Metadata
Additional key-value data associated with an event request that provides context or configuration information specific to the request.

### Reglink Service
An external service that provides event metadata and registration link functionality, integrated with the event data service for validation and enrichment.

## Core Entities

### EventRequest (Base Entity)

**Description**: The base abstract entity representing any type of event request in the system.

**Attributes**:
- `participantId`: Long - The ID of the participant who owns this request
- `status`: Status - Current processing status of the request
- `eventId`: String - Identifier of the associated event
- `eventName`: String - Human-readable name of the event
- `requestedBy`: String - Email or identifier of the person who created the request
- `requestedDate`: Instant - Timestamp when the request was created
- `createdDate`: Instant - System timestamp when the record was created
- `lastModifiedDate`: Instant - System timestamp when the record was last updated
- `metadata`: Map<String, Object> - Additional contextual data

**Relationships**:
- Belongs to one Participant
- Can have multiple processing history records

### RoomListEventRequest (Concrete Entity)

**Description**: Represents a request to process hotel room inventory data from an uploaded file.

**Attributes** (extends EventRequest):
- `fileId`: String - Unique identifier of the uploaded file
- `fileName`: String - Original name of the uploaded file
- `requestType`: RequestType - Always set to ROOM_LIST

**Relationships**:
- References one uploaded file
- May have associated processing results

### GmlEventRequest (Concrete Entity)

**Description**: Represents a request to process group meeting list data.

**Attributes** (extends EventRequest):
- `glCode`: String - Group List code for categorization
- `uuid`: String - Unique identifier for this specific GML request
- `requestType`: RequestType - Always set to GML

**Relationships**:
- Identified by combination of glCode and uuid
- May have associated group meeting data

### EventRequestSearchResponse

**Description**: Response object for search operations containing filtered and sorted event requests.

**Attributes**:
- `eventRequests`: List<EventRequest> - The actual event request data
- `totalCount`: Integer - Number of requests in current response
- `allTotalCount`: Integer - Total number of requests matching criteria
- `hasMore`: Boolean - Whether more results are available
- `sortBy`: SortBy - Field used for sorting
- `sortDirection`: SortDirection - Direction of sorting (ASC/DESC)

**Relationships**:
- Contains multiple EventRequest entities
- Provides pagination metadata

## Enumerations

### RequestType

**Description**: Categorizes the type of event request being processed.

**Values**:
- `ROOM_LIST` - Request involves processing hotel room inventory data
- `GML` - Request involves processing group meeting list data

### Status (Individual Types)

**Description**: Individual status values representing specific states in the request lifecycle.

**Values**:
- `PENDING` - Request has been created but not yet started processing
- `IN_PROGRESS` - Request is currently being processed
- `COMPLETED` - Request has been successfully processed
- `FAILED` - Request processing encountered an error and failed
- `CANCELLED` - Request was cancelled before completion

### Status (Group Types)

**Description**: Group status values used for filtering multiple individual statuses.

**Values**:
- `ALL` - Includes all requests regardless of individual status
- `ACTIVE` - Includes PENDING and IN_PROGRESS requests
- `FINISHED` - Includes COMPLETED, FAILED, and CANCELLED requests

### SortBy

**Description**: Fields available for sorting search results.

**Values**:
- `CREATED_DATE` - Sort by when the request was created
- `LAST_MODIFIED_DATE` - Sort by when the request was last updated
- `REQUESTED_DATE` - Sort by when the request was originally requested
- `STATUS` - Sort by current status
- `EVENT_NAME` - Sort by event name alphabetically

### SortDirection

**Description**: Direction for sorting operations.

**Values**:
- `ASC` - Ascending order (A-Z, 1-9, oldest first)
- `DESC` - Descending order (Z-A, 9-1, newest first)

## Business Rules

### Event Request Creation
1. **Participant Validation**: All event requests must be associated with a valid participant ID
2. **Unique Identifiers**: Room list requests must have unique file IDs per participant; GML requests must have unique glCode:uuid combinations per participant
3. **Status Initialization**: New requests are created with PENDING status by default
4. **Timestamp Management**: System automatically sets createdDate and lastModifiedDate
5. **UUID Generation**: GML requests without a UUID will have one automatically generated

### Status Transitions
1. **Valid Transitions**: 
   - PENDING → IN_PROGRESS, CANCELLED
   - IN_PROGRESS → COMPLETED, FAILED, CANCELLED
   - COMPLETED → (terminal state)
   - FAILED → PENDING (for retry scenarios)
   - CANCELLED → (terminal state)

2. **Group Status Restrictions**: Group status types (ALL, ACTIVE, FINISHED) can only be used in search operations, not for creating or updating individual requests

### Search and Filtering
1. **Participant Isolation**: Users can only search for event requests within their own participant scope
2. **Default Limits**: Search operations have a default limit of 250 results to prevent performance issues
3. **Status Filtering**: Both individual and group status types are supported in search operations
4. **Sorting**: Default sorting is by creation date in descending order (newest first)

### Data Validation
1. **Required Fields**: participantId, status, and type-specific identifiers (fileId for room lists, glCode for GML) are mandatory
2. **Format Validation**: UUIDs must be valid UUID format, dates must be ISO 8601 format
3. **Length Limits**: String fields have reasonable length limits to prevent abuse
4. **Metadata Constraints**: Metadata values must be serializable to JSON

### External Integration
1. **Event Validation**: Event IDs and names may be validated against the Reglink service
2. **File References**: File IDs in room list requests must reference valid uploaded files
3. **Authentication**: All operations require valid API key authentication

### Audit and Compliance
1. **Immutable History**: Once created, the core request data should maintain an audit trail
2. **Data Retention**: Event requests may be subject to data retention policies
3. **Privacy**: Sensitive data in metadata should be handled according to privacy regulations

## Data Relationships

```
Participant (1) ←→ (N) EventRequest
    ↓
    ├── RoomListEventRequest (references File)
    └── GmlEventRequest (identified by glCode:uuid)

EventRequest (1) ←→ (N) ProcessingHistory
EventRequest (1) ←→ (1) EventMetadata (via Reglink Service)
```

## Storage Considerations

### DynamoDB Schema
- **Partition Key**: participantId - ensures data locality per participant
- **Sort Key**: Composite key based on request type and identifier (fileId for room lists, glCode:uuid for GML)
- **Global Secondary Indexes**: 
  - Status-based index for filtering by status
  - Date-based index for time-range queries
- **TTL**: Optional time-to-live for automatic cleanup of old requests

### Caching Strategy
- **Read-through Cache**: Frequently accessed requests cached in memory
- **Write-through Cache**: Updates immediately reflected in cache
- **Cache Invalidation**: Status changes and updates invalidate relevant cache entries

## Integration Points

### Reglink Service
- **Event Validation**: Validates event IDs and retrieves event metadata
- **Registration Links**: May generate registration links for completed requests
- **Event Enrichment**: Provides additional event context and details

### File Storage Service
- **File Upload**: Handles file uploads for room list requests
- **File Validation**: Validates file formats and content
- **File Processing**: Extracts and processes room inventory data

### Authentication Service
- **API Key Validation**: Validates API keys for all requests
- **Participant Authorization**: Ensures users can only access their own data
- **Audit Logging**: Logs all access and modification attempts
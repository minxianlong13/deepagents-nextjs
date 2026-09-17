# API Reference

## Base URL
`/passkey-planners/v1`

## Authentication
All endpoints require API Key authentication using Cvent's auth-service.

**Header**: `Authorization: Bearer <api-key>`

## Endpoints

### POST /planners-setup
**Description**: Create a new planner with full setup including associations

**Request Body**:
```json
{
  "plannerInfo": {
    "emailAddress": "planner@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Example Corp",
    "phoneNumber": "+1-555-0123"
  },
  "eventAssociations": [
    {
      "eventId": 12345,
      "permissionLevel": "EVENT_LEVEL"
    }
  ]
}
```

**Response**:
```json
{
  "emailUserId": 67890,
  "emailAddress": "planner@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Example Corp",
  "phoneNumber": "+1-555-0123",
  "createdDate": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 201: Created successfully
- 400: Bad Request - Invalid input data
- 401: Unauthorized - Invalid API key
- 500: Internal Server Error

---

### GET /planners/{emailUserId}
**Description**: Retrieve planner information by email user ID

**Path Parameters**:
- `emailUserId` (Long) - The unique email user identifier

**Response**:
```json
{
  "emailUserId": 67890,
  "emailAddress": "planner@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Example Corp",
  "phoneNumber": "+1-555-0123",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModifiedDate": "2024-01-20T14:45:00Z"
}
```

**Status Codes**:
- 200: Success
- 404: Planner not found
- 401: Unauthorized

---

### POST /planners
**Description**: Create a new planner (basic creation)

**Request Body**:
```json
{
  "emailAddress": "planner@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Example Corp",
  "phoneNumber": "+1-555-0123"
}
```

**Response**:
```json
{
  "emailUserId": 67890,
  "emailAddress": "planner@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Example Corp",
  "phoneNumber": "+1-555-0123",
  "createdDate": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 201: Created successfully
- 400: Bad Request
- 401: Unauthorized

---

### PUT /planners/{emailUserId}
**Description**: Update existing planner information

**Path Parameters**:
- `emailUserId` (Long) - The unique email user identifier

**Request Body**:
```json
{
  "emailAddress": "updated@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "companyName": "Updated Corp",
  "phoneNumber": "+1-555-9876"
}
```

**Status Codes**:
- 204: No Content - Updated successfully
- 400: Bad Request
- 404: Planner not found
- 401: Unauthorized

---

### DELETE /planners/{emailUserId}
**Description**: Delete planner information

**Path Parameters**:
- `emailUserId` (Long) - The unique email user identifier

**Status Codes**:
- 204: No Content - Deleted successfully
- 404: Planner not found
- 401: Unauthorized

---

### GET /planners
**Description**: Search planners with flexible filtering and field selection

**Query Parameters**:
- `emailAddress` (String) - Filter by email address
- `firstName` (String) - Filter by first name
- `lastName` (String) - Filter by last name
- `companyName` (String) - Filter by company name
- `fetchedFields` (List<String>) - Specify which fields to return
  - Possible values: `emailUserId`, `emailAddress`, `firstName`, `lastName`, `companyName`, `phoneNumber`

**Example Request**:
```
GET /passkey-planners/v1/planners?emailAddress=john@example.com&fetchedFields=emailUserId,firstName,lastName
```

**Response**:
```json
{
  "planners": [
    {
      "emailUserId": 67890,
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "totalCount": 1
}
```

**Status Codes**:
- 200: Success
- 400: Bad Request - Invalid search parameters
- 404: No planners found matching criteria
- 401: Unauthorized

---

### GET /events/{eventId}/planners
**Description**: Get planners associated with a specific event

**Important**: Event-level and SBG-level planners are stored separately. This endpoint returns only event-level planners by default. To get the complete list of planners for an event:
1. Get attendee groups with SBG IDs to find which sub-block groups exist
2. Get event-level planners (this endpoint with plannerType=EVENT_LEVEL)
3. Search by each SBG ID to get SBG-level planners for each group
4. Get permissions per planner for dashboard and room list access settings

**Path Parameters**:
- `eventId` (Long) - The event identifier

**Query Parameters**:
- `plannerType` (String) - Filter by planner permission level
  - `EVENT_LEVEL`: Planners with event-wide privileges (default)
  - `SBG_LEVEL`: Planners with sub-block group level privileges
  - `ANY_LEVEL`: All planners affiliated with the event
- `sortBy` (String) - Field to sort by (default: `emailUserId`)
  - Possible values: `emailUserId`, `emailAddress`, `firstName`, `lastName`, `companyName`
- `sortDir` (String) - Sort direction (default: `DESC`)
  - Possible values: `ASC`, `DESC`

**Example Request**:
```
GET /passkey-planners/v1/events/12345/planners?plannerType=EVENT_LEVEL&sortBy=lastName&sortDir=ASC
```

**Response**:
```json
[
  {
    "emailUserId": 67890,
    "emailAddress": "planner1@example.com",
    "firstName": "Alice",
    "lastName": "Johnson",
    "companyName": "Event Corp",
    "phoneNumber": "+1-555-0001"
  },
  {
    "emailUserId": 67891,
    "emailAddress": "planner2@example.com",
    "firstName": "Bob",
    "lastName": "Smith",
    "companyName": "Planning Inc",
    "phoneNumber": "+1-555-0002"
  }
]
```

**Status Codes**:
- 200: Success
- 400: Bad Request - Invalid event ID or parameters
- 404: Event not found or no planners associated
- 401: Unauthorized

---

## Admin Endpoints

### Administrative operations (specific endpoints depend on admin resource implementation)

**Base Path**: `/passkey-planners/v1/admin`

These endpoints provide elevated administrative capabilities for planner management and are restricted to admin users.

---

## Odyssey Endpoints

### Odyssey-specific operations (specific endpoints depend on Odyssey resource implementation)

**Base Path**: `/passkey-planners/v1/odyssey`

These endpoints provide integration points for Odyssey-specific planner operations.

---

## Error Responses

All error responses follow a consistent format:

```json
{
  "errorCodeType": "PROVIDED_EMAIL_ID_NOT_EXIST",
  "httpRequestId": "req-12345-67890",
  "message": "The provided email ID does not exist",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes

- `PROVIDED_EMAIL_ID_NOT_EXIST`: The specified email user ID was not found
- `PROVIDED_PARAMETER_IS_INVALID`: One or more request parameters are invalid
- `VALIDATION_ERROR`: Request validation failed
- `INTERNAL_SERVER_ERROR`: Unexpected server error occurred

---

## Rate Limiting

API requests are subject to rate limiting based on API key. Specific limits depend on the client's service tier and usage patterns.

---

## Pagination

For endpoints that return lists of data, pagination is supported through standard query parameters:

- `page` (Integer) - Page number (1-based)
- `size` (Integer) - Number of items per page (default: 20, max: 100)

Paginated responses include metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## Field Selection

Many endpoints support selective field fetching to optimize response size and performance. Use the `fetchedFields` query parameter to specify which fields to include in the response.

Example:
```
GET /planners?fetchedFields=emailUserId,firstName,lastName
```

This returns only the specified fields, reducing bandwidth and improving response times for large datasets.
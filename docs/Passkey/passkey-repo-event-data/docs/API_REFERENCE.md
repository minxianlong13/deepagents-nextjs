# API Reference

## Base URL

The service is deployed at different URLs based on environment:
- **Development**: `https://dev-passkey-event-data.cvent.com`
- **Staging**: `https://staging-passkey-event-data.cvent.com`
- **Production**: `https://passkey-event-data.cvent.com`

All API endpoints are prefixed with: `/passkey-event-data/v1/participants/{participantId}/event-requests`

## Authentication

All endpoints require API key authentication using the `Authorization` header:

```
Authorization: Bearer <api-key>
```

The service integrates with Cvent's centralized authentication service for token validation.

## Common Parameters

### Path Parameters
- `participantId` (Long, required) - The ID of the participant who owns the event requests

### Query Parameters
- `requestType` (String, optional) - Type of request. Default: `ROOM_LIST`. Values: `ROOM_LIST`, `GML`
- `status` (String, optional) - Status filter. Default: `ALL`. See Status Values section below
- `limit` (Integer, optional) - Maximum number of results to return. Default: `250`
- `sortBy` (String, optional) - Field to sort by
- `sortDirection` (String, optional) - Sort direction. Values: `ASC`, `DESC`

### Status Values

#### Individual Status Types
- `PENDING` - Request is pending processing
- `IN_PROGRESS` - Request is currently being processed
- `COMPLETED` - Request has been completed successfully
- `FAILED` - Request processing failed
- `CANCELLED` - Request was cancelled

#### Group Status Types (Search endpoint only)
- `ALL` - All requests regardless of status
- `ACTIVE` - All active requests (pending, in progress)
- `FINISHED` - All finished requests (completed, failed, cancelled)

## Endpoints

### Room List Event Requests

#### Create Room List Event Request

**POST** `/passkey-event-data/v1/participants/{participantId}/event-requests/roomlist`

Creates a new room list event request.

**Path Parameters**:
- `participantId` (Long, required) - Participant ID

**Request Body**:
```json
{
  "fileId": "string",
  "fileName": "string",
  "status": "PENDING",
  "eventId": "string",
  "eventName": "string",
  "requestedBy": "string",
  "requestedDate": "2024-01-15T10:30:00Z",
  "metadata": {
    "additionalProperty": "value"
  }
}
```

**Response** (201 Created):
```json
{
  "fileId": "string",
  "fileName": "string",
  "status": "PENDING",
  "eventId": "string",
  "eventName": "string",
  "requestedBy": "string",
  "requestedDate": "2024-01-15T10:30:00Z",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModifiedDate": "2024-01-15T10:30:00Z",
  "metadata": {
    "additionalProperty": "value"
  }
}
```

**Status Codes**:
- 201: Created successfully
- 400: Bad request (invalid input, group status type used)
- 401: Unauthorized
- 422: Validation error

#### Get Room List Event Request

**GET** `/passkey-event-data/v1/participants/{participantId}/event-requests/roomlist/{fileId}`

Retrieves a specific room list event request.

**Path Parameters**:
- `participantId` (Long, required) - Participant ID
- `fileId` (String, required) - File ID of the request

**Query Parameters**:
- `requestType` (String, optional) - Default: `ROOM_LIST`

**Response** (200 OK):
```json
{
  "fileId": "string",
  "fileName": "string",
  "status": "COMPLETED",
  "eventId": "string",
  "eventName": "string",
  "requestedBy": "string",
  "requestedDate": "2024-01-15T10:30:00Z",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModifiedDate": "2024-01-15T10:35:00Z",
  "metadata": {
    "additionalProperty": "value"
  }
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Event request not found

#### Update Room List Event Request

**PATCH** `/passkey-event-data/v1/participants/{participantId}/event-requests/roomlist/{fileId}`

Updates specific fields of a room list event request.

**Path Parameters**:
- `participantId` (Long, required) - Participant ID
- `fileId` (String, required) - File ID of the request

**Request Body**:
```json
{
  "status": "IN_PROGRESS",
  "eventName": "Updated Event Name",
  "metadata": {
    "updatedProperty": "newValue"
  }
}
```

**Response** (200 OK):
```json
{
  "fileId": "string",
  "fileName": "string",
  "status": "IN_PROGRESS",
  "eventId": "string",
  "eventName": "Updated Event Name",
  "requestedBy": "string",
  "requestedDate": "2024-01-15T10:30:00Z",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModifiedDate": "2024-01-15T11:00:00Z",
  "metadata": {
    "updatedProperty": "newValue"
  }
}
```

**Status Codes**:
- 200: Updated successfully
- 400: Bad request (group status type used)
- 401: Unauthorized
- 404: Event request not found

#### Delete Room List Event Request

**DELETE** `/passkey-event-data/v1/participants/{participantId}/event-requests/roomlist/{fileId}`

Deletes a room list event request.

**Path Parameters**:
- `participantId` (Long, required) - Participant ID
- `fileId` (String, required) - File ID of the request

**Response** (204 No Content)

**Status Codes**:
- 204: Deleted successfully
- 401: Unauthorized
- 404: Event request not found

### GML Event Requests

#### Create GML Event Request

**POST** `/passkey-event-data/v1/participants/{participantId}/event-requests/gml`

Creates a new GML (Group Meeting List) event request.

**Path Parameters**:
- `participantId` (Long, required) - Participant ID

**Request Body**:
```json
{
  "glCode": "string",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "eventId": "string",
  "eventName": "string",
  "requestedBy": "string",
  "requestedDate": "2024-01-15T10:30:00Z",
  "metadata": {
    "additionalProperty": "value"
  }
}
```

**Response** (201 Created):
```json
{
  "glCode": "string",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "eventId": "string",
  "eventName": "string",
  "requestedBy": "string",
  "requestedDate": "2024-01-15T10:30:00Z",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModifiedDate": "2024-01-15T10:30:00Z",
  "metadata": {
    "additionalProperty": "value"
  }
}
```

**Status Codes**:
- 201: Created successfully
- 400: Bad request (invalid input, group status type used)
- 401: Unauthorized
- 422: Validation error

#### Get GML Event Request

**GET** `/passkey-event-data/v1/participants/{participantId}/event-requests/gml/{glCode}/uuid/{uuid}`

Retrieves a specific GML event request.

**Path Parameters**:
- `participantId` (Long, required) - Participant ID
- `glCode` (String, required) - GML code
- `uuid` (UUID, required) - Unique identifier for the request

**Response** (200 OK):
```json
{
  "glCode": "string",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "eventId": "string",
  "eventName": "string",
  "requestedBy": "string",
  "requestedDate": "2024-01-15T10:30:00Z",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModifiedDate": "2024-01-15T10:35:00Z",
  "metadata": {
    "additionalProperty": "value"
  }
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Event request not found

#### Update GML Event Request

**PATCH** `/passkey-event-data/v1/participants/{participantId}/event-requests/gml/{glCode}/uuid/{uuid}`

Updates specific fields of a GML event request.

**Path Parameters**:
- `participantId` (Long, required) - Participant ID
- `glCode` (String, required) - GML code
- `uuid` (UUID, required) - Unique identifier for the request

**Request Body**:
```json
{
  "status": "IN_PROGRESS",
  "eventName": "Updated Event Name",
  "metadata": {
    "updatedProperty": "newValue"
  }
}
```

**Response** (200 OK):
```json
{
  "glCode": "string",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "IN_PROGRESS",
  "eventId": "string",
  "eventName": "Updated Event Name",
  "requestedBy": "string",
  "requestedDate": "2024-01-15T10:30:00Z",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModifiedDate": "2024-01-15T11:00:00Z",
  "metadata": {
    "updatedProperty": "newValue"
  }
}
```

**Status Codes**:
- 200: Updated successfully
- 400: Bad request (group status type used)
- 401: Unauthorized
- 404: Event request not found

#### Delete GML Event Request

**DELETE** `/passkey-event-data/v1/participants/{participantId}/event-requests/gml/{glCode}/uuid/{uuid}`

Deletes a GML event request.

**Path Parameters**:
- `participantId` (Long, required) - Participant ID
- `glCode` (String, required) - GML code
- `uuid` (UUID, required) - Unique identifier for the request

**Response** (204 No Content)

**Status Codes**:
- 204: Deleted successfully
- 401: Unauthorized
- 404: Event request not found

### Search Event Requests

#### Search Event Requests

**GET** `/passkey-event-data/v1/participants/{participantId}/event-requests`

Retrieves all event requests for a participant with optional filtering and sorting.

**Path Parameters**:
- `participantId` (Long, required) - Participant ID

**Query Parameters**:
- `requestType` (String, optional) - Default: `ROOM_LIST`. Values: `ROOM_LIST`, `GML`
- `status` (String, optional) - Default: `ALL`. Supports both individual and group status types
- `limit` (Integer, optional) - Default: `250`. Maximum number of results
- `sortBy` (String, optional) - Field to sort by
- `sortDirection` (String, optional) - Values: `ASC`, `DESC`

**Response** (200 OK):
```json
{
  "eventRequests": [
    {
      "fileId": "string",
      "fileName": "string",
      "status": "COMPLETED",
      "eventId": "string",
      "eventName": "string",
      "requestedBy": "string",
      "requestedDate": "2024-01-15T10:30:00Z",
      "createdDate": "2024-01-15T10:30:00Z",
      "lastModifiedDate": "2024-01-15T10:35:00Z",
      "metadata": {
        "additionalProperty": "value"
      }
    }
  ],
  "totalCount": 1,
  "allTotalCount": 1,
  "hasMore": false,
  "sortBy": "createdDate",
  "sortDirection": "DESC"
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: No event requests found

## Health Check

#### Service Health Check

**GET** `/healthcheck`

Returns the health status of the service.

**Response** (200 OK):
```json
{
  "passkey-event-data-service": {
    "healthy": true
  },
  "deadlocks": {
    "healthy": true
  }
}
```

## Error Responses

All error responses follow a consistent format:

```json
{
  "code": 400,
  "message": "Bad Request",
  "details": "Group status types (like ACTIVE) can only be used with the search endpoint"
}
```

### Common Error Codes

- **400 Bad Request**: Invalid input data or group status type used incorrectly
- **401 Unauthorized**: Missing or invalid API key
- **404 Not Found**: Event request not found
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server-side error

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Rate Limit**: 1000 requests per minute per API key
- **Headers**: Rate limit information is returned in response headers:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Examples

### Create a Room List Event Request

```bash
curl -X POST \
  https://passkey-event-data.cvent.com/passkey-event-data/v1/participants/12345/event-requests/roomlist \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "fileId": "file-123",
    "fileName": "hotel-rooms.xlsx",
    "status": "PENDING",
    "eventId": "event-456",
    "eventName": "Annual Conference 2024",
    "requestedBy": "john.doe@example.com",
    "requestedDate": "2024-01-15T10:30:00Z"
  }'
```

### Search Event Requests

```bash
curl -X GET \
  'https://passkey-event-data.cvent.com/passkey-event-data/v1/participants/12345/event-requests?status=ACTIVE&limit=50&sortBy=createdDate&sortDirection=DESC' \
  -H 'Authorization: Bearer your-api-key'
```

### Update Event Request Status

```bash
curl -X PATCH \
  https://passkey-event-data.cvent.com/passkey-event-data/v1/participants/12345/event-requests/roomlist/file-123 \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "COMPLETED"
  }'
```
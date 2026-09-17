# API Reference

## Base URL
`https://api.cvent.com/passkey-vendor/v1`

## Authentication
All endpoints require API key authentication via the `Authorization` header:
```
Authorization: Bearer <api-key>
```

## Common Parameters

### fetchExtras Query Parameter
Many endpoints support an optional `fetchExtras` parameter to control which additional data is returned:

- `associatedHotels`: Include associated hotel information
- `hotelConnector`: Include hotel connector details
- `partnerMessageTypes`: Include partner message type configurations
- `transporterParameters`: Include transporter parameter settings (default)
- `transporterTypes`: Include transporter type information
- `none`: Exclude all extra data

**Example**: `?fetchExtras=hotelConnector,transporterParameters`

## Vendor Endpoints

### GET /vendors
Find vendors by search criteria.

**Query Parameters**:
- `vendorId` (optional): Filter by vendor ID
- `name` (optional): Filter by vendor name

**Response**:
```json
[
  {
    "vendorId": 123,
    "name": "Example Vendor",
    "description": "Vendor description"
  }
]
```

**Status Codes**:
- 200: Success
- 400: Invalid search criteria
- 401: Unauthorized
- 500: Internal server error

## Vendor System Endpoints

### GET /vendor-systems
Find vendor systems by search criteria.

**Query Parameters**:
- `vendorSystemId` (optional): Filter by vendor system ID
- `vendorId` (optional): Filter by vendor ID
- `hotelId` (optional): Filter by hotel ID
- `chainCode` (optional): Filter by hotel chain code
- `hotelCode` (optional): Filter by hotel code
- `fetchExtras` (optional): Additional data to include

**Response**:
```json
[
  {
    "vendorSystemId": 456,
    "vendorId": 123,
    "name": "Example Vendor System",
    "authorizedPartnerId": 789,
    "outboundTransporterClass": "com.example.Transporter",
    "outboundBatchSize": 100,
    "outboundMaxRetries": 3,
    "outboundRetryInterval": 300,
    "contactEmail": "support@example.com",
    "timedOutRetry": true,
    "unableToConnectRetry": true,
    "transporterFailureRetry": false,
    "internalErrorRetry": true,
    "otherRejectionsRetry": false,
    "gmlEnabled": true,
    "outboundReservationTimeoutInterval": 30,
    "outboundSuspended": false,
    "inboundSuspended": false,
    "vendor": {
      "vendorId": 123,
      "name": "Example Vendor"
    },
    "transporterParameters": [
      {
        "name": "endpoint_url",
        "value": "https://api.example.com/v1"
      }
    ],
    "hotelConnector": {
      "hotelId": 12345,
      "chainCode": "EX",
      "hotelCode": "EXMPL",
      "brandCode": "EX"
    }
  }
]
```

**Status Codes**:
- 200: Success
- 400: No search criteria provided or invalid criteria
- 401: Unauthorized
- 500: Internal server error

### GET /vendor-systems/{id}
Get a specific vendor system by ID.

**Path Parameters**:
- `id`: Vendor system ID (required)

**Query Parameters**:
- `fetchExtras` (optional): Additional data to include

**Response**:
```json
{
  "vendorSystemId": 456,
  "vendorId": 123,
  "name": "Example Vendor System",
  "authorizedPartnerId": 789,
  "outboundTransporterClass": "com.example.Transporter",
  "outboundBatchSize": 100,
  "outboundMaxRetries": 3,
  "outboundRetryInterval": 300,
  "contactEmail": "support@example.com",
  "timedOutRetry": true,
  "unableToConnectRetry": true,
  "transporterFailureRetry": false,
  "internalErrorRetry": true,
  "otherRejectionsRetry": false,
  "gmlEnabled": true,
  "outboundReservationTimeoutInterval": 30,
  "outboundSuspended": false,
  "inboundSuspended": false
}
```

**Status Codes**:
- 200: Success
- 404: Vendor system not found
- 401: Unauthorized
- 500: Internal server error

### GET /vendor-systems/hotelId/{hotelId}
Get vendor system by hotel ID.

**Path Parameters**:
- `hotelId`: Hotel ID (required)

**Query Parameters**:
- `fetchExtras` (optional): Additional data to include

**Response**: Same as GET /vendor-systems/{id}

**Status Codes**:
- 200: Success
- 404: Vendor system not found for hotel
- 401: Unauthorized
- 500: Internal server error

### GET /vendor-systems/{vendorSystemId}/hotelId/{hotelId}
Get vendor system by both vendor system ID and hotel ID.

**Path Parameters**:
- `vendorSystemId`: Vendor system ID (required)
- `hotelId`: Hotel ID (required)

**Query Parameters**:
- `fetchExtras` (optional): Additional data to include

**Response**: Same as GET /vendor-systems/{id}

**Status Codes**:
- 200: Success
- 404: Vendor system not found
- 401: Unauthorized
- 500: Internal server error

## Hotel Connector Endpoints

### GET /vendor-systems/{vendorSystemId}/hotel-connectors
Get hotel connectors for a vendor system.

**Path Parameters**:
- `vendorSystemId`: Vendor system ID (required)

**Query Parameters**:
- `chainCode` (optional): Filter by chain code
- `hotelCode` (optional): Filter by hotel code
- `brandCode` (optional): Filter by brand code

**Response**:
```json
[
  {
    "hotelId": 12345,
    "chainCode": "EX",
    "hotelCode": "EXMPL",
    "brandCode": "EX",
    "glCode": "GL001"
  }
]
```

**Status Codes**:
- 200: Success
- 404: Vendor system not found
- 401: Unauthorized
- 500: Internal server error

## Hotel Mapping Endpoints

### GET /hotel-mappings
Get integrated hotels by search criteria.

**Query Parameters**:
- `hotelCode` (required): Hotel code to search for
- `chainCode` (optional): Filter by chain code
- `brandCode` (optional): Filter by brand code

**Response**:
```json
[
  {
    "hotelId": 12345,
    "vendorSystemId": 456,
    "chainCode": "EX",
    "hotelCode": "EXMPL",
    "brandCode": "EX",
    "integrationStatus": "ACTIVE"
  }
]
```

**Status Codes**:
- 200: Success
- 400: Hotel code is required
- 401: Unauthorized
- 500: Internal server error

### GET /vendor-systems/{vendorSystemId}/hotel-mappings
Get integrated hotels for a specific vendor system.

**Path Parameters**:
- `vendorSystemId`: Vendor system ID (required)

**Query Parameters**:
- `chainCode` (optional): Filter by chain code
- `hotelCode` (optional): Filter by hotel code
- `brandCode` (optional): Filter by brand code

**Response**: Same as GET /hotel-mappings

**Status Codes**:
- 200: Success
- 404: Vendor system not found
- 401: Unauthorized
- 500: Internal server error

## Assignment Endpoints

### POST /vendor-systems/assign
Assign hotels to a vendor system.

**Request Body**:
```json
{
  "vendorSystemId": 456,
  "hotelIds": [12345, 12346, 12347],
  "assignmentType": "FULL",
  "effectiveDate": "2024-01-01T00:00:00Z"
}
```

**Response**:
```json
{
  "successfulAssignments": [12345, 12346],
  "failedAssignments": [
    {
      "hotelId": 12347,
      "errorCode": "ALREADY_ASSIGNED",
      "errorMessage": "Hotel is already assigned to another vendor system"
    }
  ]
}
```

**Status Codes**:
- 200: Assignment completed (may include partial failures)
- 204: All assignments successful
- 400: Invalid request body
- 401: Unauthorized
- 500: Internal server error

### POST /vendor-systems/unassign
Unassign hotels from a vendor system.

**Request Body**:
```json
{
  "vendorSystemId": 456,
  "hotelIds": [12345, 12346],
  "unassignmentType": "IMMEDIATE",
  "effectiveDate": "2024-01-01T00:00:00Z"
}
```

**Response**: 204 No Content on success

**Status Codes**:
- 204: Unassignment successful
- 400: Invalid request body
- 401: Unauthorized
- 500: Internal server error

## Message Type Endpoints

### GET /message-types
Get available message types.

**Query Parameters**:
- `includeDisabled` (optional): Include disabled message types (default: false)
- `offset` (optional): Pagination offset (default: 0)
- `limit` (optional): Pagination limit

**Response**:
```json
{
  "totalCount": 25,
  "data": [
    {
      "messageTypeId": 1,
      "name": "RESERVATION_CREATE",
      "description": "Create new reservation",
      "enabled": true,
      "category": "RESERVATION"
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 500: Internal server error

### GET /partner-message-types
Get partner-specific message types.

**Query Parameters**:
- `includeDisabled` (optional): Include disabled message types (default: false)
- `offset` (optional): Pagination offset (default: 0)
- `limit` (optional): Pagination limit

**Response**:
```json
{
  "totalCount": 15,
  "data": [
    {
      "partnerMessageTypeId": 1,
      "partnerId": 123,
      "messageTypeId": 1,
      "enabled": true,
      "configuration": {
        "timeout": 30,
        "retryCount": 3
      }
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 500: Internal server error

## V2 API Endpoints

### GET /passkey-vendor/v2/vendor-systems/hotelId/{hotelId}
Get all vendor systems for a hotel (V2 returns list instead of single object).

**Path Parameters**:
- `hotelId`: Hotel ID (required)

**Query Parameters**:
- `fetchExtras` (optional): Additional data to include

**Response**:
```json
[
  {
    "vendorSystemId": 456,
    "vendorId": 123,
    "name": "Primary Vendor System"
  },
  {
    "vendorSystemId": 457,
    "vendorId": 124,
    "name": "Secondary Vendor System"
  }
]
```

### GET /passkey-vendor/v2/vendor-systems/{vendorSystemId}/hotelId/{hotelId}
Get all vendor systems by vendor system ID and hotel ID (V2 returns list).

**Path Parameters**:
- `vendorSystemId`: Vendor system ID (required)
- `hotelId`: Hotel ID (required)

**Query Parameters**:
- `fetchExtras` (optional): Additional data to include

**Response**: Array of vendor systems (same structure as V2 hotel endpoint)

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "VENDOR_SYSTEM_NOT_FOUND",
    "message": "Vendor system with ID 456 not found",
    "details": {
      "vendorSystemId": 456,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

## Rate Limiting

API requests are subject to rate limiting:
- **Rate Limit**: 1000 requests per minute per API key
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Pagination

Endpoints that return lists support pagination:
- `offset`: Starting position (0-based)
- `limit`: Maximum number of results (default: 50, max: 100)

Response includes pagination metadata:
```json
{
  "totalCount": 150,
  "offset": 0,
  "limit": 50,
  "data": [...]
}
```
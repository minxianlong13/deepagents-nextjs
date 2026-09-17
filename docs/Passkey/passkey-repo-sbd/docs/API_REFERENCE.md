# API Reference

## Base URL

**Development**: `https://dev-rlm.passkey.com/dashboard`
**Staging**: `https://staging-rlm.passkey.com/dashboard`
**Production**: `https://rlm.passkey.com/dashboard`

## Authentication

All API endpoints require authentication via JWT tokens issued by the passkey-authentication-service.

**Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## GraphQL Endpoint

### POST /api/graphql

**Description**: Main GraphQL endpoint for dashboard operations

**Request Body**:
```json
{
  "query": "query GetSubBlocks { subBlocks { id name status roomCount } }",
  "variables": {},
  "operationName": "GetSubBlocks"
}
```

**Response**:
```json
{
  "data": {
    "subBlocks": [
      {
        "id": "sb-123",
        "name": "Conference Block A",
        "status": "ACTIVE",
        "roomCount": 50
      }
    ]
  }
}
```

## REST Endpoints

### Sub-Block Management

#### GET /api/v1/subblocks

**Description**: Retrieve all sub-blocks for the authenticated user's organization

**Query Parameters**:
- `status` (optional) - Filter by status: `ACTIVE`, `INACTIVE`, `PENDING`
- `hotelId` (optional) - Filter by hotel ID
- `page` (optional) - Page number for pagination (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response**:
```json
{
  "data": [
    {
      "id": "sb-123",
      "name": "Conference Block A",
      "hotelId": "hotel-456",
      "hotelName": "Grand Hotel",
      "status": "ACTIVE",
      "roomCount": 50,
      "availableRooms": 35,
      "startDate": "2024-03-15",
      "endDate": "2024-03-18",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-02-01T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 403: Forbidden
- 500: Internal Server Error

#### GET /api/v1/subblocks/{id}

**Description**: Retrieve a specific sub-block by ID

**Path Parameters**:
- `id` - Sub-block identifier

**Response**:
```json
{
  "data": {
    "id": "sb-123",
    "name": "Conference Block A",
    "description": "Main conference room block",
    "hotelId": "hotel-456",
    "hotelName": "Grand Hotel",
    "status": "ACTIVE",
    "roomCount": 50,
    "availableRooms": 35,
    "reservedRooms": 15,
    "startDate": "2024-03-15",
    "endDate": "2024-03-18",
    "roomTypes": [
      {
        "type": "STANDARD",
        "count": 30,
        "available": 20
      },
      {
        "type": "SUITE",
        "count": 20,
        "available": 15
      }
    ],
    "pricing": {
      "baseRate": 150.00,
      "currency": "USD"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-02-01T14:20:00Z"
  }
}
```

**Status Codes**:
- 200: Success
- 404: Sub-block not found
- 401: Unauthorized
- 403: Forbidden

#### POST /api/v1/subblocks

**Description**: Create a new sub-block

**Request Body**:
```json
{
  "name": "New Conference Block",
  "description": "Block for annual conference",
  "hotelId": "hotel-456",
  "roomCount": 75,
  "startDate": "2024-06-15",
  "endDate": "2024-06-18",
  "roomTypes": [
    {
      "type": "STANDARD",
      "count": 50
    },
    {
      "type": "SUITE",
      "count": 25
    }
  ],
  "pricing": {
    "baseRate": 175.00,
    "currency": "USD"
  }
}
```

**Response**:
```json
{
  "data": {
    "id": "sb-789",
    "name": "New Conference Block",
    "status": "PENDING",
    "createdAt": "2024-02-15T09:15:00Z"
  }
}
```

**Status Codes**:
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 422: Validation Error

#### PUT /api/v1/subblocks/{id}

**Description**: Update an existing sub-block

**Path Parameters**:
- `id` - Sub-block identifier

**Request Body**:
```json
{
  "name": "Updated Conference Block",
  "roomCount": 80,
  "status": "ACTIVE"
}
```

**Response**:
```json
{
  "data": {
    "id": "sb-123",
    "name": "Updated Conference Block",
    "status": "ACTIVE",
    "updatedAt": "2024-02-15T11:30:00Z"
  }
}
```

**Status Codes**:
- 200: Success
- 400: Bad Request
- 404: Not Found
- 401: Unauthorized
- 403: Forbidden

#### DELETE /api/v1/subblocks/{id}

**Description**: Delete a sub-block (soft delete)

**Path Parameters**:
- `id` - Sub-block identifier

**Response**:
```json
{
  "message": "Sub-block successfully deleted",
  "deletedAt": "2024-02-15T12:00:00Z"
}
```

**Status Codes**:
- 200: Success
- 404: Not Found
- 401: Unauthorized
- 403: Forbidden
- 409: Conflict (cannot delete active block with reservations)

### Hotel Management

#### GET /api/v1/hotels

**Description**: Retrieve available hotels for sub-block creation

**Query Parameters**:
- `city` (optional) - Filter by city
- `country` (optional) - Filter by country
- `search` (optional) - Search by hotel name

**Response**:
```json
{
  "data": [
    {
      "id": "hotel-456",
      "name": "Grand Hotel",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "zipCode": "10001"
      },
      "amenities": ["WIFI", "POOL", "GYM"],
      "starRating": 4
    }
  ]
}
```

### Reporting Endpoints

#### GET /api/v1/reports/occupancy

**Description**: Get occupancy reports for sub-blocks

**Query Parameters**:
- `startDate` - Report start date (YYYY-MM-DD)
- `endDate` - Report end date (YYYY-MM-DD)
- `hotelId` (optional) - Filter by hotel
- `format` (optional) - Response format: `json`, `csv` (default: json)

**Response**:
```json
{
  "data": {
    "period": {
      "startDate": "2024-02-01",
      "endDate": "2024-02-29"
    },
    "summary": {
      "totalRooms": 1500,
      "occupiedRooms": 1200,
      "occupancyRate": 80.0
    },
    "daily": [
      {
        "date": "2024-02-01",
        "totalRooms": 1500,
        "occupiedRooms": 1100,
        "occupancyRate": 73.3
      }
    ]
  }
}
```

## WebSocket Endpoints

### Real-time Updates

#### /ws/subblocks

**Description**: WebSocket connection for real-time sub-block updates

**Connection**: `wss://dev-rlm.passkey.com/dashboard/ws/subblocks`

**Message Format**:
```json
{
  "type": "SUBBLOCK_UPDATE",
  "data": {
    "id": "sb-123",
    "availableRooms": 34,
    "updatedAt": "2024-02-15T13:45:00Z"
  }
}
```

**Message Types**:
- `SUBBLOCK_UPDATE`: Room availability changes
- `RESERVATION_CREATED`: New reservation made
- `RESERVATION_CANCELLED`: Reservation cancelled
- `STATUS_CHANGE`: Sub-block status changed

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "roomCount",
        "message": "Room count must be greater than 0"
      }
    ],
    "timestamp": "2024-02-15T10:30:00Z",
    "requestId": "req-12345"
  }
}
```

### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `AUTHORIZATION_DENIED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `CONFLICT`: Resource conflict (e.g., duplicate name)
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: External service unavailable

## Rate Limiting

- **Standard Endpoints**: 100 requests per minute per user
- **Reporting Endpoints**: 10 requests per minute per user
- **WebSocket Connections**: 5 concurrent connections per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708000800
```
# API Reference

## Base URL
`https://passkey-inventory-service.{environment}.cvent.org`

## Authentication
All endpoints require authentication via:
- **API Key**: `X-API-Key` header
- **Bearer Token**: `Authorization: Bearer {token}` header

## Endpoints

### Inventory Management

#### POST /inventory/locks
**Description**: Lock inventory range for a block to prevent concurrent modifications

**Request Body**:
```json
{
  "blockId": 12345,
  "arrivalDate": "2024-03-15",
  "departureDate": "2024-03-18",
  "numberOfRooms": 5
}
```

**Response**: `204 No Content`

**Status Codes**:
- 204: Lock successfully created
- 400: Invalid request parameters
- 401: Unauthorized
- 409: Inventory already locked

---

#### GET /inventory/availability/{groupTypeId}
**Description**: Get availability for blocks filtered by dates

**Path Parameters**:
- `groupTypeId` - Group type identifier

**Query Parameters**:
- `arrivalDate` - ISO date (YYYY-MM-DD)
- `departureDate` - ISO date (YYYY-MM-DD)
- `blockId` - Block identifier (optional)

**Response**:
```json
[
  {
    "blockId": 12345,
    "hotelId": 67890,
    "roomTypeId": 101,
    "availableRooms": 25,
    "totalRooms": 50,
    "inventoryDate": "2024-03-15"
  }
]
```

**Status Codes**:
- 200: Success
- 400: Invalid date format
- 404: No availability found

---

#### GET /inventory/availability/events/{eventId}/hotels/{hotelId}
**Description**: Get event hotel availability with filtering and pagination

**Path Parameters**:
- `eventId` - Event identifier
- `hotelId` - Hotel identifier

**Query Parameters**:
- `limit` - Results per page (1-100, default: 25)
- `offset` - Offset from start (default: 0)
- `filter` - Filter expression

**Response**:
```json
{
  "totalCount": 150,
  "data": [
    {
      "roomTypeId": 101,
      "roomTypeName": "Standard King",
      "availableRooms": 15,
      "totalRooms": 30,
      "inventoryDate": "2024-03-15"
    }
  ]
}
```

---

#### GET /inventory/events/{eventId}/room-types-inventory
**Description**: Get room type inventory for an event

**Path Parameters**:
- `eventId` - Event identifier

**Query Parameters**:
- `filter` - Filter expression
- `limit` - Results per page (1-100, default: 25)
- `offset` - Offset from start (default: 0)

**Response**:
```json
{
  "totalCount": 75,
  "data": [
    {
      "eventId": 12345,
      "hotelId": 67890,
      "roomTypeId": 101,
      "inventoryDate": "2024-03-15",
      "totalRooms": 50,
      "availableRooms": 25,
      "blockedRooms": 20,
      "reservedRooms": 5
    }
  ]
}
```

---

#### GET /inventory/events/{eventId}/hotels/{hotelId}/room-types/{roomTypeId}
**Description**: Get specific room type inventory

**Path Parameters**:
- `eventId` - Event identifier
- `hotelId` - Hotel identifier
- `roomTypeId` - Room type identifier

**Query Parameters**:
- `filter` - Filter expression
- `limit` - Results per page (1-100, default: 25)
- `offset` - Offset from start (default: 0)

**Response**:
```json
{
  "totalCount": 30,
  "data": [
    {
      "inventoryDate": "2024-03-15",
      "totalRooms": 50,
      "availableRooms": 25,
      "blockedRooms": 20,
      "reservedRooms": 5,
      "rate": 199.99
    }
  ]
}
```

---

### Block Operations

#### GET /inventory/blocks/{blockId}
**Description**: Get inventory for a specific block

**Path Parameters**:
- `blockId` - Block identifier

**Query Parameters**:
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `env` - Environment (optional)

**Response**:
```json
[
  {
    "blockId": 12345,
    "inventoryDate": "2024-03-15",
    "totalRooms": 50,
    "availableRooms": 25,
    "reservedRooms": 20,
    "blockedRooms": 5
  }
]
```

---

#### GET /inventory/{blockId}
**Description**: Get inventory with required date range

**Path Parameters**:
- `blockId` - Block identifier

**Query Parameters**:
- `inventoryDateFrom` - Start date (required, ISO format)
- `inventoryDateTo` - End date (required, ISO format)
- `env` - Environment (optional)

**Response**:
```json
[
  {
    "blockId": 12345,
    "hotelId": 67890,
    "roomTypeId": 101,
    "inventoryDate": "2024-03-15",
    "totalInventory": 50,
    "availableInventory": 25,
    "reservedInventory": 20,
    "blockedInventory": 5
  }
]
```

---

#### PUT /inventory/blocks/{blockId}
**Description**: Add inventory to a block

**Path Parameters**:
- `blockId` - Block identifier

**Request Body**:
```json
[
  {
    "inventoryDate": "2024-03-15",
    "roomTypeId": 101,
    "numberOfRooms": 25,
    "rate": 199.99
  }
]
```

**Response**: `204 No Content`

---

#### DELETE /inventory/blocks/{blockId}
**Description**: Remove inventory from a block

**Path Parameters**:
- `blockId` - Block identifier

**Query Parameters**:
- `inventoryDate` - Inventory dates to remove (multiple allowed)

**Response**: `204 No Content`

---

### Reservation Processing

#### PATCH /inventory/request/{blockId}/reservations/{resId}
**Description**: Request inventory for a reservation

**Path Parameters**:
- `blockId` - Block identifier
- `resId` - Reservation identifier

**Query Parameters**:
- `arrivalDate` - Arrival date (ISO format)
- `departureDate` - Departure date (ISO format)
- `numberOfRooms` - Number of rooms requested
- `modify` - Is modification (boolean)
- `waitList` - Is waitlist request (boolean)
- `env` - Environment (optional)

**Response**:
```json
{
  "success": true,
  "reservationId": 98765,
  "allocatedRooms": 3,
  "totalCost": 599.97
}
```

---

#### PATCH /inventory/modify
**Description**: Modify existing inventory request

**Request Body**:
```json
{
  "reservationId": 98765,
  "blockId": 12345,
  "originalArrivalDate": "2024-03-15",
  "originalDepartureDate": "2024-03-18",
  "newArrivalDate": "2024-03-16",
  "newDepartureDate": "2024-03-19",
  "originalRooms": 2,
  "newRooms": 3
}
```

**Response**:
```json
{
  "totalCost": 899.97,
  "costDifference": 299.98
}
```

---

#### PATCH /inventory/release/{blockId}
**Description**: Release inventory for a block

**Path Parameters**:
- `blockId` - Block identifier

**Query Parameters**:
- `resId` - Reservation ID (default: 0)
- `arrivalDate` - Arrival date (ISO format)
- `departureDate` - Departure date (ISO format)
- `numberOfRooms` - Number of rooms to release
- `waitList` - Is waitlist release (boolean)
- `env` - Environment (optional)

**Response**:
```json
{
  "success": true,
  "releasedRooms": 2
}
```

---

### Room Type Operations

#### PUT /inventory/room-types
**Description**: Add or update room type inventory

**Request Body**:
```json
[
  {
    "eventId": 12345,
    "hotelId": 67890,
    "roomTypeId": 101,
    "inventoryDate": "2024-03-15",
    "totalRooms": 50,
    "rate": 199.99
  }
]
```

**Response**: `204 No Content`

---

#### DELETE /inventory/room-types
**Description**: Delete room type inventory

**Request Body**:
```json
[
  {
    "eventId": 12345,
    "hotelId": 67890,
    "roomTypeId": 101,
    "inventoryDate": "2024-03-15"
  }
]
```

**Response**: `204 No Content`

---

#### POST /inventory/room-types/search
**Description**: Search room type inventory

**Query Parameters**:
- `fetchedFields` - Fields to include in response

**Request Body**:
```json
{
  "eventId": 12345,
  "hotelId": 67890,
  "roomTypeIds": [101, 102],
  "startDate": "2024-03-15",
  "endDate": "2024-03-18"
}
```

**Response**:
```json
[
  {
    "eventId": 12345,
    "hotelId": 67890,
    "roomTypeId": 101,
    "inventoryDate": "2024-03-15",
    "totalRooms": 50,
    "availableRooms": 25,
    "rate": 199.99
  }
]
```

---

### Analytics and Reporting

#### GET /inventory/events/{eventId}/hotels/{hotelId}/room-types/{roomTypeId}/breakdown
**Description**: Get inventory breakdown for analysis

**Path Parameters**:
- `eventId` - Event identifier
- `hotelId` - Hotel identifier
- `roomTypeId` - Room type identifier

**Query Parameters**:
- `startDate` - Start date (optional)
- `endDate` - End date (optional)

**Response**:
```json
[
  {
    "inventoryDate": "2024-03-15",
    "totalRooms": 50,
    "availableRooms": 25,
    "reservedRooms": 20,
    "blockedRooms": 5,
    "pickupRate": 0.4,
    "occupancyRate": 0.5
  }
]
```

---

#### GET /inventory/blocks/{blockId}/summary
**Description**: Get block summary information

**Path Parameters**:
- `blockId` - Block identifier

**Response**:
```json
{
  "blockId": 12345,
  "totalRooms": 100,
  "reservedRooms": 45,
  "availableRooms": 55,
  "pickupRate": 0.45,
  "totalRevenue": 8999.55
}
```

---

### Administrative Operations

#### PUT /inventory/hotel-primary/{hotelId}
**Description**: Update hotel primary inventory records

**Path Parameters**:
- `hotelId` - Hotel identifier

**Request Body**:
```json
{
  "rooms": [
    {
      "roomTypeId": 101,
      "inventoryDate": "2024-03-15",
      "totalRooms": 50,
      "rate": 199.99
    }
  ]
}
```

**Response**: `204 No Content`

---

#### GET /inventory/events/{eventId}/hotels/{hotelId}
**Description**: Get hotel base inventory

**Path Parameters**:
- `eventId` - Event identifier
- `hotelId` - Hotel identifier

**Response**:
```json
{
  "hotelId": 67890,
  "eventId": 12345,
  "totalRooms": 200,
  "roomTypes": [
    {
      "roomTypeId": 101,
      "roomTypeName": "Standard King",
      "totalRooms": 100,
      "baseRate": 199.99
    }
  ]
}
```

---

#### GET /inventory/event/{eventId}/search
**Description**: Search event inventory overview

**Path Parameters**:
- `eventId` - Event identifier

**Query Parameters**:
- `hotelRooms` - Array of hotel,room tuples (e.g., "123,456")
- `attendeeTypeIds` - Array of attendee type IDs
- `subBlockGroupId` - Sub-block group identifier

**Response**:
```json
{
  "eventId": 12345,
  "totalHotels": 5,
  "totalRooms": 500,
  "totalReserved": 250,
  "totalAvailable": 250,
  "hotelSummaries": [
    {
      "hotelId": 67890,
      "hotelName": "Grand Hotel",
      "totalRooms": 100,
      "availableRooms": 50,
      "reservedRooms": 50
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request parameters are invalid",
    "details": "Arrival date must be before departure date"
  }
}
```

**Common Error Codes**:
- `INVALID_REQUEST` - Request validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., inventory locked)
- `INTERNAL_ERROR` - Server error

## Rate Limiting

API requests are rate limited per API key:
- **Standard**: 1000 requests per minute
- **Burst**: 100 requests per second

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Window reset time (Unix timestamp)
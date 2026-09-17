# API Reference

## Base URL

**Development**: `https://passkey-request-inventory-service-dev.core.cvent.org`
**Production**: `https://passkey-request-inventory-service.core.cvent.org`

## Authentication

All endpoints require API Key authentication using the `Authorization` header:

```
Authorization: Bearer <api-key>
```

## Content Type

All requests and responses use `application/json` content type.

## Endpoints

### Individual Inventory Operations

#### GET /api/v1/request-inventory/{reservationId}

**Description**: Retrieve current inventory allocation for a specific reservation.

**Path Parameters**:
- `reservationId` (long) - Unique identifier for the reservation

**Response**:
```json
{
  "reservationId": 12345,
  "sessionKey": "session-abc-123",
  "blockId": "block-456",
  "startDate": "2024-03-15",
  "endDate": "2024-03-18",
  "dates": [
    {
      "date": "2024-03-15",
      "rooms": [
        {
          "roomTypeId": "standard-room",
          "quantity": 2,
          "rate": {
            "amount": 150.00,
            "currency": "USD"
          },
          "nightStatus": "ALLOCATED"
        }
      ]
    }
  ],
  "totalNights": 3,
  "totalRooms": 2
}
```

**Status Codes**:
- 200: Success
- 404: Reservation not found
- 401: Unauthorized
- 500: Internal server error

---

#### POST /api/v1/request-inventory/{reservationId}

**Description**: Create new inventory allocation for a reservation.

**Path Parameters**:
- `reservationId` (long) - Unique identifier for the reservation

**Request Body**:
```json
{
  "sessionKey": "session-abc-123",
  "blockId": "block-456",
  "startDate": "2024-03-15",
  "endDate": "2024-03-18",
  "dates": [
    {
      "date": "2024-03-15",
      "roomTypeId": "standard-room",
      "quantity": 2
    },
    {
      "date": "2024-03-16",
      "roomTypeId": "standard-room",
      "quantity": 2
    }
  ],
  "allowWaitList": false,
  "allowPrimary": true,
  "allowOverBook": false,
  "allowExternalRates": true,
  "ignoreCapRules": false,
  "ignoreValidations": false
}
```

**Response**: Same as GET response format

**Status Codes**:
- 200: Success
- 400: Bad request (validation errors)
- 401: Unauthorized
- 409: Conflict (inventory not available)
- 500: Internal server error

---

#### PUT /api/v1/request-inventory/{reservationId}

**Description**: Update existing inventory allocation for a reservation.

**Path Parameters**:
- `reservationId` (long) - Unique identifier for the reservation

**Request Body**: Same as POST request

**Response**: Same as GET response format

**Status Codes**:
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 404: Reservation not found
- 500: Internal server error

---

#### DELETE /api/v1/request-inventory/{reservationId}

**Description**: Delete inventory allocation (release all inventory) for a reservation.

**Path Parameters**:
- `reservationId` (long) - Unique identifier for the reservation

**Response**: Same as GET response format (showing released inventory)

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Reservation not found
- 500: Internal server error

---

#### DELETE /api/v1/request-inventory/{reservationId}/{sessionKey}

**Description**: Delete inventory allocation with specific session key and timeout.

**Path Parameters**:
- `reservationId` (long) - Unique identifier for the reservation
- `sessionKey` (string) - Session identifier

**Query Parameters**:
- `timeoutMin` (int, optional) - Timeout in minutes (default: 30)

**Response**: Same as GET response format

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Reservation not found
- 500: Internal server error

---

#### PATCH /api/v1/request-inventory/{reservationId}

**Description**: Cancel inventory allocation (soft delete) for a reservation.

**Path Parameters**:
- `reservationId` (long) - Unique identifier for the reservation

**Response**: Same as GET response format

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Reservation not found
- 500: Internal server error

---

#### PATCH /api/v1/request-inventory/{reservationId}/{sessionKey}

**Description**: Cancel inventory allocation with specific session key and timeout.

**Path Parameters**:
- `reservationId` (long) - Unique identifier for the reservation
- `sessionKey` (string) - Session identifier

**Query Parameters**:
- `timeoutMin` (int, optional) - Timeout in minutes (default: 30)

**Response**: Same as GET response format

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Reservation not found
- 500: Internal server error

---

#### PATCH /api/v1/request-inventory/{reservationId}/{sessionKey}/rollback

**Description**: Rollback a cancelled inventory allocation.

**Path Parameters**:
- `reservationId` (long) - Unique identifier for the reservation
- `sessionKey` (string) - Session identifier

**Response**: Same as GET response format

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Reservation not found
- 500: Internal server error

---

### Bulk Inventory Operations

#### POST /api/v1/request-inventory/bulk

**Description**: Process multiple inventory allocation requests in a single operation.

**Request Body**:
```json
{
  "sessionKey": "bulk-session-123",
  "requests": [
    {
      "reservationId": 12345,
      "blockId": "block-456",
      "startDate": "2024-03-15",
      "endDate": "2024-03-18",
      "dates": [
        {
          "date": "2024-03-15",
          "roomTypeId": "standard-room",
          "quantity": 1
        }
      ],
      "allowWaitList": false,
      "allowPrimary": true
    },
    {
      "reservationId": 12346,
      "blockId": "block-456",
      "startDate": "2024-03-15",
      "endDate": "2024-03-17",
      "dates": [
        {
          "date": "2024-03-15",
          "roomTypeId": "deluxe-room",
          "quantity": 1
        }
      ],
      "allowWaitList": false,
      "allowPrimary": true
    }
  ]
}
```

**Response**:
```json
{
  "sessionKey": "bulk-session-123",
  "results": [
    {
      "reservationId": 12345,
      "success": true,
      "allocation": {
        "reservationId": 12345,
        "sessionKey": "bulk-session-123",
        "startDate": "2024-03-15",
        "endDate": "2024-03-18",
        "dates": [...]
      }
    },
    {
      "reservationId": 12346,
      "success": false,
      "error": {
        "code": "INVENTORY_NOT_AVAILABLE",
        "message": "Insufficient inventory for requested dates"
      }
    }
  ],
  "totalRequests": 2,
  "successfulRequests": 1,
  "failedRequests": 1
}
```

**Status Codes**:
- 200: Success (individual results may contain errors)
- 400: Bad request (invalid bulk request format)
- 401: Unauthorized
- 500: Internal server error

---

### Inventory Locking Operations

#### POST /api/v1/lock-inventory/{reservationId}

**Description**: Create temporary inventory locks to prevent double-booking during reservation process.

**Path Parameters**:
- `reservationId` (long) - Unique identifier for the reservation

**Request Body**:
```json
{
  "sessionKey": "lock-session-789",
  "blockId": "block-456",
  "dates": [
    {
      "date": "2024-03-15",
      "rooms": [
        {
          "roomTypeId": "standard-room",
          "quantity": 2,
          "rate": {
            "amount": 150.00,
            "currency": "USD"
          }
        }
      ]
    }
  ],
  "lockDurationMinutes": 15
}
```

**Response**:
```json
{
  "reservationId": 12345,
  "sessionKey": "lock-session-789",
  "lockId": "lock-abc-123",
  "expiresAt": "2024-03-15T10:15:00Z",
  "dates": [
    {
      "date": "2024-03-15",
      "rooms": [
        {
          "roomTypeId": "standard-room",
          "quantity": 2,
          "locked": true,
          "lockId": "lock-abc-123"
        }
      ]
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 409: Conflict (inventory already locked)
- 500: Internal server error

---

#### DELETE /api/v1/lock-inventory/{reservationId}

**Description**: Release inventory locks for a reservation.

**Path Parameters**:
- `reservationId` (long) - Unique identifier for the reservation

**Response**: Same as lock creation response with `locked: false`

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Lock not found
- 500: Internal server error

---

## Error Response Format

All error responses follow this standard format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details",
      "timestamp": "2024-03-15T10:00:00Z"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `INVENTORY_NOT_AVAILABLE`: Requested inventory is not available
- `RESERVATION_NOT_FOUND`: Reservation ID does not exist
- `SESSION_EXPIRED`: Session key has expired
- `LOCK_CONFLICT`: Inventory is already locked by another session
- `BUSINESS_RULE_VIOLATION`: Request violates business rules
- `INSUFFICIENT_PERMISSIONS`: API key lacks required permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests from client
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Rate Limiting

API requests are subject to rate limiting:
- **Standard**: 1000 requests per minute per API key
- **Bulk Operations**: 100 requests per minute per API key
- **Lock Operations**: 500 requests per minute per API key

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1647345600
```

## Request/Response Examples

### cURL Examples

**Get Inventory Allocation**:
```bash
curl -X GET \
  https://passkey-request-inventory-service-dev.core.cvent.org/api/v1/request-inventory/12345 \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json'
```

**Create Inventory Allocation**:
```bash
curl -X POST \
  https://passkey-request-inventory-service-dev.core.cvent.org/api/v1/request-inventory/12345 \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionKey": "session-abc-123",
    "blockId": "block-456",
    "startDate": "2024-03-15",
    "endDate": "2024-03-18",
    "dates": [
      {
        "date": "2024-03-15",
        "roomTypeId": "standard-room",
        "quantity": 2
      }
    ],
    "allowWaitList": false,
    "allowPrimary": true
  }'
```

**Lock Inventory**:
```bash
curl -X POST \
  https://passkey-request-inventory-service-dev.core.cvent.org/api/v1/lock-inventory/12345 \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionKey": "lock-session-789",
    "blockId": "block-456",
    "dates": [
      {
        "date": "2024-03-15",
        "rooms": [
          {
            "roomTypeId": "standard-room",
            "quantity": 2
          }
        ]
      }
    ],
    "lockDurationMinutes": 15
  }'
```
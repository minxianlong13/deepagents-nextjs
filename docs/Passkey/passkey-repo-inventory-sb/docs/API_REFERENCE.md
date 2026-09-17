# API Reference

## Base URL

**Development**: `http://localhost:8080`  
**Production**: `https://passkey-inventory.core.cvent.org`

All API endpoints are prefixed with `/passkey-inventory/v1`

## Authentication

All endpoints require OAuth authentication with appropriate scopes:
- **ADMIN**: Full access for create/update operations
- **READ_ONLY**: Read access for retrieval operations

Include the OAuth token in the Authorization header:
```
Authorization: Bearer <your-oauth-token>
```

## Endpoints

### Entity Operations

#### POST /passkey-inventory/v1/entity
**Description**: Creates a new entity in the passkey inventory system.

**Authorization**: `ADMIN` scope required

**Request Body**:
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "properties": {
    "key": "value"
  }
}
```

**Response**:
```json
{
  "id": "string",
  "status": "CREATED",
  "message": "Entity created successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- `201 Created`: Entity successfully created
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid OAuth token
- `403 Forbidden`: Insufficient permissions (requires ADMIN scope)
- `500 Internal Server Error`: Server error

**Example Request**:
```bash
curl -X POST "http://localhost:8080/passkey-inventory/v1/entity" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "entity-123",
    "name": "Sample Entity",
    "type": "INVENTORY_ITEM"
  }'
```

#### GET /passkey-inventory/v1/entity/{id}
**Description**: Retrieves an entity by its ID.

**Authorization**: `READ_ONLY` scope required

**Path Parameters**:
- `id` (string, required): The unique identifier of the entity

**Response**:
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "properties": {
    "key": "value"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- `200 OK`: Entity found and returned
- `401 Unauthorized`: Missing or invalid OAuth token
- `403 Forbidden`: Insufficient permissions (requires READ_ONLY scope)
- `404 Not Found`: Entity not found
- `500 Internal Server Error`: Server error

**Example Request**:
```bash
curl -X GET "http://localhost:8080/passkey-inventory/v1/entity/entity-123" \
  -H "Authorization: Bearer <token>"
```

### Block Operations

#### POST /passkey-inventory/v1/blocks
**Description**: Retrieves block information by block IDs and locale ID. This endpoint executes a direct SELECT query to fetch block data from the database.

**Authorization**: OAuth token required (scope determined by business rules)

**Request Body**:
```json
{
  "blockIds": ["string"],
  "localeId": "string"
}
```

**Request Body Parameters**:
- `blockIds` (array of strings, required): List of block identifiers to retrieve
- `localeId` (string, required): Locale identifier for localization

**Response**:
```json
{
  "data": [
    {
      "blockId": "string",
      "blockName": "string",
      "hotelId": "string",
      "hotelName": "string",
      "startDate": "2024-01-15",
      "endDate": "2024-01-20",
      "totalRooms": 100,
      "availableRooms": 75,
      "blockedRooms": 25,
      "roomType": "string",
      "rate": {
        "amount": 150.00,
        "currency": "USD"
      },
      "status": "ACTIVE",
      "localeId": "string",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Response Fields**:
- `data` (array): List of block information objects
  - `blockId` (string): Unique block identifier
  - `blockName` (string): Human-readable block name
  - `hotelId` (string): Associated hotel identifier
  - `hotelName` (string): Hotel name
  - `startDate` (string): Block start date (ISO 8601 date format)
  - `endDate` (string): Block end date (ISO 8601 date format)
  - `totalRooms` (integer): Total rooms in the block
  - `availableRooms` (integer): Currently available rooms
  - `blockedRooms` (integer): Currently blocked/reserved rooms
  - `roomType` (string): Type of rooms in the block
  - `rate` (object): Rate information
    - `amount` (number): Rate amount
    - `currency` (string): Currency code
  - `status` (string): Block status (ACTIVE, INACTIVE, EXPIRED)
  - `localeId` (string): Locale identifier
  - `createdAt` (string): Creation timestamp (ISO 8601)
  - `updatedAt` (string): Last update timestamp (ISO 8601)

**Status Codes**:
- `200 OK`: Block information retrieved successfully
- `400 Bad Request`: Invalid request data (missing required fields, invalid format)
- `401 Unauthorized`: Missing or invalid OAuth token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: No blocks found for the provided IDs
- `500 Internal Server Error`: Server error

**Example Request**:
```bash
curl -X POST "http://localhost:8080/passkey-inventory/v1/blocks" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "blockIds": ["block-123", "block-456"],
    "localeId": "en-US"
  }'
```

**Example Response**:
```json
{
  "data": [
    {
      "blockId": "block-123",
      "blockName": "Corporate Event Block",
      "hotelId": "hotel-789",
      "hotelName": "Grand Plaza Hotel",
      "startDate": "2024-03-15",
      "endDate": "2024-03-18",
      "totalRooms": 50,
      "availableRooms": 30,
      "blockedRooms": 20,
      "roomType": "Standard Double",
      "rate": {
        "amount": 189.99,
        "currency": "USD"
      },
      "status": "ACTIVE",
      "localeId": "en-US",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    }
  ]
}
```

## Health Check Endpoints

### GET /actuator/health
**Description**: Returns the health status of the service and its dependencies.

**Authorization**: No authentication required

**Response**:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "Oracle",
        "validationQuery": "SELECT 1 FROM DUAL"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 10737418240,
        "free": 8589934592,
        "threshold": 10485760
      }
    }
  }
}
```

**Status Codes**:
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service or dependencies are unhealthy

## Error Responses

All endpoints return consistent error responses in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/passkey-inventory/v1/entity"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Requested resource not found
- `INTERNAL_ERROR`: Server-side error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Rate Limiting

API endpoints are subject to rate limiting:
- **Default Limit**: 1000 requests per minute per OAuth token
- **Burst Limit**: 100 requests per 10 seconds

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## Versioning

The API uses URL path versioning:
- Current version: `v1`
- Future versions will be available at `/passkey-inventory/v2`, etc.
- Backward compatibility is maintained for at least one major version

## Content Types

- **Request Content-Type**: `application/json`
- **Response Content-Type**: `application/json`
- **Character Encoding**: UTF-8

## CORS Support

Cross-Origin Resource Sharing (CORS) is enabled for web applications:
- Allowed origins: Configured per environment
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Authorization, Content-Type, X-Requested-With
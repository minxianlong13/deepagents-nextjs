# API Reference

## Base URL
`https://passkey-event-housing-service.{environment}.cvent.org`

## Authentication
All endpoints require authentication via Cvent's auth-service. Include the authorization token in the request headers:
```
Authorization: Bearer <token>
```

## Common Response Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request - Invalid input parameters
- **401**: Unauthorized - Invalid or missing authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **500**: Internal Server Error

## Endpoints

### Event Housing Operations

#### GET /events/{eventId}/housing
**Description**: Retrieve housing information for a specific event

**Path Parameters**:
- `eventId` (string, required) - Unique identifier for the event

**Query Parameters**:
- `includeDetails` (boolean, optional) - Include detailed housing information
- `status` (string, optional) - Filter by housing status

**Response**:
```json
{
  "eventId": "12345",
  "housingInfo": {
    "totalRooms": 150,
    "availableRooms": 75,
    "hotels": [
      {
        "hotelId": "hotel-123",
        "name": "Grand Hotel",
        "address": "123 Main St, City, State",
        "roomBlocks": [...]
      }
    ]
  }
}
```

#### POST /events/{eventId}/housing
**Description**: Create or update housing information for an event

**Path Parameters**:
- `eventId` (string, required) - Unique identifier for the event

**Request Body**:
```json
{
  "housingInfo": {
    "hotels": [
      {
        "hotelId": "hotel-123",
        "roomBlocks": [
          {
            "blockId": "block-456",
            "roomTypeId": "standard",
            "quantity": 50,
            "rate": 129.99
          }
        ]
      }
    ]
  }
}
```

### Room Block Operations

#### GET /blocks/{blockId}
**Description**: Retrieve details for a specific room block

**Path Parameters**:
- `blockId` (string, required) - Unique identifier for the room block

**Response**:
```json
{
  "blockId": "block-456",
  "eventId": "12345",
  "hotelId": "hotel-123",
  "roomTypeId": "standard",
  "quantity": 50,
  "reservedQuantity": 25,
  "rate": 129.99,
  "currency": "USD",
  "checkInDate": "2024-06-15",
  "checkOutDate": "2024-06-18",
  "status": "active"
}
```

#### POST /blocks
**Description**: Create a new room block

**Request Body**:
```json
{
  "eventId": "12345",
  "hotelId": "hotel-123",
  "roomTypeId": "standard",
  "quantity": 50,
  "rate": 129.99,
  "currency": "USD",
  "checkInDate": "2024-06-15",
  "checkOutDate": "2024-06-18"
}
```

#### PUT /blocks/{blockId}
**Description**: Update an existing room block

**Path Parameters**:
- `blockId` (string, required) - Unique identifier for the room block

**Request Body**:
```json
{
  "quantity": 75,
  "rate": 139.99,
  "status": "active"
}
```

#### DELETE /blocks/{blockId}
**Description**: Delete a room block

**Path Parameters**:
- `blockId` (string, required) - Unique identifier for the room block

### Room Block Transfer Operations

#### GET /room-block-transfer-state/{transferId}
**Description**: Get the state of a room block transfer

**Path Parameters**:
- `transferId` (string, required) - Unique identifier for the transfer

**Response**:
```json
{
  "transferId": "transfer-789",
  "sourceBlockId": "block-456",
  "targetBlockId": "block-789",
  "quantity": 10,
  "status": "completed",
  "initiatedBy": "user-123",
  "initiatedAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-15T10:35:00Z"
}
```

#### POST /room-block-transfer-state
**Description**: Initiate a room block transfer

**Request Body**:
```json
{
  "sourceBlockId": "block-456",
  "targetBlockId": "block-789",
  "quantity": 10,
  "reason": "Reallocation due to demand"
}
```

### Room Category Operations

#### GET /room-categories
**Description**: Retrieve all room categories

**Query Parameters**:
- `hotelId` (string, optional) - Filter by hotel
- `active` (boolean, optional) - Filter by active status

**Response**:
```json
{
  "categories": [
    {
      "categoryId": "standard",
      "name": "Standard Room",
      "description": "Comfortable standard accommodation",
      "amenities": ["WiFi", "TV", "Air Conditioning"],
      "maxOccupancy": 2,
      "bedType": "Queen",
      "active": true
    }
  ]
}
```

#### POST /room-categories
**Description**: Create a new room category

**Request Body**:
```json
{
  "name": "Deluxe Suite",
  "description": "Spacious suite with premium amenities",
  "amenities": ["WiFi", "TV", "Mini Bar", "Balcony"],
  "maxOccupancy": 4,
  "bedType": "King",
  "active": true
}
```

#### PUT /room-categories/{categoryId}
**Description**: Update a room category

**Path Parameters**:
- `categoryId` (string, required) - Unique identifier for the room category

### Image Management Operations

#### POST /images/upload
**Description**: Upload images for housing properties

**Request**: Multipart form data
- `file` (file, required) - Image file to upload
- `propertyId` (string, required) - Property identifier
- `imageType` (string, required) - Type of image (hotel, room, amenity)

**Response**:
```json
{
  "imageId": "img-123",
  "url": "https://images.cvent.com/housing/img-123.jpg",
  "propertyId": "hotel-123",
  "imageType": "hotel",
  "uploadedAt": "2024-01-15T10:30:00Z"
}
```

#### GET /images/{imageId}
**Description**: Retrieve image information

**Path Parameters**:
- `imageId` (string, required) - Unique identifier for the image

#### DELETE /images/{imageId}
**Description**: Delete an image

**Path Parameters**:
- `imageId` (string, required) - Unique identifier for the image

### Group Link Operations

#### GET /group-links/{linkId}
**Description**: Retrieve group booking link information

**Path Parameters**:
- `linkId` (string, required) - Unique identifier for the group link

**Response**:
```json
{
  "linkId": "link-456",
  "eventId": "12345",
  "groupName": "Conference Attendees",
  "url": "https://book.passkey.com/group/link-456",
  "expirationDate": "2024-06-01",
  "maxReservations": 100,
  "currentReservations": 45,
  "active": true
}
```

#### POST /group-links
**Description**: Create a new group booking link

**Request Body**:
```json
{
  "eventId": "12345",
  "groupName": "Conference Attendees",
  "expirationDate": "2024-06-01",
  "maxReservations": 100,
  "roomBlocks": ["block-456", "block-789"]
}
```

### Connection Management

#### GET /connections/{connectionId}
**Description**: Retrieve connection information

**Path Parameters**:
- `connectionId` (string, required) - Unique identifier for the connection

#### POST /connections
**Description**: Create a new connection

**Request Body**:
```json
{
  "providerId": "provider-123",
  "connectionType": "api",
  "configuration": {
    "endpoint": "https://api.provider.com",
    "apiKey": "encrypted-key"
  }
}
```

### Callback Operations

#### POST /callbacks/{providerId}
**Description**: Handle callbacks from external housing providers

**Path Parameters**:
- `providerId` (string, required) - Identifier for the external provider

**Request Body**: Provider-specific callback data

### Administrative Operations

#### GET /admin/health
**Description**: Service health check endpoint

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.4.6",
  "dependencies": {
    "database": "healthy",
    "auth-service": "healthy"
  }
}
```

#### GET /admin/metrics
**Description**: Service metrics and statistics

**Response**:
```json
{
  "requests": {
    "total": 10000,
    "successful": 9850,
    "failed": 150
  },
  "performance": {
    "averageResponseTime": "125ms",
    "p95ResponseTime": "250ms"
  }
}
```

#### POST /admin/cache/clear
**Description**: Clear service cache

**Request Body**:
```json
{
  "cacheType": "all" // or specific cache type
}
```

## Pagination

Many list endpoints support pagination using the following query parameters:
- `page` (integer, default: 1) - Page number
- `size` (integer, default: 20, max: 100) - Number of items per page
- `sort` (string, optional) - Sort field and direction (e.g., "name:asc")

**Paginated Response Format**:
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

## Error Responses

**Standard Error Format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "eventId",
        "message": "Event ID is required"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

## Rate Limiting

API requests are subject to rate limiting:
- **Standard endpoints**: 1000 requests per minute per client
- **Upload endpoints**: 100 requests per minute per client
- **Admin endpoints**: 500 requests per minute per client

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
```
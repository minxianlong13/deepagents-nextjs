# API Reference

## Base URL
`https://passkey-housing-library-service.{environment}.cvent.org`

## Authentication
All endpoints require authentication via:
- **Bearer Token**: JWT token from Cvent Auth Service
- **API Key**: Service-to-service authentication via `X-API-Key` header

## Endpoints

### Event Templates

#### GET /event-templates
**Description**: Retrieves available event templates

**Query Parameters**:
- `organizationId` (required) - Organization identifier
- `eventSubType` (optional) - Filter by event sub-type

**Response**:
```json
{
  "eventTemplates": [
    {
      "id": "template-123",
      "name": "Corporate Meeting Template",
      "eventSubType": "CORPORATE",
      "description": "Standard template for corporate meetings"
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 400: Bad Request - Missing required parameters
- 401: Unauthorized
- 404: Organization not found

### Images

#### POST /images
**Description**: Uploads a new image to the library

**Request**: Multipart form data
- `file` (required) - Image file (JPEG, PNG, GIF, WebP)
- `metadata` (optional) - JSON metadata

**Request Body Example**:
```
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="hotel-room.jpg"
Content-Type: image/jpeg

[binary image data]
--boundary
Content-Disposition: form-data; name="metadata"
Content-Type: application/json

{
  "title": "Deluxe Room",
  "description": "Spacious deluxe room with city view",
  "tags": ["room", "deluxe", "city-view"]
}
```

**Response**:
```json
{
  "imageId": "img-456",
  "url": "https://images.cvent.org/passkey/img-456.jpg",
  "metadata": {
    "title": "Deluxe Room",
    "description": "Spacious deluxe room with city view",
    "tags": ["room", "deluxe", "city-view"]
  },
  "uploadedAt": "2024-01-15T10:30:00Z"
}
```

#### GET /images/{imageId}
**Description**: Retrieves image metadata

**Path Parameters**:
- `imageId` - Unique image identifier

**Response**:
```json
{
  "imageId": "img-456",
  "url": "https://images.cvent.org/passkey/img-456.jpg",
  "metadata": {
    "title": "Deluxe Room",
    "description": "Spacious deluxe room with city view",
    "tags": ["room", "deluxe", "city-view"]
  },
  "uploadedAt": "2024-01-15T10:30:00Z"
}
```

#### PUT /images/{imageId}/metadata
**Description**: Updates image metadata

**Path Parameters**:
- `imageId` - Unique image identifier

**Request Body**:
```json
{
  "title": "Updated Room Title",
  "description": "Updated description",
  "tags": ["room", "updated"]
}
```

#### POST /images/bulk-metadata
**Description**: Updates metadata for multiple images

**Request Body**:
```json
{
  "updates": [
    {
      "imageId": "img-456",
      "metadata": {
        "title": "Bulk Updated Title",
        "tags": ["bulk", "updated"]
      }
    }
  ]
}
```

#### DELETE /images/{imageId}
**Description**: Deletes an image from the library

**Path Parameters**:
- `imageId` - Unique image identifier

### Participant Settings

#### GET /participant/profile-settings
**Description**: Retrieves participant profile settings

**Query Parameters**:
- `organizationId` (required) - Organization identifier
- `eventId` (optional) - Event identifier for event-specific settings

**Response**:
```json
{
  "organizationId": "org-123",
  "eventId": "event-456",
  "settings": {
    "allowProfileEditing": true,
    "requiredFields": ["firstName", "lastName", "email"],
    "optionalFields": ["phone", "company"]
  }
}
```

#### PUT /participant/profile-settings
**Description**: Updates participant profile settings

**Request Body**:
```json
{
  "organizationId": "org-123",
  "eventId": "event-456",
  "settings": {
    "allowProfileEditing": true,
    "requiredFields": ["firstName", "lastName", "email"],
    "optionalFields": ["phone", "company"]
  }
}
```

### Room Categories

#### GET /room-categories
**Description**: Retrieves available room categories

**Query Parameters**:
- `organizationId` (required) - Organization identifier
- `hotelId` (optional) - Filter by hotel
- `active` (optional) - Filter by active status (default: true)

**Response**:
```json
{
  "roomCategories": [
    {
      "id": "cat-123",
      "name": "Standard Room",
      "description": "Comfortable standard accommodation",
      "maxOccupancy": 2,
      "bedTypes": ["QUEEN"],
      "amenities": ["WiFi", "TV", "AC"],
      "active": true
    }
  ]
}
```

#### POST /room-categories
**Description**: Creates a new room category

**Request Body**:
```json
{
  "name": "Deluxe Suite",
  "description": "Spacious suite with separate living area",
  "maxOccupancy": 4,
  "bedTypes": ["KING", "SOFA_BED"],
  "amenities": ["WiFi", "TV", "AC", "Kitchenette", "Balcony"]
}
```

#### PUT /room-categories/{categoryId}
**Description**: Updates an existing room category

**Path Parameters**:
- `categoryId` - Room category identifier

**Request Body**:
```json
{
  "name": "Updated Deluxe Suite",
  "description": "Updated description",
  "maxOccupancy": 4,
  "amenities": ["WiFi", "TV", "AC", "Kitchenette", "Balcony", "Room Service"]
}
```

#### DELETE /room-categories/{categoryId}
**Description**: Deactivates a room category

**Path Parameters**:
- `categoryId` - Room category identifier

### Room Library

#### GET /room-library
**Description**: Retrieves room library data

**Query Parameters**:
- `organizationId` (required) - Organization identifier
- `hotelId` (optional) - Filter by hotel
- `roomType` (optional) - Filter by room type
- `page` (optional) - Page number (default: 1)
- `size` (optional) - Page size (default: 20)

**Response**:
```json
{
  "rooms": [
    {
      "id": "room-123",
      "name": "Ocean View Suite",
      "type": "SUITE",
      "description": "Luxurious suite with ocean view",
      "maxOccupancy": 4,
      "beds": [
        {
          "type": "KING",
          "count": 1
        }
      ],
      "amenities": ["Ocean View", "Balcony", "Kitchenette"],
      "images": ["img-456", "img-789"]
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

#### POST /room-library
**Description**: Adds a new room to the library

**Request Body**:
```json
{
  "name": "Presidential Suite",
  "type": "SUITE",
  "description": "Ultimate luxury accommodation",
  "maxOccupancy": 6,
  "beds": [
    {
      "type": "KING",
      "count": 2
    }
  ],
  "amenities": ["City View", "Balcony", "Full Kitchen", "Living Room"]
}
```

### Health Check

#### GET /stub
**Description**: Basic health check endpoint

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "organizationId",
        "message": "Organization ID is required"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/room-categories"
}
```

## Common Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error

## Rate Limiting

- **Rate Limit**: 1000 requests per minute per API key
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Pagination

List endpoints support pagination:
- `page`: Page number (1-based, default: 1)
- `size`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
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
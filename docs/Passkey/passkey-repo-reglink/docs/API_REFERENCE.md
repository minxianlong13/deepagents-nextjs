# API Reference

## Base URL
`https://passkey-reglink-service.{environment}.cvent.com`

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

## Content Type
All requests and responses use JSON:
```
Content-Type: application/json
```

## Endpoints

### Event Management

#### GET /v1/events/{eventId}/availability
**Description**: Get event availability including hotel information and room inventory

**Path Parameters**:
- `eventId` - Unique identifier for the event

**Query Parameters**:
- `checkIn` - Check-in date (ISO 8601 format)
- `checkOut` - Check-out date (ISO 8601 format)
- `adults` - Number of adults (optional, default: 1)
- `children` - Number of children (optional, default: 0)

**Response**:
```json
{
  "eventId": "string",
  "hotels": [
    {
      "hotelId": "string",
      "name": "string",
      "address": {
        "street": "string",
        "city": "string",
        "state": "string",
        "zipCode": "string",
        "country": "string"
      },
      "rooms": [
        {
          "roomTypeId": "string",
          "name": "string",
          "description": "string",
          "rate": {
            "amount": 199.99,
            "currency": "USD"
          },
          "availability": 10
        }
      ]
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 400: Invalid request parameters
- 404: Event not found
- 500: Internal server error

#### POST /v1/events/{eventId}/metadata
**Description**: Create or update event metadata

**Path Parameters**:
- `eventId` - Unique identifier for the event

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "startDate": "2024-01-15T00:00:00Z",
  "endDate": "2024-01-17T00:00:00Z",
  "location": {
    "city": "string",
    "state": "string",
    "country": "string"
  },
  "settings": {
    "allowGroupReservations": true,
    "requireApproval": false
  }
}
```

**Response**:
```json
{
  "eventId": "string",
  "status": "CREATED",
  "message": "Event metadata created successfully"
}
```

### Reservation Management

#### POST /v1/reservations
**Description**: Create a new individual reservation

**Request Body**:
```json
{
  "eventId": "string",
  "hotelId": "string",
  "roomTypeId": "string",
  "checkIn": "2024-01-15",
  "checkOut": "2024-01-17",
  "guest": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string"
  },
  "preferences": {
    "smokingPreference": "NON_SMOKING",
    "bedType": "KING",
    "specialRequests": "string"
  }
}
```

**Response**:
```json
{
  "reservationId": "string",
  "confirmationNumber": "string",
  "status": "CONFIRMED",
  "totalAmount": {
    "amount": 599.97,
    "currency": "USD"
  },
  "createdAt": "2024-01-10T10:30:00Z"
}
```

#### GET /v1/reservations/{reservationId}
**Description**: Retrieve reservation details

**Path Parameters**:
- `reservationId` - Unique identifier for the reservation

**Response**:
```json
{
  "reservationId": "string",
  "confirmationNumber": "string",
  "status": "CONFIRMED",
  "eventId": "string",
  "hotelId": "string",
  "roomTypeId": "string",
  "checkIn": "2024-01-15",
  "checkOut": "2024-01-17",
  "guest": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string"
  },
  "totalAmount": {
    "amount": 599.97,
    "currency": "USD"
  }
}
```

#### DELETE /v1/reservations/{reservationId}
**Description**: Cancel an existing reservation

**Path Parameters**:
- `reservationId` - Unique identifier for the reservation

**Response**:
```json
{
  "reservationId": "string",
  "status": "CANCELLED",
  "cancellationDate": "2024-01-10T15:45:00Z",
  "refundAmount": {
    "amount": 599.97,
    "currency": "USD"
  }
}
```

### Room Block Management

#### POST /v1/room-blocks
**Description**: Create a new room block

**Request Body**:
```json
{
  "eventId": "string",
  "hotelId": "string",
  "name": "string",
  "description": "string",
  "blockDates": {
    "startDate": "2024-01-15",
    "endDate": "2024-01-17"
  },
  "rooms": [
    {
      "roomTypeId": "string",
      "quantity": 20,
      "rate": {
        "amount": 179.99,
        "currency": "USD"
      }
    }
  ],
  "cutoffDate": "2024-01-01",
  "releaseDate": "2024-01-08"
}
```

**Response**:
```json
{
  "roomBlockId": "string",
  "status": "PENDING",
  "requestId": "string",
  "message": "Room block creation request submitted"
}
```

#### GET /v1/room-blocks/{roomBlockId}/status
**Description**: Get room block creation status

**Path Parameters**:
- `roomBlockId` - Unique identifier for the room block

**Response**:
```json
{
  "roomBlockId": "string",
  "status": "CONFIRMED",
  "progress": {
    "stage": "HOTEL_CONFIRMATION",
    "percentage": 75,
    "message": "Awaiting final hotel confirmation"
  },
  "estimatedCompletion": "2024-01-10T18:00:00Z"
}
```

#### GET /v1/room-blocks/{roomBlockId}
**Description**: Retrieve room block details

**Path Parameters**:
- `roomBlockId` - Unique identifier for the room block

**Response**:
```json
{
  "roomBlockId": "string",
  "eventId": "string",
  "hotelId": "string",
  "name": "string",
  "status": "ACTIVE",
  "blockDates": {
    "startDate": "2024-01-15",
    "endDate": "2024-01-17"
  },
  "rooms": [
    {
      "roomTypeId": "string",
      "quantity": 20,
      "reserved": 8,
      "available": 12,
      "rate": {
        "amount": 179.99,
        "currency": "USD"
      }
    }
  ],
  "cutoffDate": "2024-01-01",
  "createdAt": "2024-01-10T10:00:00Z"
}
```

#### PATCH /v1/room-blocks/{roomBlockId}
**Description**: Partially update room block details

**Path Parameters**:
- `roomBlockId` - Unique identifier for the room block

**Request Body**:
```json
{
  "name": "Updated Block Name",
  "cutoffDate": "2024-01-05",
  "rooms": [
    {
      "roomTypeId": "string",
      "quantity": 25
    }
  ]
}
```

#### DELETE /v1/room-blocks/{roomBlockId}
**Description**: Cancel a room block

**Path Parameters**:
- `roomBlockId` - Unique identifier for the room block

**Response**:
```json
{
  "roomBlockId": "string",
  "status": "CANCELLED",
  "cancellationDate": "2024-01-10T16:30:00Z"
}
```

### Housing Events

#### POST /v1/housing-events
**Description**: Create a new housing event

**Request Body**:
```json
{
  "eventId": "string",
  "name": "string",
  "description": "string",
  "housingDates": {
    "startDate": "2024-01-14",
    "endDate": "2024-01-18"
  },
  "settings": {
    "allowSelfService": true,
    "requireApproval": false,
    "maxRoomsPerReservation": 5
  },
  "hotels": ["hotel-id-1", "hotel-id-2"]
}
```

**Response**:
```json
{
  "housingEventId": "string",
  "status": "CREATED",
  "publicUrl": "https://housing.cvent.com/events/{housingEventId}",
  "createdAt": "2024-01-10T11:00:00Z"
}
```

#### GET /v1/housing-events/{housingEventId}
**Description**: Retrieve housing event information

**Path Parameters**:
- `housingEventId` - Unique identifier for the housing event

**Response**:
```json
{
  "housingEventId": "string",
  "eventId": "string",
  "name": "string",
  "status": "ACTIVE",
  "housingDates": {
    "startDate": "2024-01-14",
    "endDate": "2024-01-18"
  },
  "statistics": {
    "totalReservations": 45,
    "totalRooms": 52,
    "occupancyRate": 0.73
  },
  "publicUrl": "https://housing.cvent.com/events/{housingEventId}"
}
```

### Group Reservations

#### POST /v1/reservations/group
**Description**: Create a group reservation request

**Request Body**:
```json
{
  "eventId": "string",
  "groupName": "string",
  "contactInfo": {
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "roomRequirements": [
    {
      "roomTypeId": "string",
      "quantity": 10,
      "checkIn": "2024-01-15",
      "checkOut": "2024-01-17"
    }
  ],
  "specialRequests": "string"
}
```

**Response**:
```json
{
  "groupReservationId": "string",
  "status": "PENDING",
  "requestId": "string",
  "estimatedProcessingTime": "24 hours"
}
```

#### GET /v1/reservations/group/{groupReservationId}/status
**Description**: Get group reservation creation status

**Path Parameters**:
- `groupReservationId` - Unique identifier for the group reservation

**Response**:
```json
{
  "groupReservationId": "string",
  "status": "CONFIRMED",
  "confirmationNumber": "string",
  "totalRooms": 10,
  "totalAmount": {
    "amount": 1799.90,
    "currency": "USD"
  }
}
```

### Library Services

#### GET /v1/library/event-templates
**Description**: Get available event templates

**Query Parameters**:
- `category` - Template category (optional)
- `eventType` - Type of event (optional)

**Response**:
```json
{
  "templates": [
    {
      "templateId": "string",
      "name": "string",
      "category": "CONFERENCE",
      "description": "string",
      "settings": {
        "defaultHousingDuration": 3,
        "allowGroupBookings": true
      }
    }
  ]
}
```

#### GET /v1/library/hotels/{hotelId}/details
**Description**: Get detailed hotel information from library

**Path Parameters**:
- `hotelId` - Unique identifier for the hotel

**Response**:
```json
{
  "hotelId": "string",
  "name": "string",
  "brand": "string",
  "starRating": 4,
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "amenities": ["WIFI", "POOL", "FITNESS_CENTER"],
  "policies": {
    "checkInTime": "15:00",
    "checkOutTime": "11:00",
    "cancellationPolicy": "string"
  }
}
```

#### GET /v1/library/hotels/{hotelId}/rooms
**Description**: Get hotel room types from library

**Path Parameters**:
- `hotelId` - Unique identifier for the hotel

**Response**:
```json
{
  "rooms": [
    {
      "roomTypeId": "string",
      "name": "string",
      "description": "string",
      "maxOccupancy": 2,
      "bedConfiguration": "1 King Bed",
      "amenities": ["WIFI", "MINI_FRIDGE"],
      "images": ["url1", "url2"]
    }
  ]
}
```

### Association Management

#### POST /v1/associations/link
**Description**: Link bridge registration number to reservation

**Request Body**:
```json
{
  "bridgeRegistrationNumber": "string",
  "reservationId": "string",
  "linkType": "PRIMARY"
}
```

**Response**:
```json
{
  "associationId": "string",
  "status": "LINKED",
  "linkedAt": "2024-01-10T12:00:00Z"
}
```

#### DELETE /v1/associations/{associationId}
**Description**: Unlink bridge registration number from reservation

**Path Parameters**:
- `associationId` - Unique identifier for the association

**Response**:
```json
{
  "associationId": "string",
  "status": "UNLINKED",
  "unlinkedAt": "2024-01-10T12:30:00Z"
}
```

### Bridge Operations

#### GET /v1/connections/bridge/{bridgeRegistrationNumber}
**Description**: Get bridge information by registration number

**Path Parameters**:
- `bridgeRegistrationNumber` - Bridge registration number

**Response**:
```json
{
  "bridgeRegistrationNumber": "string",
  "status": "ACTIVE",
  "eventId": "string",
  "registrantInfo": {
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  },
  "linkedReservations": ["reservation-id-1"]
}
```

#### POST /v1/connections/bridge
**Description**: Create a new bridge

**Request Body**:
```json
{
  "eventId": "string",
  "registrantInfo": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string"
  },
  "preferences": {
    "communicationPreference": "EMAIL",
    "specialRequests": "string"
  }
}
```

**Response**:
```json
{
  "bridgeRegistrationNumber": "string",
  "status": "CREATED",
  "createdAt": "2024-01-10T13:00:00Z"
}
```

#### PUT /v1/connections/bridge/{bridgeRegistrationNumber}
**Description**: Modify bridge by registration number

**Path Parameters**:
- `bridgeRegistrationNumber` - Bridge registration number

**Request Body**:
```json
{
  "registrantInfo": {
    "phone": "string"
  },
  "preferences": {
    "specialRequests": "Updated requests"
  }
}
```

#### DELETE /v1/connections/bridge/{bridgeRegistrationNumber}
**Description**: Cancel bridge by registration number

**Path Parameters**:
- `bridgeRegistrationNumber` - Bridge registration number

**Response**:
```json
{
  "bridgeRegistrationNumber": "string",
  "status": "CANCELLED",
  "cancelledAt": "2024-01-10T14:00:00Z"
}
```

## Error Responses

All endpoints may return the following error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-10T15:00:00Z",
    "requestId": "string"
  }
}
```

### Common Error Codes
- `INVALID_REQUEST`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: Insufficient permissions
- `CONFLICT`: Resource conflict (e.g., duplicate creation)
- `SERVICE_UNAVAILABLE`: External service temporarily unavailable
- `INTERNAL_ERROR`: Unexpected server error

## Rate Limiting

API requests are subject to rate limiting:
- **Standard endpoints**: 1000 requests per hour per client
- **Bulk operations**: 100 requests per hour per client
- **Search endpoints**: 500 requests per hour per client

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641826800
```
# API Reference

## Base URL

**Development**: `https://dev-manage.passkey.com`
**Staging**: `https://staging-manage.passkey.com`
**Production**: `https://manage.passkey.com`

## Authentication

All API endpoints require authentication through the Passkey authentication service. Requests must include valid session cookies or authentication tokens.

### Authentication Headers
```
Cookie: JSESSIONID=<session-id>
Authorization: Bearer <token>
```

## Core Endpoints

### Reservation Management

#### GET /reservations
**Description**: Retrieve reservation listings with filtering and pagination

**Query Parameters**:
- `page` - Page number (default: 1)
- `size` - Page size (default: 20)
- `status` - Filter by reservation status
- `hotelId` - Filter by hotel ID
- `guestName` - Filter by guest name
- `dateFrom` - Start date filter (ISO 8601)
- `dateTo` - End date filter (ISO 8601)

**Response**:
```json
{
  "reservations": [
    {
      "id": "12345",
      "confirmationNumber": "ABC123",
      "guestName": "John Doe",
      "hotelId": "hotel-456",
      "checkIn": "2024-03-15",
      "checkOut": "2024-03-18",
      "status": "confirmed",
      "roomType": "standard",
      "totalAmount": 450.00,
      "currency": "USD"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### GET /reservations/{id}
**Description**: Retrieve detailed information for a specific reservation

**Path Parameters**:
- `id` - Reservation ID

**Response**:
```json
{
  "id": "12345",
  "confirmationNumber": "ABC123",
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123"
  },
  "hotel": {
    "id": "hotel-456",
    "name": "Grand Hotel",
    "address": "123 Main St, City, State"
  },
  "dates": {
    "checkIn": "2024-03-15",
    "checkOut": "2024-03-18",
    "nights": 3
  },
  "room": {
    "type": "standard",
    "number": "205",
    "rate": 150.00
  },
  "status": "confirmed",
  "totalAmount": 450.00,
  "currency": "USD",
  "createdAt": "2024-03-01T10:30:00Z",
  "updatedAt": "2024-03-01T10:30:00Z"
}
```

#### POST /reservations
**Description**: Update or modify an existing reservation (Note: Resdesk does not create new reservations - those are created through booking applications)

**Request Body**:
```json
{
  "reservationId": "existing-reservation-123",
  "guest": {
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1-555-0456"
  },
  "checkIn": "2024-04-10",
  "checkOut": "2024-04-13",
  "roomType": "deluxe",
  "specialRequests": "Late check-in requested"
}
```

**Response**:
```json
{
  "id": "existing-reservation-123",
  "confirmationNumber": "DEF456",
  "status": "modified",
  "message": "Reservation updated successfully"
}
```

#### PUT /reservations/{id}
**Description**: Update an existing reservation

**Path Parameters**:
- `id` - Reservation ID

**Request Body**:
```json
{
  "checkIn": "2024-04-11",
  "checkOut": "2024-04-14",
  "roomType": "suite",
  "specialRequests": "Ocean view preferred"
}
```

#### DELETE /reservations/{id}
**Description**: Cancel a reservation

**Path Parameters**:
- `id` - Reservation ID

**Response**:
```json
{
  "message": "Reservation cancelled successfully",
  "cancellationId": "CANCEL-123"
}
```

### Hotel Management

#### GET /hotels
**Description**: Retrieve list of hotels

**Query Parameters**:
- `city` - Filter by city
- `state` - Filter by state
- `active` - Filter by active status (true/false)

**Response**:
```json
{
  "hotels": [
    {
      "id": "hotel-123",
      "name": "City Center Hotel",
      "address": "456 Downtown Ave",
      "city": "New York",
      "state": "NY",
      "phone": "+1-555-0789",
      "active": true
    }
  ]
}
```

#### GET /hotels/{id}
**Description**: Get detailed hotel information

**Path Parameters**:
- `id` - Hotel ID

**Response**:
```json
{
  "id": "hotel-123",
  "name": "City Center Hotel",
  "description": "Modern hotel in downtown area",
  "address": {
    "street": "456 Downtown Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "contact": {
    "phone": "+1-555-0789",
    "email": "info@citycenterhotel.com",
    "website": "https://citycenterhotel.com"
  },
  "amenities": ["wifi", "parking", "gym", "pool"],
  "roomTypes": [
    {
      "type": "standard",
      "description": "Standard room with city view",
      "baseRate": 150.00
    }
  ]
}
```

### Call Center Operations

#### GET /callcenter/dashboard
**Description**: Get call center dashboard data

**Response**:
```json
{
  "stats": {
    "activeReservations": 1250,
    "pendingRequests": 45,
    "todayCheckIns": 89,
    "todayCheckOuts": 76
  },
  "alerts": [
    {
      "type": "warning",
      "message": "High volume of cancellations detected",
      "timestamp": "2024-03-15T14:30:00Z"
    }
  ]
}
```

#### POST /callcenter/notes
**Description**: Add notes to a reservation

**Request Body**:
```json
{
  "reservationId": "12345",
  "note": "Guest requested late checkout",
  "category": "special_request",
  "agentId": "agent-789"
}
```

### File Upload and Scanning

#### POST /upload/scan
**Description**: Upload and scan files for malware

**Request**: Multipart form data with file

**Response**:
```json
{
  "fileId": "file-abc123",
  "filename": "document.pdf",
  "scanResult": "clean",
  "uploadedAt": "2024-03-15T15:45:00Z"
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "checkIn",
        "message": "Check-in date must be in the future"
      }
    ],
    "timestamp": "2024-03-15T16:00:00Z",
    "requestId": "req-xyz789"
  }
}
```

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., double booking)
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

## Rate Limiting

API requests are subject to rate limiting:
- **Authenticated users**: 1000 requests per hour
- **Call center agents**: 5000 requests per hour
- **System integrations**: 10000 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1647360000
```

## Webhooks

### Reservation Events
The system can send webhook notifications for reservation events:

#### Webhook Payload Example
```json
{
  "event": "reservation.confirmed",
  "timestamp": "2024-03-15T17:00:00Z",
  "data": {
    "reservationId": "12345",
    "confirmationNumber": "ABC123",
    "hotelId": "hotel-456",
    "guestEmail": "john.doe@example.com"
  }
}
```

#### Supported Events
- `reservation.created`
- `reservation.confirmed`
- `reservation.modified`
- `reservation.cancelled`
- `guest.checkin`
- `guest.checkout`

## SDK and Client Libraries

Official client libraries are available for:
- Java
- JavaScript/Node.js
- Python
- C#

Example usage (Java):
```java
PasskeyResdeskClient client = new PasskeyResdeskClient(apiUrl, apiKey);
Reservation reservation = client.getReservation("12345");
```
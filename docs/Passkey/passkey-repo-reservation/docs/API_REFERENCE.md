# API Reference

## Base URL
`https://passkey-reservation-service.{environment}.cvent.org`

## Authentication
All API endpoints require authentication via:
- **JWT Token**: Bearer token in Authorization header
- **API Key**: Service-to-service authentication

## API Versions
- **v2**: Current stable version
- **v3**: Latest version with enhanced features

## Core Endpoints

### Group Booking Resources

#### POST /v2/group-bookings
**Description**: Create a new group booking reservation

**Request Body**:
```json
{
  "eventId": "string",
  "hotelId": "string",
  "checkInDate": "2024-03-15",
  "checkOutDate": "2024-03-17",
  "rooms": [
    {
      "roomTypeId": "string",
      "quantity": 2,
      "rate": 150.00
    }
  ],
  "attendees": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123"
    }
  ]
}
```

**Response**:
```json
{
  "reservationId": "res_123456789",
  "confirmationNumber": "CNF789012",
  "masterAcknowledgmentNumber": "MACK123456",
  "status": "ACTIVE",
  "totalAmount": 300.00,
  "currency": "USD",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 201: Created successfully
- 400: Invalid request data
- 401: Unauthorized
- 409: Conflict (inventory unavailable)

#### GET /v2/group-bookings/{reservationId}
**Description**: Retrieve group booking details

**Path Parameters**:
- `reservationId` - Unique reservation identifier

**Response**:
```json
{
  "reservationId": "res_123456789",
  "confirmationNumber": "CNF789012",
  "masterAcknowledgmentNumber": "MACK123456",
  "status": "ACTIVE",
  "eventId": "evt_456789",
  "hotelId": "hotel_123",
  "checkInDate": "2024-03-15",
  "checkOutDate": "2024-03-17",
  "rooms": [...],
  "attendees": [...],
  "totalAmount": 300.00,
  "createdAt": "2024-01-15T10:30:00Z",
  "modifiedAt": "2024-01-15T10:30:00Z"
}
```

#### PUT /v2/group-bookings/{reservationId}
**Description**: Update existing group booking

**Path Parameters**:
- `reservationId` - Unique reservation identifier

**Request Body**: Same as POST with updated fields

**Status Codes**:
- 200: Updated successfully
- 404: Reservation not found
- 409: Update conflict

#### DELETE /v2/group-bookings/{reservationId}
**Description**: Cancel group booking

**Query Parameters**:
- `reason` - Cancellation reason (optional)
- `refundAmount` - Refund amount (optional)

**Status Codes**:
- 204: Cancelled successfully
- 404: Reservation not found
- 409: Cannot cancel (e.g., already checked in)

### Orchestrated Reservation Resources

#### POST /v2/orchestrated-reservations
**Description**: Create reservation through orchestration workflow

**Request Body**:
```json
{
  "workflowType": "STANDARD_BOOKING",
  "eventId": "string",
  "hotelId": "string",
  "reservationDetails": {
    "checkInDate": "2024-03-15",
    "checkOutDate": "2024-03-17",
    "rooms": [...],
    "attendees": [...]
  },
  "paymentDetails": {
    "paymentMethodId": "pm_123456",
    "billingAddress": {...}
  }
}
```

**Response**:
```json
{
  "workflowId": "wf_789012345",
  "reservationId": "res_123456789",
  "status": "IN_PROGRESS",
  "estimatedCompletionTime": "2024-01-15T10:35:00Z"
}
```

#### GET /v2/orchestrated-reservations/{workflowId}/status
**Description**: Check orchestration workflow status

**Response**:
```json
{
  "workflowId": "wf_789012345",
  "status": "COMPLETED",
  "currentStep": "PAYMENT_PROCESSING",
  "completedSteps": ["INVENTORY_CHECK", "RESERVATION_CREATE"],
  "reservationId": "res_123456789",
  "errors": []
}
```

### Reservation Data Resources

#### GET /v2/reservations/{reservationId}
**Description**: Get reservation details

**Path Parameters**:
- `reservationId` - Unique reservation identifier

**Query Parameters**:
- `includeAttendees` - Include attendee details (default: true)
- `includePayments` - Include payment information (default: false)

**Response**:
```json
{
  "reservationId": "res_123456789",
  "confirmationNumber": "CNF789012",
  "masterAcknowledgmentNumber": "MACK123456",
  "status": "ACTIVE",
  "type": "GROUP_BOOKING",
  "eventId": "evt_456789",
  "hotelId": "hotel_123",
  "hotelName": "Grand Hotel Downtown",
  "checkInDate": "2024-03-15",
  "checkOutDate": "2024-03-17",
  "numberOfNights": 2,
  "rooms": [
    {
      "roomId": "room_001",
      "roomType": "STANDARD_DOUBLE",
      "rate": 150.00,
      "occupancy": 2
    }
  ],
  "attendees": [
    {
      "attendeeId": "att_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "roomAssignment": "room_001"
    }
  ],
  "totalAmount": 300.00,
  "currency": "USD",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### PATCH /v2/reservations/{reservationId}
**Description**: Partially update reservation

**Request Body**:
```json
{
  "checkInDate": "2024-03-16",
  "specialRequests": "Late checkout requested"
}
```

### Room Lists Resources

#### GET /v2/room-lists
**Description**: Get available room lists for an event

**Query Parameters**:
- `eventId` - Event identifier (required)
- `hotelId` - Hotel identifier (optional)
- `checkInDate` - Check-in date (required)
- `checkOutDate` - Check-out date (required)

**Response**:
```json
{
  "eventId": "evt_456789",
  "roomLists": [
    {
      "hotelId": "hotel_123",
      "hotelName": "Grand Hotel Downtown",
      "roomTypes": [
        {
          "roomTypeId": "rt_001",
          "roomTypeName": "Standard Double",
          "baseRate": 150.00,
          "availableRooms": 25,
          "amenities": ["WiFi", "AC", "TV"]
        }
      ]
    }
  ]
}
```

### Waitlist Resources

#### POST /v2/waitlists
**Description**: Add reservation to waitlist when inventory unavailable

**Request Body**:
```json
{
  "eventId": "string",
  "hotelId": "string",
  "checkInDate": "2024-03-15",
  "checkOutDate": "2024-03-17",
  "roomTypeId": "rt_001",
  "quantity": 1,
  "attendeeDetails": {
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com"
  },
  "priority": "STANDARD"
}
```

**Response**:
```json
{
  "waitlistId": "wl_123456789",
  "position": 5,
  "estimatedAvailabilityDate": "2024-02-01",
  "status": "ACTIVE"
}
```

#### GET /v2/waitlists/{waitlistId}
**Description**: Get waitlist entry details

**Response**:
```json
{
  "waitlistId": "wl_123456789",
  "reservationRequest": {...},
  "position": 3,
  "status": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00Z",
  "estimatedAvailabilityDate": "2024-02-01"
}
```

### Admin Resources

#### GET /admin/reservations
**Description**: Administrative search for reservations

**Query Parameters**:
- `eventId` - Filter by event
- `hotelId` - Filter by hotel
- `status` - Filter by status
- `dateFrom` - Date range start
- `dateTo` - Date range end
- `page` - Page number (default: 0)
- `size` - Page size (default: 20)

**Response**:
```json
{
  "content": [
    {
      "reservationId": "res_123456789",
      "confirmationNumber": "CNF789012",
      "status": "ACTIVE",
      "guestName": "John Doe",
      "hotelName": "Grand Hotel Downtown",
      "checkInDate": "2024-03-15",
      "totalAmount": 300.00
    }
  ],
  "totalElements": 150,
  "totalPages": 8,
  "number": 0,
  "size": 20
}
```

#### PUT /admin/reservations/{reservationId}/status
**Description**: Administrative status change

**Request Body**:
```json
{
  "status": "CANCELLED",
  "reason": "Guest request",
  "adminUserId": "admin_123"
}
```

### Guarantee Type Resources

#### GET /v2/guarantee-types
**Description**: Get available guarantee types for reservations

**Query Parameters**:
- `hotelId` - Hotel identifier (required)

**Response**:
```json
{
  "guaranteeTypes": [
    {
      "guaranteeTypeId": "gt_001",
      "name": "Credit Card",
      "description": "Guaranteed with credit card",
      "requiresPayment": true,
      "cancellationPolicy": "24 hours before check-in"
    },
    {
      "guaranteeTypeId": "gt_002",
      "name": "Corporate Account",
      "description": "Guaranteed with corporate billing",
      "requiresPayment": false,
      "cancellationPolicy": "48 hours before check-in"
    }
  ]
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "checkInDate",
        "message": "Check-in date must be in the future"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `INVENTORY_UNAVAILABLE`: Requested rooms not available
- `PAYMENT_FAILED`: Payment processing failed
- `RESERVATION_NOT_FOUND`: Reservation does not exist
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `CONFLICT`: Operation conflicts with current state
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limiting
- **Standard endpoints**: 1000 requests per minute per API key
- **Admin endpoints**: 100 requests per minute per API key
- **Bulk operations**: 10 requests per minute per API key

## Pagination
List endpoints support pagination with the following parameters:
- `page`: Page number (0-based, default: 0)
- `size`: Page size (max: 100, default: 20)
- `sort`: Sort field and direction (e.g., `createdAt,desc`)

## Webhooks
The service supports webhooks for real-time notifications:
- `reservation.created`
- `reservation.updated`
- `reservation.cancelled`
- `waitlist.activated`
- `payment.processed`

Configure webhook endpoints in the service configuration.
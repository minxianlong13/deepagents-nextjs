# API Reference

## Base URLs

### Passkey API Service
- **Development**: `https://api-dev.passkey.com`
- **Staging**: `https://api-staging.passkey.com`
- **Production**: `https://api.passkey.com`

### Passkey GroupLink Service
- **Development**: `https://gl-dev.passkey.com`
- **Staging**: `https://gl-staging.passkey.com`
- **Production**: `https://gl.passkey.com`

## Authentication

All API endpoints require authentication via:
- **Bearer Token**: JWT token in Authorization header
- **API Key**: Service-to-service authentication
- **OAuth 2.0**: For partner integrations

```http
Authorization: Bearer <jwt_token>
```

## Passkey API Endpoints

### Amadeus Integration

#### POST /amadeus/booking
**Description**: Process hotel booking through Amadeus system

**Request Body**:
```json
{
  "hotelId": "string",
  "checkIn": "2024-03-15",
  "checkOut": "2024-03-18",
  "guests": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    }
  ],
  "rooms": 1,
  "rateCode": "CORP"
}
```

**Response**:
```json
{
  "bookingId": "AMX123456789",
  "confirmationNumber": "CONF789",
  "status": "CONFIRMED",
  "totalAmount": 450.00,
  "currency": "USD"
}
```

**Status Codes**:
- 200: Booking successful
- 400: Invalid request data
- 401: Authentication failed
- 404: Hotel not found
- 500: Internal server error

## GroupLink API Endpoints

### Group Management Layer (GML)

#### GET /gml/groups/{groupId}
**Description**: Retrieve group booking details

**Path Parameters**:
- `groupId` - Unique group identifier

**Response**:
```json
{
  "groupId": "GRP123456",
  "groupName": "Corporate Conference 2024",
  "hotelId": "HTL789",
  "checkIn": "2024-06-15",
  "checkOut": "2024-06-18",
  "totalRooms": 50,
  "blockedRooms": 45,
  "availableRooms": 5,
  "status": "ACTIVE"
}
```

#### POST /gml/groups
**Description**: Create new group booking

**Request Body**:
```json
{
  "groupName": "Annual Sales Meeting",
  "hotelId": "HTL456",
  "checkIn": "2024-09-10",
  "checkOut": "2024-09-13",
  "roomsNeeded": 25,
  "rateCode": "GROUP",
  "contactInfo": {
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "phone": "+1-555-0123"
  }
}
```

### Transfer Processing

#### POST /transfers/inbound
**Description**: Process inbound hotel data transfer

**Request Body**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<HotelReservation>
  <ReservationId>RSV123456</ReservationId>
  <HotelCode>HTL789</HotelCode>
  <GuestName>John Doe</GuestName>
  <CheckIn>2024-03-15</CheckIn>
  <CheckOut>2024-03-18</CheckOut>
  <RoomType>DELUXE</RoomType>
  <Rate>150.00</Rate>
</HotelReservation>
```

**Response**:
```json
{
  "transferId": "TXN789123",
  "status": "PROCESSED",
  "reservationId": "RSV123456",
  "processedAt": "2024-02-05T10:30:00Z"
}
```

#### GET /transfers/inbound/v2/{transferId}
**Description**: Get transfer processing status (Version 2)

**Path Parameters**:
- `transferId` - Transfer transaction identifier

**Response**:
```json
{
  "transferId": "TXN789123",
  "status": "COMPLETED",
  "originalData": "...",
  "transformedData": "...",
  "errors": [],
  "processedAt": "2024-02-05T10:30:00Z",
  "completedAt": "2024-02-05T10:31:15Z"
}
```

### Email Processing

#### POST /email/send
**Description**: Send booking confirmation or notification email

**Request Body**:
```json
{
  "templateId": "booking_confirmation",
  "recipient": "guest@example.com",
  "data": {
    "guestName": "John Doe",
    "confirmationNumber": "CONF123",
    "hotelName": "Grand Hotel",
    "checkIn": "2024-03-15",
    "checkOut": "2024-03-18"
  }
}
```

**Response**:
```json
{
  "emailId": "EMAIL789456",
  "status": "SENT",
  "sentAt": "2024-02-05T10:35:00Z"
}
```

### Callback Management

#### POST /callback/webhook
**Description**: Handle webhook callbacks from external systems

**Request Body**:
```json
{
  "eventType": "BOOKING_CONFIRMED",
  "timestamp": "2024-02-05T10:40:00Z",
  "data": {
    "bookingId": "BKG123456",
    "status": "CONFIRMED",
    "hotelId": "HTL789"
  },
  "signature": "sha256=abc123..."
}
```

**Response**:
```json
{
  "received": true,
  "processed": true,
  "callbackId": "CB789123"
}
```

### Availability, Rates, and Inventory (ARI)

#### GET /ari/availability
**Description**: Check room availability for specified dates

**Query Parameters**:
- `hotelId` - Hotel identifier
- `checkIn` - Check-in date (YYYY-MM-DD)
- `checkOut` - Check-out date (YYYY-MM-DD)
- `roomType` - Room type code (optional)

**Response**:
```json
{
  "hotelId": "HTL789",
  "checkIn": "2024-03-15",
  "checkOut": "2024-03-18",
  "availability": [
    {
      "roomType": "STANDARD",
      "available": 10,
      "rate": 120.00
    },
    {
      "roomType": "DELUXE",
      "available": 5,
      "rate": 180.00
    }
  ]
}
```

#### POST /ari/rates/update
**Description**: Update room rates for specified dates

**Request Body**:
```json
{
  "hotelId": "HTL789",
  "updates": [
    {
      "roomType": "STANDARD",
      "date": "2024-03-15",
      "rate": 125.00,
      "availability": 8
    }
  ]
}
```

### Data Transformation

#### POST /transformation/xml-to-json
**Description**: Transform XML hotel data to JSON format

**Request Body**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<HotelData>
  <Property id="HTL123">
    <Name>Sample Hotel</Name>
    <Address>123 Main St</Address>
  </Property>
</HotelData>
```

**Response**:
```json
{
  "transformationId": "TXF456789",
  "result": {
    "hotelData": {
      "property": {
        "id": "HTL123",
        "name": "Sample Hotel",
        "address": "123 Main St"
      }
    }
  }
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
        "field": "checkIn",
        "message": "Check-in date must be in the future"
      }
    ],
    "timestamp": "2024-02-05T10:45:00Z",
    "requestId": "REQ123456789"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_FAILED` - Invalid or expired authentication
- `AUTHORIZATION_DENIED` - Insufficient permissions
- `VALIDATION_ERROR` - Request data validation failed
- `RESOURCE_NOT_FOUND` - Requested resource does not exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXTERNAL_SERVICE_ERROR` - Downstream service failure
- `INTERNAL_SERVER_ERROR` - Unexpected server error

## Rate Limiting

- **Default Limit**: 1000 requests per hour per API key
- **Burst Limit**: 100 requests per minute
- **Headers**:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Webhooks

### Webhook Events
- `BOOKING_CREATED` - New booking created
- `BOOKING_MODIFIED` - Booking details changed
- `BOOKING_CANCELLED` - Booking cancelled
- `PAYMENT_PROCESSED` - Payment completed
- `TRANSFER_COMPLETED` - Data transfer finished

### Webhook Payload
```json
{
  "eventId": "EVT123456789",
  "eventType": "BOOKING_CREATED",
  "timestamp": "2024-02-05T10:50:00Z",
  "data": {
    "bookingId": "BKG789456",
    "hotelId": "HTL123",
    "status": "CONFIRMED"
  }
}
```

## SDK and Client Libraries

### Java Client
```java
PasskeyClient client = new PasskeyClient("your-api-key");
BookingResponse response = client.createBooking(bookingRequest);
```

### cURL Examples

#### Create Group Booking
```bash
curl -X POST https://gl.passkey.com/gml/groups \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "Conference 2024",
    "hotelId": "HTL456",
    "checkIn": "2024-09-10",
    "checkOut": "2024-09-13",
    "roomsNeeded": 25
  }'
```

#### Check Availability
```bash
curl -X GET "https://gl.passkey.com/ari/availability?hotelId=HTL789&checkIn=2024-03-15&checkOut=2024-03-18" \
  -H "Authorization: Bearer your-jwt-token"
```
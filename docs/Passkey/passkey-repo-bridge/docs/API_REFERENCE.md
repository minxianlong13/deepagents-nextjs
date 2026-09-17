# API Reference

## Base URL
`https://passkey-bridge-service.{environment}.cvent.com`

## Authentication
All endpoints require API key authentication via the `Authorization` header.

## Endpoints

### Registration Management

#### GET /registrations/{registrationNumber}
**Description**: Retrieve a bridge registration by registration number

**Path Parameters**:
- `registrationNumber` - Bridge registration acknowledgment number

**Response**:
```json
{
  "regNumber": "REG123456",
  "eventId": 12345,
  "subBlockGroupId": 67890,
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "555-0123"
  },
  "address": {
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": {
      "code": "US",
      "name": "United States"
    }
  },
  "travelInfo": {
    "checkInDate": "2024-03-15",
    "checkOutDate": "2024-03-18",
    "numberOfNights": 3
  },
  "payInfo": {
    "guaranteeType": "CREDIT_CARD",
    "cardType": "VISA",
    "cardNumber": "****1234"
  },
  "status": "CONFIRMED",
  "createdDate": "2024-01-15T10:30:00Z",
  "modifiedDate": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 200: Success
- 404: Registration not found
- 401: Unauthorized

#### POST /registrations
**Description**: Create a new bridge registration

**Request Body**:
```json
{
  "eventId": 12345,
  "subBlockGroupId": 67890,
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "555-0123"
  },
  "address": {
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": {
      "code": "US",
      "name": "United States"
    }
  },
  "travelInfo": {
    "checkInDate": "2024-03-15",
    "checkOutDate": "2024-03-18",
    "numberOfNights": 3
  },
  "payInfo": {
    "guaranteeType": "CREDIT_CARD",
    "cardType": "VISA",
    "cardNumber": "4111111111111111",
    "expirationMonth": 12,
    "expirationYear": 2025
  }
}
```

**Response**: Returns the created registration with generated `regNumber`

**Status Codes**:
- 200: Registration created successfully
- 400: Invalid request data
- 401: Unauthorized

#### PUT /registrations/{registrationNumber}
**Description**: Modify an existing bridge registration

**Path Parameters**:
- `registrationNumber` - Bridge registration acknowledgment number

**Request Body**: Same as POST /registrations

**Response**: Returns the updated registration

**Status Codes**:
- 200: Registration updated successfully
- 400: Invalid request data
- 404: Registration not found
- 401: Unauthorized

#### DELETE /registrations/{registrationNumber}
**Description**: Cancel a bridge registration

**Path Parameters**:
- `registrationNumber` - Bridge registration acknowledgment number

**Response**: Returns the cancelled registration with updated status

**Status Codes**:
- 200: Registration cancelled successfully
- 404: Registration not found
- 401: Unauthorized

### Association Management

#### POST /registrations/{registrationNumber}/reservations/{confirmationNumber}
**Description**: Link a bridge registration to a hotel reservation

**Path Parameters**:
- `registrationNumber` - Bridge registration acknowledgment number
- `confirmationNumber` - Hotel reservation confirmation number

**Request Body**:
```json
{
  "associationType": "CONFIRMED",
  "associationDate": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 204: Association created successfully
- 400: Invalid request data
- 404: Registration not found
- 401: Unauthorized

#### DELETE /registrations/{registrationNumber}/reservations/{confirmationNumber}
**Description**: Unlink a bridge registration from a hotel reservation

**Path Parameters**:
- `registrationNumber` - Bridge registration acknowledgment number
- `confirmationNumber` - Hotel reservation confirmation number

**Status Codes**:
- 204: Association removed successfully
- 404: Registration or association not found
- 401: Unauthorized

### Reporting

#### GET /registrations/event/{eventId}/counts
**Description**: Get reservation counts for an event

**Path Parameters**:
- `eventId` - Event identifier

**Query Parameters**:
- `subBlockGroupId` (optional) - Sub-block group identifier

**Response**:
```json
{
  "eventId": 12345,
  "subBlockGroupId": 67890,
  "unconfirmedCount": 25,
  "totalCount": 100
}
```

**Status Codes**:
- 200: Success
- 404: Event not found
- 401: Unauthorized

## Error Responses

All error responses follow this format:
```json
{
  "errorCodeType": {
    "errorCode": "BRIDGE_NOT_FOUND",
    "message": "Bridge registration not found"
  },
  "httpRequestId": "uuid-string"
}
```

## Common Error Codes

- `BRIDGE_NOT_FOUND`: Registration not found
- `INVALID_REQUEST`: Request validation failed
- `UNAUTHORIZED`: API key invalid or missing
- `INTERNAL_ERROR`: Server error occurred

## Rate Limiting

API endpoints are subject to rate limiting. Clients should implement appropriate retry logic with exponential backoff.

## Examples

### Create Registration with cURL
```bash
curl -X POST \
  https://passkey-bridge-service.dev.cvent.com/registrations \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "eventId": 12345,
    "guest": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "travelInfo": {
      "checkInDate": "2024-03-15",
      "checkOutDate": "2024-03-18"
    }
  }'
```

### Link Registration to Reservation
```bash
curl -X POST \
  https://passkey-bridge-service.dev.cvent.com/registrations/REG123456/reservations/CONF789012 \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "associationType": "CONFIRMED"
  }'
```
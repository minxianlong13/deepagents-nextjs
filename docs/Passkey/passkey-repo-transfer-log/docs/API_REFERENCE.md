# API Reference

## Base URL

The Passkey Transfer Log Service provides RESTful APIs accessible at:
```
https://{environment}.passkey-transfer-log-service.cvent.com
```

## Authentication

All endpoints require API key authentication using Cvent's auth-service:

```http
Authorization: Bearer {api_key}
```

## Core Transfer Log API (`/passkey-transfer-log/v1`)

### Transfer State Management

#### Get Transfer State
**GET** `/passkey-transfer-log/v1/transfer-state`

Retrieves transfer state information based on search criteria.

**Query Parameters**:
- `reservationId` (Long) - Reservation ID
- `resAckNumber` (String) - Reservation acknowledgement number
- `eventId` (Long) - Event ID
- `hotelId` (Long) - Hotel ID

**Response**:
```json
{
  "reservationId": 12345,
  "resAckNumber": "RES123456",
  "transferState": "PENDING",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModifiedDate": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found

#### Update Transfer State
**POST** `/passkey-transfer-log/v1/transfer-state`

Creates or updates transfer state information.

**Request Body**:
```json
{
  "reservationId": 12345,
  "resAckNumber": "RES123456",
  "transferState": "COMPLETED",
  "transferResult": "SUCCESS",
  "extendedInfo": {
    "transferDate": "2024-01-15T10:30:00Z",
    "transferredBy": "system"
  }
}
```

**Response**:
```json
{
  "reservationId": 12345,
  "resAckNumber": "RES123456",
  "transferState": "COMPLETED",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModifiedDate": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 201: Created
- 400: Bad Request
- 401: Unauthorized

### Folio Transfer State Management

#### Get Folio Transfer States
**GET** `/passkey-transfer-log/v1/folio-transfer-states`

Retrieves folio transfer states by reservation ID or acknowledgement number.

**Query Parameters**:
- `reservationId` (Long) - Reservation ID
- `resAckNumber` (String) - Reservation acknowledgement number

**Response**:
```json
[
  {
    "reservationId": 12345,
    "suffix": "001",
    "transferState": "PENDING",
    "folioAckNumber": "FOL123456",
    "createdDate": "2024-01-15T10:30:00Z"
  }
]
```

#### Update Folio Transfer State
**POST** `/passkey-transfer-log/v1/folio-transfer-states`

Creates or updates folio transfer state.

**Request Body**:
```json
{
  "reservationId": 12345,
  "suffix": "001",
  "transferState": "COMPLETED",
  "folioAckNumber": "FOL123456"
}
```

### Combine Queue Management

#### Get Combine Queue Record
**GET** `/passkey-transfer-log/v1/combine-transfer-queue/{resAckNumber}`

Retrieves combine queue record by reservation acknowledgement number.

**Path Parameters**:
- `resAckNumber` (String) - Reservation acknowledgement number

**Response**:
```json
{
  "resAckNumber": "RES123456",
  "status": "PENDING",
  "priority": 1,
  "createdDate": "2024-01-15T10:30:00Z"
}
```

#### Update Combine Queue
**POST** `/passkey-transfer-log/v1/combine-transfer-queue`

Adds or updates combine queue record.

**Request Body**:
```json
{
  "resAckNumber": "RES123456",
  "status": "PROCESSING",
  "priority": 1
}
```

#### Delete Combine Queue Record
**DELETE** `/passkey-transfer-log/v1/combine-transfer-queue/{resAckNumber}`

Deletes combine queue record.

**Path Parameters**:
- `resAckNumber` (String) - Reservation acknowledgement number

#### Process Combine Queue Records
**POST** `/passkey-transfer-log/v1/combine-transfer-queue/process`

Processes combine queue records based on criteria.

**Request Body**:
```json
{
  "maxRecords": 100,
  "status": "PENDING",
  "priority": 1
}
```

### Reservation Identifiers

#### Search Reservation Identifiers
**GET** `/passkey-transfer-log/v1/reservation-identifiers/search`

Searches for reservation identifiers based on criteria.

**Query Parameters**:
- `eventId` (Long) - Event ID
- `hotelId` (Long) - Hotel ID
- `startDate` (String) - Start date (ISO format)
- `endDate` (String) - End date (ISO format)

**Response**:
```json
[
  {
    "reservationId": 12345,
    "resAckNumber": "RES123456",
    "eventId": 789,
    "hotelId": 456
  }
]
```

#### Get Reservation Identifiers by Folio
**GET** `/passkey-transfer-log/v1/reservation-identifiers-by-folio/{folioAckNumber}`

Retrieves reservation identifiers by folio acknowledgement number.

**Path Parameters**:
- `folioAckNumber` (String) - Folio acknowledgement number

## Transfer Definitions API

### Get Transfer Definitions
**GET** `/transfer-definitions`

Retrieves transfer definitions by event and hotel.

**Query Parameters**:
- `eventId` (Long) - Event ID
- `hotelId` (Long) - Hotel ID

**Response**:
```json
[
  {
    "eventId": 789,
    "hotelId": 456,
    "transferEnabled": true,
    "transferSettings": {
      "autoTransfer": true,
      "transferDelay": 24
    }
  }
]
```

## Reservation Management API

### Search Reservations for Transfer
**GET** `/reservations/search`

Searches for reservations eligible for transfer.

**Query Parameters**:
- `eventId` (Long) - Event ID
- `hotelId` (Long) - Hotel ID
- `status` (String) - Reservation status
- `checkInDate` (String) - Check-in date filter

**Response**:
```json
[
  {
    "reservationId": 12345,
    "resAckNumber": "RES123456",
    "guestName": "John Doe",
    "checkInDate": "2024-02-01",
    "checkOutDate": "2024-02-03",
    "status": "CONFIRMED"
  }
]
```

## Transfer History API

### Get Transfer History
**GET** `/transfer-history`

Retrieves transfer history records.

**Query Parameters**:
- `reservationId` (Long) - Reservation ID
- `eventId` (Long) - Event ID
- `startDate` (String) - Start date filter
- `endDate` (String) - End date filter

**Response**:
```json
[
  {
    "historyId": 1001,
    "reservationId": 12345,
    "action": "TRANSFER_INITIATED",
    "timestamp": "2024-01-15T10:30:00Z",
    "userId": "user123",
    "details": "Transfer initiated for reservation RES123456"
  }
]
```

### Create Transfer History Entry
**POST** `/transfer-history`

Creates a new transfer history entry.

**Request Body**:
```json
{
  "reservationId": 12345,
  "action": "TRANSFER_COMPLETED",
  "userId": "user123",
  "details": "Transfer completed successfully"
}
```

## Transfer Results API (v2)

### Get Transfer Results
**GET** `/v2/transfer-results`

Retrieves transfer results with enhanced filtering.

**Query Parameters**:
- `reservationId` (Long) - Reservation ID
- `transferId` (String) - Transfer ID
- `status` (String) - Transfer status
- `dateRange` (String) - Date range filter

**Response**:
```json
[
  {
    "transferId": "TXN123456",
    "reservationId": 12345,
    "status": "SUCCESS",
    "transferDate": "2024-01-15T10:30:00Z",
    "result": {
      "foliosTransferred": 2,
      "totalAmount": 450.00,
      "currency": "USD"
    }
  }
]
```

### Update Transfer Results
**PUT** `/v2/transfer-results/{transferId}`

Updates transfer result information.

**Path Parameters**:
- `transferId` (String) - Transfer ID

**Request Body**:
```json
{
  "status": "SUCCESS",
  "result": {
    "foliosTransferred": 2,
    "totalAmount": 450.00,
    "currency": "USD"
  }
}
```

## Mapping Rules API

### Get Mapping Rules
**GET** `/mapping-rules`

Retrieves transfer mapping rules.

**Query Parameters**:
- `eventId` (Long) - Event ID
- `hotelId` (Long) - Hotel ID
- `ruleType` (String) - Rule type filter

**Response**:
```json
[
  {
    "ruleId": 1001,
    "eventId": 789,
    "hotelId": 456,
    "ruleType": "ROOM_MAPPING",
    "sourceValue": "STANDARD",
    "targetValue": "STD",
    "active": true
  }
]
```

## External Reservations API

### Get External Reservation Info
**GET** `/external-reservations/{reservationId}`

Retrieves external reservation information.

**Path Parameters**:
- `reservationId` (Long) - Reservation ID

**Response**:
```json
{
  "reservationId": 12345,
  "externalSystemId": "PMS123",
  "externalReservationId": "EXT789",
  "syncStatus": "SYNCHRONIZED",
  "lastSyncDate": "2024-01-15T10:30:00Z"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "BAD_REQUEST",
  "message": "Invalid request parameters",
  "details": "reservationId must be a positive number"
}
```

### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing API key"
}
```

### 404 Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Resource not found",
  "details": "Transfer state not found for reservation ID 12345"
}
```

### 500 Internal Server Error
```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred",
  "requestId": "req-123456789"
}
```

## Rate Limiting

API requests are subject to rate limiting:
- **Rate Limit**: 1000 requests per minute per API key
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Pagination

For endpoints that return lists, pagination is supported:

**Query Parameters**:
- `page` (Integer) - Page number (default: 1)
- `size` (Integer) - Page size (default: 20, max: 100)

**Response Headers**:
- `X-Total-Count`: Total number of items
- `X-Page-Count`: Total number of pages

## Content Types

- **Request Content-Type**: `application/json`
- **Response Content-Type**: `application/json`
- **Character Encoding**: UTF-8
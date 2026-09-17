# API Reference

## Base URL

**Production**: `https://passkey-inbound.cvent.com`  
**Development**: `https://passkey-inbound-dev.cvent.com`  
**Local**: `http://localhost:8080`

All API endpoints are prefixed with `/passkey-inbound/v1` unless otherwise specified.

## Authentication

The service uses OAuth 2.0 for authentication. All endpoints require valid authorization tokens with appropriate scopes.

### Required Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Scopes

- `ADMIN` - Administrative operations and event processing
- `READ` - Read-only access to configurations and data
- `WRITE` - Write access for data modifications

## REST API Endpoints

### Event Processing

#### POST /external-data-load/events

**Description**: Processes external data load events from vendor systems.

**Authorization**: Requires `ADMIN` scope

**Request Body**:
```json
{
  "eventType": "INVENTORY_UPDATE",
  "vendorSystemId": 12345,
  "hotelId": "HTL001",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "roomType": "STANDARD",
    "availability": 50,
    "rate": 199.99
  }
}
```

**Response**:
```json
{
  "status": "ACCEPTED",
  "eventId": "evt_123456789",
  "message": "Event queued for processing"
}
```

**Status Codes**:
- `202 Accepted` - Event successfully queued
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions

---

#### POST /ohip/subscription-tasks

**Description**: Manages OHIP subscription tasks for vendor system integrations.

**Authorization**: Requires `ADMIN` scope

**Request Body**:
```json
{
  "vendorSystemId": 12345,
  "action": "SUBSCRIBE",
  "eventTypes": ["RESERVATION_CREATED", "RESERVATION_MODIFIED"],
  "callbackUrl": "https://vendor.example.com/webhook",
  "credentials": {
    "username": "api_user",
    "password": "encrypted_password"
  }
}
```

**Response**:
```json
{
  "taskId": "task_987654321",
  "status": "PENDING",
  "subscriptionId": "sub_123456789"
}
```

**Status Codes**:
- `200 OK` - Task created successfully
- `400 Bad Request` - Invalid task configuration
- `409 Conflict` - Subscription already exists

---

#### POST /ohip/{vsId}/events

**Description**: Processes a single business event from a specific vendor system.

**Authorization**: Requires `ADMIN` scope

**Path Parameters**:
- `vsId` (Long) - Vendor System ID

**Request Body**:
```json
{
  "newEvent": {
    "eventType": "RESERVATION_CREATED",
    "eventId": "res_123456",
    "timestamp": "2024-01-15T14:30:00Z",
    "hotelId": "HTL001",
    "reservationData": {
      "confirmationNumber": "CNF123456",
      "guestName": "John Doe",
      "checkIn": "2024-02-01",
      "checkOut": "2024-02-05",
      "roomType": "DELUXE",
      "rate": 299.99
    }
  }
}
```

**Response**:
```json
{
  "status": "PROCESSED",
  "eventId": "res_123456",
  "processedAt": "2024-01-15T14:30:15Z"
}
```

---

#### POST /ohip/{vsId}/events/batch

**Description**: Processes multiple business events in a single request for improved performance.

**Authorization**: Requires `ADMIN` scope

**Path Parameters**:
- `vsId` (Long) - Vendor System ID

**Request Body**:
```json
{
  "events": [
    {
      "newEvent": {
        "eventType": "RESERVATION_CREATED",
        "eventId": "res_123456",
        "timestamp": "2024-01-15T14:30:00Z",
        "hotelId": "HTL001",
        "reservationData": { /* reservation details */ }
      }
    },
    {
      "newEvent": {
        "eventType": "INVENTORY_UPDATE",
        "eventId": "inv_789012",
        "timestamp": "2024-01-15T14:31:00Z",
        "hotelId": "HTL001",
        "inventoryData": { /* inventory details */ }
      }
    }
  ]
}
```

**Response**:
```json
{
  "batchId": "batch_456789123",
  "totalEvents": 2,
  "processedEvents": 2,
  "failedEvents": 0,
  "results": [
    {
      "eventId": "res_123456",
      "status": "PROCESSED"
    },
    {
      "eventId": "inv_789012",
      "status": "PROCESSED"
    }
  ]
}
```

### Configuration Management

#### GET /inbound-settings/hotels/{hotelId}/config

**Description**: Retrieves inbound configuration for a specific hotel.

**Authorization**: Requires `READ` scope

**Path Parameters**:
- `hotelId` (String) - Hotel identifier

**Response**:
```json
{
  "hotelId": "HTL001",
  "vendorSystemId": 12345,
  "configuration": {
    "gmlEnabled": true,
    "inboundReservationEnabled": true,
    "inventorySyncEnabled": true,
    "eventFilters": ["RESERVATION_CREATED", "RESERVATION_MODIFIED"],
    "mappingCodes": {
      "roomTypes": {
        "STD": "STANDARD",
        "DLX": "DELUXE"
      }
    }
  },
  "lastUpdated": "2024-01-15T10:00:00Z"
}
```

#### PUT /inbound-settings/hotels/{hotelId}/config

**Description**: Updates inbound configuration for a specific hotel.

**Authorization**: Requires `ADMIN` scope

**Path Parameters**:
- `hotelId` (String) - Hotel identifier

**Request Body**:
```json
{
  "gmlEnabled": true,
  "inboundReservationEnabled": true,
  "inventorySyncEnabled": false,
  "eventFilters": ["RESERVATION_CREATED", "RESERVATION_MODIFIED", "RESERVATION_CANCELLED"],
  "mappingCodes": {
    "roomTypes": {
      "STD": "STANDARD",
      "DLX": "DELUXE",
      "STE": "SUITE"
    }
  }
}
```

### Housing and Hotels

#### GET /housing/hotels

**Description**: Retrieves list of hotels available for housing operations.

**Authorization**: Requires `READ` scope

**Query Parameters**:
- `vendorSystemId` (Long, optional) - Filter by vendor system
- `active` (Boolean, optional) - Filter by active status
- `page` (Integer, optional) - Page number (default: 0)
- `size` (Integer, optional) - Page size (default: 20)

**Response**:
```json
{
  "content": [
    {
      "hotelId": "HTL001",
      "hotelName": "Grand Hotel Downtown",
      "vendorSystemId": 12345,
      "active": true,
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "US"
      },
      "contactInfo": {
        "phone": "+1-555-123-4567",
        "email": "reservations@grandhotel.com"
      }
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

## GraphQL API

### Endpoint

**URL**: `/graphql`  
**Method**: `POST` for queries/mutations, WebSocket for subscriptions

### Subscriptions

#### Business Event Subscription

**Description**: Subscribe to real-time business events for a vendor system.

**Subscription**:
```graphql
subscription BusinessEvents($vendorSystemId: Long!) {
  businessEvents(vendorSystemId: $vendorSystemId) {
    eventId
    eventType
    timestamp
    hotelId
    data
  }
}
```

**Variables**:
```json
{
  "vendorSystemId": 12345
}
```

**Response Stream**:
```json
{
  "data": {
    "businessEvents": {
      "eventId": "res_123456",
      "eventType": "RESERVATION_CREATED",
      "timestamp": "2024-01-15T14:30:00Z",
      "hotelId": "HTL001",
      "data": {
        "confirmationNumber": "CNF123456",
        "guestName": "John Doe",
        "checkIn": "2024-02-01",
        "checkOut": "2024-02-05"
      }
    }
  }
}
```

#### Configuration Updates Subscription

**Description**: Subscribe to configuration changes for hotels and vendor systems.

**Subscription**:
```graphql
subscription ConfigurationUpdates($hotelId: String) {
  configurationUpdates(hotelId: $hotelId) {
    hotelId
    vendorSystemId
    changeType
    timestamp
    configuration
  }
}
```

### Queries

#### Hotel Configuration Query

**Query**:
```graphql
query GetHotelConfig($hotelId: String!) {
  hotelConfiguration(hotelId: $hotelId) {
    hotelId
    vendorSystemId
    gmlEnabled
    inboundReservationEnabled
    inventorySyncEnabled
    eventFilters
    mappingCodes
    lastUpdated
  }
}
```

### Mutations

#### Update Hotel Configuration

**Mutation**:
```graphql
mutation UpdateHotelConfig($hotelId: String!, $config: HotelConfigInput!) {
  updateHotelConfiguration(hotelId: $hotelId, configuration: $config) {
    success
    message
    configuration {
      hotelId
      lastUpdated
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
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "vendorSystemId",
        "message": "Vendor System ID is required"
      }
    ],
    "timestamp": "2024-01-15T14:30:00Z",
    "path": "/passkey-inbound/v1/ohip/events"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_ERROR` - Invalid or missing authentication
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource does not exist
- `CONFLICT` - Resource conflict (e.g., duplicate subscription)
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Downstream service unavailable

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Default Limit**: 1000 requests per minute per API key
- **Burst Limit**: 100 requests per 10 seconds
- **Headers**: Rate limit information is returned in response headers:
  - `X-RateLimit-Limit` - Request limit per window
  - `X-RateLimit-Remaining` - Remaining requests in current window
  - `X-RateLimit-Reset` - Time when the rate limit resets

## Webhooks

### Event Notifications

The service can send webhook notifications for important events:

**Webhook URL Configuration**: Set via hotel configuration API

**Webhook Payload**:
```json
{
  "eventType": "RESERVATION_PROCESSED",
  "eventId": "res_123456",
  "timestamp": "2024-01-15T14:30:00Z",
  "hotelId": "HTL001",
  "vendorSystemId": 12345,
  "data": {
    "confirmationNumber": "CNF123456",
    "status": "CONFIRMED"
  },
  "signature": "sha256=abc123..."
}
```

**Webhook Security**: 
- HMAC-SHA256 signature verification
- Retry mechanism with exponential backoff
- Timeout: 30 seconds per request
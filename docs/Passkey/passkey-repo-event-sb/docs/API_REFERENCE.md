# API Reference

## Base URL

The Passkey Event Service API is available at:
```
https://{environment}.cvent.com/passkey-event/v5/events
```

Where `{environment}` is one of:
- `api-dev` (Development)
- `api-staging` (Staging)  
- `api` (Production)

## Authentication

All API endpoints require authentication via OAuth 2.0 Bearer tokens:

```http
Authorization: Bearer {access_token}
```

## Content Type

All requests and responses use JSON format:

```http
Content-Type: application/json
Accept: application/json
```

## Endpoints

### Get Event Status

Retrieves the current status of a specific event.

**Endpoint**: `GET /{id}`

**Description**: Returns the status of an event as a string value.

**Path Parameters**:
- `id` (Long, required) - The unique identifier of the event

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: text/plain

"OPEN"
```

**Status Codes**:
- `200 OK`: Event status retrieved successfully
- `404 Not Found`: Event not found
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X GET "https://api.cvent.com/passkey-event/v5/events/12345" \
  -H "Authorization: Bearer {access_token}"
```

---

### Get Event Information

Retrieves comprehensive information about a specific event.

**Endpoint**: `GET /{eventId}/event-info`

**Description**: Returns detailed event information including configuration, settings, and metadata.

**Path Parameters**:
- `eventId` (Long, required) - The unique identifier of the event

**Query Parameters**:
- `localeId` (String, optional) - The locale for localization (defaults to "en_US")

**Response**:
```json
{
  "id": 12345,
  "name": "Annual Conference 2024",
  "description": "Our annual company conference",
  "startDate": "2024-06-15T09:00:00Z",
  "endDate": "2024-06-17T17:00:00Z",
  "status": "OPEN",
  "locale": "en_US",
  "timezone": "America/New_York",
  "venue": {
    "name": "Convention Center",
    "address": "123 Main St, City, State 12345"
  },
  "organizer": {
    "name": "Event Organizer",
    "email": "organizer@company.com"
  }
}
```

**Status Codes**:
- `200 OK`: Event information retrieved successfully
- `404 Not Found`: Event not found
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X GET "https://api.cvent.com/passkey-event/v5/events/12345/event-info?localeId=en_US" \
  -H "Authorization: Bearer {access_token}"
```

---

### Get Marketing Items

Retrieves marketing items associated with a specific event.

**Endpoint**: `GET /{eventId}/marketing-items`

**Description**: Returns a list of marketing items for the specified event, optionally filtered by hotel.

**Path Parameters**:
- `eventId` (Long, required) - The unique identifier of the event

**Query Parameters**:
- `hotelId` (Long, optional) - The unique identifier of the hotel to filter by
- `localeId` (String, required) - The locale for localization

**Response**:
```json
[
  {
    "id": 1001,
    "title": "Welcome Package",
    "description": "Complimentary welcome package for attendees",
    "type": "AMENITY",
    "price": 0.00,
    "currency": "USD",
    "available": true,
    "hotelId": 5001,
    "locale": "en_US"
  },
  {
    "id": 1002,
    "title": "Spa Package",
    "description": "Relaxing spa treatment package",
    "type": "UPGRADE",
    "price": 150.00,
    "currency": "USD",
    "available": true,
    "hotelId": 5001,
    "locale": "en_US"
  }
]
```

**Status Codes**:
- `200 OK`: Marketing items retrieved successfully
- `400 Bad Request`: Missing required parameters or invalid values
- `404 Not Found`: Event not found
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X GET "https://api.cvent.com/passkey-event/v5/events/12345/marketing-items?hotelId=5001&localeId=en_US" \
  -H "Authorization: Bearer {access_token}"
```

---

### Get FlipTo Settings

Retrieves FlipTo configuration settings for a specific event.

**Endpoint**: `GET /{eventId}/flip-to-settings`

**Description**: Returns FlipTo settings that control event behavior and configuration.

**Path Parameters**:
- `eventId` (Long, required) - The unique identifier of the event

**Response**:
```json
[
  {
    "id": 2001,
    "settingName": "AUTO_FLIP_ENABLED",
    "settingValue": "true",
    "description": "Enable automatic flipping to alternate hotels",
    "eventId": 12345
  },
  {
    "id": 2002,
    "settingName": "FLIP_THRESHOLD_DAYS",
    "settingValue": "30",
    "description": "Number of days before event to enable flipping",
    "eventId": 12345
  }
]
```

**Status Codes**:
- `200 OK`: FlipTo settings retrieved successfully
- `404 Not Found`: Event not found
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X GET "https://api.cvent.com/passkey-event/v5/events/12345/flip-to-settings" \
  -H "Authorization: Bearer {access_token}"
```

---

### Get Closed SBG Attendees

Retrieves closed Sub-Block Group (SBG) attendee information for a specific event.

**Endpoint**: `GET /{eventId}/closed-sbg-attendees`

**Description**: Returns details about attendees in closed sub-block groups.

**Path Parameters**:
- `eventId` (Long, required) - The unique identifier of the event

**Response**:
```json
[
  {
    "groupId": 3001,
    "groupName": "VIP Attendees",
    "groupType": "VIP",
    "attendeeCount": 25,
    "status": "CLOSED",
    "closedDate": "2024-05-15T10:30:00Z",
    "eventId": 12345
  },
  {
    "groupId": 3002,
    "groupName": "Executive Team",
    "groupType": "EXECUTIVE",
    "attendeeCount": 12,
    "status": "CLOSED",
    "closedDate": "2024-05-10T14:15:00Z",
    "eventId": 12345
  }
]
```

**Status Codes**:
- `200 OK`: Closed SBG attendees retrieved successfully
- `404 Not Found`: Event not found
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X GET "https://api.cvent.com/passkey-event/v5/events/12345/closed-sbg-attendees" \
  -H "Authorization: Bearer {access_token}"
```

---

### Get Merchant Account

Retrieves merchant account information for payment processing.

**Endpoint**: `GET /{eventId}/merchant-account`

**Description**: Returns merchant account details used for payment processing for the event.

**Path Parameters**:
- `eventId` (Long, required) - The unique identifier of the event

**Response**:
```json
{
  "merchantId": "MERCH_12345",
  "accountName": "Event Payments Account",
  "currency": "USD",
  "paymentMethods": ["CREDIT_CARD", "BANK_TRANSFER"],
  "status": "OPEN",
  "eventId": 12345,
  "configuration": {
    "processingFee": 2.9,
    "transactionFee": 0.30,
    "settlementPeriod": "T+2"
  }
}
```

**Status Codes**:
- `200 OK`: Merchant account retrieved successfully
- `404 Not Found`: Event or merchant account not found
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X GET "https://api.cvent.com/passkey-event/v5/events/12345/merchant-account" \
  -H "Authorization: Bearer {access_token}"
```

---

### Get Consents

Retrieves consent information and privacy settings for a specific event.

**Endpoint**: `GET /{eventId}/consents`

**Description**: Returns consent data including privacy agreements and data processing consents.

**Path Parameters**:
- `eventId` (Long, required) - The unique identifier of the event

**Response**:
```json
{
  "data": [
    {
      "consentId": 4001,
      "consentType": "PRIVACY_POLICY",
      "title": "Privacy Policy Agreement",
      "description": "Agreement to privacy policy terms",
      "required": true,
      "version": "1.2",
      "effectiveDate": "2024-01-01T00:00:00Z",
      "eventId": 12345
    },
    {
      "consentId": 4002,
      "consentType": "MARKETING_COMMUNICATIONS",
      "title": "Marketing Communications",
      "description": "Consent to receive marketing communications",
      "required": false,
      "version": "1.0",
      "effectiveDate": "2024-01-01T00:00:00Z",
      "eventId": 12345
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Consents retrieved successfully
- `404 Not Found`: Event not found
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -X GET "https://api.cvent.com/passkey-event/v5/events/12345/consents" \
  -H "Authorization: Bearer {access_token}"
```

## Error Responses

All endpoints return consistent error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/passkey-event/v5/events/12345"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST`: Malformed request or missing required parameters
- `UNAUTHORIZED`: Authentication required or invalid credentials
- `FORBIDDEN`: Insufficient permissions for the requested operation
- `NOT_FOUND`: Requested resource does not exist
- `INTERNAL_ERROR`: Unexpected server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Rate Limiting

API requests are subject to rate limiting:
- **Rate Limit**: 1000 requests per minute per client
- **Headers**: Rate limit information included in response headers
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when rate limit window resets

## Versioning

The API uses URL path versioning:
- Current version: `v5`
- Backward compatibility maintained for previous versions
- Deprecation notices provided 6 months before version retirement

## SDK and Client Libraries

Official client libraries are available:
- **Java**: `com.cvent.passkeyeventsb:passkey-event-java-client`
- **JavaScript/TypeScript**: Available through npm registry
- **OpenAPI Specification**: Available for code generation

## Support

For API support and questions:
- **Documentation**: Internal Cvent developer portal
- **Slack**: #passkey-cherrypickers
- **Issues**: GitHub repository issues
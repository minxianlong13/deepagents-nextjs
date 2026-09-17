# API Reference

## Base URL

**Production**: `https://passkey-hotel.cvent.com`  
**Development**: `http://localhost:8080`

All API endpoints are prefixed with `/passkey-hotel/v1`

## Authentication

All API endpoints require OAuth 2.0 authentication. Include the bearer token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

## Content Type

All requests and responses use JSON format:

```
Content-Type: application/json
Accept: application/json
```

## Endpoints

### E-Commerce Rules

#### GET /events/{eventId}/hotels/{hotelId}/attendee-types/{attendeeTypeId}/ecommerce-rules

Retrieves the e-commerce rules for a specific hotel, event, and attendee type combination.

**Description**: This endpoint returns pricing rules, booking policies, and other e-commerce configurations that apply to a specific attendee type for a hotel within an event context.

**Path Parameters**:
- `eventId` (Long, required) - The unique identifier of the event
- `hotelId` (Long, required) - The unique identifier of the hotel
- `attendeeTypeId` (Long, required) - The unique identifier of the attendee type

**Query Parameters**:
- `locale` (String, optional) - The locale for localized content (e.g., "en-US", "fr-FR")

**Request Example**:
```http
GET /passkey-hotel/v1/events/12345/hotels/67890/attendee-types/111/ecommerce-rules?locale=en-US
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "eventId": 12345,
  "hotelId": 67890,
  "attendeeTypeId": 111,
  "locale": "en-US",
  "rules": {
    "bookingPolicies": {
      "cancellationPolicy": "FREE_CANCELLATION_24H",
      "modificationPolicy": "MODIFICATIONS_ALLOWED",
      "guaranteePolicy": "CREDIT_CARD_REQUIRED"
    },
    "pricingRules": {
      "baseRate": 199.00,
      "currency": "USD",
      "taxRate": 0.12,
      "discountEligible": true,
      "groupRateApplicable": true
    },
    "availabilityRules": {
      "advanceBookingDays": 30,
      "cutoffDate": "2024-03-15T23:59:59Z",
      "minimumStay": 1,
      "maximumStay": 7
    },
    "paymentRules": {
      "acceptedPaymentMethods": ["CREDIT_CARD", "CORPORATE_ACCOUNT"],
      "depositRequired": true,
      "depositAmount": 50.00,
      "paymentDueDate": "2024-03-20T23:59:59Z"
    }
  },
  "metadata": {
    "lastUpdated": "2024-01-15T10:30:00Z",
    "version": "1.2.3",
    "source": "PASSKEY_HOTEL_SB"
  }
}
```

**Status Codes**:
- `200 OK` - Successfully retrieved e-commerce rules
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Event, hotel, or attendee type not found
- `500 Internal Server Error` - Server error occurred

**Error Response Example**:
```json
{
  "error": {
    "code": "HOTEL_NOT_FOUND",
    "message": "Hotel with ID 67890 not found for event 12345",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/passkey-hotel/v1/events/12345/hotels/67890/attendee-types/111/ecommerce-rules"
  }
}
```

## Health Check Endpoints

### GET /actuator/health

Returns the health status of the service.

**Response**:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "Oracle",
        "validationQuery": "SELECT 1 FROM DUAL"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 10737418240,
        "free": 8589934592,
        "threshold": 10485760
      }
    }
  }
}
```

### GET /actuator/info

Returns application information.

**Response**:
```json
{
  "app": {
    "name": "passkey-hotel",
    "version": "2.4.3",
    "description": "Passkey Hotel Spring Boot Service"
  },
  "build": {
    "version": "2.4.3",
    "artifact": "passkey-hotel",
    "group": "com.cvent.passkeyhotelsb",
    "time": "2024-01-15T08:00:00Z"
  },
  "git": {
    "branch": "master",
    "commit": {
      "id": "abc123def456",
      "time": "2024-01-15T07:30:00Z"
    }
  }
}
```

## Common Response Headers

All successful responses include these headers:

```
Content-Type: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Response-Time: 45ms
Cache-Control: no-cache, no-store, must-revalidate
```

## Rate Limiting

API requests are subject to rate limiting:

- **Rate Limit**: 1000 requests per minute per client
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

When rate limit is exceeded:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/endpoint/path",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not supported |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Content-Type not supported |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Request/Response Examples

### cURL Examples

**Get E-Commerce Rules**:
```bash
curl -X GET \
  "https://passkey-hotel.cvent.com/passkey-hotel/v1/events/12345/hotels/67890/attendee-types/111/ecommerce-rules?locale=en-US" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Accept: application/json"
```

**Health Check**:
```bash
curl -X GET \
  "https://passkey-hotel.cvent.com/actuator/health" \
  -H "Accept: application/json"
```

### JavaScript/Fetch Examples

```javascript
// Get E-Commerce Rules
const response = await fetch('/passkey-hotel/v1/events/12345/hotels/67890/attendee-types/111/ecommerce-rules?locale=en-US', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json'
  }
});

if (response.ok) {
  const ecommerceRules = await response.json();
  console.log('E-Commerce Rules:', ecommerceRules);
} else {
  const error = await response.json();
  console.error('Error:', error);
}
```

## Versioning

The API uses URL path versioning:
- Current version: `v1`
- Future versions will be available at `/passkey-hotel/v2`, etc.
- Backward compatibility is maintained for at least 12 months after a new version release

## Pagination

For endpoints that return collections (future implementations), pagination follows this pattern:

**Request**:
```
GET /passkey-hotel/v1/hotels?page=1&size=20&sort=name,asc
```

**Response**:
```json
{
  "content": [...],
  "page": {
    "number": 1,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  },
  "sort": {
    "sorted": true,
    "by": "name",
    "direction": "asc"
  }
}
```

## OpenAPI/Swagger Documentation

Interactive API documentation is available at:
- **Development**: `http://localhost:8080/swagger-ui.html`
- **Production**: Contact the development team for access

The OpenAPI specification can be downloaded from:
- **JSON**: `/v3/api-docs`
- **YAML**: `/v3/api-docs.yaml`
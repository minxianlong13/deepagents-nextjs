# API Reference

## Base URL

The service runs on port 8080 by default:
- **Local Development**: `http://localhost:8080`
- **CI Environment**: `https://passkey-hilton-converter-service-ci.core.cvent.org`
- **Alpha Environment**: `https://passkey-hilton-converter-service-alpha.core.cvent.org`
- **Production Environments**: Environment-specific URLs

## Authentication

All API endpoints require authentication using API keys.

### API Key Authentication
- **Method**: API Key in request header
- **Header**: `Authorization: Bearer <api-key>`
- **Scope**: Service-level access through Cvent auth-service

### Secrets Management
API keys are managed through Jenkins parameter store:
- **Staging**: `__STAGING_HILTON_CONVERTER_API_USER_PASSWORD__`
- **Production**: `__PRODUCTION_HILTON_CONVERTER_API_USER_PASSWORD__`

## Endpoints

### POST /passkey-hilton-converter/v1/stayrecords

**Description**: Transforms Hilton EventStays reservation data from JSON format to Passkey-compatible XML format.

**Authentication**: Required (API Key)

**Content-Type**: `application/json`

**Request Body**:
```json
[
  {
    "reservationId": "string",
    "guestName": "string",
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-17",
    "hotelCode": "string",
    "roomType": "string",
    "rateCode": "string",
    "totalAmount": 299.99,
    "currency": "USD",
    "status": "CONFIRMED",
    "eventDetails": {
      "eventId": "string",
      "eventName": "string",
      "organizationId": "string"
    },
    "guestDetails": {
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string"
    },
    "additionalServices": [
      {
        "serviceType": "string",
        "description": "string",
        "amount": 50.00
      }
    ]
  }
]
```

**Response**:
```json
{
  "results": [
    {
      "reservationId": "string",
      "status": "SUCCESS",
      "passkeyXml": "<xml>...</xml>",
      "message": "Successfully transformed reservation",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "summary": {
    "totalProcessed": 1,
    "successful": 1,
    "failed": 0,
    "processingTimeMs": 150
  }
}
```

**Status Codes**:
- **200 OK**: Successfully processed all stay records
- **400 Bad Request**: Invalid input data or malformed JSON
- **401 Unauthorized**: Missing or invalid API key
- **422 Unprocessable Entity**: Valid JSON but business rule violations
- **500 Internal Server Error**: Service error during processing

**Error Response**:
```json
{
  "error": {
    "code": "TRANSFORMATION_ERROR",
    "message": "Failed to transform reservation data",
    "details": [
      {
        "field": "checkInDate",
        "message": "Invalid date format"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid-string"
  }
}
```

### POST /passkey-hilton-converter/v1/logging

**Description**: Provides logging and monitoring capabilities for operational insights.

**Authentication**: Required (API Key)

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "logLevel": "INFO",
  "message": "Custom log message",
  "context": {
    "reservationId": "string",
    "operation": "string",
    "additionalData": {}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response**:
```json
{
  "status": "LOGGED",
  "logId": "uuid-string",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- **200 OK**: Log entry successfully recorded
- **400 Bad Request**: Invalid log data
- **401 Unauthorized**: Missing or invalid API key
- **500 Internal Server Error**: Logging service error

## Request/Response Examples

### Successful Transformation Example

**Request**:
```bash
curl -X POST \
  http://localhost:8080/passkey-hilton-converter/v1/stayrecords \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '[
    {
      "reservationId": "HTN-12345",
      "guestName": "John Doe",
      "checkInDate": "2024-02-15",
      "checkOutDate": "2024-02-17",
      "hotelCode": "HTN001",
      "roomType": "DELUXE",
      "rateCode": "CORP",
      "totalAmount": 450.00,
      "currency": "USD",
      "status": "CONFIRMED"
    }
  ]'
```

**Response**:
```json
{
  "results": [
    {
      "reservationId": "HTN-12345",
      "status": "SUCCESS",
      "passkeyXml": "<?xml version=\"1.0\"?><reservation>...</reservation>",
      "message": "Successfully transformed reservation HTN-12345",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "summary": {
    "totalProcessed": 1,
    "successful": 1,
    "failed": 0,
    "processingTimeMs": 125
  }
}
```

### Error Response Example

**Request with Invalid Data**:
```bash
curl -X POST \
  http://localhost:8080/passkey-hilton-converter/v1/stayrecords \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '[
    {
      "reservationId": "",
      "checkInDate": "invalid-date",
      "totalAmount": "not-a-number"
    }
  ]'
```

**Response**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "reservationId",
        "message": "Reservation ID cannot be empty"
      },
      {
        "field": "checkInDate",
        "message": "Invalid date format. Expected: YYYY-MM-DD"
      },
      {
        "field": "totalAmount",
        "message": "Total amount must be a valid number"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-uuid-12345"
  }
}
```

## Data Validation Rules

### Required Fields
- `reservationId`: Must be non-empty string
- `checkInDate`: Must be valid date in YYYY-MM-DD format
- `checkOutDate`: Must be valid date in YYYY-MM-DD format, after check-in date
- `hotelCode`: Must be non-empty string
- `status`: Must be valid reservation status

### Optional Fields
- `guestName`: String, defaults to empty if not provided
- `roomType`: String, defaults to "STANDARD"
- `rateCode`: String, defaults to "RACK"
- `totalAmount`: Numeric, defaults to 0.00
- `currency`: String, defaults to "USD"

### Business Rules
- Check-out date must be after check-in date
- Total amount must be non-negative
- Currency must be valid ISO 4217 code
- Hotel code must exist in Passkey system

## Rate Limiting

- **Default Limit**: 100 requests per minute per API key
- **Burst Limit**: 10 requests per second
- **Headers**: Rate limit information included in response headers
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when rate limit resets

## Health Check Endpoints

### GET /healthcheck
**Description**: Basic health check endpoint provided by Dropwizard

**Response**:
```json
{
  "deadlocks": {
    "healthy": true
  },
  "database": {
    "healthy": true,
    "message": "Database connection successful"
  },
  "external-services": {
    "healthy": true,
    "message": "All external services accessible"
  }
}
```

### GET /metrics
**Description**: Service metrics endpoint

**Response**: Prometheus-formatted metrics including:
- Request counts and response times
- JVM metrics
- Custom business metrics
- External service call metrics

## Monitoring and Observability

### Request Tracing
- **Correlation ID**: Each request gets a unique correlation ID
- **Header**: `X-Correlation-ID` (auto-generated if not provided)
- **Logging**: All log entries include correlation ID for tracing

### Performance Metrics
- **Response Time**: Average, 95th, and 99th percentile response times
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Transformation Time**: Time spent on data transformation

### External Dependencies
- **Passkey API**: Connectivity and response time monitoring
- **Auth Service**: Authentication success/failure rates
- **Parameter Store**: Configuration retrieval metrics
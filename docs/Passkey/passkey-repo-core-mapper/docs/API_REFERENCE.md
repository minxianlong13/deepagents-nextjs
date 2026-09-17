# API Reference

## Base URL

**Development**: `http://localhost:8080`  
**Production**: `https://passkey-core-mapper-service.{environment}.cvent.net`

## Authentication

All API endpoints require authentication via Cvent Auth Service. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

## Common Headers

```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <jwt-token>
```

## Endpoints

### Health Check

#### GET /healthcheck
**Description**: Returns the health status of the service and its dependencies.

**Response**:
```json
{
  "passkey-core-mapper-service": {
    "healthy": true
  }
}
```

**Status Codes**:
- 200: Service is healthy
- 503: Service is unhealthy

---

## Hilton Mapping Endpoints

### POST /hilton/map-reservation
**Description**: Maps a Passkey reservation to Hilton's data format.

**Request Body**:
```json
{
  "reservation": {
    "id": 12345,
    "confNumber": "ABC123",
    "guestInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "hotelInfo": {
      "hotelId": "HTL001",
      "propertyCode": "HILTON_NYC"
    },
    "stayInfo": {
      "checkIn": "2024-03-15",
      "checkOut": "2024-03-17",
      "roomType": "KING",
      "numberOfGuests": 2
    }
  },
  "mappingContext": {
    "vendorSpecificData": {},
    "transformationRules": []
  }
}
```

**Response**:
```json
{
  "mappedReservation": {
    "reservationId": "12345",
    "confirmationNumber": "ABC123",
    "guest": {
      "name": {
        "first": "John",
        "last": "Doe"
      },
      "contact": {
        "email": "john.doe@example.com"
      }
    },
    "property": {
      "code": "HILTON_NYC",
      "id": "HTL001"
    },
    "stay": {
      "arrival": "2024-03-15",
      "departure": "2024-03-17",
      "room": {
        "type": "KING",
        "occupancy": 2
      }
    }
  },
  "validationResults": {
    "isValid": true,
    "warnings": [],
    "errors": []
  }
}
```

**Status Codes**:
- 200: Mapping successful
- 400: Invalid request data
- 401: Unauthorized
- 422: Validation errors in mapping

---

## OHIP Mapping Endpoints

### POST /ohip/map-reservation
**Description**: Maps a reservation from orchestrator format to OHIP format.

**Request Body**:
```json
{
  "orchestratorReservation": {
    "reservationId": 67890,
    "confirmationCode": "XYZ789",
    "guest": {
      "personalInfo": {
        "firstName": "Jane",
        "lastName": "Smith",
        "emailAddress": "jane.smith@example.com"
      }
    },
    "hotel": {
      "propertyId": "PROP123",
      "chainCode": "OHIP"
    },
    "dates": {
      "checkInDate": "2024-04-01",
      "checkOutDate": "2024-04-03"
    }
  },
  "mappingOptions": {
    "includeAddons": true,
    "validateRewardProgram": true
  }
}
```

**Response**:
```json
{
  "ohipReservation": {
    "id": "67890",
    "confirmation": "XYZ789",
    "guestDetails": {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com"
    },
    "propertyInfo": {
      "propertyId": "PROP123",
      "brand": "OHIP"
    },
    "stayDates": {
      "arrivalDate": "2024-04-01",
      "departureDate": "2024-04-03"
    },
    "addons": [],
    "rewardProgram": null
  },
  "mappingMetadata": {
    "mappingVersion": "1.0",
    "timestamp": "2024-01-15T10:30:00Z",
    "processingTime": 150
  }
}
```

### POST /ohip/merge-reservations
**Description**: Merges multiple OHIP reservations into a single consolidated reservation.

**Request Body**:
```json
{
  "reservations": [
    {
      "id": "RES001",
      "guestDetails": { /* guest info */ },
      "stayDates": { /* date info */ }
    },
    {
      "id": "RES002", 
      "guestDetails": { /* guest info */ },
      "stayDates": { /* date info */ }
    }
  ],
  "mergeStrategy": "CONSECUTIVE_STAYS"
}
```

**Response**:
```json
{
  "mergedReservation": {
    "id": "MERGED_RES001_RES002",
    "originalReservationIds": ["RES001", "RES002"],
    "guestDetails": { /* consolidated guest info */ },
    "stayDates": { /* merged date range */ }
  },
  "mergeResults": {
    "successful": true,
    "conflictsResolved": [],
    "warnings": []
  }
}
```

**Status Codes**:
- 200: Merge successful
- 400: Invalid merge request
- 422: Merge conflicts that cannot be resolved

---

## Shiji Mapping Endpoints

### POST /shiji/map-reservation
**Description**: Maps an orchestrator reservation to Shiji payload format.

**Request Body**:
```json
{
  "orchestratorReservation": {
    "id": 11111,
    "confirmationNumber": "SHIJI001",
    "guestInformation": {
      "primaryGuest": {
        "name": "Alice Johnson",
        "email": "alice.johnson@example.com"
      }
    },
    "hotelDetails": {
      "propertyCode": "SHIJI_HOTEL",
      "propertyId": "SH001"
    },
    "reservationDates": {
      "checkIn": "2024-05-10",
      "checkOut": "2024-05-12"
    }
  },
  "shijiConfiguration": {
    "apiVersion": "v2",
    "includeExtendedData": true
  }
}
```

**Response**:
```json
{
  "shijiPayloads": [
    {
      "payloadType": "RESERVATION_CREATE",
      "data": {
        "reservationId": "11111",
        "confirmation": "SHIJI001",
        "guest": {
          "fullName": "Alice Johnson",
          "contactEmail": "alice.johnson@example.com"
        },
        "property": {
          "code": "SHIJI_HOTEL",
          "identifier": "SH001"
        },
        "dates": {
          "arrival": "2024-05-10",
          "departure": "2024-05-12"
        }
      }
    }
  ],
  "transformationSummary": {
    "payloadsGenerated": 1,
    "validationsPassed": true,
    "processingTimeMs": 75
  }
}
```

**Status Codes**:
- 200: Mapping successful
- 400: Invalid orchestrator reservation data
- 401: Unauthorized
- 422: Shiji-specific validation errors

---

## Common Response Formats

### Success Response
```json
{
  "data": { /* response data */ },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.16.1",
    "processingTime": 120
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid reservation data provided",
    "details": [
      {
        "field": "reservation.guestInfo.email",
        "message": "Email format is invalid"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/hilton/map-reservation"
}
```

### Validation Error Response
```json
{
  "validationErrors": [
    {
      "field": "reservation.hotelInfo.propertyCode",
      "code": "REQUIRED_FIELD_MISSING",
      "message": "Property code is required for Hilton mappings"
    },
    {
      "field": "reservation.stayInfo.checkIn",
      "code": "INVALID_DATE_FORMAT",
      "message": "Check-in date must be in YYYY-MM-DD format"
    }
  ],
  "errorCount": 2
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid input data |
| 401  | Unauthorized - Missing or invalid authentication |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found |
| 422  | Unprocessable Entity - Validation errors |
| 500  | Internal Server Error - Unexpected server error |
| 503  | Service Unavailable - Service or dependencies unavailable |

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Rate Limit**: 1000 requests per minute per client
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when rate limit resets

## Pagination

For endpoints that return multiple items, pagination is supported:

**Query Parameters**:
- `page`: Page number (default: 1)
- `size`: Items per page (default: 20, max: 100)

**Response Headers**:
- `X-Total-Count`: Total number of items
- `X-Page-Count`: Total number of pages

## Examples

### cURL Examples

**Health Check**:
```bash
curl -X GET "http://localhost:8080/healthcheck" \
  -H "Accept: application/json"
```

**Hilton Reservation Mapping**:
```bash
curl -X POST "http://localhost:8080/hilton/map-reservation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "reservation": {
      "id": 12345,
      "confNumber": "ABC123",
      "guestInfo": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      }
    }
  }'
```

### Client Library Usage

**Java Client**:
```java
PasskeyCoreMapperClient client = new PasskeyCoreMapperClient(
    "http://localhost:8080", 
    authToken
);

HiltonMappingRequest request = HiltonMappingRequest.builder()
    .reservation(reservation)
    .build();

HiltonMappingResponse response = client.mapHiltonReservation(request);
```
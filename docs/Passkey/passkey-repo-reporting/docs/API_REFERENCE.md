# API Reference

## Base URL

The Passkey Reporting Service API is available at:
```
https://{environment}.cvent.com/passkey-reporting/v1/
```

Where `{environment}` is one of:
- `api-dev` (Development)
- `api-staging` (Staging)  
- `api` (Production)

## Authentication

The API supports two authentication methods:

### API Key Authentication (Recommended)
```http
Authorization: Bearer {api-key}
```

### Bearer Token Authentication (Deprecated)
```http
Authorization: Bearer {access-token}
```

**Note**: Bearer token authentication is deprecated and will be removed. Use API key authentication for all new integrations.

## Common Parameters

Most endpoints support these common query parameters:

- `startDate` (string, required): Start date in YYYY-MM-DD format
- `endDate` (string, required): End date in YYYY-MM-DD format  
- `participantId` (integer, optional): ID of the participant (hotel or organizer)
- `participantType` (string, optional): Type of participant ("HOTEL" or "ORGANIZER")
- `eventCategory` (string, optional): Event category filter

## Endpoints

### GET /bookings

**Description**: Retrieves booking report data with comprehensive reservation information.

**Path**: `/passkey-reporting/v1/bookings`

**Query Parameters**:
- `startDate` (string, required): Start date for the report period
- `endDate` (string, required): End date for the report period
- `participantId` (integer, optional): Filter by specific participant ID
- `participantType` (string, optional): Filter by participant type ("HOTEL" or "ORGANIZER")
- `eventCategory` (string, optional): Filter by event category

**Example Request**:
```http
GET /passkey-reporting/v1/bookings?startDate=2024-01-01&endDate=2024-01-31&participantId=12345&participantType=HOTEL
Authorization: Bearer {api-key}
```

**Response**:
```json
{
  "bookingsReportData": [
    {
      "eventId": "evt_123456",
      "eventName": "Annual Conference 2024",
      "hotelId": 12345,
      "hotelName": "Grand Hotel",
      "bookingDate": "2024-01-15",
      "checkInDate": "2024-03-15",
      "checkOutDate": "2024-03-17",
      "roomNights": 2,
      "totalRevenue": 450.00,
      "reservationMethod": "ONLINE",
      "guestName": "John Doe",
      "confirmationNumber": "CNF123456"
    }
  ],
  "totalRecords": 1,
  "summary": {
    "totalBookings": 1,
    "totalRoomNights": 2,
    "totalRevenue": 450.00
  }
}
```

**Status Codes**:
- 200: Success
- 400: Bad Request (invalid parameters)
- 401: Unauthorized
- 403: Forbidden
- 500: Internal Server Error

---

### GET /events

**Description**: Retrieves event report data including event details and performance metrics.

**Path**: `/passkey-reporting/v1/events`

**Query Parameters**:
- `startDate` (string, required): Start date for the report period
- `endDate` (string, required): End date for the report period
- `participantId` (integer, optional): Filter by specific participant ID
- `participantType` (string, optional): Filter by participant type
- `eventCategory` (string, optional): Filter by event category

**Example Request**:
```http
GET /passkey-reporting/v1/events?startDate=2024-01-01&endDate=2024-12-31&participantType=ORGANIZER
Authorization: Bearer {api-key}
```

**Response**:
```json
{
  "eventsReportData": [
    {
      "eventId": "evt_123456",
      "eventName": "Annual Conference 2024",
      "eventStartDate": "2024-03-15",
      "eventEndDate": "2024-03-17",
      "organizerId": 67890,
      "organizerName": "Tech Corp",
      "eventCategory": "CORPORATE",
      "totalAttendees": 500,
      "totalBookings": 350,
      "totalRoomNights": 700,
      "totalRevenue": 157500.00,
      "averageRoomRate": 225.00,
      "occupancyRate": 0.85
    }
  ],
  "totalRecords": 1
}
```

---

### GET /revenue

**Description**: Retrieves detailed revenue analytics and financial performance data.

**Path**: `/passkey-reporting/v1/revenue`

**Query Parameters**:
- `startDate` (string, required): Start date for the report period
- `endDate` (string, required): End date for the report period
- `participantId` (integer, optional): Filter by specific participant ID
- `participantType` (string, optional): Filter by participant type
- `eventCategory` (string, optional): Filter by event category

**Example Request**:
```http
GET /passkey-reporting/v1/revenue?startDate=2024-01-01&endDate=2024-01-31&participantId=12345
Authorization: Bearer {api-key}
```

**Response**:
```json
{
  "revenueReportData": [
    {
      "date": "2024-01-15",
      "totalRevenue": 15750.00,
      "roomRevenue": 12500.00,
      "taxRevenue": 1875.00,
      "feeRevenue": 1375.00,
      "bookingCount": 50,
      "roomNights": 75,
      "averageRoomRate": 166.67,
      "revenueByCategory": {
        "CORPORATE": 8750.00,
        "ASSOCIATION": 4500.00,
        "WEDDING": 2500.00
      }
    }
  ],
  "summary": {
    "totalRevenue": 15750.00,
    "totalBookings": 50,
    "totalRoomNights": 75,
    "averageRoomRate": 166.67
  }
}
```

---

### GET /incremental-revenue

**Description**: Calculates and returns incremental revenue data showing additional revenue generated through the Passkey platform.

**Path**: `/passkey-reporting/v1/incremental-revenue`

**Query Parameters**:
- `startDate` (string, required): Start date for the report period
- `endDate` (string, required): End date for the report period
- `participantId` (integer, optional): Filter by specific participant ID
- `participantType` (string, optional): Filter by participant type
- `eventCategory` (string, optional): Filter by event category

**Example Request**:
```http
GET /passkey-reporting/v1/incremental-revenue?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {api-key}
```

**Response**:
```json
{
  "incrementalRevenueData": [
    {
      "eventId": "evt_123456",
      "eventName": "Annual Conference 2024",
      "baselineRevenue": 50000.00,
      "actualRevenue": 75000.00,
      "incrementalRevenue": 25000.00,
      "incrementalPercentage": 50.0,
      "passkeyBookings": 150,
      "totalBookings": 200,
      "passkeyRoomNights": 300,
      "totalRoomNights": 400
    }
  ],
  "summary": {
    "totalIncrementalRevenue": 25000.00,
    "averageIncrementalPercentage": 50.0
  }
}
```

---

### GET /reservation-method

**Description**: Provides analytics on how reservations are being made (online, phone, etc.).

**Path**: `/passkey-reporting/v1/reservation-method`

**Query Parameters**:
- `startDate` (string, required): Start date for the report period
- `endDate` (string, required): End date for the report period
- `participantId` (integer, optional): Filter by specific participant ID
- `participantType` (string, optional): Filter by participant type
- `eventCategory` (string, optional): Filter by event category

**Example Request**:
```http
GET /passkey-reporting/v1/reservation-method?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {api-key}
```

**Response**:
```json
{
  "reservationMethodData": [
    {
      "method": "ONLINE",
      "bookingCount": 150,
      "percentage": 75.0,
      "totalRevenue": 33750.00,
      "averageRoomRate": 225.00
    },
    {
      "method": "PHONE",
      "bookingCount": 40,
      "percentage": 20.0,
      "totalRevenue": 9000.00,
      "averageRoomRate": 225.00
    },
    {
      "method": "EMAIL",
      "bookingCount": 10,
      "percentage": 5.0,
      "totalRevenue": 2250.00,
      "averageRoomRate": 225.00
    }
  ],
  "summary": {
    "totalBookings": 200,
    "totalRevenue": 45000.00
  }
}
```

---

### GET /event-statistics

**Description**: Provides statistical data and performance metrics for events.

**Path**: `/passkey-reporting/v1/event-statistics`

**Query Parameters**:
- `startDate` (string, required): Start date for the report period
- `endDate` (string, required): End date for the report period
- `participantId` (integer, optional): Filter by specific participant ID
- `participantType` (string, optional): Filter by participant type
- `eventCategory` (string, optional): Filter by event category

**Example Request**:
```http
GET /passkey-reporting/v1/event-statistics?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {api-key}
```

**Response**:
```json
{
  "eventStatisticsData": [
    {
      "eventId": "evt_123456",
      "eventName": "Annual Conference 2024",
      "totalAttendees": 500,
      "totalBookings": 350,
      "bookingConversionRate": 0.70,
      "averageStayLength": 2.5,
      "peakBookingDate": "2024-02-15",
      "cancellationRate": 0.05,
      "noShowRate": 0.02,
      "roomTypeDistribution": {
        "STANDARD": 200,
        "DELUXE": 100,
        "SUITE": 50
      }
    }
  ]
}
```

---

### GET /event-pace-data

**Description**: Provides event pace analytics showing booking patterns over time.

**Path**: `/passkey-reporting/v1/event-pace-data`

**Query Parameters**:
- `startDate` (string, required): Start date for the report period
- `endDate` (string, required): End date for the report period
- `participantId` (integer, optional): Filter by specific participant ID
- `participantType` (string, optional): Filter by participant type
- `eventCategory` (string, optional): Filter by event category

**Example Request**:
```http
GET /passkey-reporting/v1/event-pace-data?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {api-key}
```

**Response**:
```json
{
  "eventPaceData": [
    {
      "eventId": "evt_123456",
      "eventName": "Annual Conference 2024",
      "eventStartDate": "2024-03-15",
      "daysToEvent": [
        {
          "daysOut": 60,
          "bookingsToDate": 50,
          "roomNightsToDate": 100,
          "revenueToDate": 22500.00
        },
        {
          "daysOut": 30,
          "bookingsToDate": 150,
          "roomNightsToDate": 300,
          "revenueToDate": 67500.00
        },
        {
          "daysOut": 7,
          "bookingsToDate": 300,
          "roomNightsToDate": 600,
          "revenueToDate": 135000.00
        }
      ],
      "finalBookings": 350,
      "finalRoomNights": 700,
      "finalRevenue": 157500.00
    }
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Start date cannot be after end date",
    "details": {
      "field": "startDate",
      "value": "2024-02-01"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid input parameters
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Requested resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Rate Limit**: 1000 requests per hour per API key
- **Headers**: Rate limit information is returned in response headers:
  - `X-RateLimit-Limit`: Maximum requests per hour
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Pagination

For endpoints that return large datasets, pagination is supported:

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 100, max: 1000)

**Response Headers**:
- `X-Total-Count`: Total number of items
- `X-Page-Count`: Total number of pages
- `Link`: Navigation links (first, prev, next, last)

## Data Formats

### Date Format
All dates are in ISO 8601 format: `YYYY-MM-DD`

### Currency
All monetary values are in USD with 2 decimal places.

### Time Zones
All timestamps are in UTC unless otherwise specified.

## SDK and Client Libraries

### Java Client
```xml
<dependency>
    <groupId>com.cvent.passkey-reporting</groupId>
    <artifactId>passkey-reporting-java-client</artifactId>
    <version>1.31.1</version>
</dependency>
```

### Usage Example
```java
PasskeyReportingClient client = new PasskeyReportingClient(apiKey, baseUrl);
BookingsReportResponse response = client.getBookingsReport(
    LocalDate.of(2024, 1, 1),
    LocalDate.of(2024, 1, 31),
    12345L,
    "HOTEL"
);
```
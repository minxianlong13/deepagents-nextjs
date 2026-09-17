# API Reference

## Base URL

The Passkey Book UI application is deployed across multiple environments:

- **Development**: `https://dev-passkey-book-ui.cvent.com`
- **Staging**: `https://staging-passkey-book-ui.cvent.com`
- **Production**: `https://passkey-book-ui.cvent.com`

## Application Routes

### Public Routes

#### GET /
**Description**: Main landing page for the booking application

**Response**: HTML page with booking interface

**Features**:
- Server-side rendered React components
- Internationalization support
- Feature flag integration
- SEO optimized meta tags

---

#### GET /health
**Description**: Health check endpoint for load balancer monitoring

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "0.2.4"
}
```

**Status Codes**:
- 200: Service is healthy
- 503: Service is unhealthy

---

### Booking Routes

#### GET /book
**Description**: Main booking interface page

**Query Parameters**:
- `hotelId` (string, required) - Hotel identifier
- `checkIn` (string, optional) - Check-in date (YYYY-MM-DD)
- `checkOut` (string, optional) - Check-out date (YYYY-MM-DD)
- `guests` (number, optional) - Number of guests
- `locale` (string, optional) - Language locale (en, es, fr, etc.)

**Response**: HTML page with booking form and room availability

**Example**:
```
GET /book?hotelId=12345&checkIn=2024-02-01&checkOut=2024-02-03&guests=2&locale=en
```

---

#### GET /book/confirmation
**Description**: Booking confirmation page

**Query Parameters**:
- `confirmationId` (string, required) - Booking confirmation number

**Response**: HTML page with booking details and confirmation information

---

### API Routes (Next.js API Routes)

#### GET /api/hotels/:hotelId
**Description**: Retrieve hotel information and availability

**Path Parameters**:
- `hotelId` (string) - Unique hotel identifier

**Query Parameters**:
- `checkIn` (string) - Check-in date (YYYY-MM-DD)
- `checkOut` (string) - Check-out date (YYYY-MM-DD)
- `guests` (number) - Number of guests

**Response**:
```json
{
  "hotelId": "12345",
  "name": "Grand Hotel Example",
  "address": {
    "street": "123 Main St",
    "city": "Example City",
    "state": "EX",
    "zipCode": "12345",
    "country": "US"
  },
  "amenities": ["wifi", "pool", "gym", "parking"],
  "rooms": [
    {
      "roomTypeId": "standard",
      "name": "Standard Room",
      "description": "Comfortable room with city view",
      "capacity": 2,
      "price": {
        "amount": 150.00,
        "currency": "USD"
      },
      "availability": 5
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 404: Hotel not found
- 400: Invalid parameters

---

#### POST /api/bookings
**Description**: Create a new booking reservation

**Request Body**:
```json
{
  "hotelId": "12345",
  "roomTypeId": "standard",
  "checkIn": "2024-02-01",
  "checkOut": "2024-02-03",
  "guests": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-123-4567"
    }
  ],
  "paymentInfo": {
    "cardNumber": "****-****-****-1234",
    "expiryDate": "12/25",
    "cvv": "***"
  },
  "specialRequests": "Late check-in requested"
}
```

**Response**:
```json
{
  "confirmationId": "CONF123456",
  "bookingId": "BK789012",
  "status": "confirmed",
  "totalAmount": {
    "amount": 300.00,
    "currency": "USD"
  },
  "checkIn": "2024-02-01",
  "checkOut": "2024-02-03",
  "hotel": {
    "name": "Grand Hotel Example",
    "address": "123 Main St, Example City, EX 12345"
  },
  "room": {
    "type": "Standard Room",
    "number": "205"
  }
}
```

**Status Codes**:
- 201: Booking created successfully
- 400: Invalid booking data
- 409: Room not available
- 422: Payment processing failed

---

#### GET /api/bookings/:confirmationId
**Description**: Retrieve booking details by confirmation ID

**Path Parameters**:
- `confirmationId` (string) - Booking confirmation number

**Response**:
```json
{
  "confirmationId": "CONF123456",
  "bookingId": "BK789012",
  "status": "confirmed",
  "createdAt": "2024-01-15T10:30:00Z",
  "hotel": {
    "name": "Grand Hotel Example",
    "address": "123 Main St, Example City, EX 12345",
    "phone": "+1-555-987-6543"
  },
  "room": {
    "type": "Standard Room",
    "number": "205",
    "amenities": ["wifi", "tv", "minibar"]
  },
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "dates": {
    "checkIn": "2024-02-01",
    "checkOut": "2024-02-03",
    "nights": 2
  },
  "pricing": {
    "roomRate": 150.00,
    "taxes": 24.00,
    "fees": 15.00,
    "total": 339.00,
    "currency": "USD"
  }
}
```

**Status Codes**:
- 200: Success
- 404: Booking not found
- 403: Access denied

---

### Feature Flag Routes

#### GET /api/features
**Description**: Retrieve feature flags for the current user/session

**Headers**:
- `Authorization` (string, optional) - Bearer token for user context

**Response**:
```json
{
  "features": {
    "newBookingFlow": true,
    "paymentV2": false,
    "loyaltyProgram": true,
    "mobileApp": false
  },
  "userId": "user123",
  "sessionId": "session456"
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized (if user context required)

---

### Internationalization Routes

#### GET /api/locales/:locale
**Description**: Retrieve localized strings for the specified locale

**Path Parameters**:
- `locale` (string) - Language code (en, es, fr, de, etc.)

**Response**:
```json
{
  "locale": "en",
  "messages": {
    "booking.title": "Book Your Stay",
    "booking.checkIn": "Check-in Date",
    "booking.checkOut": "Check-out Date",
    "booking.guests": "Number of Guests",
    "booking.search": "Search Rooms",
    "booking.confirm": "Confirm Booking",
    "errors.required": "This field is required",
    "errors.invalidDate": "Please enter a valid date"
  }
}
```

**Status Codes**:
- 200: Success
- 404: Locale not supported

---

## Middleware Processing

### Request Flow

All requests pass through Next.js middleware (`src/middleware.ts`) which handles:

1. **Authentication**: Validates user tokens and session
2. **Logging**: Records request details for monitoring
3. **Feature Flags**: Evaluates feature flags based on user context
4. **Internationalization**: Determines user locale and language preferences
5. **Security Headers**: Adds security headers (CSP, HSTS, etc.)
6. **Rate Limiting**: Prevents abuse and ensures fair usage

### Middleware Configuration

```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "The requested booking could not be found",
    "details": {
      "confirmationId": "CONF123456",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Common Error Codes

- `HOTEL_NOT_FOUND` - Hotel ID does not exist
- `ROOM_UNAVAILABLE` - Requested room type not available
- `INVALID_DATES` - Check-in/check-out dates are invalid
- `PAYMENT_FAILED` - Payment processing error
- `BOOKING_NOT_FOUND` - Booking confirmation ID not found
- `VALIDATION_ERROR` - Request data validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests from client
- `FEATURE_DISABLED` - Requested feature is disabled

## Authentication

### Bearer Token Authentication

For API routes requiring authentication, include the Authorization header:

```
Authorization: Bearer <jwt-token>
```

### Session-Based Authentication

Web pages use session-based authentication with secure HTTP-only cookies.

## Rate Limiting

- **Public Routes**: 100 requests per minute per IP
- **API Routes**: 60 requests per minute per authenticated user
- **Booking Creation**: 5 requests per minute per user

## CORS Policy

- **Allowed Origins**: Cvent domains and approved partner domains
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Authorization, Content-Type, Accept-Language
- **Credentials**: Included for same-origin requests

## Monitoring and Observability

### Health Check Endpoints

- `/health` - Application health status
- `/api/health/db` - Database connectivity check
- `/api/health/external` - External service dependencies

### Metrics Endpoints

- `/metrics` - Prometheus-compatible metrics
- `/api/metrics/performance` - Application performance metrics

### Logging

All API requests are logged with:
- Request ID for tracing
- User context (if authenticated)
- Response time and status
- Error details (if applicable)
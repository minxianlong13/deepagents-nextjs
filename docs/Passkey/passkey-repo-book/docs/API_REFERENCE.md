# API Reference

## Base URL

The Passkey Book application is accessed through event-specific URLs:
```
https://passkey-book-{environment}.core.cvent.org
```

**Environments:**
- `dev` - Development environment
- `qai` - QA/Testing environment  
- `pr50` - Production environment

## URL Structure

Passkey Book uses a path-based routing structure for different booking flows:

### Event Access Pattern
```
/event/{eventId}/owner/{ownerId}/{page}
```

**Path Parameters:**
- `eventId` - Unique identifier for the event
- `ownerId` - Owner/organizer identifier
- `page` - Specific page or action within the booking flow

## Core Endpoints

### Home/Landing Page
**GET** `/event/{eventId}/owner/{ownerId}/home`

**Description**: Main landing page for event booking

**Path Parameters:**
- `eventId` - Event identifier
- `ownerId` - Event owner identifier

**Response**: HTML page with event details and booking options

---

### Hotel Search
**GET** `/event/{eventId}/owner/{ownerId}/search`

**Description**: Hotel search and availability page

**Query Parameters:**
- `checkin` - Check-in date (YYYY-MM-DD)
- `checkout` - Check-out date (YYYY-MM-DD)
- `guests` - Number of guests
- `rooms` - Number of rooms

**Response**: HTML page with available hotels and rooms

---

### Room Selection
**GET** `/event/{eventId}/owner/{ownerId}/rooms`

**Description**: Room type selection and pricing

**Query Parameters:**
- `hotelId` - Selected hotel identifier
- `checkin` - Check-in date
- `checkout` - Check-out date

**Response**: HTML page with room options and rates

---

### Guest Information
**GET** `/event/{eventId}/owner/{ownerId}/guests`

**Description**: Guest information collection form

**Response**: HTML form for guest details

**POST** `/event/{eventId}/owner/{ownerId}/guests`

**Description**: Submit guest information

**Request Body**: Form data with guest details
```
guestName: string
guestEmail: string
guestPhone: string
specialRequests: string
```

**Response**: Redirect to payment page or validation errors

---

### Payment Processing
**GET** `/event/{eventId}/owner/{ownerId}/payment`

**Description**: Payment information form

**Response**: HTML form for payment details

**POST** `/event/{eventId}/owner/{ownerId}/payment`

**Description**: Process payment and create reservation

**Request Body**: Form data with payment information
```
cardNumber: string
expiryMonth: string
expiryYear: string
cvv: string
billingAddress: object
```

**Response**: Redirect to confirmation page or payment errors

---

### Booking Confirmation
**GET** `/event/{eventId}/owner/{ownerId}/confirmation`

**Description**: Booking confirmation page

**Query Parameters:**
- `reservationId` - Confirmation number

**Response**: HTML page with booking details and confirmation

---

### Reservation Management
**GET** `/event/{eventId}/owner/{ownerId}/manage/{reservationId}`

**Description**: View and manage existing reservation

**Path Parameters:**
- `reservationId` - Reservation identifier

**Response**: HTML page with reservation details and modification options

**POST** `/event/{eventId}/owner/{ownerId}/manage/{reservationId}`

**Description**: Update reservation details

**Request Body**: Form data with updated information

**Response**: Updated reservation page or validation errors

---

## AJAX Endpoints

### Room Availability Check
**POST** `/ajax/availability`

**Description**: Real-time room availability check

**Request Body**:
```json
{
  "hotelId": "string",
  "checkin": "YYYY-MM-DD",
  "checkout": "YYYY-MM-DD",
  "rooms": number,
  "guests": number
}
```

**Response**:
```json
{
  "available": boolean,
  "rooms": [
    {
      "roomTypeId": "string",
      "roomTypeName": "string",
      "rate": number,
      "currency": "string",
      "available": number
    }
  ]
}
```

---

### Payment Validation
**POST** `/ajax/validate-payment`

**Description**: Validate payment information before submission

**Request Body**:
```json
{
  "cardNumber": "string",
  "expiryMonth": "string",
  "expiryYear": "string",
  "cvv": "string"
}
```

**Response**:
```json
{
  "valid": boolean,
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

---

### Guest Validation
**POST** `/ajax/validate-guest`

**Description**: Validate guest information

**Request Body**:
```json
{
  "guests": [
    {
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string"
    }
  ]
}
```

**Response**:
```json
{
  "valid": boolean,
  "errors": [
    {
      "guestIndex": number,
      "field": "string",
      "message": "string"
    }
  ]
}
```

## Error Responses

### Standard Error Format
All endpoints return errors in a consistent format:

**HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (event/reservation not found)
- `500` - Internal Server Error

**Error Response Body** (for AJAX endpoints):
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific error details"
  }
}
```

**HTML Error Pages** (for regular endpoints):
- Custom error pages with user-friendly messages
- Redirect to appropriate error handling pages
- Logging of errors for debugging

## Authentication

### Session-Based Authentication
- **Cookie**: `JSESSIONID` - Server-side session identifier
- **Timeout**: 30 minutes of inactivity
- **Security**: Secure, HttpOnly cookies

### Authentication Flow
1. User accesses booking URL
2. System checks for valid session
3. If no session, redirects to authentication service
4. After successful authentication, returns to booking flow
5. Session maintained throughout booking process

## Rate Limiting

### Request Limits
- **General Endpoints**: 100 requests per minute per IP
- **AJAX Endpoints**: 200 requests per minute per session
- **Payment Endpoints**: 10 requests per minute per session

### Throttling Response
**HTTP Status**: `429 Too Many Requests`
**Headers**:
```
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
```

## Data Formats

### Date Format
- **Input**: `YYYY-MM-DD` (ISO 8601 date format)
- **Display**: Localized format based on user preferences

### Currency Format
- **Storage**: Decimal values in USD
- **Display**: Localized currency formatting
- **API**: Numeric values with currency code

### Phone Numbers
- **Input**: Various international formats accepted
- **Storage**: Normalized E.164 format
- **Display**: Localized formatting

## Localization

### Supported Languages
- English (en-US) - Default
- Spanish (es-ES)
- French (fr-FR)
- German (de-DE)

### Language Selection
- **URL Parameter**: `?lang=en-US`
- **Session Storage**: Language preference maintained
- **Browser Detection**: Automatic language detection

### Localized Content
- All user-facing text
- Date and time formats
- Currency formatting
- Validation messages
- Error messages
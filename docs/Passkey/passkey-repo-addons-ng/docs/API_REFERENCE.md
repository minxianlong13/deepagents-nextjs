# API Reference

## Base URL

The Addon Portal is hosted as a sub-application under the booking site:
- **Development**: `https://dev-book.passkey.com/addon`
- **Alpha**: `https://alpha-book.passkey.com/addon`
- **TS50**: `https://ts50-book.passkey.com/addon`
- **Staging**: `https://stg-book.passkey.com/addon`

## Authentication

All endpoints require authentication through the Passkey Authentication Service. Users must have valid sessions established through the main booking application.

## Endpoints

### Account Management

#### POST /account/forgotusername
**Description**: Retrieve username(s) associated with an email address

**Parameters**:
- `email` (query, required): Email address to search for usernames

**Request**:
```http
POST /addon/account/forgotusername?email=user@example.com
```

**Response**: 
- **200**: Username retrieval initiated (email sent if found)
- **500**: Server error during username lookup

**Example**:
```bash
curl -X POST "https://dev-book.passkey.com/addon/account/forgotusername?email=user@example.com"
```

---

#### POST /account/pwdresetemail
**Description**: Send password reset instructions to user

**Parameters**:
- `username` (query, required): Username for password reset

**Request**:
```http
POST /addon/account/pwdresetemail?username=testuser
```

**Response**:
- **200**: Password reset email sent successfully
- **500**: Error sending password reset email

**Example**:
```bash
curl -X POST "https://dev-book.passkey.com/addon/account/pwdresetemail?username=testuser"
```

---

#### GET /account/pwdreset/{key}
**Description**: Display password reset form with security question

**Path Parameters**:
- `key` (string, required): Password reset token

**Response**:
- **200**: Password reset form displayed
- **Redirect**: Error page if token is invalid/expired

**Example**:
```bash
curl "https://dev-book.passkey.com/addon/account/pwdreset/abc123token"
```

---

#### POST /account/pwdreset
**Description**: Process password reset with security question answer

**Request Body** (form data):
- `answer` (string, required): Security question answer
- `newPassword` (string, required): New password
- `newPasswordConfirm` (string, required): Password confirmation

**Response**:
- **200**: Password reset successful
- **400**: Validation errors or incorrect answer
- **Redirect**: Account locked if too many failures

### Booking Management

#### GET /bookings
**Description**: Display booking search and results interface

**Query Parameters**:
- `startDate` (date, optional): Search start date (YYYY-MM-DD)
- `endDate` (date, optional): Search end date (YYYY-MM-DD)
- `guestName` (string, optional): Guest name filter
- `confirmationNumber` (string, optional): Booking confirmation number
- `page` (integer, optional): Page number for pagination (default: 1)
- `size` (integer, optional): Results per page (default: 20)

**Response**: HTML page with booking results

**Example**:
```bash
curl "https://dev-book.passkey.com/addon/bookings?startDate=2024-01-01&endDate=2024-01-31&page=1"
```

---

#### POST /bookings/search
**Description**: Execute booking search with advanced filters

**Request Body** (form data):
- `searchParams.startDate` (date): Search start date
- `searchParams.endDate` (date): Search end date
- `searchParams.guestName` (string): Guest name
- `searchParams.hotelId` (integer): Hotel ID filter
- `searchParams.addonType` (string): Addon type filter

**Response**: 
- **200**: Search results page
- **400**: Invalid search parameters

### Arrivals Management

#### GET /arrivals
**Description**: Display guest arrival information and management interface

**Query Parameters**:
- `arrivalDate` (date, optional): Specific arrival date (YYYY-MM-DD)
- `hotelId` (integer, optional): Filter by hotel ID
- `status` (string, optional): Arrival status filter

**Response**: HTML page with arrival information

**Example**:
```bash
curl "https://dev-book.passkey.com/addon/arrivals?arrivalDate=2024-02-15&hotelId=123"
```

---

#### POST /arrivals/update
**Description**: Update arrival information for guests

**Request Body** (JSON):
```json
{
  "arrivalId": 12345,
  "actualArrivalTime": "2024-02-15T14:30:00",
  "notes": "Guest arrived early",
  "status": "CHECKED_IN"
}
```

**Response**:
- **200**: Arrival information updated successfully
- **400**: Invalid arrival data
- **404**: Arrival record not found

### Registration Completion

#### GET /completereg
**Description**: Display registration completion form

**Query Parameters**:
- `token` (string, required): Registration completion token
- `guestId` (integer, optional): Guest identifier

**Response**: 
- **200**: Registration completion form
- **400**: Invalid or expired token

---

#### POST /completereg
**Description**: Process registration completion

**Request Body** (form data):
- `personalInfo.firstName` (string, required): Guest first name
- `personalInfo.lastName` (string, required): Guest last name
- `personalInfo.email` (string, required): Guest email
- `personalInfo.phone` (string, optional): Guest phone number
- `preferences.newsletter` (boolean): Newsletter subscription
- `preferences.promotions` (boolean): Promotional emails

**Response**:
- **200**: Registration completed successfully
- **400**: Validation errors
- **Redirect**: Success page on completion

### Hotel Search

#### GET /hotels/search
**Description**: Search for hotels with addon availability

**Query Parameters**:
- `location` (string, optional): Hotel location or city
- `checkIn` (date, optional): Check-in date (YYYY-MM-DD)
- `checkOut` (date, optional): Check-out date (YYYY-MM-DD)
- `addonType` (string, optional): Specific addon type filter

**Response**: JSON array of hotel search results

**Example Response**:
```json
[
  {
    "hotelId": 123,
    "name": "Grand Hotel Downtown",
    "location": "New York, NY",
    "availableAddons": [
      {
        "addonId": 456,
        "name": "Spa Package",
        "price": 150.00,
        "currency": "USD"
      }
    ]
  }
]
```

### Sorting and Filtering

#### POST /sort
**Description**: Apply sorting and filtering to current results

**Request Body** (form data):
- `sortBy` (string): Sort field (date, price, name, etc.)
- `sortOrder` (string): Sort direction (asc, desc)
- `filters.dateRange` (string): Date range filter
- `filters.priceRange` (string): Price range filter
- `filters.addonTypes` (array): Addon type filters

**Response**:
- **200**: Updated results with applied sorting/filtering
- **400**: Invalid sort or filter parameters

### System Endpoints

#### GET /health
**Description**: Application health check endpoint

**Response**:
```json
{
  "status": "UP",
  "timestamp": "2024-02-15T10:30:00Z",
  "version": "3.3.0",
  "environment": "development"
}
```

**Status Codes**:
- **200**: Application is healthy
- **503**: Application is unhealthy

---

#### GET /session/timeout
**Description**: Check session timeout status

**Response**:
```json
{
  "timeoutWarning": false,
  "remainingTime": 1800,
  "sessionId": "ABC123..."
}
```

### Cvent Apps Integration

#### POST /cventapps/integration
**Description**: Handle integration requests from Cvent applications

**Request Body** (JSON):
```json
{
  "eventId": "evt_123456",
  "integrationData": {
    "attendeeId": "att_789012",
    "addonRequests": [
      {
        "addonType": "TRANSPORTATION",
        "quantity": 1,
        "preferences": {}
      }
    ]
  }
}
```

**Response**:
- **200**: Integration processed successfully
- **400**: Invalid integration data
- **401**: Unauthorized integration request

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request parameters",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "AUTHENTICATION_REQUIRED",
  "message": "Valid authentication required",
  "loginUrl": "/addon/login"
}
```

### 403 Forbidden
```json
{
  "error": "ACCESS_DENIED",
  "message": "Insufficient permissions for this operation"
}
```

### 404 Not Found
```json
{
  "error": "RESOURCE_NOT_FOUND",
  "message": "Requested resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "requestId": "req_123456789"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Limit**: 100 requests per minute per authenticated user
- **Headers**: Rate limit information included in response headers
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Window reset time (Unix timestamp)

## Content Types

- **Request Content-Type**: `application/x-www-form-urlencoded` for form submissions, `application/json` for API calls
- **Response Content-Type**: `text/html` for page responses, `application/json` for API responses
- **Character Encoding**: UTF-8 for all text content

## CSRF Protection

All state-changing operations (POST, PUT, DELETE) require CSRF tokens:
- Token included as hidden form field: `<input type="hidden" name="_csrf" value="${_csrf.token}"/>`
- Token included in AJAX requests as header: `X-CSRF-TOKEN`
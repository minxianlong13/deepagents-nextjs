# API Reference

## Base URL

The Passkey Planner Portal is accessible at:
- **Development**: `https://dev-planners.passkey.com/`
- **Staging**: `https://staging-planners.passkey.com/`
- **Production**: `https://planners.passkey.com/`

## Authentication

All endpoints require authentication through the Passkey Authentication Service. Users must have valid session cookies to access protected resources.

## Endpoints

### Portal Management

#### GET /portal/dashboard
**Description**: Displays the main planner dashboard with event overview and quick actions

**Authentication**: Required

**Response**: HTML dashboard page with:
- Active events summary
- Recent reservations
- Quick action buttons
- Navigation menu

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 500: Internal Server Error

---

#### GET /portal/health
**Description**: Health check endpoint for monitoring application status

**Authentication**: Not required

**Response**:
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "3.9.39"
}
```

**Status Codes**:
- 200: Application healthy
- 503: Service unavailable

---

### Event Management

#### GET /events
**Description**: Lists all events accessible to the authenticated planner

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number for pagination (default: 1)
- `size` (optional): Number of events per page (default: 20)
- `status` (optional): Filter by event status (active, completed, cancelled)
- `dateFrom` (optional): Filter events from date (YYYY-MM-DD)
- `dateTo` (optional): Filter events to date (YYYY-MM-DD)

**Response**: HTML page with event listing table

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 400: Invalid parameters

---

#### GET /events/{eventId}
**Description**: Displays detailed information for a specific event

**Authentication**: Required

**Path Parameters**:
- `eventId`: Unique identifier for the event

**Response**: HTML event details page with:
- Event information
- Reservation summary
- Hotel listings
- Action buttons

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Event not found

---

#### POST /events/create
**Description**: Creates a new event with housing requirements

**Authentication**: Required

**Request Body** (Form Data):
- `eventName`: Event name (required)
- `startDate`: Event start date (required, YYYY-MM-DD)
- `endDate`: Event end date (required, YYYY-MM-DD)
- `location`: Event location (required)
- `expectedAttendees`: Number of expected attendees (required)
- `description`: Event description (optional)

**Response**: Redirect to event details page

**Status Codes**:
- 302: Created successfully (redirect)
- 400: Invalid input data
- 401: Unauthorized
- 500: Creation failed

---

### Reservation Management

#### GET /events/{eventId}/reservations
**Description**: Lists all reservations for a specific event

**Authentication**: Required

**Path Parameters**:
- `eventId`: Event identifier

**Query Parameters**:
- `status` (optional): Filter by reservation status
- `hotel` (optional): Filter by hotel ID

**Response**: HTML reservations listing page

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 404: Event not found

---

#### POST /events/{eventId}/reservations
**Description**: Creates a new reservation for an event

**Authentication**: Required

**Path Parameters**:
- `eventId`: Event identifier

**Request Body** (Form Data):
- `hotelId`: Hotel identifier (required)
- `roomType`: Room type (required)
- `checkIn`: Check-in date (required, YYYY-MM-DD)
- `checkOut`: Check-out date (required, YYYY-MM-DD)
- `roomCount`: Number of rooms (required)
- `rate`: Room rate (optional)

**Response**: Redirect to reservations page

**Status Codes**:
- 302: Created successfully (redirect)
- 400: Invalid input data
- 401: Unauthorized
- 409: Inventory conflict

---

### Reporting

#### GET /reports
**Description**: Displays available reports and analytics

**Authentication**: Required

**Response**: HTML reports dashboard with:
- Available report types
- Recent reports
- Export options

**Status Codes**:
- 200: Success
- 401: Unauthorized

---

#### GET /reports/generate
**Description**: Generates a custom report based on specified parameters

**Authentication**: Required

**Query Parameters**:
- `type`: Report type (occupancy, revenue, pickup, etc.)
- `eventId` (optional): Specific event ID
- `dateFrom`: Start date for report data
- `dateTo`: End date for report data
- `format`: Output format (html, pdf, excel)

**Response**: Generated report in specified format

**Status Codes**:
- 200: Success
- 400: Invalid parameters
- 401: Unauthorized
- 500: Report generation failed

---

#### GET /charts/{chartType}
**Description**: Generates chart images for dashboard and reports

**Authentication**: Required

**Path Parameters**:
- `chartType`: Type of chart (occupancy, pickup, revenue)

**Query Parameters**:
- `eventId` (optional): Event identifier
- `width`: Chart width in pixels (default: 800)
- `height`: Chart height in pixels (default: 400)

**Response**: PNG image data

**Status Codes**:
- 200: Success
- 400: Invalid parameters
- 401: Unauthorized

---

### File Management

#### POST /upload/file
**Description**: Uploads files with malware scanning

**Authentication**: Required

**Request Body** (Multipart Form):
- `file`: File to upload (required)
- `eventId`: Associated event ID (optional)
- `description`: File description (optional)

**Response**:
```json
{
  "success": true,
  "fileId": "12345",
  "filename": "document.pdf",
  "size": 1024000,
  "scanResult": "clean"
}
```

**Status Codes**:
- 200: Upload successful
- 400: Invalid file or parameters
- 401: Unauthorized
- 413: File too large
- 422: Malware detected

---

### Account Management

#### GET /account/profile
**Description**: Displays user profile information

**Authentication**: Required

**Response**: HTML profile page with user details and preferences

**Status Codes**:
- 200: Success
- 401: Unauthorized

---

#### POST /account/profile
**Description**: Updates user profile information

**Authentication**: Required

**Request Body** (Form Data):
- `firstName`: User's first name
- `lastName`: User's last name
- `email`: Email address
- `phone`: Phone number
- `preferences`: JSON string of user preferences

**Response**: Redirect to profile page

**Status Codes**:
- 302: Updated successfully (redirect)
- 400: Invalid input data
- 401: Unauthorized

---

### Administrative Functions

#### GET /admin/users
**Description**: Lists all users (admin only)

**Authentication**: Required (Admin role)

**Query Parameters**:
- `page` (optional): Page number
- `search` (optional): Search term for user filtering

**Response**: HTML user management page

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 403: Insufficient permissions

---

#### GET /admin/system/status
**Description**: System status and health information (admin only)

**Authentication**: Required (Admin role)

**Response**:
```json
{
  "database": "connected",
  "externalServices": {
    "authService": "healthy",
    "reportingService": "healthy",
    "bookingService": "degraded"
  },
  "memoryUsage": "75%",
  "activeUsers": 42
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 403: Insufficient permissions

---

### Session Management

#### GET /session/timeout
**Description**: Checks session timeout status

**Authentication**: Required

**Response**:
```json
{
  "timeRemaining": 1800,
  "warningThreshold": 300,
  "sessionActive": true
}
```

**Status Codes**:
- 200: Success
- 401: Session expired

---

#### POST /session/extend
**Description**: Extends the current user session

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "newExpiration": "2024-01-15T12:30:00Z"
}
```

**Status Codes**:
- 200: Session extended
- 401: Session expired

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid input parameters",
  "details": ["Field 'eventName' is required"]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "requestId": "req-12345"
}
```

## Rate Limiting

- Standard endpoints: 100 requests per minute per user
- File upload endpoints: 10 requests per minute per user
- Report generation: 5 requests per minute per user

## Content Types

- **Request**: `application/x-www-form-urlencoded`, `multipart/form-data`
- **Response**: `text/html`, `application/json`, `image/png`, `application/pdf`

## Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
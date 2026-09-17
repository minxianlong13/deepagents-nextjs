# API Reference

## Base URL
`https://passkey-notifications.{environment}.cvent.com`

## Authentication
All endpoints require API key authentication using the `Authorization` header:
```
Authorization: Bearer {api-key}
```

## Endpoints

### User Notifications API (V1)

#### GET /passkey-notifications/v1/user-notifications/{userId}/notifications/{notificationType}
**Description**: Retrieves notifications for a specific user and notification type.

**Path Parameters**:
- `userId` (Long, required) - The ID of the user requesting notifications
- `notificationType` (NotificationType, required) - Type of notifications to retrieve

**Query Parameters**:
- `participantId` (Long, optional) - Participant ID for Group Link Setup notifications
- `eventId` (Long, optional) - Event ID to narrow down notifications
- `userType` (UserType, optional) - User type (ORG/Hotel) for specific notification filtering
- `fetchLimit` (Long, optional) - Limit notification response size (applies to GML notifications)
- `fetchStart` (Long, optional) - Starting point for AB notifications pagination

**Response**:
```json
{
  "notifications": [
    {
      "id": "string",
      "type": "AUTO_BLOCK_REQUEST",
      "userId": 12345,
      "eventId": 67890,
      "message": "Auto-block request processed",
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "UNREAD"
    }
  ],
  "totalCount": 1,
  "hasMore": false
}
```

**Status Codes**:
- 200: Success
- 400: Bad Request - Invalid parameters
- 401: Unauthorized - Invalid API key
- 404: Not Found - User not found
- 500: Internal Server Error

#### GET /passkey-notifications/v1/user-notifications/{userId}/count
**Description**: Returns the count of notifications for a user, optionally filtered by type.

**Path Parameters**:
- `userId` (Long, required) - The ID of the user

**Query Parameters**:
- `eventId` (Long, optional) - Event ID filter
- `participantId` (Long, optional) - Participant ID filter
- `participantType` (ParticipantType, optional) - Type of participant
- `alertType` (NotificationType, optional) - Specific notification type to count
- `isSporg` (Boolean, optional, default: false) - Whether user is a SPORG user

**Response**:
```json
{
  "count": 5,
  "unreadCount": 3,
  "byType": {
    "AUTO_BLOCK_REQUEST": 2,
    "RESERVATION_TRANSFER": 1,
    "GENERAL_ALERT": 2
  }
}
```

**Status Codes**:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 500: Internal Server Error

### User Notifications API (V2)

#### GET /passkey-notifications/v2/user-notifications/{userId}/notifications/{notificationType}
**Description**: Enhanced V2 endpoint with improved filtering and response format.

**Path Parameters**:
- `userId` (Long, required) - The ID of the user requesting notifications
- `notificationType` (NotificationType, required) - Type of notifications to retrieve

**Query Parameters**:
- `participantId` (Long, optional) - Participant ID filter
- `eventId` (Long, optional) - Event ID filter
- `userType` (UserType, optional) - User type filter
- `fetchLimit` (Long, optional) - Response size limit
- `fetchStart` (Long, optional) - Pagination starting point
- `includeRead` (Boolean, optional, default: true) - Include read notifications
- `sortOrder` (String, optional, default: "DESC") - Sort order (ASC/DESC)

**Response**:
```json
{
  "notifications": [
    {
      "id": "string",
      "type": "AUTO_BLOCK_REQUEST",
      "userId": 12345,
      "eventId": 67890,
      "participantId": 11111,
      "title": "Auto-block Request",
      "message": "Your auto-block request has been processed",
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "UNREAD",
      "priority": "HIGH",
      "metadata": {
        "hotelId": "hotel-123",
        "roomType": "STANDARD"
      }
    }
  ],
  "pagination": {
    "totalCount": 25,
    "currentPage": 1,
    "pageSize": 10,
    "hasNext": true,
    "nextCursor": "cursor-token"
  }
}
```

### Admin API

#### GET /passkey-notifications/admin/notifications
**Description**: Administrative endpoint to retrieve notifications across all users.

**Query Parameters**:
- `userId` (Long, optional) - Filter by specific user
- `eventId` (Long, optional) - Filter by event
- `notificationType` (NotificationType, optional) - Filter by type
- `startDate` (String, optional) - Start date filter (ISO 8601)
- `endDate` (String, optional) - End date filter (ISO 8601)
- `limit` (Integer, optional, default: 100) - Response limit
- `offset` (Integer, optional, default: 0) - Pagination offset

**Response**:
```json
{
  "notifications": [...],
  "totalCount": 1000,
  "limit": 100,
  "offset": 0
}
```

#### POST /passkey-notifications/admin/notifications/{notificationId}/status
**Description**: Update notification status (mark as read/unread).

**Path Parameters**:
- `notificationId` (String, required) - Notification ID

**Request Body**:
```json
{
  "status": "READ"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Notification status updated"
}
```

### Event Publishing API

#### POST /passkey-notifications/events/publish
**Description**: Publish notification events to EventBridge.

**Request Body**:
```json
{
  "eventType": "NOTIFICATION_CREATED",
  "source": "passkey-notifications",
  "data": {
    "notificationId": "notif-123",
    "userId": 12345,
    "type": "AUTO_BLOCK_REQUEST",
    "eventId": 67890
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response**:
```json
{
  "eventId": "event-456",
  "status": "PUBLISHED",
  "timestamp": "2024-01-15T10:30:01Z"
}
```

#### POST /passkey-notifications/admin/events/create
**Description**: Administrative endpoint to create and publish events.

**Request Body**:
```json
{
  "eventType": "ADMIN_NOTIFICATION",
  "targetUsers": [12345, 67890],
  "message": "System maintenance scheduled",
  "priority": "HIGH",
  "metadata": {
    "maintenanceWindow": "2024-01-20T02:00:00Z"
  }
}
```

### Alerts API

#### GET /passkey-notifications/alerts/{userId}
**Description**: Retrieve alerts for a specific user.

**Path Parameters**:
- `userId` (Long, required) - User ID

**Query Parameters**:
- `alertType` (String, optional) - Filter by alert type
- `severity` (String, optional) - Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
- `limit` (Integer, optional, default: 50) - Response limit

**Response**:
```json
{
  "alerts": [
    {
      "id": "alert-123",
      "type": "BOOKING_DEADLINE",
      "severity": "HIGH",
      "message": "Booking deadline approaching",
      "timestamp": "2024-01-15T10:30:00Z",
      "acknowledged": false
    }
  ],
  "totalCount": 3
}
```

## Data Models

### NotificationType Enum
- `AUTO_BLOCK_REQUEST` - Auto-block request notifications
- `RESERVATION_TRANSFER` - Reservation transfer notifications
- `GENERAL_ALERT` - General system alerts
- `BOOKING_REMINDER` - Booking deadline reminders
- `PAYMENT_ALERT` - Payment-related notifications
- `ALL` - All notification types (for count endpoints)

### UserType Enum
- `ORG` - Organization user
- `HOTEL` - Hotel user
- `ADMIN` - Administrative user

### ParticipantType Enum
- `ATTENDEE` - Event attendee
- `ORGANIZER` - Event organizer
- `NOTIFICATION_CONTACT` - Hotel staff designated to receive reservation notifications

### NotificationStatus Enum
- `READ` - Notification has been read
- `UNREAD` - Notification is unread
- `ARCHIVED` - Notification is archived

### Priority Enum
- `LOW` - Low priority notification
- `MEDIUM` - Medium priority notification
- `HIGH` - High priority notification
- `CRITICAL` - Critical priority notification

## Error Responses

All error responses follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

### Common Error Codes
- `INVALID_REQUEST` - Request validation failed
- `UNAUTHORIZED` - Authentication failed
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- **User endpoints**: 100 requests per minute per API key
- **Admin endpoints**: 500 requests per minute per API key
- **Event publishing**: 1000 requests per minute per API key

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## Pagination

For endpoints that return large datasets, pagination is supported:
- Use `limit` and `offset` for traditional pagination
- Use `cursor` tokens for cursor-based pagination (V2 endpoints)
- Maximum page size is 1000 items

## Webhooks

The service supports webhook notifications for real-time updates:
- Configure webhook URLs through admin endpoints
- Events are delivered via HTTP POST with JSON payload
- Includes retry logic with exponential backoff
- Webhook signatures for security verification
# API Reference

## Base URL
`https://passkey-user-service.{environment}.cvent.org/passkey-user/v1`

## Authentication
All endpoints require API Key authentication via the `Authorization` header.

```
Authorization: Bearer {api-key}
```

## Endpoints

### User Details Management

#### GET /user-details/{userId}
**Description**: Retrieves user details for a specific user ID.

**Path Parameters**:
- `userId` (Long, required) - The unique identifier for the user

**Response**:
```json
{
  "userId": 12345,
  "userName": "john.doe@example.com",
  "userType": "PLANNER",
  "participantId": 67890,
  "emailAddress": "john.doe@example.com",
  "lastLogin": "2024-01-15",
  "lastPasswordChange": "2023-12-01",
  "pkUserId": 12345,
  "pkActionId": 1,
  "pkTimeStamp": "2024-01-15",
  "lastAcceptedTerms": "2023-11-15",
  "lastNameFormatEnabled": true,
  "dateFormatId": 1,
  "timeFormatId": 1,
  "typeEmailNotificationId": 1
}
```

**Status Codes**:
- 200: Success
- 404: User not found
- 500: Internal server error

#### PUT /user-details/{userId}
**Description**: Updates user details for a specific user ID.

**Path Parameters**:
- `userId` (Long, required) - The unique identifier for the user

**Request Body**:
```json
{
  "userId": 12345,
  "userName": "john.doe@example.com",
  "userType": "PLANNER",
  "participantId": 67890,
  "emailAddress": "john.doe@example.com",
  "lastNameFormatEnabled": true,
  "dateFormatId": 1,
  "timeFormatId": 1,
  "typeEmailNotificationId": 1
}
```

**Status Codes**:
- 201: User details updated successfully
- 400: Invalid request (user ID mismatch)
- 404: User not found
- 500: Internal server error

### User Favorites Management

#### GET /user-favourites/{userId}
**Description**: Retrieves user's favorite properties.

**Path Parameters**:
- `userId` (Long, required) - The unique identifier for the user

**Query Parameters**:
- `limit` (Integer, optional) - Maximum number of favorites to return
- `offset` (Integer, optional) - Number of favorites to skip

**Response**:
```json
{
  "favorites": [
    {
      "favoriteId": 1,
      "userId": 12345,
      "propertyId": 98765,
      "propertyName": "Grand Hotel Downtown",
      "dateAdded": "2024-01-10",
      "notes": "Great location near conference center"
    }
  ],
  "totalCount": 5
}
```

**Status Codes**:
- 200: Success
- 404: User not found
- 500: Internal server error

#### POST /user-favourites/{userId}
**Description**: Adds a property to user's favorites.

**Path Parameters**:
- `userId` (Long, required) - The unique identifier for the user

**Request Body**:
```json
{
  "propertyId": 98765,
  "notes": "Great location near conference center"
}
```

**Status Codes**:
- 201: Favorite added successfully
- 400: Invalid request
- 409: Property already in favorites
- 500: Internal server error

#### DELETE /user-favourites/{userId}/{favoriteId}
**Description**: Removes a property from user's favorites.

**Path Parameters**:
- `userId` (Long, required) - The unique identifier for the user
- `favoriteId` (Long, required) - The unique identifier for the favorite

**Status Codes**:
- 204: Favorite removed successfully
- 404: Favorite not found
- 500: Internal server error

### User Preferences Management

#### GET /user-preferences/{userId}
**Description**: Retrieves user preferences and settings.

**Path Parameters**:
- `userId` (Long, required) - The unique identifier for the user

**Response**:
```json
{
  "userId": 12345,
  "dateFormatId": 1,
  "timeFormatId": 1,
  "typeEmailNotificationId": 1,
  "lastNameFormatEnabled": true,
  "language": "en-US",
  "timezone": "America/New_York"
}
```

**Status Codes**:
- 200: Success
- 404: User not found
- 500: Internal server error

#### PUT /user-preferences/{userId}
**Description**: Updates user preferences and settings.

**Path Parameters**:
- `userId` (Long, required) - The unique identifier for the user

**Request Body**:
```json
{
  "userId": 12345,
  "dateFormatId": 2,
  "timeFormatId": 2,
  "typeEmailNotificationId": 2,
  "lastNameFormatEnabled": false,
  "language": "en-GB",
  "timezone": "Europe/London"
}
```

**Status Codes**:
- 200: Preferences updated successfully
- 400: Invalid request
- 404: User not found
- 500: Internal server error

### Participant Management

#### GET /participants/{participantId}
**Description**: Retrieves participant organization information.

**Path Parameters**:
- `participantId` (Long, required) - The unique identifier for the participant organization

**Response**:
```json
{
  "participantId": 67890,
  "organizationName": "Example Corp",
  "objectType": "EVENT_ORGANIZER",
  "contactInfo": {
    "email": "contact@example.com",
    "phone": "+1-555-123-4567",
    "address": "123 Business St, City, State"
  },
  "customerFlags": 1,
  "permissionLevels": "READ_WRITE"
}
```

**Status Codes**:
- 200: Success
- 404: Participant not found
- 500: Internal server error

### Administrative Endpoints

#### GET /admin/user-favourites
**Description**: Administrative endpoint to retrieve user favorites with filtering options.

**Query Parameters**:
- `userId` (Long, optional) - Filter by user ID
- `propertyId` (Long, optional) - Filter by property ID
- `dateFrom` (String, optional) - Filter favorites added after this date (YYYY-MM-DD)
- `dateTo` (String, optional) - Filter favorites added before this date (YYYY-MM-DD)
- `limit` (Integer, optional) - Maximum number of results
- `offset` (Integer, optional) - Number of results to skip

**Response**:
```json
{
  "favorites": [
    {
      "favoriteId": 1,
      "userId": 12345,
      "propertyId": 98765,
      "propertyName": "Grand Hotel Downtown",
      "dateAdded": "2024-01-10",
      "notes": "Great location"
    }
  ],
  "totalCount": 150,
  "hasMore": true
}
```

**Status Codes**:
- 200: Success
- 400: Invalid query parameters
- 500: Internal server error

### Reporting Framework Integration

#### GET /reporting/user-info
**Description**: Provides user information for reporting framework integration.

**Query Parameters**:
- `userIds` (String, required) - Comma-separated list of user IDs
- `fields` (String, optional) - Comma-separated list of fields to include

**Response**:
```json
{
  "users": [
    {
      "userId": 12345,
      "userName": "john.doe@example.com",
      "userType": "PLANNER",
      "lastLogin": "2024-01-15",
      "participantId": 67890
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 400: Invalid request parameters
- 500: Internal server error

## Error Response Format

All error responses follow a consistent format:

```json
{
  "message": "Detailed error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/passkey-user/v1/user-details/12345"
}
```

## Common Error Codes

- `INVALID_REQUEST`: Request validation failed
- `USER_NOT_FOUND`: Specified user does not exist
- `PARTICIPANT_NOT_FOUND`: Specified participant does not exist
- `FAVORITE_NOT_FOUND`: Specified favorite does not exist
- `DUPLICATE_FAVORITE`: Property already in user's favorites
- `DATABASE_ERROR`: Database operation failed
- `AUTHENTICATION_FAILED`: Invalid or missing API key
- `AUTHORIZATION_FAILED`: Insufficient permissions

## Rate Limiting

API requests are subject to rate limiting:
- 1000 requests per minute per API key
- 429 status code returned when limit exceeded
- `Retry-After` header indicates when to retry

## Pagination

List endpoints support pagination via query parameters:
- `limit`: Maximum number of items to return (default: 50, max: 500)
- `offset`: Number of items to skip (default: 0)

Response includes pagination metadata:
```json
{
  "data": [...],
  "totalCount": 150,
  "hasMore": true,
  "limit": 50,
  "offset": 0
}
```
# API Reference

## Base URL
`/passkey-admin/v1`

## Authentication
All endpoints require OAuth authentication with valid JWT tokens.

## Endpoints

### Contact Management

#### POST /contacts
**Description**: Creates a new contact in the system

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "emailAddress": "john.doe@example.com",
  "phoneNumber": "+1-555-0123",
  "companyName": "Example Corp",
  "jobTitle": "Manager",
  "contactStatusId": 1,
  "emailTypeIds": [1, 2]
}
```

**Response**:
```json
{
  "contactId": 12345,
  "firstName": "John",
  "lastName": "Doe",
  "emailAddress": "john.doe@example.com",
  "phoneNumber": "+1-555-0123",
  "companyName": "Example Corp",
  "jobTitle": "Manager",
  "contactStatusId": 1,
  "emailTypeIds": [1, 2],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 201: Contact created successfully
- 400: Validation errors in request body
- 401: Unauthorized
- 500: Internal server error

#### PATCH /contacts/{contactId}
**Description**: Updates an existing contact with partial data

**Path Parameters**:
- `contactId` (Long) - The unique identifier of the contact to update

**Request Body** (partial update):
```json
{
  "firstName": "Jane",
  "emailAddress": "jane.doe@example.com",
  "jobTitle": "Senior Manager"
}
```

**Response**:
- 200: Contact updated successfully (no body)
- 400: Validation errors
- 404: Contact not found
- 500: Internal server error

#### DELETE /contacts/{contactId}
**Description**: Deletes a contact from the system

**Path Parameters**:
- `contactId` (Long) - The unique identifier of the contact to delete

**Response**:
- 204: Contact deleted successfully (no body)
- 404: Contact not found
- 500: Internal server error

### User and Contact Details

#### POST /users-or-contacts/details
**Description**: Retrieves detailed information about users or contacts based on filter criteria

**Request Body**:
```json
{
  "filterType": "EMAIL",
  "filterValues": ["user1@example.com", "user2@example.com"],
  "includeUsers": true,
  "includeContacts": true,
  "limit": 100,
  "offset": 0
}
```

**Query Parameters**:
- `filterType` - Type of filter (EMAIL, ID, NAME)
- `filterValues` - Array of values to filter by
- `includeUsers` - Whether to include platform users in results
- `includeContacts` - Whether to include contacts in results
- `limit` - Maximum number of results to return
- `offset` - Number of results to skip for pagination

**Response**:
```json
{
  "users": [
    {
      "userId": "user-123",
      "firstName": "Alice",
      "lastName": "Smith",
      "emailAddress": "alice.smith@example.com",
      "userType": "PLATFORM_USER",
      "status": "ACTIVE",
      "lastLoginAt": "2024-01-15T09:15:00Z"
    }
  ],
  "contacts": [
    {
      "contactId": 12345,
      "firstName": "John",
      "lastName": "Doe",
      "emailAddress": "john.doe@example.com",
      "companyName": "Example Corp",
      "contactStatus": "ACTIVE",
      "emailTypes": ["MARKETING", "NOTIFICATIONS"]
    }
  ],
  "totalCount": 2,
  "hasMore": false
}
```

**Status Codes**:
- 200: Success
- 400: Invalid filter criteria
- 401: Unauthorized
- 500: Internal server error

### Email Type Management

#### GET /email-types
**Description**: Retrieves all available email types

**Response**:
```json
[
  {
    "emailTypeId": 1,
    "typeName": "MARKETING",
    "description": "Marketing and promotional emails",
    "isActive": true
  },
  {
    "emailTypeId": 2,
    "typeName": "NOTIFICATIONS",
    "description": "System notifications and alerts",
    "isActive": true
  }
]
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 500: Internal server error

### Analytics

#### POST /analytics/events
**Description**: Records analytics events for tracking and reporting

**Request Body**:
```json
{
  "eventType": "CONTACT_CREATED",
  "entityId": "12345",
  "entityType": "CONTACT",
  "userId": "user-123",
  "metadata": {
    "source": "admin_portal",
    "campaign": "spring_2024"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response**:
```json
{
  "eventId": "event-789",
  "status": "RECORDED",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 201: Event recorded successfully
- 400: Invalid event data
- 401: Unauthorized
- 500: Internal server error

#### GET /analytics/reports/{reportType}
**Description**: Generates analytics reports based on specified criteria

**Path Parameters**:
- `reportType` - Type of report (CONTACT_SUMMARY, USER_ACTIVITY, EMAIL_ENGAGEMENT)

**Query Parameters**:
- `startDate` - Start date for report period (ISO 8601)
- `endDate` - End date for report period (ISO 8601)
- `groupBy` - Grouping criteria (DAY, WEEK, MONTH)
- `filters` - Additional filters as JSON string

**Response**:
```json
{
  "reportType": "CONTACT_SUMMARY",
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  },
  "data": [
    {
      "date": "2024-01-15",
      "contactsCreated": 25,
      "contactsUpdated": 12,
      "contactsDeleted": 3
    }
  ],
  "summary": {
    "totalContacts": 1250,
    "activeContacts": 1180,
    "inactiveContacts": 70
  }
}
```

**Status Codes**:
- 200: Report generated successfully
- 400: Invalid report parameters
- 401: Unauthorized
- 404: Report type not found
- 500: Internal server error

### GDPR Compliance

#### POST /gdpr/data-export
**Description**: Exports user data for GDPR compliance requests

**Request Body**:
```json
{
  "userId": "user-123",
  "emailAddress": "user@example.com",
  "exportFormat": "JSON",
  "includeContacts": true,
  "includeAnalytics": false
}
```

**Response**:
```json
{
  "exportId": "export-456",
  "status": "PROCESSING",
  "estimatedCompletionTime": "2024-01-15T11:00:00Z",
  "downloadUrl": null
}
```

**Status Codes**:
- 202: Export request accepted
- 400: Invalid export request
- 401: Unauthorized
- 500: Internal server error

#### DELETE /gdpr/data-deletion
**Description**: Processes data deletion requests for GDPR compliance

**Request Body**:
```json
{
  "userId": "user-123",
  "emailAddress": "user@example.com",
  "deletionReason": "USER_REQUEST",
  "retentionOverride": false
}
```

**Response**:
```json
{
  "deletionId": "deletion-789",
  "status": "SCHEDULED",
  "scheduledDeletionDate": "2024-02-15T00:00:00Z",
  "affectedRecords": {
    "contacts": 5,
    "analytics": 150,
    "userProfiles": 1
  }
}
```

**Status Codes**:
- 202: Deletion request accepted
- 400: Invalid deletion request
- 401: Unauthorized
- 409: Deletion conflicts with retention policies
- 500: Internal server error

## Health and Monitoring

#### GET /actuator/health
**Description**: Returns the health status of the service

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

#### GET /actuator/info
**Description**: Returns application information and build details

**Response**:
```json
{
  "app": {
    "name": "passkey-admin-service",
    "version": "0.4.1",
    "description": "Passkey Admin Service"
  },
  "build": {
    "version": "0.4.1",
    "artifact": "passkey-admin-service",
    "group": "com.cvent.passkeyadminservice"
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for field 'emailAddress'",
  "path": "/passkey-admin/v1/contacts",
  "details": [
    {
      "field": "emailAddress",
      "rejectedValue": "invalid-email",
      "message": "Email address format is invalid"
    }
  ]
}
```

### Common HTTP Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no response body
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict or business rule violation
- **500 Internal Server Error**: Unexpected server error

## Rate Limiting
- Default rate limit: 1000 requests per minute per authenticated user
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when rate limit resets

## Versioning
- API version is included in the URL path (`/v1`)
- Backward compatibility maintained within major versions
- Deprecation notices provided 6 months before removal
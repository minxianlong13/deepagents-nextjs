# Domain Model

## Glossary

### Amadeus
A global distribution system (GDS) and technology provider for the travel and hospitality industry. In this context, refers to the Amadeus Delphi FDC system that sends event notifications.

### Delphi FDC
Delphi.fdc is an end-to-end sales and catering solution designed for organizations that sell and manage meeting and event space. It's the source system that generates event notifications.

### GML (Guest Management Language)
A standardized format for exchanging guest and reservation data between hospitality systems. The service transforms Amadeus data into GML format for Passkey consumption.

### Notification
An event message sent from Amadeus Delphi FDC to indicate changes in bookings, reservations, or guest services. Notifications trigger processing workflows in the Passkey system.

### PreCode
A unique identifier used in the hospitality industry to identify specific hotels, properties, or booking channels. Used for routing and processing notifications to the correct destination.

### Resource
A bookable item or space within a hotel or venue, such as a room, meeting space, or amenity. Each resource has a unique identifier used in event notifications.

### Location
A physical hotel, venue, or property where events and bookings take place. Identified by a unique locationId in the system.

### Event Detail
Specific information about an event or booking change, including timing, type, and affected resources.

### Processing Service
The core business logic component that orchestrates the transformation and forwarding of notifications from Amadeus to Passkey services.

### Notification Processor
A background service that runs on scheduled intervals to process queued notifications asynchronously.

## Core Entities

### NotificationRequest
**Description**: The primary entity representing an event notification from Amadeus Delphi FDC

**Attributes**:
- `id`: String - Unique identifier for the notification
- `eventDetail`: EventDetail - Detailed information about the event
- `guestInformation`: Object - Guest-related data (optional)
- `bookingDetails`: Object - Booking-specific information (optional)
- `metadata`: Object - Additional metadata and tracking information

**Relationships**:
- Contains one EventDetail
- May contain guest and booking information
- Processed by NotificationProcessor
- Stored in DynamoDB via NotificationService

### EventDetail
**Description**: Detailed information about a specific event or booking change

**Attributes**:
- `locationId`: String - Identifier for the hotel/venue location
- `resourceId`: String - Identifier for the specific resource (room, space)
- `eventType`: String - Type of event (booking_created, booking_modified, etc.)
- `timestamp`: DateTime - When the event occurred
- `preCode`: String - Hotel/property identifier code
- `bookingId`: String - Associated booking identifier
- `eventCategory`: String - Category classification of the event
- `priority`: String - Processing priority level

**Relationships**:
- Belongs to NotificationRequest
- References Location and Resource entities
- Used by ProcessingService for routing decisions

### BookingFetch
**Description**: Represents booking data retrieved from external systems during processing

**Attributes**:
- `bookingReference`: String - External booking reference number
- `guestCount`: Integer - Number of guests in the booking
- `checkInDate`: Date - Scheduled check-in date
- `checkOutDate`: Date - Scheduled check-out date
- `roomType`: String - Type of room booked
- `rateCode`: String - Rate plan identifier
- `totalAmount`: Decimal - Total booking amount
- `currency`: String - Currency code for the booking

**Relationships**:
- Associated with NotificationRequest
- Retrieved by AmadeusService
- Transformed by GMLMessageService

### InnerNotification
**Description**: Internal representation of notifications used during processing

**Attributes**:
- `notificationId`: String - Internal notification identifier
- `status`: String - Processing status (pending, processing, completed, failed)
- `processingAttempts`: Integer - Number of processing attempts
- `lastProcessedAt`: DateTime - Timestamp of last processing attempt
- `errorMessage`: String - Error details if processing failed
- `correlationId`: String - Correlation identifier for tracking

**Relationships**:
- Derived from NotificationRequest
- Managed by NotificationProcessor
- Logged by LogDynamoDBService

### Task
**Description**: Represents a processing task in the system workflow

**Attributes**:
- `taskId`: String - Unique task identifier
- `taskType`: String - Type of task (notification_processing, data_fetch, etc.)
- `status`: String - Current task status
- `createdAt`: DateTime - Task creation timestamp
- `scheduledAt`: DateTime - Scheduled execution time
- `completedAt`: DateTime - Task completion timestamp
- `payload`: Object - Task-specific data payload

**Relationships**:
- Created by NotificationProcessor
- Managed by TaskDynamoDBService
- May spawn child tasks for complex workflows

### User
**Description**: Represents user information for authentication and authorization

**Attributes**:
- `userId`: String - Unique user identifier
- `username`: String - User login name
- `roles`: List<String> - Assigned user roles
- `permissions`: List<String> - Granted permissions
- `environment`: String - Associated environment
- `lastLoginAt`: DateTime - Last login timestamp

**Relationships**:
- Managed by UserService
- Stored via UserDetailesDataAccess
- Used by AuthService for authorization

### Log Entry
**Description**: Audit log entry for tracking system operations

**Attributes**:
- `logId`: String - Unique log entry identifier
- `timestamp`: DateTime - Log entry timestamp
- `level`: String - Log level (ERROR, WARN, INFO, DEBUG)
- `message`: String - Log message content
- `correlationId`: String - Request correlation identifier
- `userId`: String - Associated user (if applicable)
- `operation`: String - Operation being logged
- `metadata`: Object - Additional contextual information

**Relationships**:
- Created by LogDynamoDBService
- Associated with NotificationRequest processing
- Used for audit trails and debugging

### Error Record
**Description**: Represents processing errors and failures

**Attributes**:
- `errorId`: String - Unique error identifier
- `timestamp`: DateTime - Error occurrence timestamp
- `errorType`: String - Classification of error
- `errorMessage`: String - Detailed error message
- `stackTrace`: String - Technical stack trace
- `notificationId`: String - Associated notification (if applicable)
- `retryCount`: Integer - Number of retry attempts
- `resolved`: Boolean - Whether error has been resolved

**Relationships**:
- Created by ErrorDynamoDBService
- Associated with failed NotificationRequest processing
- Used for error tracking and resolution

## Business Rules

### Notification Processing Rules

1. **Unique Notification IDs**: Each notification must have a unique ID. Duplicate IDs are rejected.

2. **Required Fields Validation**: All notifications must include:
   - Valid notification ID
   - EventDetail with locationId and resourceId
   - Valid timestamp in ISO 8601 format

3. **Event Type Validation**: Only supported event types are processed:
   - booking_created, booking_modified, booking_cancelled
   - guest_checkin, guest_checkout
   - room_assignment, rate_change, special_request

4. **Processing Order**: Notifications are processed in chronological order based on timestamp.

5. **Retry Logic**: Failed notifications are retried up to 3 times with exponential backoff.

### Authentication Rules

1. **API Key Validation**: All incoming requests must include valid API key or JWT token.

2. **Role-Based Access**: Users must have appropriate roles:
   - AMADEUS_USER: For Amadeus system integration
   - delphifdc-notifications:write: For notification submission

3. **Environment Isolation**: Users can only access resources in their assigned environment.

### Data Retention Rules

1. **Notification Retention**: Processed notifications are retained for 90 days.

2. **Log Retention**: System logs are retained for 30 days.

3. **Error Retention**: Error records are retained for 180 days for analysis.

4. **Task Cleanup**: Completed tasks are cleaned up after 7 days.

### Processing Constraints

1. **Rate Limiting**: Maximum 1000 notifications per minute per API key.

2. **Batch Size**: Background processor handles maximum 100 notifications per batch.

3. **Timeout Limits**: 
   - Individual notification processing: 30 seconds
   - Batch processing: 7 minutes
   - External service calls: 10 seconds

4. **Concurrent Processing**: Maximum 5 concurrent processing threads per service instance.

### Data Validation Rules

1. **Location ID Format**: Must be alphanumeric, 3-20 characters.

2. **Resource ID Format**: Must be alphanumeric with hyphens allowed, 1-50 characters.

3. **PreCode Format**: Must be uppercase alphanumeric, 3-10 characters.

4. **Date Validation**: All dates must be valid and not more than 2 years in the past or future.

5. **Currency Validation**: Currency codes must be valid ISO 4217 codes.

### Integration Rules

1. **Amadeus Integration**: 
   - Must authenticate before each API call
   - Implement circuit breaker for service failures
   - Cache authentication tokens for 1 hour

2. **Passkey Integration**:
   - Transform all data to GML format before sending
   - Include correlation IDs for tracking
   - Implement retry logic for transient failures

3. **DynamoDB Operations**:
   - Use consistent reads for critical operations
   - Implement optimistic locking for updates
   - Batch operations where possible for efficiency

### Error Handling Rules

1. **Transient Errors**: Automatically retry with exponential backoff.

2. **Permanent Errors**: Log and alert, do not retry.

3. **Data Validation Errors**: Return 400 Bad Request with detailed error message.

4. **Authentication Errors**: Return 401 Unauthorized, do not log sensitive information.

5. **Authorization Errors**: Return 403 Forbidden, log access attempt for security monitoring.
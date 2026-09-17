# Domain Model

## Glossary

### Auto-Block Request
A request to automatically reserve a block of hotel rooms for an event. The system processes these requests and generates notifications to inform users about the status and outcomes of their auto-block requests.

### Notification
A message or alert delivered to users about events, status changes, or actions that require their attention within the Passkey system. Notifications can be of various types and priorities.

### Participant
An individual involved in an event, which can be an attendee, organizer, or hotel contact. Participants receive notifications relevant to their role and involvement in specific events.

### Reservation Transfer
The process of moving a hotel reservation from one booking system or status to another. This typically occurs during event management workflows and generates notifications to keep stakeholders informed.

### Event
A gathering or occasion (such as a conference, wedding, or corporate meeting) for which hotel accommodations are being managed through the Passkey system.

### SPORG (Special Organization)
A special type of organization in the Cvent system that has enhanced privileges and different notification handling requirements.

### EventBridge
AWS service used for event-driven architecture, allowing the service to publish and consume events in a decoupled manner.

### SQS (Simple Queue Service)
AWS messaging service used for asynchronous processing of events and notifications, ensuring reliable delivery and processing.

### Notification Template
Email or communication templates used for sending notifications to planners, hotels, or attendees. Templates define the structure and content for different types of notifications within the Passkey system.

### Business Text
Customizable labels and text strings used throughout the UI. Supports multi-language functionality via message keys and locale codes, allowing organizations to customize the user interface text and support multiple languages.

### Notification Contact
Hotel staff members specifically designated to receive reservation notifications such as new bookings, cancellations, and modifications. These contacts are configured per hotel to ensure proper communication flow.

## Core Entities

### Notification
**Description**: Represents a message or alert sent to a user about system events or required actions.

**Attributes**:
- `id`: String - Unique identifier for the notification
- `userId`: Long - ID of the user who should receive the notification
- `eventId`: Long - ID of the associated event (optional)
- `participantId`: Long - ID of the associated participant (optional)
- `type`: NotificationType - Category of the notification
- `title`: String - Brief title or subject of the notification
- `message`: String - Detailed notification content
- `timestamp`: DateTime - When the notification was created
- `status`: NotificationStatus - Current status (READ, UNREAD, ARCHIVED)
- `priority`: Priority - Importance level (LOW, MEDIUM, HIGH, CRITICAL)
- `metadata`: Map<String, Object> - Additional context-specific data

**Relationships**:
- Belongs to a User (userId)
- May be associated with an Event (eventId)
- May be associated with a Participant (participantId)

### User
**Description**: Represents a person who interacts with the Passkey system and receives notifications.

**Attributes**:
- `id`: Long - Unique user identifier
- `type`: UserType - Classification of user (ORG, HOTEL, ADMIN)
- `email`: String - User's email address
- `preferences`: NotificationPreferences - User's notification settings

**Relationships**:
- Has many Notifications
- May be associated with multiple Events as different ParticipantTypes

### Event
**Description**: Represents a gathering or occasion requiring hotel accommodations.

**Attributes**:
- `id`: Long - Unique event identifier
- `name`: String - Event name or title
- `startDate`: Date - Event start date
- `endDate`: Date - Event end date
- `organizerId`: Long - ID of the event organizer
- `status`: EventStatus - Current event status

**Relationships**:
- Has many Notifications
- Has many Participants
- Associated with Hotels through room blocks

### AutoBlockRequest
**Description**: Represents a request to automatically reserve hotel room blocks for an event.

**Attributes**:
- `id`: String - Unique request identifier
- `eventId`: Long - Associated event ID
- `userId`: Long - User who made the request
- `hotelId`: String - Target hotel identifier
- `roomType`: String - Type of rooms requested
- `roomCount`: Integer - Number of rooms requested
- `checkInDate`: Date - Requested check-in date
- `checkOutDate`: Date - Requested check-out date
- `status`: AutoBlockStatus - Current processing status
- `createdAt`: DateTime - When the request was created
- `processedAt`: DateTime - When the request was processed

**Relationships**:
- Belongs to an Event
- Belongs to a User
- Generates Notifications when processed

### ReservationTransfer
**Description**: Represents the transfer of a hotel reservation between systems or statuses.

**Attributes**:
- `id`: String - Unique transfer identifier
- `reservationId`: String - Original reservation ID
- `fromSystem`: String - Source system or status
- `toSystem`: String - Destination system or status
- `eventId`: Long - Associated event ID
- `userId`: Long - User associated with the reservation
- `transferDate`: DateTime - When the transfer occurred
- `status`: TransferStatus - Current transfer status
- `reason`: String - Reason for the transfer

**Relationships**:
- Belongs to an Event
- Belongs to a User
- Generates Notifications upon completion

### NotificationTemplate
**Description**: Represents an email or communication template used for sending notifications to different user types.

**Attributes**:
- `id`: String - Unique template identifier
- `name`: String - Template name
- `type`: TemplateType - Category of template (PLANNER, HOTEL, ATTENDEE)
- `subject`: String - Email subject template
- `body`: String - Email body template with placeholders
- `locale`: String - Language/locale code
- `active`: Boolean - Whether template is currently active
- `createdAt`: DateTime - When template was created
- `updatedAt`: DateTime - When template was last modified

**Relationships**:
- Used by Notifications for formatting
- Can have multiple locale versions

### BusinessText
**Description**: Represents customizable labels and text strings used throughout the UI with multi-language support.

**Attributes**:
- `id`: String - Unique identifier
- `messageKey`: String - Key used to reference the text in code
- `locale`: String - Language/locale code (e.g., 'en-US', 'es-ES')
- `text`: String - The actual text content
- `organizationId`: Long - Organization that owns this customization (optional)
- `category`: String - Grouping category for related text items
- `lastModified`: DateTime - When text was last updated

**Relationships**:
- Belongs to an Organization (for custom text)
- Multiple locale versions for same messageKey

### Alert
**Description**: Represents a system-generated alert or warning that requires user attention.

**Attributes**:
- `id`: String - Unique alert identifier
- `userId`: Long - Target user ID
- `type`: AlertType - Category of alert
- `severity`: Severity - Alert severity level
- `message`: String - Alert message content
- `acknowledged`: Boolean - Whether user has acknowledged the alert
- `createdAt`: DateTime - When the alert was created
- `expiresAt`: DateTime - When the alert expires (optional)

**Relationships**:
- Belongs to a User
- May be related to specific Events or Reservations

## Business Rules

### Notification Processing Rules

1. **Auto-Block Notifications**
   - Generated when auto-block requests are processed
   - Include hotel details, room counts, and approval status
   - High priority for urgent requests or failures
   - Automatically marked as unread upon creation

2. **Reservation Transfer Notifications**
   - Created when reservation transfers complete
   - Include transfer details and new reservation information
   - Medium priority by default
   - Include links to updated reservation details

3. **Alert Notifications**
   - System-generated based on business rules
   - Priority determined by alert severity
   - May have expiration dates for time-sensitive alerts
   - Can be acknowledged by users to dismiss

4. **Notification Template Usage**
   - Templates selected based on notification type and recipient type
   - Support for multiple locales per template
   - Placeholder substitution for dynamic content
   - Fallback to default templates if custom ones unavailable

5. **Business Text Integration**
   - UI labels and messages customizable per organization
   - Multi-language support via locale codes
   - Message keys used for consistent referencing
   - Fallback to default text if custom text unavailable

### User Type Permissions

1. **ORG Users**
   - Receive event-related notifications
   - Can view notifications for their events
   - Cannot access admin functions

2. **HOTEL Users**
   - Receive hotel-specific notifications
   - Can view room block and reservation notifications
   - Limited to their hotel's events

3. **ADMIN Users**
   - Full access to all notifications
   - Can create and manage system-wide alerts
   - Access to administrative endpoints

### Notification Lifecycle

1. **Creation**
   - Notifications created by event processors or admin actions
   - Initial status is UNREAD
   - Timestamp recorded for creation time

2. **Delivery**
   - Notifications available through REST API
   - May trigger external delivery mechanisms (email, webhooks)
   - Delivery attempts logged for audit purposes

3. **User Interaction**
   - Users can mark notifications as READ
   - Notifications can be archived for cleanup
   - Read status affects count calculations

4. **Cleanup**
   - Old notifications may be archived automatically
   - Retention policies based on notification type
   - Critical notifications retained longer

### Event Publishing Rules

1. **EventBridge Integration**
   - All significant notification events published to EventBridge
   - Events include notification metadata and user context
   - Enables downstream systems to react to notifications

2. **Event Types**
   - `NOTIFICATION_CREATED` - New notification generated
   - `NOTIFICATION_READ` - User marked notification as read
   - `NOTIFICATION_ARCHIVED` - Notification archived
   - `BULK_NOTIFICATION_SENT` - Multiple notifications sent

3. **Event Routing**
   - Events routed based on notification type and user type
   - Different downstream systems handle different event types
   - Retry logic for failed event deliveries

### Data Consistency Rules

1. **Cross-System Synchronization**
   - Notifications synchronized between Oracle and DynamoDB
   - Eventual consistency model for performance
   - Conflict resolution favors most recent updates

2. **Audit Trail**
   - All notification state changes logged
   - Includes user actions and system processes
   - Audit logs retained for compliance requirements

3. **Data Validation**
   - User IDs validated against user service
   - Event IDs validated against event service
   - Notification types must be from approved enum values

### Performance Considerations

1. **Caching Strategy**
   - Frequently accessed notifications cached in memory
   - Cache invalidation on notification updates
   - User-specific cache keys for isolation

2. **Batch Processing**
   - Bulk notification creation for efficiency
   - Batch updates for status changes
   - Asynchronous processing for non-critical operations

3. **Rate Limiting**
   - API rate limits prevent system overload
   - Different limits for different user types
   - Graceful degradation under high load
# Domain Model

## Glossary

### Acknowledgment
A confirmation notification sent to guests and contacts when a hotel reservation is made, modified, or cancelled. Acknowledgments serve as official confirmation of the booking details.

### Master Acknowledgment
A consolidated acknowledgment for group bookings that covers multiple individual reservations under a single master acknowledgment number. Used for corporate groups, events, or bulk bookings.

### Primary Contact
The main guest or contact person associated with a reservation who should receive acknowledgment notifications by default.

### Secondary Contact
Additional email addresses that should receive copies of acknowledgment notifications, such as travel coordinators, assistants, or other stakeholders.

### Reservation Status
A numeric code indicating the current state of a reservation (e.g., confirmed, pending, cancelled, modified).

### Acknowledgment Preference
User or account-level settings that control whether acknowledgment notifications should be sent automatically for reservations.

### Required Tag
A classification or category tag that must be present for acknowledgment processing to proceed, used for filtering and routing acknowledgments.

### Acknowledgment Task
A background processing job that handles the actual delivery of acknowledgment notifications through email or other channels.

## Core Entities

### AcknowledgementRequest

**Description**: Represents a request to send acknowledgment for a single hotel reservation.

**Attributes**:
- `reservationId`: Long - Unique identifier for the hotel reservation
- `reservationStatus`: Long - Current status code of the reservation
- `sendToPrimary`: Boolean - Flag indicating whether to send to the primary contact
- `secondaryContactEmailList`: String - Comma-separated list of additional email addresses
- `checkSenAckPreference`: Boolean - Whether to validate acknowledgment preferences before sending
- `requiredTag`: String - Tag that must be present for processing

**Relationships**:
- Links to Reservation entity (external)
- Generates AcknowledgementResponse upon processing

**Business Rules**:
- `reservationId` must reference a valid, existing reservation
- If `checkSenAckPreference` is true, user preferences must allow acknowledgments
- `secondaryContactEmailList` must contain valid email addresses when provided
- `reservationStatus` must be a recognized status code

### MasterAcknowledgementRequest

**Description**: Represents a request to send acknowledgment for multiple reservations in a group booking scenario.

**Attributes**:
- `masterAckNumber`: String - Unique identifier for the group acknowledgment
- `sendToPrimary`: Boolean - Flag indicating whether to send to primary contacts
- `secondaryContactEmailList`: String - Comma-separated list of additional email addresses
- `sendSingleAcks`: Boolean - Whether to also generate individual acknowledgments for each reservation

**Relationships**:
- Links to multiple Reservation entities (external)
- May generate multiple individual AcknowledgementRequest objects
- Generates single AcknowledgementResponse for the master acknowledgment

**Business Rules**:
- `masterAckNumber` must be unique within the system
- If `sendSingleAcks` is true, individual acknowledgments are created for each reservation in the group
- All reservations in the group must belong to the same account or organization

### AcknowledgementResponse

**Description**: Standard response returned after processing an acknowledgment request, containing tracking and audit information.

**Attributes**:
- `reservationAcknowledgementLogId`: Long - Unique identifier for the acknowledgment log entry
- `acknowledgementTaskId`: Long - Identifier for the background processing task
- `acknowledgementCreatedSystime`: Long - Unix timestamp when the acknowledgment was created

**Relationships**:
- Links back to the original AcknowledgementRequest or MasterAcknowledgementRequest
- References background processing task for status tracking

**Business Rules**:
- `acknowledgementCreatedSystime` is automatically set to current system time
- `acknowledgementTaskId` is generated when background processing is initiated
- `reservationAcknowledgementLogId` provides audit trail for the acknowledgment

### SendAcknowledgementCommand

**Description**: Internal command object used to encapsulate acknowledgment processing instructions and context.

**Attributes**:
- Processing instructions and metadata
- Routing information for notification delivery
- Audit and tracking context

**Relationships**:
- Created from AcknowledgementRequest or MasterAcknowledgementRequest
- Used by background processing tasks

**Business Rules**:
- Contains all necessary information for asynchronous processing
- Immutable once created to ensure processing consistency

## Data Relationships

```
┌─────────────────────┐     1:1     ┌─────────────────────┐
│ AcknowledgementRequest │ ────────► │ AcknowledgementResponse │
└─────────────────────┘           └─────────────────────┘
         │                                   │
         │ 1:1                               │ 1:1
         ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│   Reservation       │           │ AcknowledgementLog  │
│   (External)        │           │   (Database)        │
└─────────────────────┘           └─────────────────────┘

┌─────────────────────┐     1:1     ┌─────────────────────┐
│MasterAcknowledgementRequest│ ────► │ AcknowledgementResponse │
└─────────────────────┘           └─────────────────────┘
         │                                   │
         │ 1:N                               │ 1:1
         ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│ AcknowledgementRequest │         │ MasterAckLog        │
│   (Generated)       │           │   (Database)        │
└─────────────────────┘           └─────────────────────┘
```

## Business Rules

### Acknowledgment Processing Rules

1. **Preference Validation**: If `checkSenAckPreference` is enabled, the system must verify that the guest or account has not opted out of acknowledgment notifications.

2. **Contact Resolution**: The system must resolve primary contact information from the reservation data and validate all secondary contact email addresses.

3. **Duplicate Prevention**: Multiple acknowledgment requests for the same reservation within a short time window should be deduplicated to prevent spam.

4. **Status Validation**: Acknowledgments should only be sent for reservations in valid states (confirmed, modified, etc.) and not for cancelled or invalid reservations.

### Group Acknowledgment Rules

1. **Master Number Uniqueness**: Each `masterAckNumber` must be unique within the system to prevent conflicts.

2. **Reservation Grouping**: All reservations associated with a master acknowledgment must belong to the same booking group or organization.

3. **Individual Acknowledgment Generation**: When `sendSingleAcks` is true, the system creates individual acknowledgment requests for each reservation in the group while maintaining the link to the master acknowledgment.

### Email Delivery Rules

1. **Email Validation**: All email addresses in `secondaryContactEmailList` must pass basic email format validation.

2. **Bounce Handling**: The system must handle email bounces and update acknowledgment status accordingly.

3. **Delivery Tracking**: Each acknowledgment delivery attempt must be logged with timestamp and delivery status.

### Audit and Compliance Rules

1. **Audit Trail**: Every acknowledgment request and response must be logged with complete audit information including user context, timestamps, and processing details.

2. **Data Retention**: Acknowledgment logs must be retained according to company data retention policies for compliance and customer service purposes.

3. **Privacy Compliance**: Email addresses and personal information must be handled according to GDPR and other applicable privacy regulations.

## Domain Events

### Acknowledgment Lifecycle Events

1. **AcknowledmentRequested**: Triggered when an acknowledgment request is received
2. **AcknowledmentValidated**: Triggered after successful validation of request parameters
3. **AcknowledmentQueued**: Triggered when acknowledgment is queued for background processing
4. **AcknowledmentSent**: Triggered when acknowledgment is successfully delivered
5. **AcknowledmentFailed**: Triggered when acknowledgment delivery fails
6. **AcknowledmentBounced**: Triggered when email acknowledgment bounces back

### Integration Points

- **Reservation Service**: Source of reservation data and status updates
- **User Preference Service**: Source of acknowledgment preference settings
- **Email Service**: Downstream service for actual email delivery
- **Audit Service**: Repository for acknowledgment audit logs
- **Notification Service**: Alternative delivery channels (SMS, push notifications)
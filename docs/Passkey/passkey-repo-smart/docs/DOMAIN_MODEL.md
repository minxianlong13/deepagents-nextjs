# Domain Model

## Glossary

### Smart Email Setup
A configuration entity that defines the parameters, templates, and rules for an automated email campaign within the Passkey system.

### Campaign
An execution instance of a Smart Email Setup, representing the configuration and setup for sending emails to a defined set of recipients. Note: This service handles campaign configuration; actual email sending is handled by other systems.

### Email Template
A reusable email format with placeholders for dynamic content, used to generate personalized emails for recipients.

### Recipient
An individual or entity (typically a hotel guest or booking contact) who will receive emails from a campaign. In Passkey context, this refers to attendees of Events (housing events like conferences, conventions, trade shows) rather than calendar events.

### Trigger
An event or condition that initiates the execution of an email campaign (e.g., booking confirmation, check-in reminder).

### Personalization Variables
Dynamic data points used to customize email content for individual recipients (e.g., guest name, reservation details, hotel information).

### SMTP Configuration
Settings that define how the service connects to and authenticates with email servers for message delivery.

### Campaign Metrics
Statistical data about campaign performance, including delivery rates, open rates, and engagement metrics.

## Core Entities

### SmartEmailSetup
**Description**: Central configuration entity that defines how email campaigns should be executed

**Attributes**:
- `id`: String - Unique identifier for the email setup
- `name`: String - Human-readable name for the campaign
- `description`: String - Detailed description of the campaign purpose
- `templateId`: String - Reference to the email template to use
- `triggerType`: String - Type of event that triggers the campaign
- `recipientCriteria`: String - Rules for selecting email recipients
- `scheduleConfiguration`: ScheduleConfig - Timing and frequency settings
- `isActive`: Boolean - Whether the setup is currently enabled
- `createdDate`: Date - When the setup was created
- `lastModifiedDate`: Date - When the setup was last updated

**Relationships**:
- One-to-many with Campaign executions
- One-to-one with EmailTemplate
- Many-to-one with SmtpConfiguration

### Campaign
**Description**: Represents a specific execution instance of a Smart Email Setup

**Attributes**:
- `id`: String - Unique campaign execution identifier
- `smartEmailSetupId`: String - Reference to the parent setup
- `executionDate`: Date - When the campaign was executed
- `status`: CampaignStatus - Current execution status
- `totalRecipients`: Integer - Number of intended recipients
- `successfulDeliveries`: Integer - Number of successfully sent emails
- `failedDeliveries`: Integer - Number of failed email deliveries
- `executionDuration`: Long - Time taken to complete the campaign
- `errorDetails`: String - Details of any execution errors

**Relationships**:
- Many-to-one with SmartEmailSetup
- One-to-many with EmailDelivery records

### EmailTemplate
**Description**: Defines the structure and content of emails sent by campaigns

**Attributes**:
- `id`: String - Unique template identifier
- `name`: String - Template name
- `subject`: String - Email subject line with variable placeholders
- `htmlContent`: String - HTML version of email body
- `textContent`: String - Plain text version of email body
- `variables`: List<String> - List of available personalization variables
- `isActive`: Boolean - Whether template is available for use
- `version`: Integer - Template version number

**Relationships**:
- One-to-many with SmartEmailSetup configurations

### Recipient
**Description**: Represents an individual who receives emails from campaigns

**Attributes**:
- `id`: String - Unique recipient identifier
- `emailAddress`: String - Primary email address
- `firstName`: String - Recipient's first name
- `lastName`: String - Recipient's last name
- `guestId`: String - Reference to guest record in reservation system
- `reservationId`: String - Associated reservation identifier
- `hotelId`: String - Associated hotel identifier (Hotel entity in Passkey)
- `eventId`: String - Associated Event identifier (housing event, not calendar event)
- `preferredLanguage`: String - Language preference for emails
- `optInStatus`: Boolean - Email consent status

**Relationships**:
- One-to-many with EmailDelivery records
- Many-to-one with Hotel
- Many-to-one with Event (housing event)
- Many-to-one with Reservation

### EmailDelivery
**Description**: Records the delivery status and details for individual email sends

**Attributes**:
- `id`: String - Unique delivery record identifier
- `campaignId`: String - Associated campaign
- `recipientId`: String - Target recipient
- `emailAddress`: String - Delivery email address
- `deliveryStatus`: DeliveryStatus - Success, failed, or pending
- `sentDate`: Date - When email was sent
- `deliveredDate`: Date - When delivery was confirmed
- `errorMessage`: String - Error details if delivery failed
- `smtpResponse`: String - SMTP server response

**Relationships**:
- Many-to-one with Campaign
- Many-to-one with Recipient

## Business Rules

### Campaign Execution Rules
1. **Active Setup Required**: Only active SmartEmailSetup configurations can be executed
2. **Template Validation**: Email templates must be validated before campaign execution
3. **Recipient Consent**: Only recipients with valid opt-in status receive emails
4. **Duplicate Prevention**: Same recipient cannot receive duplicate emails within a defined time window
5. **Rate Limiting**: Email sending is throttled to prevent SMTP server overload

### Template Processing Rules
1. **Variable Substitution**: All template variables must have corresponding data values
2. **Fallback Content**: Default values provided for missing personalization data
3. **Content Validation**: HTML and text content validated for proper formatting
4. **Language Support**: Templates support multiple languages based on recipient preference

### Delivery Rules
1. **Retry Logic**: Failed deliveries are retried up to 3 times with exponential backoff
2. **Bounce Handling**: Hard bounces result in recipient opt-out status update
3. **Delivery Tracking**: All delivery attempts are logged for audit and metrics
4. **SMTP Failover**: Multiple SMTP servers configured for redundancy

### Data Integrity Rules
1. **Referential Integrity**: All foreign key relationships must be valid
2. **Audit Trail**: All configuration changes are logged with user and timestamp
3. **Data Retention**: Campaign and delivery data retained according to compliance policies
4. **Privacy Compliance**: Personal data handling follows GDPR and privacy regulations

## Status Enumerations

### CampaignStatus
- `PENDING` - Campaign queued for execution
- `RUNNING` - Campaign currently executing
- `COMPLETED` - Campaign finished successfully
- `FAILED` - Campaign execution failed
- `CANCELLED` - Campaign execution was cancelled

### DeliveryStatus
- `PENDING` - Email queued for delivery
- `SENT` - Email sent to SMTP server
- `DELIVERED` - Email delivery confirmed
- `FAILED` - Email delivery failed
- `BOUNCED` - Email bounced back
- `REJECTED` - Email rejected by recipient server

### TriggerType
- `MANUAL` - Manually triggered campaign
- `SCHEDULED` - Time-based scheduled campaign
- `EVENT_DRIVEN` - Triggered by system events
- `RECURRING` - Regularly repeating campaign
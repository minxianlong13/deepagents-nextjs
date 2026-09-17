# Domain Model

## Glossary

### Addon
A supplementary service or product that can be purchased in addition to a hotel reservation, such as spa services, transportation, dining packages, or room upgrades.

### Addon History
A chronological record of all changes made to addon purchases, including creation, modification, and cancellation events.

### Addon Portal
The web application that provides reporting and management capabilities for reservation addons within the Passkey ecosystem.

### Addon Task
A scheduled or triggered operation related to addon processing, such as email notifications, fulfillment requests, or data synchronization.

### Arrival Info
Information about a guest's actual or expected arrival at a hotel, including arrival time, transportation details, and special requirements.

### Booking History
A comprehensive record of all changes and events related to a hotel reservation, including addon modifications.

### Complete Registration
The process of finalizing guest registration details, typically including personal information, preferences, and addon selections.

### Fulfillment
The process of delivering or providing addon services to guests, including coordination with service providers and confirmation of completion.

### Participant Profile
A comprehensive record of attendee information, preferences, and history across multiple reservations and addon purchases.

### Event
A housing event (conference, convention, trade show) that requires hotel room blocks. Not a calendar event — it's the top-level organizing entity in Passkey.

### Participant
The base entity for any organization or entity in Passkey. NOT a person attending an event. Types: Event Organizer, Hotel, Sister Property Org, Vendor/Sponsor, Passkey itself.

### Hotel Search
The capability to find and filter hotels based on location, dates, available addons, and other criteria.

### Passkey Authentication
The centralized authentication service used across the Passkey ecosystem for user login and session management.

### Reservation (ResInfo)
The core booking record containing guest information, room details, dates, and associated addon purchases.

### Scheduled Task
Automated operations that run at predetermined intervals or in response to specific events, such as email notifications or data cleanup.

### Security Principal
The authenticated user context containing user identity, roles, and permissions within the application.

### Task Service
The system component responsible for managing and executing background tasks and scheduled operations.

## Core Entities

### Addon
**Description**: Represents a supplementary service or product available for purchase with hotel reservations.

**Attributes**:
- `id`: Long - Unique addon identifier
- `name`: String - Display name of the addon
- `description`: String - Detailed addon description
- `price`: BigDecimal - Base price of the addon
- `currency`: String - Currency code (USD, EUR, etc.)
- `category`: String - Addon category (SPA, DINING, TRANSPORT, etc.)
- `isActive`: Boolean - Whether the addon is currently available
- `hotelId`: Long - Associated hotel identifier

**Relationships**:
- Related to Hotel entity
- Referenced by AddonHistory records
- Associated with AddonTask instances

---

### AddonHistory
**Description**: Tracks all changes and events related to addon purchases and modifications.

**Attributes**:
- `id`: Long - Unique history record identifier
- `addonId`: Long - Reference to the addon
- `reservationId`: Long - Associated reservation
- `guestId`: Long - Guest who made the change
- `historyType`: HistoryType - Type of change (PURCHASE, MODIFY, CANCEL)
- `changeDate`: Date - When the change occurred
- `oldValue`: String - Previous state (JSON)
- `newValue`: String - New state (JSON)
- `reason`: String - Reason for the change
- `userId`: Long - User who made the change

**Relationships**:
- Links to Addon entity
- References ResInfo (reservation)
- Connected to Guest profile

---

### AddonInfo
**Description**: Detailed information about a specific addon purchase or selection.

**Attributes**:
- `addonId`: Long - Addon identifier
- `reservationId`: Long - Associated reservation
- `quantity`: Integer - Number of addon units
- `totalPrice`: BigDecimal - Total cost for this addon
- `purchaseDate`: Date - When the addon was purchased
- `fulfillmentStatus`: String - Current fulfillment state
- `specialRequests`: String - Guest special requests
- `confirmationNumber`: String - Addon confirmation code

**Relationships**:
- References Addon entity
- Associated with ResInfo
- May have related AddonTask records

---

### AddonTask
**Description**: Represents a scheduled or triggered task related to addon processing.

**Attributes**:
- `id`: Long - Unique task identifier
- `taskType`: String - Type of task (EMAIL, FULFILLMENT, SYNC)
- `addonId`: Long - Related addon
- `reservationId`: Long - Associated reservation
- `scheduledTime`: Date - When task should execute
- `status`: ScheduledTaskStatus - Current task status
- `priority`: Integer - Task execution priority
- `retryCount`: Integer - Number of retry attempts
- `lastError`: String - Last error message if failed
- `completedTime`: Date - When task was completed

**Relationships**:
- References Addon and ResInfo
- May spawn EmailNotificationTask or FulfillmentEmailTask

---

### ResInfo (Reservation Information)
**Description**: Core reservation data containing guest booking details and associated addons.

**Attributes**:
- `reservationId`: Long - Unique reservation identifier
- `confirmationNumber`: String - Guest confirmation code
- `guestId`: Long - Primary guest identifier
- `hotelId`: Long - Hotel where reservation is made
- `checkInDate`: Date - Reservation check-in date
- `checkOutDate`: Date - Reservation check-out date
- `roomType`: String - Type of room reserved
- `totalAmount`: BigDecimal - Total reservation cost
- `status`: String - Current reservation status
- `createdDate`: Date - When reservation was created
- `modifiedDate`: Date - Last modification date

**Relationships**:
- Associated with multiple AddonInfo records
- Links to Guest entity
- References Hotel entity
- Connected to BookingHistoryInfo

---

### Guest (Person)
**Description**: Individual attendee information and profile data.

**Attributes**:
- `id`: Long - Unique attendee identifier
- `firstName`: String - Attendee first name
- `lastName`: String - Attendee last name
- `email`: String - Primary email address
- `phone`: String - Contact phone number
- `dateOfBirth`: Date - Attendee birth date
- `preferences`: String - Attendee preferences (JSON)
- `loyaltyNumber`: String - Loyalty program number
- `address`: Address - Attendee address information

**Relationships**:
- Has multiple ResInfo records
- Associated with AddonHistory entries
- May have User account for portal access

---

### Hotel
**Description**: Hotel property information and available services.

**Attributes**:
- `id`: Long - Unique hotel identifier
- `name`: String - Hotel name
- `address`: Address - Hotel location
- `phone`: String - Hotel contact number
- `email`: String - Hotel email address
- `timezone`: String - Hotel timezone
- `currency`: String - Default currency
- `isActive`: Boolean - Whether hotel is active

**Relationships**:
- Has multiple Addon offerings
- Associated with ResInfo records
- Connected to ArrivalInfo data

---

### SecurityPrincipal
**Description**: Authenticated user context and security information.

**Attributes**:
- `id`: Long - User identifier
- `username`: String - Login username
- `email`: String - User email address
- `roles`: List<String> - User roles and permissions
- `hotelIds`: List<Long> - Hotels user can access
- `lastLoginDate`: Date - Last successful login
- `isActive`: Boolean - Whether account is active
- `pwdResetNumFailures`: Integer - Password reset attempt count

**Relationships**:
- May be associated with Guest entity
- References accessible Hotel entities
- Connected to User profile

---

### ScheduledTask
**Description**: System task scheduled for execution at specific times or intervals.

**Attributes**:
- `id`: Long - Unique task identifier
- `taskName`: String - Descriptive task name
- `taskClass`: String - Java class implementing the task
- `cronExpression`: String - Cron schedule expression
- `isEnabled`: Boolean - Whether task is active
- `lastRunTime`: Date - Last execution time
- `nextRunTime`: Date - Next scheduled execution
- `status`: ScheduledTaskStatus - Current task status

**Relationships**:
- May generate AddonTask instances
- Associated with system maintenance operations

---

### EmailNotificationTask
**Description**: Specific task type for sending email notifications related to addons.

**Attributes**:
- `id`: Long - Task identifier
- `recipientEmail`: String - Email recipient
- `subject`: String - Email subject line
- `templateName`: String - Email template to use
- `templateData`: String - Template variables (JSON)
- `sendTime`: Date - When to send the email
- `sentTime`: Date - When email was actually sent
- `deliveryStatus`: String - Email delivery status

**Relationships**:
- Extends AddonTask
- References email templates
- Associated with Guest or User

## Business Rules

### Addon Purchase Rules
1. **Availability Validation**: Addons can only be purchased if available for the reservation dates
2. **Quantity Limits**: Each addon type may have minimum and maximum quantity restrictions
3. **Pricing Rules**: Addon prices may vary based on season, room type, or guest loyalty status
4. **Cancellation Policy**: Addon cancellations must comply with hotel-specific cancellation policies
5. **Modification Restrictions**: Some addons cannot be modified within 24 hours of check-in

### Reservation Integration Rules
1. **Addon Association**: Addons must be associated with valid, active reservations
2. **Date Alignment**: Addon dates must fall within or overlap with reservation dates
3. **Hotel Consistency**: Addons must be available at the hotel where the reservation is made
4. **Payment Integration**: Addon charges must be properly integrated with reservation billing

### Task Processing Rules
1. **Email Timing**: Confirmation emails must be sent within 15 minutes of addon purchase
2. **Fulfillment Scheduling**: Fulfillment tasks must be scheduled based on addon delivery requirements
3. **Retry Logic**: Failed tasks must be retried up to 3 times with exponential backoff
4. **Priority Handling**: High-priority tasks (cancellations, urgent requests) must be processed first

### Security and Access Rules
1. **Data Privacy**: Guest data access must comply with GDPR and privacy regulations
2. **Role-Based Access**: Users can only access data for hotels they are authorized to manage
3. **Audit Trail**: All addon modifications must be logged in AddonHistory
4. **Session Management**: User sessions must timeout after 30 minutes of inactivity

### Data Integrity Rules
1. **Referential Integrity**: All foreign key relationships must be maintained
2. **Status Consistency**: Addon and reservation statuses must remain synchronized
3. **Historical Accuracy**: AddonHistory records must never be modified or deleted
4. **Concurrent Updates**: Optimistic locking must prevent concurrent modification conflicts

## Entity Relationships

```
Guest (Person)
    ├── 1:N → ResInfo (Reservations)
    ├── 1:N → AddonHistory (Changes made by guest)
    └── 0:1 → SecurityPrincipal (Portal access)

ResInfo (Reservation)
    ├── N:1 → Hotel
    ├── N:1 → Guest (Primary guest)
    ├── 1:N → AddonInfo (Purchased addons)
    ├── 1:N → BookingHistoryInfo (Reservation changes)
    └── 1:N → ArrivalInfo (Arrival details)

Hotel
    ├── 1:N → ResInfo (Reservations)
    ├── 1:N → Addon (Available addons)
    └── 1:N → ArrivalInfo (Guest arrivals)

Addon
    ├── N:1 → Hotel (Available at hotel)
    ├── 1:N → AddonInfo (Purchase instances)
    ├── 1:N → AddonHistory (Change history)
    └── 1:N → AddonTask (Related tasks)

AddonTask
    ├── N:1 → Addon (Related addon)
    ├── N:1 → ResInfo (Associated reservation)
    └── 1:N → EmailNotificationTask (Email tasks)

SecurityPrincipal
    ├── 0:1 → Guest (Associated guest profile)
    ├── N:N → Hotel (Accessible hotels)
    └── 1:N → AddonHistory (Changes made by user)
```
# Domain Model

## Glossary

### Autoblock
A hotel room inventory management feature that automatically reserves blocks of rooms for events, allowing guests to select and book rooms within predefined parameters and availability windows.

### Guestside
The guest-facing interface and functionality of the autoblock system, as opposed to the planner or hotel administrator interfaces. This includes survey forms, room selection interfaces, and booking confirmation pages.

### Survey
An interactive form presented to event guests that allows them to specify their accommodation preferences, including room types, dates, special requirements, and personal information needed for booking.

### Passkey
Cvent's hotel booking and room block management platform that facilitates connections between event planners, hotels, and attendees for group accommodation bookings.

### Nucleus View
Cvent's server-side rendering framework that generates HTML pages with embedded data, used instead of traditional JSON API responses for web interfaces.

### Room Block
A predetermined number of hotel rooms reserved for an event, with specific rates, dates, and booking conditions negotiated between the event planner and hotel.

### Event
A gathering, conference, meeting, or other occasion that requires group accommodation, managed through the Passkey platform.

### Hotel Property
A lodging establishment that participates in the Passkey network, offering rooms and services for event-related bookings.

### Inventory
The available hotel rooms, rates, and booking slots that can be reserved through the autoblock system at any given time.

### Access Token
A security credential that grants authenticated access to the service, typically obtained through Cvent's authentication system.

### Rate Limiting
A protective mechanism that restricts the number of requests a client can make within a specified time period to prevent abuse and ensure service stability.

## Core Entities

### Survey Request Metadata
**Description**: Contains configuration and tracking information for an autoblock survey instance

**Attributes**:
- `surveyId`: string - Unique identifier for the survey
- `eventId`: string - Associated event identifier
- `hotelId`: string - Target hotel property identifier
- `createdAt`: timestamp - Survey creation time
- `status`: enum - Current survey state (active, inactive, completed)
- `configuration`: object - Survey behavior settings

**Relationships**:
- Belongs to one Event
- Associated with one Hotel Property
- Can have multiple Survey Responses

**Business Rules**:
- Survey must be in 'active' status to accept responses
- Each survey is unique per event-hotel combination
- Survey configuration cannot be modified after activation

### Guest Information
**Description**: Personal and preference data collected from event attendees

**Attributes**:
- `firstName`: string - Guest's first name
- `lastName`: string - Guest's last name  
- `email`: string - Contact email address
- `phone`: string - Contact phone number
- `preferences`: object - Room and service preferences

**Relationships**:
- Associated with Survey Responses
- May link to existing Cvent attendee records

**Business Rules**:
- Email address must be unique within an event context
- Phone number format validated per regional standards
- Preferences are optional but enhance room matching

### Survey Response
**Description**: Complete guest submission including room selections and personal information

**Attributes**:
- `responseId`: string - Unique response identifier
- `surveyId`: string - Parent survey reference
- `roomSelections`: array - Selected room types and dates
- `guestInfo`: object - Guest personal information
- `specialRequests`: string - Additional guest requirements
- `submittedAt`: timestamp - Response submission time
- `status`: enum - Processing status (pending, confirmed, failed)

**Relationships**:
- Belongs to one Survey
- Contains one Guest Information record
- May generate multiple Room Reservations

**Business Rules**:
- Response cannot be modified after submission
- Room selections must be within available inventory
- Guest information must pass validation rules

### Room Selection
**Description**: Specific room type, dates, and quantity chosen by a guest

**Attributes**:
- `roomTypeId`: string - Hotel room type identifier
- `quantity`: integer - Number of rooms requested
- `checkInDate`: date - Arrival date
- `checkOutDate`: date - Departure date
- `rate`: decimal - Room rate per night
- `currency`: string - Rate currency code

**Relationships**:
- Part of a Survey Response
- References Hotel Room Type
- May create Room Reservations

**Business Rules**:
- Check-in date must be before check-out date
- Dates must fall within event date range
- Quantity must not exceed per-guest limits
- Rate must match current hotel pricing

### Access Context
**Description**: Authentication and authorization information for service requests

**Attributes**:
- `userId`: string - Authenticated user identifier
- `permissions`: array - Granted permission list
- `tokenType`: string - Authentication token type
- `expiresAt`: timestamp - Token expiration time
- `scope`: string - Access scope limitations

**Relationships**:
- Associated with User Account
- Linked to Service Requests

**Business Rules**:
- Expired tokens must be refreshed or re-authenticated
- Permissions determine accessible operations
- Scope limits data visibility

### Service Health Status
**Description**: Operational status and metrics for the service and its dependencies

**Attributes**:
- `status`: enum - Overall health (healthy, degraded, unhealthy)
- `timestamp`: timestamp - Status check time
- `version`: string - Service version
- `dependencies`: object - Dependency health status
- `metrics`: object - Performance and usage statistics

**Relationships**:
- References External Service Dependencies
- Contains Performance Metrics

**Business Rules**:
- Status automatically updated based on dependency health
- Unhealthy status triggers alerting
- Metrics retained for historical analysis

## Business Rules

### Survey Lifecycle Management
1. **Creation**: Surveys must be created with valid event and hotel associations
2. **Activation**: Only active surveys accept guest responses
3. **Completion**: Surveys automatically close when capacity is reached or deadline passes
4. **Archival**: Completed surveys are archived but remain accessible for reporting

### Guest Response Processing
1. **Validation**: All guest information must pass format and completeness checks
2. **Inventory Check**: Room selections verified against current availability
3. **Rate Verification**: Quoted rates must match current hotel pricing
4. **Duplicate Prevention**: Multiple responses from same guest are flagged for review

### Access Control
1. **Authentication**: All requests require valid authentication tokens
2. **Authorization**: Operations checked against user permissions
3. **Rate Limiting**: Request frequency limited to prevent abuse
4. **Audit Logging**: All access attempts logged for security monitoring

### Data Consistency
1. **Referential Integrity**: All entity relationships must be valid
2. **Temporal Consistency**: Dates and times must be logically consistent
3. **Business Logic**: Domain rules enforced at service boundaries
4. **Transaction Boundaries**: Related operations grouped for atomicity

### Error Handling
1. **Graceful Degradation**: Service continues operating with reduced functionality when dependencies fail
2. **User-Friendly Messages**: Technical errors translated to understandable messages
3. **Retry Logic**: Transient failures automatically retried with backoff
4. **Circuit Breaking**: Failing dependencies temporarily bypassed

## Integration Patterns

### Service Orchestration
The service acts as an orchestrator, coordinating data from multiple backend services to provide a unified guest experience.

### Event-Driven Updates
Real-time updates propagated through event notifications to maintain data consistency across the platform.

### Caching Strategy
Frequently accessed data cached to improve performance while maintaining data freshness through cache invalidation.

### Asynchronous Processing
Non-critical operations processed asynchronously to maintain responsive user experience.

## Data Flow Patterns

### Request-Response Flow
1. Guest initiates survey request
2. Service validates authentication and permissions
3. Required data fetched from backend services
4. Response aggregated and formatted
5. Rendered view returned to guest

### Survey Submission Flow
1. Guest submits completed survey
2. Data validated against business rules
3. Inventory availability confirmed
4. Response stored and confirmation generated
5. Downstream services notified of new booking

### Administrative Operations Flow
1. Admin request authenticated and authorized
2. Operation parameters validated
3. Required services called with admin context
4. Results aggregated and returned
5. Audit trail updated with operation details
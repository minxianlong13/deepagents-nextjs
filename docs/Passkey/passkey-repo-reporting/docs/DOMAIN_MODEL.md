# Domain Model

## Glossary

### Booking
A confirmed reservation made by a guest for accommodation at a hotel, typically associated with a specific event or group block.

### Event
A gathering, conference, meeting, or celebration that requires accommodation services, often involving a group of attendees who need hotel rooms.

### Event
A housing event (conference, convention, trade show) that requires hotel room blocks. Not a calendar event — it's the top-level organizing entity in Passkey.

### Event Category
Classification of events based on their type and purpose (e.g., CORPORATE, ASSOCIATION, WEDDING, SOCIAL).

### Incremental Revenue
Additional revenue generated through the Passkey platform that would not have been captured through traditional booking methods.

### Organizer
An entity (person or organization) responsible for planning and managing an event, typically requiring accommodation for attendees.

### Pace Data
Analytics showing the booking pattern and velocity for an event over time, tracking how reservations accumulate as the event date approaches.

### Participant
The base entity for any organization or entity in Passkey. NOT a person attending an event. Types: Event Organizer, Hotel, Sister Property Org, Vendor/Sponsor, Passkey itself.

### Participant Type
Classification distinguishing between different types of participants in the system (HOTEL or ORGANIZER).

### Passkey
Cvent's hotel booking and group accommodation management platform that connects event organizers with hotels.

### Reservation Method
The channel or method through which a booking was made (e.g., ONLINE, PHONE, EMAIL).

### Room Night
A unit of measurement representing one room occupied for one night, used for calculating occupancy and revenue metrics.

### Revenue Analytics
Comprehensive financial reporting that includes room revenue, taxes, fees, and other charges associated with bookings.

## Core Entities

### Booking
**Description**: Represents a confirmed hotel reservation made through the Passkey platform.

**Attributes**:
- `bookingId`: String - Unique identifier for the booking
- `eventId`: String - Associated event identifier
- `hotelId`: Long - Hotel where the booking is made
- `guestName`: String - Name of the guest making the reservation
- `confirmationNumber`: String - Hotel confirmation number
- `bookingDate`: LocalDate - Date when the booking was made
- `checkInDate`: LocalDate - Guest check-in date
- `checkOutDate`: LocalDate - Guest check-out date
- `roomNights`: Integer - Number of room nights
- `totalRevenue`: BigDecimal - Total revenue for the booking
- `reservationMethod`: ReservationMethod - How the booking was made
- `roomType`: String - Type of room booked
- `status`: BookingStatus - Current status of the booking

**Relationships**:
- Belongs to one Event
- Associated with one Hotel (Participant)
- May have multiple Revenue components

### Event
**Description**: Represents a gathering or occasion that requires group accommodation services.

**Attributes**:
- `eventId`: String - Unique identifier for the event
- `eventName`: String - Display name of the event
- `organizerId`: Long - ID of the organizing participant
- `eventCategory`: EventCategory - Classification of the event type
- `eventStartDate`: LocalDate - When the event begins
- `eventEndDate`: LocalDate - When the event ends
- `totalAttendees`: Integer - Expected number of attendees
- `description`: String - Event description
- `status`: EventStatus - Current status of the event

**Relationships**:
- Organized by one Participant (Organizer)
- Has many Bookings
- Associated with multiple Hotels through room blocks

### Participant
**Description**: Represents an organization or entity in the Passkey ecosystem, either a hotel or an event organizer. NOT a person attending an event.

**Attributes**:
- `participantId`: Long - Unique identifier
- `participantType`: ParticipantType - HOTEL or ORGANIZER
- `name`: String - Display name
- `contactEmail`: String - Primary contact email
- `contactPhone`: String - Primary contact phone
- `address`: Address - Physical address
- `status`: ParticipantStatus - Active, inactive, etc.

**Relationships**:
- Hotels have many Bookings
- Organizers have many Events
- May have multiple associated Users

### Revenue
**Description**: Represents financial data associated with bookings and events.

**Attributes**:
- `revenueId`: String - Unique identifier
- `bookingId`: String - Associated booking
- `roomRevenue`: BigDecimal - Revenue from room charges
- `taxRevenue`: BigDecimal - Tax amounts
- `feeRevenue`: BigDecimal - Additional fees
- `totalRevenue`: BigDecimal - Total revenue amount
- `currency`: String - Currency code (typically USD)
- `revenueDate`: LocalDate - Date revenue was recognized

**Relationships**:
- Associated with one Booking
- May be aggregated for Event-level reporting

### EventStatistics
**Description**: Aggregated statistical data for event performance analysis.

**Attributes**:
- `eventId`: String - Associated event identifier
- `totalBookings`: Integer - Total number of bookings
- `totalRoomNights`: Integer - Total room nights booked
- `totalRevenue`: BigDecimal - Total revenue generated
- `averageRoomRate`: BigDecimal - Average rate per room night
- `occupancyRate`: Double - Percentage of available rooms booked
- `bookingConversionRate`: Double - Percentage of attendees who booked
- `cancellationRate`: Double - Percentage of bookings cancelled
- `noShowRate`: Double - Percentage of no-show bookings
- `averageStayLength`: Double - Average nights per booking

**Relationships**:
- Derived from one Event
- Aggregated from multiple Bookings

### Metadata
**Description**: Authentication and authorization context for API requests.

**Attributes**:
- `participantId`: Long - ID of the authenticated participant
- `objectTypeId`: Integer - Type identifier for authorization
- `isApiKeyAccess`: Boolean - Whether request uses API key auth
- `permissions`: List<String> - Granted permissions
- `organizationId`: Long - Associated organization ID

**Relationships**:
- Associated with one Participant
- Used for request authorization and data filtering

## Enumerations

### EventCategory
- `CORPORATE` - Corporate meetings and conferences
- `ASSOCIATION` - Association meetings and conventions
- `WEDDING` - Wedding events and celebrations
- `SOCIAL` - Social gatherings and parties
- `GOVERNMENT` - Government meetings and events
- `RELIGIOUS` - Religious gatherings and conferences
- `EDUCATION` - Educational conferences and seminars
- `MEDICAL` - Medical conferences and training
- `SPORTS` - Sports events and tournaments
- `OTHER` - Other event types

### ParticipantType
- `HOTEL` - Hotel property or accommodation provider
- `ORGANIZER` - Event organizer or planner

### ReservationMethod
- `ONLINE` - Booked through online platform
- `PHONE` - Booked via telephone
- `EMAIL` - Booked through email communication
- `FAX` - Booked via fax (legacy)
- `WALK_IN` - Walk-in booking at hotel
- `OTHER` - Other booking methods

### BookingStatus
- `CONFIRMED` - Booking is confirmed
- `PENDING` - Booking is pending confirmation
- `CANCELLED` - Booking has been cancelled
- `NO_SHOW` - Guest did not show up
- `CHECKED_IN` - Guest has checked in
- `CHECKED_OUT` - Guest has checked out

### EventStatus
- `ACTIVE` - Event is active and accepting bookings
- `INACTIVE` - Event is not currently active
- `COMPLETED` - Event has been completed
- `CANCELLED` - Event has been cancelled

## Business Rules

### Booking Rules
1. **Date Validation**: Check-in date must be before check-out date
2. **Event Association**: All bookings must be associated with a valid event
3. **Participant Access**: Hotels can only see bookings for their property
4. **Revenue Calculation**: Total revenue must equal sum of room, tax, and fee revenue
5. **Room Nights**: Calculated as (check-out date - check-in date) for each booking

### Event Rules
1. **Date Constraints**: Event end date must be on or after start date
2. **Organizer Assignment**: Each event must have exactly one organizer
3. **Category Classification**: Events must have a valid category assignment
4. **Attendee Limits**: Total attendees must be a positive number

### Reporting Rules
1. **Date Range Limits**: Report date ranges cannot exceed 2 years
2. **Participant Filtering**: Data is automatically filtered by participant permissions
3. **Revenue Recognition**: Revenue is recognized on the booking date
4. **Aggregation Logic**: Statistics are calculated in real-time from booking data

### Authentication Rules
1. **API Key Preference**: API key authentication is preferred over bearer tokens
2. **Participant Context**: All requests must include valid participant context
3. **Permission Validation**: Users can only access data they have permissions for
4. **Token Expiration**: Bearer tokens have limited validity periods

### Data Access Rules
1. **Multi-tenancy**: Each participant can only access their own data
2. **Cross-Reference**: Organizers can see aggregated hotel data for their events
3. **Historical Data**: All historical data is preserved for reporting purposes
4. **Real-time Updates**: Booking data is updated in real-time

## Data Relationships

### Primary Relationships
```
Participant (Organizer) 1:N Event
Event 1:N Booking
Participant (Hotel) 1:N Booking
Booking 1:1 Revenue
Event 1:1 EventStatistics
```

### Derived Relationships
```
Participant (Organizer) 1:N Booking (through Event)
Event 1:N Revenue (through Booking)
Participant (Hotel) 1:N Revenue (through Booking)
```

## Aggregation Patterns

### Revenue Aggregation
- **By Event**: Sum all booking revenues for an event
- **By Hotel**: Sum all booking revenues for a hotel
- **By Date Range**: Sum revenues within specified date ranges
- **By Category**: Group revenues by event category

### Statistical Aggregation
- **Booking Counts**: Count of bookings by various dimensions
- **Occupancy Rates**: Calculated from booked vs. available rooms
- **Conversion Rates**: Percentage calculations from attendee to booking ratios
- **Average Calculations**: Mean values for rates, stay lengths, etc.

### Pace Analysis
- **Time-based Grouping**: Bookings grouped by days before event
- **Cumulative Calculations**: Running totals of bookings and revenue
- **Trend Analysis**: Comparison of booking patterns across similar events

## Data Validation

### Input Validation
- Date formats must be ISO 8601 (YYYY-MM-DD)
- Monetary values must be non-negative
- Participant IDs must exist in the system
- Event categories must be from valid enumeration

### Business Logic Validation
- Start dates cannot be after end dates
- Participant types must match request context
- Revenue components must sum to total revenue
- Room nights must be calculated correctly

### Authorization Validation
- Participants can only access their own data
- API keys must be valid and not expired
- Request parameters must match authentication context
- Cross-participant access requires explicit permissions
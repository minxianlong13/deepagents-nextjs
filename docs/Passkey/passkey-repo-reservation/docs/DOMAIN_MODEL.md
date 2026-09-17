# Domain Model

## Glossary

### Reservation
A booking record that represents a guest's commitment to stay at a hotel for specific dates. Contains all details about the accommodation, guest information, and associated services.

**Note**: Reservations are NOT made in Passkey Manage (Resdesk). They are made through guest-facing booking websites (passkey-book), call centers, planner portals, or vendor integrations. Passkey Manage is used to view and manage existing reservations.

### Group Booking
A reservation type that handles multiple rooms or attendees under a single booking entity, typically associated with events or corporate bookings.

### Orchestrated Reservation
A reservation created through a complex workflow managed by the Reservation Saga, involving multiple services and compensation patterns for transaction integrity.

### Attendee
An individual person associated with a reservation who will be staying at the hotel. Multiple attendees can be associated with a single reservation.

### Room List
A collection of available room types and rates for a specific hotel and date range, typically associated with an event or group booking.

### Waitlist
A queue system for handling reservation requests when inventory is not immediately available, allowing guests to be notified when rooms become available.

### Queue-It
A virtual waiting room service for high-demand event launches that provides rate limiting and prevents system overload. This is separate from the waitlist functionality.

### Guarantee Type
A method of securing a reservation, such as credit card guarantee, corporate account, or deposit, which determines cancellation policies and payment requirements.

### Confirmation Number
A unique identifier provided to guests for their individual reservation, used for check-in and customer service interactions.

### Master Acknowledgment Number
A unique identifier that links multiple reservations in a group booking, allowing related reservations to be managed together.

### Event
A business event or conference that drives hotel bookings, often with negotiated rates and special terms.

### Inventory
The available room capacity at a hotel for specific dates and room types, managed in real-time across six pools (Block, Hotel Pool, Room Pool, Overbook, Waitlist, Primary Pool) to prevent overbooking.

### Saga
An orchestration pattern used for managing complex, multi-step reservation workflows that span multiple services and require compensation logic.

## Core Entities

### Reservation
**Description**: The primary entity representing a hotel booking

**Attributes**:
- `reservationId`: String - Unique system identifier
- `confirmationNumber`: String - Guest-facing confirmation code
- `masterAcknowledgmentNumber`: String - Links multiple reservations in a group booking
- `status`: ReservationStatus - Current state of the reservation
- `type`: ReservationType - Classification of reservation (individual, group, etc.)
- `eventId`: String - Associated event identifier
- `hotelId`: String - Hotel where reservation is made
- `checkInDate`: LocalDate - Guest arrival date
- `checkOutDate`: LocalDate - Guest departure date
- `numberOfNights`: Integer - Calculated stay duration
- `totalAmount`: BigDecimal - Total cost of reservation
- `currency`: String - Currency code (ISO 4217)
- `createdAt`: Instant - Reservation creation timestamp
- `modifiedAt`: Instant - Last modification timestamp
- `createdBy`: String - User who created the reservation
- `specialRequests`: String - Guest special requests or notes

**Relationships**:
- One-to-many with Room entities
- One-to-many with Attendee entities
- One-to-many with Payment entities
- Many-to-one with Event entity
- Many-to-one with Hotel entity

### Attendee
**Description**: Individual guest information associated with a reservation (not to be confused with Participant which refers to organizations)

**Attributes**:
- `attendeeId`: String - Unique attendee identifier
- `reservationId`: String - Associated reservation
- `firstName`: String - Guest first name
- `lastName`: String - Guest last name
- `email`: String - Contact email address
- `phone`: String - Contact phone number
- `dateOfBirth`: LocalDate - Guest date of birth (optional)
- `specialNeeds`: String - Accessibility or dietary requirements
- `roomAssignment`: String - Assigned room identifier
- `checkInStatus`: CheckInStatus - Current check-in state
- `loyaltyNumber`: String - Hotel loyalty program number

**Relationships**:
- Many-to-one with Reservation entity
- One-to-one with Room assignment

### Room
**Description**: Accommodation unit within a reservation

**Attributes**:
- `roomId`: String - Unique room identifier
- `reservationId`: String - Associated reservation
- `roomTypeId`: String - Type of room (standard, suite, etc.)
- `roomNumber`: String - Physical room number (assigned at check-in)
- `rate`: BigDecimal - Nightly rate for this room
- `occupancy`: Integer - Number of guests in room
- `bedType`: String - Bed configuration
- `smokingPreference`: Boolean - Smoking or non-smoking
- `floorPreference`: String - Preferred floor level
- `amenities`: List<String> - Room amenities and features

**Relationships**:
- Many-to-one with Reservation entity
- One-to-many with Attendee entities (room occupants)

### GroupBooking
**Description**: Specialized reservation type for multiple rooms or large parties

**Attributes**:
- `groupBookingId`: String - Unique group booking identifier
- `reservationId`: String - Base reservation reference
- `groupName`: String - Name of the group or organization
- `groupSize`: Integer - Total number of attendees
- `roomBlockId`: String - Associated room block
- `cutoffDate`: LocalDate - Deadline for room reservations
- `groupRate`: BigDecimal - Negotiated group rate
- `minimumNights`: Integer - Minimum stay requirement
- `depositRequired`: Boolean - Whether deposit is required
- `depositAmount`: BigDecimal - Required deposit amount

**Relationships**:
- One-to-one with Reservation entity
- One-to-many with individual room reservations

### Waitlist
**Description**: FIFO queue entry for reservations when inventory is unavailable (separate from Queue-It virtual waiting room)

**Attributes**:
- `waitlistId`: String - Unique waitlist identifier
- `eventId`: String - Associated event
- `hotelId`: String - Requested hotel
- `roomTypeId`: String - Requested room type
- `checkInDate`: LocalDate - Requested check-in date
- `checkOutDate`: LocalDate - Requested check-out date
- `quantity`: Integer - Number of rooms requested
- `priority`: WaitlistPriority - Queue priority level
- `position`: Integer - Current position in queue
- `status`: WaitlistStatus - Current waitlist status
- `estimatedAvailabilityDate`: LocalDate - Projected availability
- `createdAt`: Instant - Waitlist entry creation time
- `contactEmail`: String - Notification email address

**Relationships**:
- Many-to-one with Event entity
- Many-to-one with Hotel entity
- One-to-one with potential Reservation (when activated)

### Payment
**Description**: Financial transaction associated with a reservation

**Attributes**:
- `paymentId`: String - Unique payment identifier
- `reservationId`: String - Associated reservation
- `amount`: BigDecimal - Payment amount
- `currency`: String - Payment currency
- `paymentMethod`: PaymentMethod - Method used for payment
- `paymentStatus`: PaymentStatus - Current payment state
- `transactionId`: String - External payment processor ID
- `processedAt`: Instant - Payment processing timestamp
- `refundAmount`: BigDecimal - Amount refunded (if applicable)
- `refundedAt`: Instant - Refund processing timestamp

**Relationships**:
- Many-to-one with Reservation entity
- One-to-many with Refund entities

### Event
**Description**: Business event driving hotel bookings

**Attributes**:
- `eventId`: String - Unique event identifier
- `eventName`: String - Display name of the event
- `eventType`: EventType - Classification of event
- `startDate`: LocalDate - Event start date
- `endDate`: LocalDate - Event end date
- `organizationId`: String - Organizing company/entity
- `primaryHotelId`: String - Main event hotel
- `attendeeCount`: Integer - Expected number of attendees
- `roomNightGoal`: Integer - Target room nights
- `cutoffDate`: LocalDate - Booking deadline

**Relationships**:
- One-to-many with Reservation entities
- Many-to-many with Hotel entities
- One-to-many with Waitlist entries

## Enumerations

### ReservationStatus
- `ACTIVE` - Valid confirmed booking (also called CONFIRMED)
- `MODIFIED` - Reservation changed after initial booking
- `CANCELLED` - Reservation cancelled (subject to cancellation policy)
- `WAITLISTED` - Pending inventory availability
- `NO_SHOW` - Guest failed to arrive

### ReservationType
- `INDIVIDUAL` - Single guest reservation
- `GROUP_BOOKING` - Multiple rooms/attendees
- `CORPORATE` - Corporate account booking
- `EVENT_ATTENDEE` - Event-associated reservation

### WaitlistStatus
- `ACTIVE` - Actively waiting for availability
- `NOTIFIED` - Guest notified of availability
- `CONVERTED` - Converted to confirmed reservation
- `EXPIRED` - Waitlist entry expired
- `CANCELLED` - Guest cancelled waitlist request

### PaymentStatus
- `PENDING` - Payment initiated but not processed
- `AUTHORIZED` - Payment authorized but not captured
- `CAPTURED` - Payment successfully processed
- `FAILED` - Payment processing failed
- `REFUNDED` - Payment refunded to guest
- `PARTIALLY_REFUNDED` - Partial refund processed

### CheckInStatus
- `NOT_CHECKED_IN` - Guest has not arrived
- `CHECKED_IN` - Guest has checked in
- `CHECKED_OUT` - Guest has checked out
- `NO_SHOW` - Guest failed to check in

## Business Rules

### Reservation Creation
1. Check-in date must be in the future
2. Check-out date must be after check-in date
3. Maximum stay duration is 30 nights
4. At least one attendee must be specified
5. Room inventory must be available for requested dates
6. Payment guarantee required for confirmation

### Group Booking Rules
1. Minimum of 10 room nights for group rates
2. Group cutoff date must be at least 30 days before event
3. Deposit required for groups over 50 rooms
4. Group rates locked until cutoff date
5. Individual reservations within group subject to group terms

### Waitlist Management
1. Waitlist entries processed in priority order
2. High-priority entries (VIP, corporate) processed first
3. Notification sent within 24 hours of availability
4. Guest has 48 hours to confirm after notification
5. Expired waitlist entries automatically removed after 30 days

### Payment Processing
1. Authorization required before reservation confirmation
2. Capture occurs 24 hours before check-in
3. Cancellation refunds processed within 5-7 business days
4. No-show charges applied according to hotel policy
5. Group deposits non-refundable after cutoff date

### Modification Rules
1. Date changes subject to availability and rate differences
2. Room type upgrades allowed with rate adjustment
3. Attendee changes allowed up to 24 hours before check-in
4. Cancellations subject to hotel cancellation policy
5. Group modifications require approval from group coordinator

### Inventory Management
1. Real-time inventory updates prevent overbooking
2. Room blocks reserved for events have priority
3. Last-minute availability released 24 hours before arrival
4. Oversold situations trigger automatic waitlist processing
5. Inventory holds expire after 15 minutes without confirmation
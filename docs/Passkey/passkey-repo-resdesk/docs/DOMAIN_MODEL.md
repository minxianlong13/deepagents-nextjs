# Domain Model

## Glossary

### Reservation
A booking record that represents a guest's stay at a hotel, including dates, room details, and guest information.

### Guest
An individual who makes or is associated with a hotel reservation. Contains personal information and contact details.

### Hotel
A property that offers accommodation services. Contains location, amenities, and room type information.

### Room Type
A category of accommodation offered by a hotel (e.g., standard, deluxe, suite) with specific features and pricing.

### Confirmation Number
A unique identifier assigned to each reservation for easy reference and lookup.

### Check-in/Check-out
The process of a guest arriving at or departing from a hotel, marking the start and end of their stay.

### Resdesk
The reservation desk system that manages hotel bookings, guest services, and call center operations.

### Autoblock
A system feature that automatically blocks or reserves rooms based on predefined criteria and business rules.

### Subblock
A subset of rooms within a larger block reservation, often used for group bookings or events.

### Call Center
The customer service interface used by agents to manage reservations and assist guests.

### Malware Scanner
Security component that scans uploaded files for viruses and malicious content using ClamAV.

### Passkey Platform
The broader ecosystem of hotel management services that Resdesk integrates with.

## Core Entities

### Reservation
**Description**: Central entity representing a hotel booking

**Attributes**:
- `id`: String - Unique reservation identifier
- `confirmationNumber`: String - Human-readable confirmation code
- `status`: ReservationStatus - Current state of the reservation
- `guestId`: String - Reference to the guest making the reservation
- `hotelId`: String - Reference to the hotel
- `checkInDate`: LocalDate - Planned arrival date
- `checkOutDate`: LocalDate - Planned departure date
- `roomTypeId`: String - Type of room reserved
- `roomNumber`: String - Assigned room number (if available)
- `numberOfGuests`: Integer - Total number of guests
- `totalAmount`: BigDecimal - Total cost of the reservation
- `currency`: String - Currency code (e.g., USD)
- `specialRequests`: String - Guest special requests or notes
- `createdAt`: Instant - When the reservation was created
- `updatedAt`: Instant - Last modification timestamp
- `createdBy`: String - User who created the reservation
- `source`: ReservationSource - How the reservation was made

**Relationships**:
- Belongs to one Guest
- Belongs to one Hotel
- Has one RoomType
- Has many ReservationNotes
- Has many PaymentTransactions

**Business Rules**:
- Check-in date must be before check-out date
- Cannot modify confirmed reservations within 24 hours of check-in
- Total amount must be positive
- Confirmation number must be unique across all reservations

### Guest
**Description**: Individual making or associated with reservations

**Attributes**:
- `id`: String - Unique guest identifier
- `firstName`: String - Guest's first name
- `lastName`: String - Guest's last name
- `email`: String - Primary email address
- `phone`: String - Primary phone number
- `dateOfBirth`: LocalDate - Guest's birth date
- `nationality`: String - Guest's nationality
- `loyaltyNumber`: String - Loyalty program membership number
- `preferences`: GuestPreferences - Room and service preferences
- `createdAt`: Instant - When guest record was created
- `updatedAt`: Instant - Last modification timestamp

**Relationships**:
- Has many Reservations
- Has one GuestProfile
- Has many GuestNotes

**Business Rules**:
- Email must be unique and valid format
- Phone number must be valid format
- Must be at least 18 years old for primary guest

### Hotel
**Description**: Property offering accommodation services

**Attributes**:
- `id`: String - Unique hotel identifier
- `name`: String - Hotel name
- `description`: String - Hotel description
- `address`: Address - Physical location
- `phone`: String - Hotel contact phone
- `email`: String - Hotel contact email
- `website`: String - Hotel website URL
- `starRating`: Integer - Hotel star rating (1-5)
- `totalRooms`: Integer - Total number of rooms
- `amenities`: List<String> - Available amenities
- `policies`: HotelPolicies - Check-in/out times, cancellation policies
- `active`: Boolean - Whether hotel is currently accepting reservations
- `timezone`: String - Hotel's timezone
- `createdAt`: Instant - When hotel was added to system

**Relationships**:
- Has many RoomTypes
- Has many Reservations
- Has one HotelConfiguration

**Business Rules**:
- Hotel name must be unique within the same city
- Star rating must be between 1 and 5
- Must have at least one active room type to accept reservations

### RoomType
**Description**: Category of accommodation with specific features and pricing

**Attributes**:
- `id`: String - Unique room type identifier
- `hotelId`: String - Reference to parent hotel
- `name`: String - Room type name (e.g., "Standard King")
- `description`: String - Detailed description
- `maxOccupancy`: Integer - Maximum number of guests
- `bedConfiguration`: String - Bed setup description
- `size`: Integer - Room size in square feet
- `amenities`: List<String> - Room-specific amenities
- `baseRate`: BigDecimal - Base nightly rate
- `currency`: String - Currency for pricing
- `available`: Boolean - Whether room type is bookable
- `totalRooms`: Integer - Number of rooms of this type

**Relationships**:
- Belongs to one Hotel
- Has many Reservations
- Has many RateSchedules

**Business Rules**:
- Base rate must be positive
- Max occupancy must be at least 1
- Room type name must be unique within the hotel

### ReservationNote
**Description**: Comments and notes associated with reservations

**Attributes**:
- `id`: String - Unique note identifier
- `reservationId`: String - Reference to reservation
- `category`: NoteCategory - Type of note (guest_request, agent_note, system_alert)
- `content`: String - Note content
- `createdBy`: String - User who created the note
- `createdAt`: Instant - When note was created
- `visibility`: NoteVisibility - Who can see the note
- `priority`: NotePriority - Importance level

**Relationships**:
- Belongs to one Reservation
- Created by one User

### Address
**Description**: Physical location information

**Attributes**:
- `street`: String - Street address
- `city`: String - City name
- `state`: String - State or province
- `zipCode`: String - Postal code
- `country`: String - Country code
- `latitude`: Double - Geographic latitude
- `longitude`: Double - Geographic longitude

### PaymentTransaction
**Description**: Financial transaction related to a reservation

**Attributes**:
- `id`: String - Unique transaction identifier
- `reservationId`: String - Reference to reservation
- `type`: TransactionType - Payment, refund, adjustment
- `amount`: BigDecimal - Transaction amount
- `currency`: String - Currency code
- `status`: TransactionStatus - Processing status
- `paymentMethod`: String - How payment was made
- `processedAt`: Instant - When transaction was processed
- `reference`: String - External payment reference

## Enumerations

### ReservationStatus
- `PENDING` - Reservation created but not confirmed
- `CONFIRMED` - Reservation confirmed and guaranteed
- `CHECKED_IN` - Guest has arrived and checked in
- `CHECKED_OUT` - Guest has completed stay and checked out
- `CANCELLED` - Reservation cancelled
- `NO_SHOW` - Guest did not arrive for reservation

### ReservationSource
- `WEBSITE` - Direct booking through hotel website
- `PHONE` - Booking made via phone call
- `WALK_IN` - Guest walked in without reservation
- `THIRD_PARTY` - Booking through OTA or travel agent
- `CORPORATE` - Corporate booking
- `GROUP` - Part of group reservation

### NoteCategory
- `GUEST_REQUEST` - Special requests from guest
- `AGENT_NOTE` - Notes added by call center agents
- `SYSTEM_ALERT` - Automated system notifications
- `MAINTENANCE` - Room or facility maintenance notes
- `BILLING` - Payment and billing related notes

### TransactionType
- `PAYMENT` - Money received from guest
- `REFUND` - Money returned to guest
- `ADJUSTMENT` - Rate or fee adjustment
- `DEPOSIT` - Security or booking deposit
- `FEE` - Additional charges or fees

## Business Rules

### Reservation Management
1. **Date Validation**: Check-in date must be before check-out date
2. **Availability**: Cannot book more rooms than available for given dates
3. **Modification Window**: Confirmed reservations cannot be modified within 24 hours of check-in
4. **Cancellation Policy**: Cancellations must follow hotel-specific policies
5. **Payment Requirements**: Deposit may be required based on hotel policy

### Guest Management
1. **Age Requirement**: Primary guest must be at least 18 years old
2. **Contact Information**: Valid email and phone required for all reservations
3. **Identity Verification**: Government ID required for check-in
4. **Occupancy Limits**: Cannot exceed maximum occupancy for room type

### Hotel Operations
1. **Room Assignment**: Rooms assigned based on availability and guest preferences
2. **Rate Management**: Rates can vary by season, demand, and booking source
3. **Overbooking**: System may allow controlled overbooking based on historical data
4. **Maintenance**: Rooms under maintenance cannot be booked

### Security and Compliance
1. **Data Privacy**: Guest information protected according to privacy regulations
2. **PCI Compliance**: Payment data handled according to PCI DSS standards
3. **Audit Trail**: All changes to reservations logged for audit purposes
4. **Access Control**: Users can only access data appropriate to their role

## Integration Points

### External Services
- **Authentication Service**: User login and session management
- **Payment Gateway**: Credit card processing and validation
- **Email Service**: Confirmation and notification emails
- **SMS Service**: Text message notifications
- **Reporting Service**: Business intelligence and analytics

### Internal Services
- **Passkey Commerce**: Pricing and inventory management
- **Passkey Ledger**: Financial transaction recording
- **Passkey Reservation Saga**: Complex reservation workflows
- **Autoblock Services**: Automated room blocking and management
# Domain Model

## Glossary

### Reservation
A booking record that represents a guest's stay at a hotel property, including all associated details such as dates, room preferences, guest information, and payment status.

### Confirmation Number
A unique alphanumeric identifier assigned to each reservation that guests use to reference their booking. Also known as a confirmation code or booking reference. This is shown to the guest and used for their booking reference.

### Master Acknowledgment Number
A unique identifier that links multiple reservations in a group booking (e.g., a company booking rooms for multiple employees). Multiple reservations can share the same master acknowledgment number to group related bookings.

### Passkey
Cvent's hotel booking platform that enables event attendees to book accommodations at contracted hotels with special rates and availability.

### Legacy System
The original Passkey reservation service that this Spring Boot service is designed to replace, maintaining backward compatibility during the migration period.

### Guest Profile
The collection of personal information associated with a reservation, including contact details, preferences, and special requirements.

### Room Block
A group of hotel rooms reserved for a specific event or group, with negotiated rates and terms.

### Check-in/Check-out
The dates when a guest begins and ends their hotel stay, respectively.

### Hotel Property
A specific hotel location with unique identification, amenities, and room inventory.

### Room Type
A category of hotel room with specific characteristics such as bed configuration, size, and amenities (e.g., Standard King, Deluxe Suite).

### Booking Status
The current state of a reservation (e.g., Active/Confirmed, Modified, Cancelled, Waitlisted, No-show).

### Waitlist
A queue for reservations when inventory is exhausted. Uses FIFO (first-in, first-out) processing when rooms become available. Auto-fulfill option available with email notifications configurable.

### Queue-It
A virtual waiting room service for high-demand event launches that provides rate limiting and prevents system overload. This is separate from the waitlist functionality and is used specifically for managing traffic during popular event openings.

### Payment Method
The form of payment associated with a reservation (e.g., credit card, corporate billing, group payment).

### Add-ons
Additional services or amenities that can be added to a reservation (e.g., parking, breakfast, late checkout).

### Inventory
The available room capacity at a hotel property for specific dates and room types.

## Core Entities

### Reservation
**Description**: The primary entity representing a hotel booking within the Passkey system.

**Attributes**:
- `confirmationNumber`: String - Unique alphanumeric identifier for the reservation (shown to guest)
- `masterAcknowledmentNumber`: String - Links multiple reservations in group bookings (optional)
- `guestName`: String - Full name of the primary guest
- `checkInDate`: LocalDate - Date when the guest will arrive
- `checkOutDate`: LocalDate - Date when the guest will depart
- `roomType`: String - Category of room booked
- `hotelId`: String - Unique identifier for the hotel property
- `hotelName`: String - Display name of the hotel
- `status`: ReservationStatus - Current booking status
- `totalAmount`: BigDecimal - Total cost of the reservation
- `currency`: String - Currency code (e.g., USD, EUR)
- `createdDate`: Instant - When the reservation was created
- `modifiedDate`: Instant - When the reservation was last updated

**Relationships**:
- Has one GuestProfile
- Has one RoomDetails
- Has one PaymentInfo
- May have multiple Add-ons

### GuestProfile
**Description**: Personal information and preferences for the guest making the reservation.

**Attributes**:
- `firstName`: String - Guest's first name
- `lastName`: String - Guest's last name
- `email`: String - Primary email address
- `phone`: String - Contact phone number
- `specialRequests`: String - Any special accommodation requests
- `loyaltyNumber`: String - Hotel loyalty program number (optional)
- `preferences`: GuestPreferences - Room and service preferences

**Relationships**:
- Belongs to one Reservation

### RoomDetails
**Description**: Specific information about the room assignment and characteristics.

**Attributes**:
- `roomNumber`: String - Assigned room number (if available)
- `bedType`: String - Type of bed configuration (King, Queen, Double, etc.)
- `smokingPreference`: SmokingPreference - SMOKING or NON_SMOKING
- `accessibilityFeatures`: List<String> - ADA compliance features
- `floorPreference`: Integer - Preferred floor level (optional)
- `viewType`: String - Room view preference (city, ocean, etc.)

**Relationships**:
- Belongs to one Reservation

### PaymentInfo
**Description**: Payment method and transaction details for the reservation.

**Attributes**:
- `paymentMethod`: PaymentMethod - Type of payment (CREDIT_CARD, CORPORATE, etc.)
- `lastFourDigits`: String - Last four digits of payment card
- `paymentStatus`: PaymentStatus - Current payment state
- `authorizationCode`: String - Payment authorization reference
- `billingAddress`: Address - Billing address information
- `transactionId`: String - Unique transaction identifier

**Relationships**:
- Belongs to one Reservation

### HotelProperty
**Description**: Information about the hotel where the reservation is made.

**Attributes**:
- `hotelId`: String - Unique hotel identifier
- `hotelName`: String - Official hotel name
- `address`: Address - Physical hotel address
- `phone`: String - Hotel contact number
- `amenities`: List<String> - Available hotel amenities
- `starRating`: Integer - Hotel star rating
- `chainCode`: String - Hotel chain identifier

**Relationships**:
- Has many Reservations
- Has many RoomTypes

### RoomType
**Description**: Categories of rooms available at a hotel property.

**Attributes**:
- `roomTypeCode`: String - Unique room type identifier
- `roomTypeName`: String - Display name for the room type
- `bedConfiguration`: String - Bed setup description
- `maxOccupancy`: Integer - Maximum number of guests
- `squareFootage`: Integer - Room size in square feet
- `amenities`: List<String> - Room-specific amenities

**Relationships**:
- Belongs to one HotelProperty
- Has many Reservations

## Enumerations

### ReservationStatus
- `ACTIVE_CONFIRMED` - Valid booking (Active/Confirmed)
- `MODIFIED` - Changed after initial booking
- `CANCELLED` - Reservation has been cancelled
- `WAITLISTED` - Pending inventory availability
- `NO_SHOW` - Guest did not arrive for their reservation

### PaymentMethod
- `CREDIT_CARD` - Payment by credit or debit card
- `CORPORATE` - Corporate billing arrangement
- `GROUP_PAYMENT` - Payment handled at group level
- `CASH` - Cash payment (rare for advance bookings)
- `COMP` - Complimentary reservation

### PaymentStatus
- `PENDING` - Payment not yet processed
- `AUTHORIZED` - Payment authorized but not captured
- `PAID` - Payment successfully processed
- `FAILED` - Payment processing failed
- `REFUNDED` - Payment has been refunded

### SmokingPreference
- `SMOKING` - Guest prefers smoking room
- `NON_SMOKING` - Guest prefers non-smoking room

## Business Rules

### Reservation Creation Rules
1. **Confirmation Number Uniqueness**: Each reservation must have a unique confirmation number across the entire system
2. **Date Validation**: Check-in date must be before check-out date
3. **Future Dates**: Check-in date cannot be in the past (except for same-day bookings)
4. **Maximum Stay**: Reservations cannot exceed 30 consecutive nights
5. **Guest Information**: First name, last name, and email are required fields

### Confirmation Number Rules
1. **Format**: Must be alphanumeric characters only (A-Z, 0-9)
2. **Length**: Between 6 and 12 characters
3. **Case Insensitive**: Stored and compared in uppercase
4. **No Special Characters**: Hyphens, spaces, and other symbols are not allowed

### Payment Rules
1. **Authorization Required**: All reservations must have valid payment authorization
2. **Currency Consistency**: All amounts must be in the same currency for a reservation
3. **Refund Policy**: Cancellations follow hotel-specific refund policies
4. **Corporate Billing**: Corporate accounts may have different payment terms

### Room Assignment Rules
1. **Availability Check**: Room type must be available for the requested dates
2. **Occupancy Limits**: Number of guests cannot exceed room type maximum occupancy
3. **Accessibility**: ADA-compliant rooms prioritized for guests with accessibility needs
4. **Preferences**: Room preferences honored when available, but not guaranteed

### Modification Rules
1. **Date Changes**: Subject to availability and rate changes
2. **Cancellation Window**: Must respect hotel cancellation policies
3. **Guest Changes**: Primary guest name changes may require verification
4. **Payment Updates**: New payment authorization required for payment method changes

### Legacy Compatibility Rules
1. **Data Migration**: Legacy reservation data must be accessible through new APIs
2. **Format Conversion**: Legacy formats converted to modern structure transparently
3. **Backward Compatibility**: Legacy systems can continue to operate during migration
4. **Audit Trail**: All legacy data modifications must be logged

## Data Validation Rules

### Guest Information Validation
- **Email Format**: Must be valid email address format
- **Phone Format**: Must be valid international phone number format
- **Name Length**: First and last names must be 1-50 characters
- **Special Characters**: Names may contain letters, spaces, hyphens, and apostrophes only

### Date Validation
- **Date Format**: ISO 8601 date format (YYYY-MM-DD)
- **Business Logic**: Check-in must be before check-out
- **Advance Booking**: Maximum 2 years in advance
- **Past Dates**: Only allowed for administrative corrections

### Amount Validation
- **Positive Values**: All monetary amounts must be positive
- **Decimal Precision**: Maximum 2 decimal places for currency amounts
- **Currency Codes**: Must be valid ISO 4217 currency codes
- **Range Limits**: Amounts must be within reasonable ranges (e.g., $1-$10,000 per night)

## Integration Patterns

### Service Integration
- **Payment Service**: Handles all payment processing and authorization
- **Inventory Service**: Validates room availability and manages inventory
- **Add-ons Service**: Manages additional services and amenities
- **Legacy Service**: Provides backward compatibility during migration

### Data Consistency
- **Eventual Consistency**: Updates propagated asynchronously to related services
- **Compensation Patterns**: Failed operations trigger compensating transactions
- **Idempotency**: All operations designed to be safely retryable
- **Audit Logging**: All changes tracked for compliance and debugging

### Event-Driven Architecture
- **Reservation Events**: Created, modified, cancelled, checked-in, checked-out
- **Payment Events**: Authorized, captured, failed, refunded
- **Inventory Events**: Room blocked, released, assigned
- **Integration Events**: Legacy system synchronization events
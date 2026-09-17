# Domain Model

## Glossary

### Call Center Agent
A hotel employee who uses the Passkey Call Center application to book reservations on behalf of customers who call or visit the hotel.

### Passkey
Cvent's hotel reservation and inventory management system that provides booking capabilities for hotels and event venues.

### Reservation
A booking record that represents a guest's stay at a hotel, including dates, room type, guest information, and payment details.

### Room Type
A category of hotel room with specific characteristics such as bed configuration, amenities, and capacity (e.g., "Deluxe King", "Standard Double").

### Availability
The number of rooms of a specific type that are available for booking on given dates.

### Rate
The price for a room type on a specific date, which can vary based on demand, seasonality, and other factors.

### Confirmation Number
A unique identifier assigned to each reservation that guests can use to reference their booking.

### Check-in/Check-out
The dates when a guest begins and ends their stay at the hotel.

### Guest Profile
Information about the person making the reservation, including contact details and preferences.

### Inventory
The total number of rooms available for booking across all room types at a hotel.

### Booking Window
The period during which reservations can be made, typically extending from the current date to a future cutoff date.

## Core Entities

### Reservation
**Description**: Central entity representing a hotel booking made through the call center or other booking channels

**Note**: Reservations ARE made through the call center application (passkey-call-center) by agents on behalf of guests. Other booking channels include guest-facing websites (passkey-book), planner portals, and vendor integrations.

**Attributes**:
- `id`: String - Unique reservation identifier
- `confirmationNumber`: String - Unique identifier shown to guest
- `masterAckNumber`: String - Master acknowledgment number (links group bookings)
- `status`: ReservationStatus - Current state of the reservation
- `hotelId`: String - Reference to the hotel
- `roomTypeId`: String - Reference to the booked room type
- `checkInDate`: Date - Guest arrival date
- `checkOutDate`: Date - Guest departure date
- `nights`: Number - Duration of stay
- `totalAmount`: Number - Total cost of the reservation
- `currency`: String - Currency code (e.g., "USD")
- `createdAt`: DateTime - When reservation was created
- `updatedAt`: DateTime - Last modification time
- `cancelledAt`: DateTime - When reservation was cancelled (if applicable)

**Relationships**:
- Belongs to one Hotel
- Belongs to one RoomType
- Has one Guest
- May have multiple SpecialRequests
- Has one PaymentMethod

**Business Rules**:
- Check-in date must be before check-out date
- Cannot modify reservation within 24 hours of check-in
- Cancellation policies vary by hotel and rate type

### Guest
**Description**: Person making or staying at the reservation

**Attributes**:
- `id`: String - Unique guest identifier
- `firstName`: String - Guest's first name
- `lastName`: String - Guest's last name
- `email`: String - Contact email address
- `phone`: String - Contact phone number
- `address`: Address - Guest's address information
- `preferences`: GuestPreferences - Room and service preferences
- `loyaltyNumber`: String - Hotel loyalty program number (optional)

**Relationships**:
- Can have multiple Reservations
- May have GuestPreferences

**Business Rules**:
- Email must be valid format
- Phone number must include country code
- At least one contact method (email or phone) required

### Hotel
**Description**: Property where reservations are made

**Attributes**:
- `id`: String - Unique hotel identifier
- `name`: String - Hotel name
- `address`: Address - Hotel location
- `phone`: String - Hotel contact number
- `email`: String - Hotel contact email
- `timezone`: String - Hotel's timezone
- `checkInTime`: Time - Standard check-in time
- `checkOutTime`: Time - Standard check-out time
- `policies`: HotelPolicies - Cancellation and other policies

**Relationships**:
- Has many RoomTypes
- Has many Reservations
- Has many Amenities

**Business Rules**:
- Must have at least one room type
- Check-in time must be before check-out time
- Address must include valid postal code

### RoomType
**Description**: Category of hotel room with specific characteristics

**Attributes**:
- `id`: String - Unique room type identifier
- `name`: String - Display name (e.g., "Deluxe King")
- `description`: String - Detailed description
- `capacity`: Number - Maximum number of guests
- `bedConfiguration`: String - Bed setup description
- `size`: Number - Room size in square feet/meters
- `amenities`: Array<String> - List of room amenities
- `images`: Array<String> - URLs to room photos

**Relationships**:
- Belongs to one Hotel
- Has many Rates
- Has many Reservations
- Has many AvailabilityRecords

**Business Rules**:
- Capacity must be at least 1
- Name must be unique within hotel
- Must have at least one rate defined

### Rate
**Description**: Pricing information for a room type on specific dates

**Attributes**:
- `id`: String - Unique rate identifier
- `roomTypeId`: String - Associated room type
- `date`: Date - Specific date for this rate
- `amount`: Number - Price amount
- `currency`: String - Currency code
- `rateType`: RateType - Category of rate (standard, promotional, etc.)
- `restrictions`: RateRestrictions - Booking restrictions
- `minimumStay`: Number - Minimum nights required (optional)

**Relationships**:
- Belongs to one RoomType
- May have RateRestrictions

**Business Rules**:
- Amount must be positive
- Date cannot be in the past
- Minimum stay cannot exceed maximum booking window

### Availability
**Description**: Number of rooms available for booking on specific dates

**Attributes**:
- `id`: String - Unique availability identifier
- `roomTypeId`: String - Associated room type
- `date`: Date - Specific date
- `totalRooms`: Number - Total rooms of this type
- `availableRooms`: Number - Rooms available for booking
- `reservedRooms`: Number - Rooms already booked
- `blockedRooms`: Number - Rooms unavailable (maintenance, etc.)

**Relationships**:
- Belongs to one RoomType

**Business Rules**:
- Available + Reserved + Blocked = Total rooms
- Available rooms cannot be negative
- Date cannot be in the past

## Enumerations

### ReservationStatus
- `ACTIVE` - Valid booking (also called Confirmed)
- `MODIFIED` - Changed after initial booking
- `CANCELLED` - Cancelled (subject to cancellation policy)
- `WAITLISTED` - Pending inventory availability
- `NO_SHOW` - Guest didn't arrive

### RateType
- `STANDARD` - Regular published rate
- `PROMOTIONAL` - Discounted promotional rate
- `CORPORATE` - Corporate negotiated rate
- `GROUP` - Group booking rate
- `PACKAGE` - Rate including additional services

### PaymentStatus
- `PENDING` - Payment not yet processed
- `AUTHORIZED` - Payment authorized but not captured
- `PAID` - Payment successfully processed
- `FAILED` - Payment processing failed
- `REFUNDED` - Payment refunded to guest

## Business Rules

### Reservation Management
1. **Booking Window**: Reservations can only be made within the hotel's defined booking window (typically 1-365 days in advance)
2. **Minimum Stay**: Some rates require a minimum number of nights
3. **Maximum Stay**: Reservations cannot exceed 30 nights without special approval
4. **Modification Policy**: Changes to reservations may incur fees depending on timing and rate type
5. **Cancellation Policy**: Varies by rate type and hotel, typically 24-72 hours before arrival

### Availability Rules
1. **Real-time Updates**: Availability is updated in real-time as reservations are made or cancelled
2. **Overbooking Protection**: System prevents booking when no rooms are available
3. **Inventory Allocation**: Rooms are allocated on a first-come, first-served basis
4. **Blocked Inventory**: Rooms can be blocked for maintenance or special events

### Pricing Rules
1. **Dynamic Pricing**: Rates can vary by date based on demand and seasonality
2. **Rate Restrictions**: Some rates have booking restrictions (advance purchase, non-refundable)
3. **Currency Handling**: All rates are stored in the hotel's base currency
4. **Tax Calculation**: Taxes are calculated based on hotel location and guest residency

### Guest Data Rules
1. **Data Privacy**: Guest information is protected according to GDPR and other privacy regulations
2. **Contact Requirements**: At least one contact method (email or phone) must be provided
3. **Profile Linking**: Multiple reservations can be linked to the same guest profile
4. **Preference Storage**: Guest preferences are stored for future bookings

## Data Relationships

```
Hotel (1) ──── (many) RoomType
  │                      │
  │                      ├── (many) Rate
  │                      ├── (many) Availability
  │                      └── (many) Reservation
  │
  └── (many) Reservation ──── (1) Guest
                │
                ├── (1) PaymentMethod
                └── (many) SpecialRequest
```

## Integration Points

### External Systems
- **Passkey Core**: Main reservation system for inventory and booking processing
- **Payment Gateway**: Credit card processing and payment authorization
- **Channel Manager**: Distribution to online travel agencies and booking sites
- **Property Management System**: Hotel operations and guest services
- **Revenue Management**: Pricing optimization and demand forecasting

### Data Synchronization
- Availability updates are synchronized in real-time
- Rate changes are propagated to all distribution channels
- Guest profiles are shared across Cvent's hospitality platform
- Reservation modifications trigger notifications to relevant systems
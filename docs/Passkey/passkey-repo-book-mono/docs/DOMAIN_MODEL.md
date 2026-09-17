# Domain Model

## Glossary

### Booking
A reservation made by a guest for accommodation at a hotel, including room type, dates, guest information, and payment details.

### Confirmation ID
A unique alphanumeric identifier (e.g., CONF123456) provided to guests as proof of their booking reservation.

### Hotel
A property offering accommodation services, including rooms, amenities, and services for travelers.

### Room Type
A category of accommodation (e.g., Standard Room, Suite, Deluxe Room) with specific features, capacity, and pricing.

### Guest
An individual who makes or stays in a booking reservation, including their personal and contact information.

### Check-in/Check-out
The dates when a guest begins and ends their stay at the hotel property.

### Availability
The number of rooms of a specific type that are available for booking during a given date range.

### Rate
The price charged for a room type per night, which may vary based on dates, demand, and other factors.

### Amenity
A feature or service provided by the hotel (e.g., WiFi, pool, gym, parking) that enhances the guest experience.

### Feature Flag
A configuration toggle that enables or disables specific functionality in the application without code deployment.

### Locale
A language and region combination (e.g., en-US, es-ES) that determines the language and cultural formatting for the user interface.

### Session
A temporary interaction period between a user and the application, maintained through cookies or tokens.

### Middleware
Software components that process requests before they reach the main application logic, handling cross-cutting concerns.

### Monorepo
A single repository containing multiple related packages or applications, managed as a unified codebase.

### CDK (Cloud Development Kit)
Infrastructure as Code framework used to define cloud resources using familiar programming languages.

### Nx
A build system and development toolkit designed for managing monorepos with advanced caching and task orchestration.

## Core Entities

### Hotel Entity
**Description**: Represents a hotel property with its basic information, location, and available services.

**Attributes**:
- `hotelId`: string - Unique identifier for the hotel
- `name`: string - Hotel name as displayed to guests
- `description`: string - Detailed description of the hotel
- `address`: Address - Physical location of the hotel
- `phone`: string - Primary contact phone number
- `email`: string - Primary contact email address
- `website`: string - Hotel's official website URL
- `starRating`: number - Hotel star rating (1-5)
- `amenities`: string[] - List of available amenities
- `policies`: HotelPolicy[] - Hotel-specific policies and rules
- `images`: Image[] - Collection of hotel photos
- `coordinates`: GeoCoordinates - Latitude and longitude for mapping

**Relationships**:
- Has many Room Types
- Has many Bookings
- Has many Reviews

### Room Type Entity
**Description**: Represents a category of rooms with similar features, capacity, and pricing structure.

**Attributes**:
- `roomTypeId`: string - Unique identifier for the room type
- `hotelId`: string - Reference to the parent hotel
- `name`: string - Display name (e.g., "Standard Room", "Executive Suite")
- `description`: string - Detailed description of room features
- `capacity`: number - Maximum number of guests
- `bedConfiguration`: string - Bed types and quantities
- `size`: number - Room size in square feet/meters
- `amenities`: string[] - Room-specific amenities
- `images`: Image[] - Room photos
- `baseRate`: Money - Standard nightly rate
- `inventory`: number - Total number of rooms of this type

**Relationships**:
- Belongs to Hotel
- Has many Room Instances
- Has many Bookings
- Has many Rate Plans

### Booking Entity
**Description**: Represents a reservation made by a guest for accommodation at a hotel.

**Attributes**:
- `bookingId`: string - Internal unique identifier
- `confirmationId`: string - Guest-facing confirmation number
- `hotelId`: string - Reference to the booked hotel
- `roomTypeId`: string - Reference to the booked room type
- `roomNumber`: string - Assigned room number (if available)
- `status`: BookingStatus - Current booking state
- `checkInDate`: Date - Guest arrival date
- `checkOutDate`: Date - Guest departure date
- `numberOfNights`: number - Calculated stay duration
- `numberOfGuests`: number - Total guest count
- `primaryGuest`: Guest - Main guest information
- `additionalGuests`: Guest[] - Other guests in the booking
- `pricing`: BookingPricing - Detailed pricing breakdown
- `paymentInfo`: PaymentInfo - Payment method and status
- `specialRequests`: string - Guest requests and preferences
- `createdAt`: Date - Booking creation timestamp
- `modifiedAt`: Date - Last modification timestamp
- `source`: string - Booking channel (web, mobile, phone, etc.)

**Relationships**:
- Belongs to Hotel
- Belongs to Room Type
- Has one Primary Guest
- Has many Additional Guests
- Has many Payment Transactions

### Guest Entity
**Description**: Represents an individual associated with a booking reservation.

**Attributes**:
- `guestId`: string - Unique identifier for the guest
- `firstName`: string - Guest's first name
- `lastName`: string - Guest's last name
- `email`: string - Contact email address
- `phone`: string - Contact phone number
- `dateOfBirth`: Date - Guest's birth date (optional)
- `address`: Address - Guest's home address (optional)
- `preferences`: GuestPreferences - Stored preferences and special needs
- `loyaltyNumber`: string - Loyalty program membership number (optional)
- `isPrimary`: boolean - Whether this is the primary guest for the booking

**Relationships**:
- Has many Bookings (as primary or additional guest)
- Has one Loyalty Account (optional)

### Address Entity
**Description**: Represents a physical address for hotels or guests.

**Attributes**:
- `street`: string - Street address line 1
- `street2`: string - Street address line 2 (optional)
- `city`: string - City name
- `state`: string - State or province
- `zipCode`: string - Postal code
- `country`: string - Country code (ISO 3166-1 alpha-2)
- `coordinates`: GeoCoordinates - Latitude and longitude (optional)

### Money Entity
**Description**: Represents a monetary amount with currency information.

**Attributes**:
- `amount`: number - Numeric value of the amount
- `currency`: string - Currency code (ISO 4217)
- `formatted`: string - Human-readable formatted string

### BookingPricing Entity
**Description**: Detailed breakdown of all costs associated with a booking.

**Attributes**:
- `roomRate`: Money - Base room rate per night
- `totalRoomCharges`: Money - Room charges for all nights
- `taxes`: Money - Total tax amount
- `fees`: Money - Additional fees (resort, service, etc.)
- `discounts`: Money - Applied discounts or promotions
- `subtotal`: Money - Amount before taxes and fees
- `total`: Money - Final total amount
- `currency`: string - Currency for all amounts

### Feature Flag Entity
**Description**: Configuration toggles that control application functionality.

**Attributes**:
- `flagKey`: string - Unique identifier for the feature flag
- `name`: string - Human-readable name
- `description`: string - Description of the feature
- `enabled`: boolean - Whether the feature is currently enabled
- `rolloutPercentage`: number - Percentage of users who see the feature
- `targetingRules`: TargetingRule[] - Rules for conditional feature activation
- `variations`: Variation[] - Different variations of the feature

**Relationships**:
- Has many Targeting Rules
- Has many Variations

## Business Rules

### Booking Validation Rules

1. **Date Validation**:
   - Check-in date must be in the future or today
   - Check-out date must be after check-in date
   - Maximum stay duration is 30 nights
   - Minimum stay duration is 1 night

2. **Availability Rules**:
   - Room must be available for all requested nights
   - Guest count cannot exceed room capacity
   - Booking cannot exceed hotel's maximum occupancy

3. **Payment Rules**:
   - Valid payment method required for booking confirmation
   - Payment authorization must succeed before booking creation
   - Refund policies vary by rate plan and cancellation timing

4. **Guest Information Rules**:
   - Primary guest must be 18 years or older
   - Valid email address required for confirmation
   - Phone number required for contact purposes

### Pricing Rules

1. **Rate Calculation**:
   - Base rate varies by date, demand, and seasonality
   - Taxes calculated based on hotel location and local regulations
   - Fees applied according to hotel policies
   - Discounts applied based on promotions and loyalty status

2. **Currency Handling**:
   - All prices displayed in hotel's default currency
   - Currency conversion available for international guests
   - Exchange rates updated regularly

### Feature Flag Rules

1. **Rollout Strategy**:
   - New features start with 0% rollout to production
   - Gradual increase based on monitoring and feedback
   - Ability to quickly disable features if issues arise

2. **Targeting Rules**:
   - Features can be targeted by user attributes
   - Geographic targeting for region-specific features
   - A/B testing capabilities for feature variations

### Data Consistency Rules

1. **Booking State Management**:
   - Booking status transitions follow defined workflow
   - Concurrent booking attempts handled with optimistic locking
   - Inventory updates are atomic and consistent

2. **Audit Trail**:
   - All booking modifications logged with timestamp and user
   - Payment transactions tracked for compliance
   - Guest data changes recorded for privacy compliance

### Internationalization Rules

1. **Locale Support**:
   - Content translated based on user's preferred language
   - Date and currency formatting follows locale conventions
   - Right-to-left language support for applicable locales

2. **Content Management**:
   - Translations managed through PhraseApp integration
   - Fallback to default language if translation unavailable
   - Dynamic content updates without application restart

### Security and Privacy Rules

1. **Data Protection**:
   - Guest personal information encrypted at rest and in transit
   - Payment card data handled according to PCI DSS standards
   - Access to guest data logged and monitored

2. **Authentication and Authorization**:
   - User sessions expire after period of inactivity
   - API access requires valid authentication tokens
   - Role-based access control for administrative functions

3. **Compliance Requirements**:
   - GDPR compliance for European guests
   - Data retention policies enforced automatically
   - Right to data deletion honored within required timeframes
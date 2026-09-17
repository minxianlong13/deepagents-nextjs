# Domain Model

## Glossary

### Attendee Type
A classification of event participants that determines their booking privileges, pricing, and access to hotel inventory. Examples include "Speaker", "VIP", "General Attendee", or "Staff".

### E-Commerce Rules
A comprehensive set of business rules that govern how hotel bookings are processed, including pricing, availability, cancellation policies, and payment requirements for specific combinations of events, hotels, and attendee types.

### Event
A scheduled gathering or conference that requires hotel accommodations. Events have specific dates, locations, and associated hotels with negotiated rates and inventory allocations.

### Hotel
A lodging establishment that provides accommodations for event attendees. Hotels have properties, room types, rates, and availability that can be managed through the Passkey platform.

### Passkey
Cvent's hotel booking and management platform that facilitates group hotel reservations for events, providing tools for event planners and attendees to manage accommodations.

### Housing Library
A collection of reusable hotel configurations, rate structures, and booking policies that can be applied across multiple events to standardize hotel management processes.

### Locale
A combination of language and regional settings (e.g., "en-US", "fr-FR") that determines how content is displayed, including currency, date formats, and localized text.

### Group Rate
Special negotiated pricing for hotel rooms that applies to event attendees, typically offering discounts compared to standard retail rates.

### Booking Policy
Rules that define how reservations can be made, modified, or cancelled, including deadlines, fees, and restrictions.

### Guarantee Policy
Requirements for securing a hotel reservation, such as credit card guarantee, deposit, or corporate account billing.

## Core Entities

### ECommerceRules
**Description**: The primary business entity that encapsulates all commercial rules and policies for hotel bookings within a specific event context.

**Attributes**:
- `eventId`: Long - Unique identifier of the associated event
- `hotelId`: Long - Unique identifier of the hotel
- `attendeeTypeId`: Long - Unique identifier of the attendee type
- `locale`: String - Localization setting for the rules
- `rules`: RuleSet - Container for all rule categories
- `metadata`: RuleMetadata - Information about rule versioning and updates

**Relationships**:
- Belongs to one Event
- Belongs to one Hotel
- Belongs to one AttendeeType
- Contains multiple rule categories (BookingPolicies, PricingRules, etc.)

### RuleSet
**Description**: Container object that organizes different categories of e-commerce rules.

**Attributes**:
- `bookingPolicies`: BookingPolicies - Rules governing reservation management
- `pricingRules`: PricingRules - Rules for rate calculation and pricing
- `availabilityRules`: AvailabilityRules - Rules controlling room availability
- `paymentRules`: PaymentRules - Rules for payment processing and requirements

### BookingPolicies
**Description**: Defines how reservations can be created, modified, and cancelled.

**Attributes**:
- `cancellationPolicy`: String - Type of cancellation policy (e.g., "FREE_CANCELLATION_24H")
- `modificationPolicy`: String - Rules for changing reservations
- `guaranteePolicy`: String - Requirements for securing reservations
- `cutoffDate`: DateTime - Last date for making reservations
- `minimumAdvanceBooking`: Integer - Minimum days before event for booking

**Business Rules**:
- Cancellation policies must align with hotel contracts
- Modification policies can be more restrictive than cancellation policies
- Cutoff dates cannot be after the event start date

### PricingRules
**Description**: Governs how room rates are calculated and applied.

**Attributes**:
- `baseRate`: BigDecimal - Base room rate before taxes and fees
- `currency`: String - Currency code (ISO 4217)
- `taxRate`: BigDecimal - Applicable tax percentage
- `taxStructure`: TaxStructure - Two-level tax configuration (hotel-level defaults with event-level overrides)
- `discountEligible`: Boolean - Whether discounts can be applied
- `groupRateApplicable`: Boolean - Whether group rates apply
- `seasonalAdjustments`: List<SeasonalRate> - Date-based rate modifications

**Business Rules**:
- Base rates must be positive values
- Tax rates are configured at two levels: hotel-level defaults and event-level overrides
- Event-level tax configurations take precedence over hotel-level defaults
- Group rates take precedence over individual rates when applicable
- Seasonal adjustments are applied on top of base rates

### AvailabilityRules
**Description**: Controls when and how rooms can be booked.

**Attributes**:
- `advanceBookingDays`: Integer - Maximum days in advance for booking
- `cutoffDate`: DateTime - Last date for making reservations
- `minimumStay`: Integer - Minimum number of nights required
- `maximumStay`: Integer - Maximum number of nights allowed
- `blackoutDates`: List<DateRange> - Dates when booking is not allowed

**Business Rules**:
- Minimum stay cannot exceed maximum stay
- Cutoff date must be before or on event start date
- Blackout dates override all other availability rules
- Advance booking days must be reasonable (typically 1-365 days)

### PaymentRules
**Description**: Defines payment requirements and processing rules.

**Attributes**:
- `acceptedPaymentMethods`: List<String> - Allowed payment types
- `depositRequired`: Boolean - Whether a deposit is required
- `depositAmount`: BigDecimal - Required deposit amount
- `paymentDueDate`: DateTime - When full payment is due
- `refundPolicy`: String - Rules for processing refunds

**Business Rules**:
- At least one payment method must be accepted
- Deposit amount cannot exceed total room cost
- Payment due date must be before or on check-in date
- Refund policies must comply with consumer protection laws

### Event
**Description**: Represents a scheduled event requiring hotel accommodations.

**Attributes**:
- `eventId`: Long - Unique identifier
- `name`: String - Event name
- `startDate`: DateTime - Event start date
- `endDate`: DateTime - Event end date
- `location`: String - Event location
- `organizerId`: Long - Event organizer identifier

**Relationships**:
- Has many Hotels (through event-hotel associations)
- Has many AttendeeTypes
- Has many ECommerceRules

### Hotel
**Description**: A Participant entity representing a lodging establishment with specific object types providing accommodations.

**Attributes**:
- `hotelId`: Long - Unique identifier
- `participantId`: Long - Participant entity identifier (hotels are participants)
- `name`: String - Hotel name
- `address`: Address - Physical location
- `contactInfo`: ContactInfo - Phone, email, website
- `amenities`: List<String> - Available facilities
- `starRating`: Integer - Hotel quality rating

**Relationships**:
- Participates in many Events
- Has many RoomTypes
- Has many ECommerceRules

### AttendeeType
**Description**: Classification of event participants with specific privileges.

**Attributes**:
- `attendeeTypeId`: Long - Unique identifier
- `name`: String - Type name (e.g., "VIP", "Speaker")
- `description`: String - Detailed description
- `priority`: Integer - Booking priority level
- `privileges`: List<String> - Special privileges or restrictions

**Relationships**:
- Belongs to one Event
- Has many ECommerceRules
- May have special pricing or availability rules

## Data Relationships

### Entity Relationship Diagram

```
Event (1) ──────── (M) ECommerceRules (M) ──────── (1) Hotel
  │                           │                        │
  │                           │                        │
  └── (1:M) AttendeeType (1) ──┘                        │
                                                        │
                                                        └── (1:M) RoomType
```

### Key Relationships

1. **Event-Hotel-AttendeeType Triangle**: ECommerceRules exist at the intersection of these three entities, creating a unique combination that determines booking behavior.

2. **Rule Composition**: ECommerceRules contain multiple rule categories, each governing different aspects of the booking process.

3. **Hierarchical Policies**: Rules can inherit from parent configurations but can be overridden at more specific levels.

## Business Rules

### Rule Precedence
1. **Specific Rules Override General Rules**: Event-specific rules take precedence over hotel default rules
2. **Attendee Type Rules**: Special attendee types (VIP, Speaker) may have different rules than general attendees
3. **Date-Based Rules**: Seasonal or time-sensitive rules override standard rules during their effective periods

### Data Consistency Rules
1. **Rate Consistency**: All monetary values must use consistent currency within a rule set
2. **Date Logic**: End dates must be after start dates, cutoff dates must be before event dates
3. **Capacity Constraints**: Available inventory must not exceed hotel capacity
4. **Policy Alignment**: Booking policies must align with legal requirements and hotel contracts

### Validation Rules
1. **Required Fields**: EventId, HotelId, and AttendeeTypeId are mandatory for all ECommerceRules
2. **Positive Values**: Rates, deposits, and stay durations must be positive numbers
3. **Date Ranges**: All date ranges must be valid and logically consistent
4. **Enum Values**: Policy types must match predefined enumeration values

## Domain Events

### Rule Creation
Triggered when new ECommerceRules are established for an event-hotel-attendee type combination.

### Rule Modification
Occurs when existing rules are updated, requiring validation and potentially affecting existing reservations.

### Rule Expiration
Happens when rules reach their cutoff date or the associated event concludes.

### Policy Violation
Raised when a booking attempt violates established rules, requiring intervention or rule adjustment.

## Integration Points

### Legacy System Integration
- **Passkey Hotel Service**: Gradual migration of rules from legacy system
- **Housing Library**: Import of standardized rule templates
- **Create Hotel Service**: Synchronization of hotel-specific configurations
- **Sister Property Organizations**: Hotel chain management and centralized configurations

### External Dependencies
- **Payment Processors**: Integration with payment rule validation
- **Tax Services**: Real-time tax rate calculation based on location
- **Currency Services**: Exchange rate updates for multi-currency support

## Data Lifecycle

### Rule Creation Workflow
1. Event planner defines event requirements
2. Hotel contracts are negotiated and terms established
3. Attendee types are defined with specific privileges
4. ECommerceRules are created combining all requirements
5. Rules are validated for consistency and compliance
6. Rules are activated and made available for booking

### Rule Maintenance
- **Regular Reviews**: Periodic validation of rule accuracy and relevance
- **Contract Updates**: Modification of rules when hotel contracts change
- **Seasonal Adjustments**: Updates to pricing and availability based on demand
- **Compliance Updates**: Changes to meet new regulatory requirements

### Rule Retirement
- **Event Completion**: Rules are archived after event conclusion
- **Contract Expiration**: Rules are deactivated when hotel contracts end
- **System Migration**: Legacy rules are replaced by new system rules
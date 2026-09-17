# Domain Model

## Glossary

### Core Mapping
The fundamental process of transforming data structures from one format to another, specifically between Passkey's internal data models and external vendor-specific formats.

### Vendor Integration
The process of connecting and exchanging data with external hotel property management systems and third-party services through standardized mapping operations.

### Reservation Orchestration
The coordination and management of reservation data as it flows through various systems, ensuring consistency and accuracy across all touchpoints.

### Mapping Rules
Configurable business logic that defines how data fields and values should be transformed between different system formats.

### Validation Context
The set of rules and constraints that ensure data integrity and compliance with vendor-specific requirements during mapping operations.

### Property Management System (PMS)
External hotel management software that handles reservations, guest information, and hotel operations. Examples include Hilton's systems, OHIP, and Shiji.

### Transformation Pipeline
The sequence of operations that process and convert data from source format to target format, including validation, enrichment, and formatting steps.

### Mapping Context
Additional metadata and configuration information that influences how mapping operations are performed for specific scenarios or vendors.

### Addon Services
Additional services or amenities that can be associated with reservations, such as spa services, dining reservations, or transportation.

### Reward Program Integration
The process of mapping and synchronizing loyalty program information between Passkey and vendor systems.

## Core Entities

### Reservation
**Description**: The central entity representing a hotel booking with all associated guest, hotel, and stay information.

**Attributes**:
- `id`: Long - Unique identifier for the reservation
- `confNumber`: String - Human-readable confirmation number
- `guestInfo`: GuestInfo - Information about the primary guest
- `hotelInfo`: HotelInfo - Details about the hotel property
- `stayInfo`: StayInfo - Check-in/out dates and room details
- `paymentInfo`: PaymentInfo - Payment method and billing information
- `addons`: List<Addon> - Additional services and amenities
- `status`: ReservationStatus - Current status of the reservation
- `createdDate`: LocalDateTime - When the reservation was created
- `modifiedDate`: LocalDateTime - Last modification timestamp

**Relationships**:
- One-to-one with GuestInfo
- One-to-one with HotelInfo  
- One-to-one with StayInfo
- One-to-many with Addon entities
- Many-to-one with ReservationStatus

### GuestInfo
**Description**: Contains all information about the guest making the reservation.

**Attributes**:
- `firstName`: String - Guest's first name
- `lastName`: String - Guest's last name
- `email`: String - Primary email address
- `phone`: String - Contact phone number
- `address`: Address - Billing/contact address
- `preferences`: GuestPreferences - Room and service preferences
- `rewardProgram`: RewardProgramInfo - Loyalty program details
- `specialRequests`: List<String> - Special accommodation requests

**Relationships**:
- One-to-one with Address
- One-to-one with GuestPreferences
- One-to-one with RewardProgramInfo

### HotelInfo
**Description**: Information about the hotel property where the reservation is made.

**Attributes**:
- `hotelId`: String - Unique hotel identifier
- `propertyCode`: String - Vendor-specific property code
- `hotelName`: String - Display name of the hotel
- `chainCode`: String - Hotel chain identifier
- `address`: Address - Hotel physical address
- `contactInfo`: ContactInfo - Hotel contact details
- `amenities`: List<String> - Available hotel amenities
- `policies`: HotelPolicies - Cancellation and other policies

**Relationships**:
- One-to-one with Address
- One-to-one with ContactInfo
- One-to-one with HotelPolicies

### StayInfo
**Description**: Details about the guest's stay including dates, room, and occupancy.

**Attributes**:
- `checkIn`: LocalDate - Check-in date
- `checkOut`: LocalDate - Check-out date
- `roomType`: String - Type of room reserved
- `numberOfGuests`: Integer - Total number of guests
- `numberOfRooms`: Integer - Number of rooms reserved
- `rateCode`: String - Rate plan identifier
- `totalAmount`: BigDecimal - Total cost of stay
- `currency`: String - Currency code for pricing

**Relationships**:
- Associated with room type configurations
- Linked to rate and pricing information

### MappingContext
**Description**: Configuration and metadata that controls how mapping operations are performed.

**Attributes**:
- `vendorType`: VendorType - Target vendor system (Hilton, OHIP, Shiji)
- `mappingVersion`: String - Version of mapping rules to use
- `transformationRules`: List<TransformationRule> - Custom mapping rules
- `validationLevel`: ValidationLevel - Strictness of validation
- `includeExtendedData`: Boolean - Whether to include optional fields
- `customProperties`: Map<String, Object> - Vendor-specific configuration

**Relationships**:
- One-to-many with TransformationRule
- Associated with VendorType enumeration

### TransformationRule
**Description**: Defines how specific data fields should be mapped between formats.

**Attributes**:
- `sourceField`: String - Source field path
- `targetField`: String - Target field path
- `transformationType`: TransformationType - Type of transformation
- `defaultValue`: Object - Default value if source is null
- `validationRules`: List<ValidationRule> - Field-specific validations
- `isRequired`: Boolean - Whether the field is mandatory

**Relationships**:
- Many-to-one with MappingContext
- One-to-many with ValidationRule

### ValidationResult
**Description**: Results of validation operations performed during mapping.

**Attributes**:
- `isValid`: Boolean - Overall validation status
- `errors`: List<ValidationError> - Critical validation failures
- `warnings`: List<ValidationWarning> - Non-critical issues
- `fieldValidations`: Map<String, FieldValidation> - Per-field results
- `validationTimestamp`: LocalDateTime - When validation was performed

**Relationships**:
- One-to-many with ValidationError
- One-to-many with ValidationWarning
- One-to-many with FieldValidation

### VendorSpecificData
**Description**: Container for vendor-specific information that doesn't map to standard fields.

**Attributes**:
- `vendorType`: VendorType - Which vendor this data applies to
- `dataFormat`: String - Format or schema of the data
- `rawData`: Map<String, Object> - Vendor-specific key-value pairs
- `metadata`: Map<String, String> - Additional metadata about the data
- `version`: String - Version of vendor data format

**Relationships**:
- Associated with specific VendorType
- Can be linked to Reservation entities

## Business Rules

### Reservation Mapping Rules

1. **Mandatory Field Validation**: All reservations must have valid guest information, hotel details, and stay dates before mapping can proceed.

2. **Date Consistency**: Check-in date must be before check-out date, and both dates must be in the future for new reservations.

3. **Guest Information Completeness**: First name, last name, and email are required for all vendor mappings. Phone number requirements vary by vendor.

4. **Hotel Property Validation**: Hotel property codes must exist in the vendor's system and be active for the requested dates.

5. **Room Type Mapping**: Room types must be mapped to vendor-specific codes. Unknown room types should trigger validation warnings.

### Vendor-Specific Rules

#### Hilton Integration Rules
- Property codes must follow Hilton's naming convention
- Reward program numbers must be validated against Hilton Honors system
- Special requests are limited to 500 characters
- Rate codes must be pre-approved for the property

#### OHIP Integration Rules  
- Reservation merging is allowed only for consecutive stays by the same guest
- Maximum of 5 reservations can be merged in a single operation
- Guest preferences must include accessibility requirements if applicable
- Payment information is optional for group reservations

#### Shiji Integration Rules
- Multiple payload types may be generated for a single reservation
- Extended data inclusion requires special permissions
- API version compatibility must be verified before mapping
- Confirmation numbers must be unique within the property

### Data Transformation Rules

1. **Field Mapping Priority**: Direct field mappings take precedence over calculated or derived values.

2. **Default Value Application**: Default values are applied only when source fields are null or empty, not when they contain invalid data.

3. **Data Type Conversion**: Automatic conversion between compatible data types (String to Integer, Date formats) with validation.

4. **Null Handling**: Null values in non-required fields are preserved unless vendor-specific rules require default values.

5. **Collection Handling**: Lists and arrays are filtered to remove null or invalid entries before mapping.

### Validation Rules

1. **Email Format**: All email addresses must conform to RFC 5322 standard.

2. **Phone Number Format**: Phone numbers should include country code and be in international format.

3. **Date Range Validation**: Stay dates must be within vendor-specific booking windows (typically 2 years in advance).

4. **Currency Validation**: Currency codes must be ISO 4217 compliant and supported by the target vendor.

5. **Text Length Limits**: All text fields are subject to vendor-specific length restrictions.

### Error Handling Rules

1. **Graceful Degradation**: Non-critical mapping failures should not prevent successful processing of valid data.

2. **Error Categorization**: Errors are classified as blocking (prevent mapping) or warning (allow mapping with notifications).

3. **Retry Logic**: Transient failures in external service calls should trigger automatic retry with exponential backoff.

4. **Audit Trail**: All mapping operations and their results must be logged for troubleshooting and compliance.

## Data Flow Patterns

### Inbound Mapping Pattern
```
Source Data → Validation → Transformation → Vendor Format → Response
```

### Outbound Integration Pattern  
```
Request → Service Call → Data Enrichment → Format Conversion → Delivery
```

### Validation Pipeline Pattern
```
Input → Schema Validation → Business Rules → Vendor Rules → Result
```

### Error Recovery Pattern
```
Failure → Classification → Retry Logic → Fallback → Notification
```

## Entity Relationships

```
Reservation (1) ←→ (1) GuestInfo
Reservation (1) ←→ (1) HotelInfo  
Reservation (1) ←→ (1) StayInfo
Reservation (1) ←→ (*) Addon
MappingContext (1) ←→ (*) TransformationRule
TransformationRule (1) ←→ (*) ValidationRule
ValidationResult (1) ←→ (*) ValidationError
ValidationResult (1) ←→ (*) ValidationWarning
```

## Enumeration Values

### VendorType
- `HILTON` - Hilton hotel chain
- `OHIP` - OHIP property management system
- `SHIJI` - Shiji technology platform

### ReservationStatus
- `CONFIRMED` - Reservation is confirmed
- `PENDING` - Awaiting confirmation
- `CANCELLED` - Reservation cancelled
- `MODIFIED` - Recently modified
- `CHECKED_IN` - Guest has checked in
- `CHECKED_OUT` - Guest has checked out

### TransformationType
- `DIRECT` - Direct field-to-field mapping
- `CALCULATED` - Computed from multiple source fields
- `LOOKUP` - Value retrieved from lookup table
- `CONSTANT` - Fixed value assignment
- `CONDITIONAL` - Value depends on conditions

### ValidationLevel
- `STRICT` - All validations must pass
- `STANDARD` - Standard business rule validation
- `LENIENT` - Minimal validation for compatibility
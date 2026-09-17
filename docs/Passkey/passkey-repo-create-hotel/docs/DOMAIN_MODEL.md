# Domain Model

## Glossary

### Hotel
A lodging establishment that provides accommodation services within the Passkey platform. Hotels are the primary entities managed by this service, containing comprehensive information about location, policies, amenities, and operational settings.

### Participant
A user or entity that participates in the Passkey system, typically representing hotel owners, managers, or administrators who have permissions to create and manage hotels.

### Hotel Settings
The comprehensive configuration data required to create a new hotel, including basic information, contact details, policies, and operational preferences.

### Accommodation Type
A classification system for different types of lodging establishments (e.g., hotel, resort, bed & breakfast) that determines available features and booking behaviors.

### Room Block Transfer
The process of transferring room inventory between different systems or providers, with configurable automation levels and provider integrations.

### Group Booking
A booking mechanism for multiple rooms or large parties, with configurable thresholds and special handling rules.

### Rewards Program
Loyalty or rewards programs associated with hotels, allowing guests to earn and redeem points or benefits.

### Credit Card Acceptance
Configuration of which credit card types and payment methods are accepted by a hotel for reservations and payments.

### Passkey Timestamp (pkTimeStamp)
A system-generated timestamp indicating when a hotel record was created or last modified in the Passkey system.

### Handicap Accessibility
Configuration indicating whether a hotel provides accommodations and facilities for guests with disabilities.

### Star Rating
A numerical rating system (typically 1-5) indicating the quality and service level of a hotel.

### Transfer Provider
External service providers that handle room block transfers and inventory management between different booking systems.

### Business Text Service
External service that provides localized text content and translations for hotel descriptions and policies.

### API Key Authentication
Security mechanism using API keys to authenticate and authorize access to service endpoints.

## Core Entities

### Hotel
**Description**: The primary entity representing a lodging establishment in the Passkey system.

**Attributes**:
- `hotelId`: Long - Unique identifier for the hotel
- `nameForDefaultLocale`: String - Hotel name in the default language
- `userId`: Long - Identifier of the user who owns/manages the hotel
- `accommodationType`: Integer - Type classification of the accommodation
- `starRating`: Integer - Quality rating (1-5 stars)
- `latitude`: Float - Geographic latitude coordinate
- `longitude`: Float - Geographic longitude coordinate
- `handicapAccessible`: Boolean - Accessibility compliance flag
- `reservationContactEmail`: String - Email for reservation inquiries
- `pkTimeStamp`: Date - Creation/modification timestamp
- `createdAfterHotelCutoff`: Boolean - Flag indicating creation timing
- `blankGuestInfo`: Boolean - Allow blank guest information flag
- `childrenAffectRate`: Boolean - Whether children affect room rates
- `suppressChildrenCount`: Boolean - Hide children count in bookings
- `showAccess`: Boolean - Display accessibility information
- `enableGlAddon`: Boolean - Enable general ledger addon features
- `enableTransferSecondaryNames`: Boolean - Allow secondary name transfers
- `flipToEnabled`: Boolean - Enable flip-to functionality
- `flipToGuestCode`: String - Guest code for flip-to feature
- `flipToLandingCode`: String - Landing code for flip-to feature
- `hotelLevelAddValFlag`: Integer - Additional value flag at hotel level
- `hotelLevelMultiPayment`: Integer - Multi-payment configuration
- `splitfolioHandlingTypeId`: Integer - Split folio handling type
- `rewardPlacement`: Integer - Rewards program placement setting
- `hideFieldsOnPI`: String - Fields to hide on personal information forms
- `hotelReviewContact`: String - Contact for hotel reviews
- `firstEmailReminder`: String - First email reminder configuration
- `secondEmailReminder`: String - Second email reminder configuration
- `thirdEmailReminder`: String - Third email reminder configuration

**Relationships**:
- Has many `AcceptedCreditCard` entries
- Has one `GroupBookingSettings` configuration
- Has one `RoomBlockTransferConfig` configuration
- Has many `RewardProgramType` associations
- Belongs to one `Participant` (via userId)

### Address
**Description**: Geographic and postal address information for a hotel.

**Attributes**:
- `city`: String - City name (required)
- `country`: String - Country name (required)
- `countryIsoCode`: String - ISO country code (required)
- `line1`: String - Primary address line (required)
- `line2`: String - Secondary address line (optional)
- `postalCode`: String - Postal or ZIP code (required)
- `state`: String - State or province name (optional)

**Relationships**:
- Belongs to one `Hotel`

### AcceptedCreditCard
**Description**: Credit card types accepted by a hotel for payments.

**Attributes**:
- `acceptedCreditCardID`: Integer - Credit card type identifier (required)

**Relationships**:
- Belongs to one `Hotel`

### GroupBookingSettings
**Description**: Configuration for group booking functionality and thresholds.

**Attributes**:
- `enabled`: Boolean - Whether group booking is enabled
- `threshold`: Integer - Minimum number of rooms for group booking

**Relationships**:
- Belongs to one `Hotel`

### RoomBlockTransferConfig
**Description**: Configuration for automated room block transfers between systems.

**Attributes**:
- `transferApproach`: Enum - Transfer automation level (TRANSIENT, SEMI_AUTOMATED, AUTOMATED)
- `transferProvider`: TransferProvider - Provider handling the transfers

**Relationships**:
- Belongs to one `Hotel`
- Has one `TransferProvider`

### TransferProvider
**Description**: External service provider for room block transfers.

**Attributes**:
- `name`: String - Provider name
- `providerId`: Integer - Provider identifier
- `vendorId`: Long - Vendor identifier
- `vendorSystemId`: Long - Vendor system identifier

**Relationships**:
- Belongs to one `RoomBlockTransferConfig`

### RewardProgramType
**Description**: Loyalty or rewards programs associated with hotels.

**Attributes**:
- `id`: Long - Unique identifier
- `name`: String - Program name
- `active`: Boolean - Whether the program is active
- `allowOverrideGLCode`: Boolean - Allow general ledger code override
- `glCode`: String - General ledger code

**Relationships**:
- Belongs to many `Hotel` entities

### HotelSettings
**Description**: Input data transfer object containing all information needed to create a new hotel.

**Attributes**:
- `name`: String - Hotel name (required)
- `address`: Address - Hotel address (required)
- `phoneNumber1`: String - Primary phone number (required)
- `faxNumber1`: String - Primary fax number (required)
- `language`: String - Primary language code (required)
- `userId`: Long - Owner user identifier (required)
- `phoneNumber2`: String - Secondary phone number (optional)
- `faxNumber2`: String - Secondary fax number (optional)
- `emailAddress`: String - General contact email (optional)
- `reservationContactEmail`: String - Reservations email (optional)
- `url`: String - Hotel website URL (optional)
- `tollFreeNumber`: String - Toll-free phone number (optional)
- `description`: String - Hotel description (optional)
- `childPolicy`: String - Child policy description (optional)
- `defaultCancelPolicy`: String - Cancellation policy (optional)
- `latitude`: Float - Geographic latitude (optional)
- `longitude`: Float - Geographic longitude (optional)
- `handicap`: Boolean - Accessibility flag (optional)
- `isTestHotel`: Integer - Test hotel flag (optional)
- `facebookPage`: String - Facebook page URL (optional)
- `rfpUrl`: String - Request for proposal URL (optional)
- `userRoleName`: String - User role name (optional)
- `acceptedCreditCards`: List<AcceptedCreditCard> - Accepted payment methods (optional)

**Relationships**:
- Contains one `Address`
- Contains many `AcceptedCreditCard` entries

### AutomationHotel
**Description**: Simplified input for creating default hotels in automation scenarios.

**Attributes**:
- `userId`: Long - User identifier (required)
- `userRoleName`: String - User role name (optional)

**Relationships**:
- References one `Participant` (via userId)

## Business Rules

### Hotel Creation Rules
1. **Required Information**: Hotels must have a name, address, primary phone, primary fax, language, and owner user ID
2. **Address Validation**: Address must include city, country, country ISO code, primary address line, and postal code
3. **User Association**: Every hotel must be associated with a valid user ID who becomes the hotel owner
4. **Language Support**: Hotels must specify a primary language for localization purposes
5. **Contact Information**: At least one phone number and one fax number must be provided

### Address Rules
1. **Geographic Validation**: Country ISO codes must be valid ISO 3166-1 alpha-2 codes
2. **Required Fields**: City, country, country ISO code, address line 1, and postal code are mandatory
3. **Format Validation**: Postal codes must match the format expected for the specified country

### Credit Card Rules
1. **Valid Card Types**: Only pre-defined credit card type IDs are accepted
2. **Multiple Cards**: Hotels can accept multiple credit card types
3. **Optional Configuration**: Credit card acceptance is optional during hotel creation

### Group Booking Rules
1. **Threshold Validation**: Group booking threshold must be a positive integer
2. **Default Settings**: If not specified, group booking is disabled with a default threshold of 10 rooms
3. **Business Logic**: Group booking settings affect reservation processing and pricing

### Room Block Transfer Rules
1. **Transfer Approaches**: Must be one of TRANSIENT, SEMI_AUTOMATED, or AUTOMATED
2. **Provider Validation**: Transfer provider must be a valid, active provider in the system
3. **Default Configuration**: If not specified, defaults to TRANSIENT approach with default provider

### Rewards Program Rules
1. **Active Programs**: Only active rewards programs can be associated with hotels
2. **GL Code Validation**: General ledger codes must be valid if override is allowed
3. **Multiple Programs**: Hotels can participate in multiple rewards programs simultaneously

### Administrative Rules
1. **Admin Privileges**: Administrative endpoints require elevated permissions
2. **Automation Hotels**: Default hotels created through admin endpoints have minimal configuration
3. **Deletion Rules**: Hotel deletion requires admin privileges and proper cleanup of related data
4. **Test Hotels**: Test hotels (isTestHotel = 1) are isolated from production operations

### Data Integrity Rules
1. **Unique Identifiers**: Hotel IDs must be unique across the system
2. **Referential Integrity**: User IDs must reference valid participants in the system
3. **Timestamp Management**: Creation timestamps are system-generated and immutable
4. **Audit Trail**: All hotel operations are logged for audit purposes

### Validation Rules
1. **Email Format**: Email addresses must be valid format when provided
2. **URL Format**: Website URLs must be valid HTTP/HTTPS URLs when provided
3. **Phone Format**: Phone numbers should follow international format standards
4. **Coordinate Validation**: Latitude must be between -90 and 90, longitude between -180 and 180
5. **Star Rating**: Star ratings must be integers between 1 and 5 when specified

### Integration Rules
1. **External Services**: Hotel creation may trigger updates to external services (hotel service, business text service)
2. **Service Dependencies**: Creation may fail if dependent services are unavailable
3. **Data Synchronization**: Hotel data must be synchronized across integrated systems
4. **Error Handling**: Failed integrations should not prevent hotel creation but should be logged
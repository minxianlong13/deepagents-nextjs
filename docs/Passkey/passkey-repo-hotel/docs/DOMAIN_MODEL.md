# Passkey Hotel Domain Model

## Overview

The Passkey Hotel service manages hotel information, tax structures, and related entities within the Cvent ecosystem. This document outlines the core domain model, entities, business rules, and key concepts.

## Core Domain Entities

### Hotel
**Primary Entity**: Represents a hotel property with comprehensive information and configuration.

**Key Attributes:**
- `hotelId` (Long) - Unique identifier
- `name` (String) - Hotel name
- `description` (String) - Hotel description
- `address1`, `address2`, `city`, `state`, `country`, `zipCode` - Location information
- `phoneNumber` (String) - Contact information
- `latitude`, `longitude` (Float) - Geographic coordinates
- `starRating` (Integer) - Hotel star rating (1-5)
- `statusTypeId` (Integer) - Hotel status
- `url` (String) - Hotel website URL
- `profileLogoImageUrl` (String) - Hotel logo image

**Configuration Attributes:**
- `childrenAffectRate` (Boolean) - Whether children impact room rates
- `splitfolioHandlingTypeId` (Integer) - Split folio handling configuration
- `handicapAccessible` (Boolean) - Accessibility compliance
- `accommodationType` (Integer) - Type of accommodation
- `flipToEnabled` (Boolean) - FlipTo integration enabled
- `enableGlAddon` (Boolean) - GL addon enabled
- `enableTransferSecondaryNames` (Boolean) - Secondary name transfers enabled
- `enableTransportation` (Boolean) - Transportation services enabled
- `blankGuestInfo` (Boolean) - Allow blank guest information
- `allowBlankAddress` (Boolean) - Allow blank addresses
- `suppressChildrenCount` (Boolean) - Suppress children count display

**Relationships:**
- `amenities` (List<Amenity>) - Hotel amenities
- `acceptedCreditCards` (List<CreditCardType>) - Accepted payment methods
- `rewardsProgram` (List<RewardProgramType>) - Loyalty programs
- `reservationContacts` (List<String>) - Reservation contact emails
- `notificationContacts` (List<NotificationContact>) - Notification contacts
- `childrenSettings` (ChildrenSettings) - Children-specific configurations
- `roomBlockTransferConfig` (RoomBlockTransferConfig) - Room block transfer settings
- `affiliateIds` (List<Long>) - Associated affiliate IDs
- `groupTypeIds` (List<Long>) - Associated group type IDs

### HotelTax
**Entity**: Represents tax information associated with hotels.

**Key Attributes:**
- `hotelTaxID` (Long) - Unique tax identifier
- `hotelTaxName` (String) - Tax name/description
- `amountValue` (BigDecimal) - Tax amount or percentage
- `rateInclusionType` (RateInclusionType) - How tax is included in rates
- `hotelTaxAmountTypeID` (Integer) - Tax amount type
- `calculatedFromTypeID` (Integer) - Calculation basis type
- `collectionsScheduleTypeId` (Integer) - Collection schedule type

### NotificationContact
**Entity**: Contact information for hotel notifications.

**Key Attributes:**
- `firstName` (String) - Contact first name
- `lastName` (String) - Contact last name
- `email` (String) - Contact email address
- `phone` (String) - Contact phone number
- `position` (String) - Contact position/role
- `casesOfNotification` (String) - Notification scenarios

### Organization (Org)
**Entity**: Represents organizational entities associated with hotels.

**Key Attributes:**
- `orgId` (Long) - Organization identifier
- `orgName` (String) - Organization name
- `orgType` (String) - Organization type

### Participant
**Entity**: Represents system-level entities (organizations, hotels, vendors) in the booking system - NOT individual people.

**Key Attributes:**
- `participantId` (Long) - Participant identifier
- `participantType` (ParticipantType) - Type of participant (hotel, event organizer, vendor, etc.)

## Value Objects and Enums

### Amenity
Represents hotel amenities and facilities.

### CreditCardType
Enumeration of accepted credit card types.

### RewardProgramType
Enumeration of supported loyalty/reward programs.

### ChildrenSettings
Configuration for children-related policies and settings.

### RoomBlockTransferConfig
Configuration for room block transfer functionality.

### RateInclusionType
Enumeration defining how taxes are included in rates:
- `EXCLUDE_FROM_DISPLAY_RATE` - Tax excluded from displayed rate
- `INCLUDE_IN_DISPLAY_RATE` - Tax included in displayed rate

### ParticipantType
Enumeration of participant types in the system.

## Data Transfer Objects (DTOs)

### HotelRequest
Request object for hotel operations with field selection capabilities.

**Key Attributes:**
- `hotelId` (Long) - Target hotel ID
- `fetchedFields` (List<HotelFields>) - Fields to retrieve
- `localeId` (String) - Locale for localized content
- `env` (String) - Environment context

### HotelSearchRequest
Request object for hotel search operations.

**Key Attributes:**
- `searchCriteria` - Various search parameters
- `fetchedFields` (List<HotelFields>) - Fields to include in results
- `pagination` - Pagination parameters

### HotelSearchResponse
Response object containing search results.

**Key Attributes:**
- `hotels` (List<Hotel>) - Matching hotels
- `hotelCount` (Long) - Total count of matches

### CreateTaxStructureRequest
Request object for creating hotel tax structures.

### HotelTaxStructureSummary
Summary information about hotel tax structures.

## Business Rules

### Hotel Management
1. **Hotel Identification**: Each hotel must have a unique `hotelId`
2. **Required Fields**: Hotel name and basic contact information are mandatory
3. **Status Management**: Hotels have status types that control availability
4. **Field Selection**: API supports selective field retrieval for performance optimization

### Tax Management
1. **Tax Structures**: Hotels have hotel-level tax defaults; events can override with event-level taxes
2. **Rate Inclusion**: Taxes can be included or excluded from display rates
3. **Calculation Types**: Taxes can be calculated based on different criteria
4. **Collection Schedules**: Taxes have configurable collection schedules

### Children Policies
1. **Rate Impact**: Children may or may not affect room rates based on hotel configuration
2. **Count Suppression**: Hotels can choose to suppress children count display
3. **Age Settings**: Children settings define age ranges and policies

### Payment Processing
1. **Credit Cards**: Hotels specify accepted credit card types
2. **Split Folio**: Configurable split folio handling for group bookings
3. **Multi-Payment**: Support for multiple payment methods per reservation

### Notification System
1. **Contact Management**: Hotels maintain multiple notification contacts
2. **Case-Specific**: Notifications are configured for specific scenarios
3. **Email Integration**: Primary communication through email channels

### Integration Features
1. **FlipTo Integration**: Optional integration with FlipTo services
2. **Transportation**: Optional transportation service enablement
3. **GL Addon**: Optional general ledger addon functionality
4. **Affiliate Management**: Support for affiliate relationships

## Service Layer

### HotelService
**Primary Service**: Manages hotel-related business operations.

**Key Operations:**
- `getHotel(HotelRequest)` - Retrieve hotel information
- `getHotels(HotelInfoByHotelIds)` - Bulk hotel retrieval
- `saveHotelInfo(HotelInfo, participantId)` - Save hotel information
- `searchHotels(HotelSearchRequest)` - Search hotels with criteria
- `getHotelTaxStructure(hotelId, eventId)` - Retrieve tax structures
- `createHotelEventTaxStructure()` - Create new tax structures

### Supporting Services
- **AdminService**: Administrative operations
- **ImageService**: Hotel image management
- **OrgService**: Organization management
- **ParticipantService**: Participant management
- **ReservationProcessingService**: Reservation processing
- **SpecialRequestsService**: Special request handling

## Data Access Layer

### Repository Pattern
The system uses MyBatis for data access with the following mappers:
- **HotelMapper**: Core hotel data operations
- **HotelSearchMapper**: Hotel search operations
- **AdminMapper**: Administrative data operations
- **OrgMapper**: Organization data operations
- **ParticipantMapper**: Participant data operations
- **ImagesMapper**: Image data operations
- **SpecialRequestsMapper**: Special request data operations

### Entity Mapping
- **ModifiableHotel**: Mutable entity for MyBatis compatibility
- **ModifiableHotelTax**: Mutable tax entity
- **ModifiableOrg**: Mutable organization entity
- **ModifiableParticipant**: Mutable participant entity
- **ModifiableNotificationContact**: Mutable contact entity

## Domain Glossary

| Term | Definition |
|------|------------|
| **Passkey** | Cvent's hotel booking and management platform |
| **Hotel Property** | A physical hotel location with rooms and services |
| **Block Request** | A request for a block of hotel rooms for an event |
| **Tax Structure** | Configuration of taxes applicable to hotel bookings |
| **Rate Inclusion** | How taxes are displayed relative to room rates |
| **Split Folio** | Dividing charges across multiple payment methods |
| **FlipTo** | Integration service for hotel booking transfers |
| **Sister Property** | Related hotels under the same management |
| **Amenity** | Hotel facility or service (pool, WiFi, etc.) |
| **Notification Contact** | Person to receive hotel-related notifications |
| **Participant** | System-level entity representing organizations (hotels, event organizers, vendors) - NOT individual people |
| **Organization** | Business entity associated with hotel operations |
| **Room Block Transfer** | Moving room allocations between properties |
| **Children Settings** | Policies and configurations for child guests |
| **Accommodation Type** | Category of lodging (hotel, resort, etc.) |
| **Star Rating** | Quality rating system for hotels (1-5 stars) |
| **Affiliate** | Partner organization in the booking ecosystem |
| **Group Type** | Classification for group bookings |
| **Reservation Contact** | Email addresses for reservation communications |

## Error Handling

The system defines specific error codes for different scenarios:
- **HotelErrorCodeType**: Hotel-specific error conditions
- **OrgErrorCodeType**: Organization-related errors
- **SpecialRequestErrorCodeType**: Special request processing errors

Common error scenarios include:
- Hotel not found
- Invalid tax structure configuration
- Save operation failures
- Invalid hotel-event combinations
- Missing required fields

## API Versioning

The service supports multiple API versions:
- **V1**: Legacy hotel operations
- **V2**: Enhanced hotel operations with additional features

## Performance Considerations

1. **Field Selection**: Use `fetchedFields` to retrieve only necessary data
2. **Bulk Operations**: Prefer bulk retrieval for multiple hotels
3. **Caching**: Certain hotel fields are cached for performance
4. **Pagination**: Search operations support pagination for large result sets
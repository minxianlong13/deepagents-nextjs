# Passkey Hotel Service API Reference

## Overview

The Passkey Hotel Service provides REST endpoints for managing hotel-related data in the Cvent Passkey system. This service is built using Dropwizard (JAX-RS) and provides comprehensive hotel management capabilities including hotel information, tax structures, organization data, participant management, and special requests.

**Base URL**: `/passkey-hotel`  
**Authentication**: API Key required for all endpoints  
**Content-Type**: `application/json`

## API Versions

- **v1**: Main API version with full hotel management capabilities
- **v2**: Enhanced version with additional search features

---

## Hotel Management Endpoints (v1)

### Get Hotels for Block Request
**GET** `/passkey-hotel/v1/brhotels/{blockRequestId}`

Retrieves a list of hotels associated with a specific block request ID.

**Parameters:**
- `blockRequestId` (path, required): Block request ID
- `localeId` (query, optional): Locale ID (default: "EN_US")
- `env` (query, optional): Environment

**Response:** `200 OK` - Array of Hotel objects  
**Error:** `404 Not Found` - Hotels not found

---

### Get Hotel by ID
**GET** `/passkey-hotel/v1/hotels/{hotelId}`

Retrieves detailed information for a specific hotel.

**Parameters:**
- `hotelId` (path, required): Hotel ID
- `localeId` (query, optional): Locale ID
- `fetchedFields` (query, optional): Array of fields to fetch
  - Available fields: `hotelId`, `name`, `description`, `phoneNumber`, `address1`, `address2`, `zipCode`, `city`, `state`, `country`, `childrenAffectRate`, `splitfolioHandlingTypeId`, `starRating`, `amenities`, `latLongCoords`, `acceptedCreditCards`, `rewardsProgram`, `reservationContacts`, `notificationContacts`, `customerFlags`, `roomBlockTransferConfig`, `blankGuestInfo`, `childrenSettings`, `allowBlankAddress`, `affiliateIds`, `resAccessInPast`, `enableTransportation`, `url`, `profileLogoImageUrl`, `statusTypeId`, `groupTypeIds`

**Response:** `200 OK` - Hotel object  
**Error:** `404 Not Found` - Hotel not found

---

### Search Hotels
**GET** `/passkey-hotel/v1/hotels`

Search for hotels based on various criteria.

**Parameters:**
- `eventId` (query, optional): Event ID
- `subBlockGroupId` (query, optional): Sub-block group ID
- `attendeeTypeId` (query, optional): Array of attendee type IDs
- `roomTypeNames` (query, optional): Array of room type names
- `spOrgId` (query, optional): Sister property organization ID
- `hasLicense` (query, optional): Filter by license status
- `name` (query, optional): Hotel name search
- `address1` (query, optional): Address line 1 search
- `address2` (query, optional): Address line 2 search
- `zipcode` (query, optional): ZIP code search
- `city` (query, optional): City search
- `state` (query, optional): State search
- `country` (query, optional): Country search
- `cached` (query, optional): Use cached results
- `startFetch` (query, optional): Pagination start
- `maxFetch` (query, optional): Maximum results to fetch
- `sortBy` (query, optional): Sort field (`id`, `name`, `shutOffDate`, `cutoffDate`)
- `sortDirection` (query, optional): Sort direction (`ASC`, `DESC`)
- `filterTestHotels` (query, optional): Filter test hotels
- `glFilter` (query, optional): GL filter (`COMPLETE`, `INCOMPLETE`, `NON_INTEGRATED`)
- `fetchedFields` (query, optional): Array of fields to fetch

**Response:** `200 OK` - Array of Hotel objects

---

### Get Hotels in Bulk
**POST** `/passkey-hotel/v1/hotels/bulk-get`

Retrieve multiple hotels by their IDs in a single request.

**Request Body:** `HotelInfoByHotelIds`
```json
{
  "hotelIds": [123, 456, 789],
  "localeId": "EN_US",
  "fetchedFields": ["hotelId", "name", "address1"]
}
```

**Response:** `200 OK` - Array of Hotel objects

---

### Save Hotel Information
**PUT** `/passkey-hotel/v1/hotels`

Save complete hotel information.

**Parameters:**
- `env` (query, optional): Environment
- `participantId` (query, required): Participant ID

**Request Body:** `HotelInfo` object

**Response:** `200 OK` - Hotel information saved successfully

---

### Save Partial Hotel Information
**PATCH** `/passkey-hotel/v1/hotels/{hotelId}`

Update specific fields of hotel information.

**Parameters:**
- `hotelId` (path, required): Hotel ID

**Request Body:** `PartialHotelInfo` object

**Response:** `200 OK` - Partial hotel information saved successfully

---

### Get Total Sister Hotels
**GET** `/passkey-hotel/v1/sisterhotels/total`

Get the total count of sister hotels for a sister property organization.

**Parameters:**
- `spOrgId` (query, required): Sister property organization ID
- `name` (query, optional): Name filter
- `hasLicense` (query, optional): License filter

**Response:** `200 OK` - Long value representing total count

---

## Tax Structure Management

### Get Hotel Tax Structure
**GET** `/passkey-hotel/v1/taxstructure/{hotelId}`

Retrieve tax structure for a specific hotel and event.

**Parameters:**
- `hotelId` (path, required): Hotel ID
- `eventId` (query, optional): Event ID
- `env` (query, optional): Environment

**Response:** `200 OK` - HotelTaxStructureSummary object  
**Error:** `404 Not Found` - Tax structure not found

---

### Get Bulk Hotel Tax Structures
**POST** `/passkey-hotel/v1/taxstructure/bulk-get`

Retrieve tax structures for multiple hotels.

**Parameters:**
- `env` (query, optional): Environment

**Request Body:** `HotelTaxStructureByHotelIds`
```json
{
  "hotelIds": [123, 456, 789],
  "eventId": 12345
}
```

**Response:** `200 OK` - Array of HotelTaxStructureSummary objects

---

### Save Tax Structure
**POST** `/passkey-hotel/v1/taxstructure/{hotelId}`

Create a new tax structure for a hotel or event.

**Parameters:**
- `hotelId` (path, required): Hotel ID
- `eventId` (query, optional): Event ID
- `rateIncluded` (query, optional): Rate inclusion flag
- `pkUserId` (query, optional): Passkey user ID

**Request Body:** Array of `CreateTaxStructureRequest`
```json
[
  {
    "hotelTaxName": "City Tax",
    "amountValue": 15.00,
    "hotelTaxAmountTypeID": 1,
    "calculatedFromTypeID": 2,
    "collectionsScheduleTypeId": 3,
    "rateInclusionType": "EXCLUDE_FROM_DISPLAY_RATE"
  }
]
```

**Response:** `200 OK` - NewHotelTaxStructureResponse object  
**Error:** `400 Bad Request` - Invalid parameters

---

### Get Reservation Tax Structure
**GET** `/passkey-hotel/v1/restaxstructure/{hotelTaxStructureId}`

Retrieve reservation tax structure by tax structure ID.

**Parameters:**
- `hotelTaxStructureId` (path, required): Hotel tax structure ID
- `env` (query, optional): Environment

**Response:** `200 OK` - HotelTaxStructureSummary object  
**Error:** `404 Not Found` - Tax structure not found

---

## Organization Management

### Get Organization by ID
**GET** `/passkey-hotel/v1/orgs/{orgId}`

Retrieve organization details by organization ID.

**Parameters:**
- `orgId` (path, required): Organization ID
- `fetchedFields` (query, optional): Array of fields to fetch
  - Available fields: `name`, `phoneNumber`, `address1`, `address2`, `zipCode`, `city`, `state`, `country`, `sisterPropertyIds`, `customerFlags`, `affiliateIds`
- `sisterPropertyFilter` (query, optional): Sister property filter
- `sisterPropertyMax` (query, optional): Maximum sister properties
- `env` (query, optional): Environment

**Response:** `200 OK` - Org object  
**Error:** `404 Not Found` - Organization not found

---

### Check Sister Property Relationship
**GET** `/passkey-hotel/v1/orgs/{sporgId}/sister-properties/{sisterHotelPropertyId}`

Check if a sister property organization has a specific hotel property.

**Parameters:**
- `sporgId` (path, required): Sister property organization ID
- `sisterHotelPropertyId` (path, required): Sister hotel property ID

**Response:** `200 OK` - Org object  
**Error:** `404 Not Found` - Relationship not found

---

## Participant Management

### Find Participants
**GET** `/passkey-hotel/v1/participants/type/{participantType}/find`

Search for participants by type and partial name.

**Parameters:**
- `participantType` (path, required): Participant type
  - Values: `ANY`, `OWNERS_AND_AFFILIATES`, `ORG`, `HOTEL`, `VENDOR`, `SPONSOR`
- `constrainByEventVisibilityParticipantId` (query, optional): Event visibility constraint
- `name` (query, optional): Partial name search

**Response:** `200 OK` - Array of participant IDs  
**Error:** `400 Bad Request` - Invalid participant type

---

### Get Participant Details
**GET** `/passkey-hotel/v1/participant`

Retrieve participant details by ID and type.

**Parameters:**
- `participantType` (query, required): Participant type
- `participantId` (query, required): Participant ID

**Response:** `200 OK` - Participant details  
**Error:** `400 Bad Request` - Invalid parameters

---

## Special Requests

### Get Special Request Codes
**GET** `/passkey-hotel/v1/special-requests`

Retrieve special request codes for hotels and/or organizations.

**Parameters:**
- `hotelId` (query, optional): Hotel ID
- `orgId` (query, optional): Organization ID

**Response:** `200 OK` - Array of SpecialRequestCode objects  
**Error:** `400 Bad Request` - Hotel ID or Organization ID required

---

## Reservation Processing

### Get Reservation Processing Data
**GET** `/passkey-hotel/v1/reservation-processing-data`

Retrieve hotel information needed for reservation processing.

**Parameters:**
- `eventId` (query, required): Event ID
- `hotelId` (query, required): Array of hotel IDs
- `taxStructureId` (query, optional): Array of tax structure IDs

**Response:** `200 OK` - HotelProcessingData object  
**Error:** `400 Bad Request` - Invalid request parameters

---

## Admin Endpoints

### Clear Hotel Search Cache
**DELETE** `/passkey-hotel/v1/admin/cache/hotel-search`

Clear the hotel search cache.

**Response:** `204 No Content` - Cache cleared successfully

---

### Delete Hotel Info (Testing)
**DELETE** `/passkey-hotel/v1/admin/delete-hotel-info/{participantId}`

Delete hotel information by participant ID (for automated testing only).

**Parameters:**
- `participantId` (path, required): Participant ID

**Response:** `204 No Content` - Hotel info deleted successfully

---

### Search Participant (Testing)
**PUT** `/passkey-hotel/v1/admin/participant`

Search for participant by name (for automation testing only).

**Request Body:** `AutomationParticipantRequest`
```json
{
  "participantName": "Hotel ABC"
}
```

**Response:** `200 OK` - AutomationParticipant object

---

### Get Hotel User Details (Testing)
**GET** `/passkey-hotel/v1/admin/hotel-users/{hotelId}`

Get hotel user details for testing purposes.

**Parameters:**
- `hotelId` (path, required): Hotel ID

**Response:** `200 OK` - Array of HotelUserDetails objects

---

### Get Organizations by Name
**GET** `/passkey-hotel/v1/admin/orgs`

Retrieve organizations by name.

**Parameters:**
- `name` (query, required): Organization name

**Response:** `200 OK` - Array of Org objects  
**Error:** `404 Not Found` - Organization not found

---

### Get Hotel Addon Details (Testing)
**GET** `/passkey-hotel/v1/admin/hotel-addons/{hotelId}`

Get hotel addon details for automation testing.

**Parameters:**
- `hotelId` (path, required): Hotel ID

**Response:** `200 OK` - Array of HotelAddOnDetails objects

---

### Update Hotel Passkey Settings (Testing)
**PUT** `/passkey-hotel/v1/admin/passkey-settings/{hotelId}`

Update hotel Passkey settings for automation testing.

**Parameters:**
- `hotelId` (path, required): Hotel ID
- `enableBlockRequests` (query, required): Enable block requests flag
- `enableEventConnector` (query, required): Enable event connector flag

**Response:** `200 OK` - Settings updated successfully

---

### Update Child Settings
**PUT** `/passkey-hotel/v1/admin/hotels/{hotelId}/child-settings`

Update child settings for a hotel.

**Parameters:**
- `hotelId` (path, required): Hotel ID

**Request Body:** `ChildrenSettings`
```json
{
  "askForChildAge": true,
  "askForChildName": false,
  "childrenStayFree": true,
  "requireChildAge": false,
  "requireChildName": false,
  "suppressChildrenCount": false,
  "childAges": [
    {
      "rangeType": "Infants",
      "rangeValue": 2,
      "includeInOccupancy": false
    },
    {
      "rangeType": "Children",
      "rangeValue": 12,
      "includeInOccupancy": true
    },
    {
      "rangeType": "Adults",
      "rangeValue": 13,
      "includeInOccupancy": true
    }
  ]
}
```

**Response:** `200 OK` - Child settings updated successfully  
**Error:** `404 Not Found` - Update failed

---

### Create Tax Structure (Admin)
**POST** `/passkey-hotel/v1/admin/taxstructure/{hotelId}/event/{eventId}`

Create a new hotel tax structure within an event.

**Parameters:**
- `hotelId` (path, required): Hotel ID
- `eventId` (path, required): Event ID
- `pkUserId` (query, optional): Passkey user ID

**Request Body:** Array of `CreateTaxStructureRequest`

**Response:** `200 OK` - NewHotelTaxStructureResponse object  
**Error:** `500 Internal Server Error` - Error occurred

---

### Update Tax Structure (Admin) - DEPRECATED
**PUT** `/passkey-hotel/v1/admin/taxstructure/{hotelId}/event/{eventId}`

Update a hotel's tax structure within an event (deprecated).

**Parameters:**
- `hotelId` (path, required): Hotel ID
- `eventId` (path, required): Event ID

**Request Body:** Array of `HotelTax` objects

**Response:** `200 OK` - Tax structure updated successfully

---

### Delete Tax Structure (Admin)
**DELETE** `/passkey-hotel/v1/admin/taxstructure/{taxStructureId}`

Delete a hotel's tax structure within an event.

**Parameters:**
- `taxStructureId` (path, required): Tax structure ID

**Response:** `204 No Content` - Tax structure deleted successfully

---

## Hotel Management Endpoints (v2)

### Search Hotels (Enhanced)
**GET** `/passkey-hotel/v2/hotels`

Enhanced hotel search with additional features including count information.

**Parameters:** Same as v1 search hotels endpoint

**Response:** `200 OK` - Enhanced search results with hotel count information

---

## OpenAPI Specification

### Get OpenAPI Spec
**GET** `/passkey-hotel/openapi.{type}`

Retrieve the OpenAPI specification for the service.

**Parameters:**
- `type` (path, required): Format type (`json` or `yaml`)

**Response:** `200 OK` - OpenAPI specification in requested format

---

## Data Models

### Hotel
Core hotel information including:
- Basic details (ID, name, description, contact info)
- Address information
- Settings and configurations
- Amenities and features
- Contact information
- Business rules and flags

### HotelInfo
Complete hotel information for creation/updates including:
- All hotel properties
- Credit card acceptance
- Booking settings
- Reward programs
- Transfer configurations

### HotelTaxStructureSummary
Tax structure information including:
- Tax details and rates
- Calculation methods
- Collection schedules
- Rate inclusion settings

### Org
Organization information including:
- Basic details (ID, name, contact info)
- Address information
- Sister property relationships
- Customer flags and affiliates

### SpecialRequestCode
Special request code information including:
- Code and name
- Keywords and descriptions
- Participant associations
- Exception groupings

---

## Authentication

All endpoints require API Key authentication using the `apiKey` security scheme. The API key must be provided in the request headers.

---

## Error Handling

The API uses standard HTTP status codes and returns structured error responses:

```json
{
  "code": "ERROR_CODE",
  "message": "Error description",
  "httpRequestId": "unique-request-id",
  "details": [
    {
      "code": "DETAIL_CODE",
      "message": "Detail message",
      "target": "field_name"
    }
  ]
}
```

Common HTTP status codes:
- `200 OK` - Successful request
- `204 No Content` - Successful request with no content
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting and Best Practices

1. Use bulk endpoints when retrieving multiple resources
2. Specify only required fields using `fetchedFields` parameter
3. Implement proper error handling for all API calls
4. Cache responses when appropriate
5. Use pagination for large result sets

---

*Generated from OpenAPI specification and source code analysis*
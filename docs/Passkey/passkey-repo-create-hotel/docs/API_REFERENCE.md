# API Reference

## Base URL
`https://{environment}.cvent.com/passkey-create-hotel/v1`

## Authentication
All endpoints require API Key authentication using Cvent's auth-service.

**Security Scheme**: API Key
- **Type**: apiKey
- **Scheme**: api_key
- **Header**: Authorization

## Endpoints

### Create Hotel

**POST** `/passkey-create-hotel/v1`

Creates a new Passkey hotel from provided hotel settings.

**Description**: This endpoint creates a new hotel in the Passkey system with comprehensive settings including address, contact information, policies, and configuration options.

**Security**: Requires API Key authentication

**Request Body**:
```json
{
  "acceptedCreditCards": [
    {
      "acceptedCreditCardID": 1
    }
  ],
  "address": {
    "city": "McLean",
    "country": "United States",
    "countryIsoCode": "US",
    "line1": "1765 Greensboro Station Pl",
    "line2": "Suite 900",
    "postalCode": "22102",
    "state": "Virginia"
  },
  "childPolicy": "Children under 12 stay free with adult",
  "defaultCancelPolicy": "24 hours prior to arrival",
  "description": "Modern business hotel in McLean",
  "emailAddress": "reservations@example.com",
  "facebookPage": "https://facebook.com/examplehotel",
  "faxNumber1": "+1-703-555-0199",
  "faxNumber2": "+1-703-555-0299",
  "handicap": true,
  "isTestHotel": 0,
  "language": "en",
  "latitude": 38.9338,
  "longitude": -77.2273,
  "name": "Example Business Hotel",
  "phoneNumber1": "+1-703-555-0100",
  "phoneNumber2": "+1-703-555-0200",
  "reservationContactEmail": "reservations@example.com",
  "rfpUrl": "https://example.com/rfp",
  "tollFreeNumber": "+1-800-555-0100",
  "url": "https://example.com",
  "userId": 12345,
  "userRoleName": "HotelManager"
}
```

**Response**:
```json
{
  "hotelId": 67890,
  "nameForDefaultLocale": "Example Business Hotel",
  "userId": 12345,
  "accommodationType": 1,
  "starRating": 4,
  "latitude": 38.9338,
  "longitude": -77.2273,
  "handicapAccessible": true,
  "acceptedCreditCards": [
    {
      "acceptedCreditCardID": 1
    }
  ],
  "hotelCancelPolicy": "24 hours prior to arrival",
  "hotelChildPolicy": "Children under 12 stay free with adult",
  "reservationContactEmail": "reservations@example.com",
  "pkTimeStamp": "2024-01-15",
  "createdAfterHotelCutoff": false,
  "blankGuestInfo": false,
  "childrenAffectRate": true,
  "suppressChildrenCount": false,
  "showAccess": true,
  "enableGlAddon": false,
  "enableTransferSecondaryNames": false,
  "flipToEnabled": false,
  "flipToGuestCode": null,
  "flipToLandingCode": null,
  "hotelLevelAddValFlag": 0,
  "hotelLevelMultiPayment": 0,
  "splitfolioHandlingTypeId": 1,
  "rewardPlacement": 0,
  "hideFieldsOnPI": null,
  "hotelReviewContact": null,
  "firstEmailReminder": null,
  "secondEmailReminder": null,
  "thirdEmailReminder": null,
  "rewardsProgram": [],
  "groupBookingSettings": {
    "enabled": false,
    "threshold": 10
  },
  "roomBlockTransferConfig": {
    "transferApproach": "TRANSIENT",
    "transferProvider": {
      "name": "Default Provider",
      "providerId": 1,
      "vendorId": 1,
      "vendorSystemId": 1
    }
  }
}
```

**Status Codes**:
- `201`: Hotel created successfully
- `400`: Bad request - Invalid hotel settings or validation errors
- `401`: Unauthorized - Invalid or missing API key
- `500`: Internal server error

---

### Create Default Hotel (Admin)

**POST** `/passkey-create-hotel/v1/admin`

Creates a default Passkey hotel for automation purposes.

**Description**: Administrative endpoint for creating hotels with minimal configuration, primarily used for automation and testing scenarios.

**Security**: Requires API Key authentication with admin privileges

**Request Body**:
```json
{
  "userId": 12345,
  "userRoleName": "SystemAdmin"
}
```

**Response**:
```json
{
  "hotelId": 67891,
  "nameForDefaultLocale": "Default Test Hotel",
  "userId": 12345,
  "accommodationType": 1,
  "starRating": 3,
  "latitude": 0.0,
  "longitude": 0.0,
  "handicapAccessible": false,
  "acceptedCreditCards": [],
  "hotelCancelPolicy": "Standard cancellation policy",
  "hotelChildPolicy": "Standard child policy",
  "reservationContactEmail": "admin@example.com",
  "pkTimeStamp": "2024-01-15",
  "createdAfterHotelCutoff": false,
  "blankGuestInfo": true,
  "childrenAffectRate": false,
  "suppressChildrenCount": true,
  "showAccess": false,
  "enableGlAddon": false,
  "enableTransferSecondaryNames": false,
  "flipToEnabled": false,
  "flipToGuestCode": null,
  "flipToLandingCode": null,
  "hotelLevelAddValFlag": 0,
  "hotelLevelMultiPayment": 0,
  "splitfolioHandlingTypeId": 1,
  "rewardPlacement": 0,
  "hideFieldsOnPI": null,
  "hotelReviewContact": null,
  "firstEmailReminder": null,
  "secondEmailReminder": null,
  "thirdEmailReminder": null,
  "rewardsProgram": [],
  "groupBookingSettings": {
    "enabled": false,
    "threshold": 10
  },
  "roomBlockTransferConfig": {
    "transferApproach": "TRANSIENT",
    "transferProvider": {
      "name": "Default Provider",
      "providerId": 1,
      "vendorId": 1,
      "vendorSystemId": 1
    }
  }
}
```

**Status Codes**:
- `201`: Default hotel created successfully
- `400`: Bad request - Invalid automation settings
- `401`: Unauthorized - Invalid or missing API key
- `403`: Forbidden - Insufficient admin privileges
- `500`: Internal server error

---

### Delete Hotel (Admin)

**DELETE** `/passkey-create-hotel/v1/admin/{participantId}`

Deletes a hotel by participant ID.

**Description**: Administrative endpoint for removing hotels from the system, primarily used for cleanup in testing and automation scenarios.

**Security**: Requires API Key authentication with admin privileges

**Path Parameters**:
- `participantId` (integer, required) - The participant ID of the hotel to delete

**Response**: No content body

**Status Codes**:
- `204`: Hotel deleted successfully
- `400`: Bad request - Invalid participant ID
- `401`: Unauthorized - Invalid or missing API key
- `403`: Forbidden - Insufficient admin privileges
- `404`: Not found - Hotel with specified participant ID not found
- `500`: Internal server error

---

## Data Models

### HotelSettings

The main input model for creating hotels with comprehensive configuration options.

**Required Fields**:
- `address` - Hotel address information
- `faxNumber1` - Primary fax number
- `language` - Hotel's primary language code
- `name` - Hotel name
- `phoneNumber1` - Primary phone number
- `userId` - User ID of the hotel owner

**Optional Fields**:
- `acceptedCreditCards` - Array of accepted credit card types
- `childPolicy` - Hotel's child policy description
- `defaultCancelPolicy` - Default cancellation policy
- `description` - Hotel description
- `emailAddress` - General contact email
- `facebookPage` - Facebook page URL
- `faxNumber2` - Secondary fax number
- `handicap` - Handicap accessibility flag
- `isTestHotel` - Test hotel flag (0 = production, 1 = test)
- `latitude` - Geographic latitude
- `longitude` - Geographic longitude
- `phoneNumber2` - Secondary phone number
- `reservationContactEmail` - Reservations contact email
- `rfpUrl` - Request for proposal URL
- `tollFreeNumber` - Toll-free phone number
- `url` - Hotel website URL
- `userRoleName` - Role name of the hotel owner

### Address

Hotel address information with required location details.

**Required Fields**:
- `city` - City name
- `country` - Country name
- `countryIsoCode` - ISO country code (e.g., "US")
- `line1` - Primary address line
- `postalCode` - Postal/ZIP code

**Optional Fields**:
- `line2` - Secondary address line
- `state` - State/province name

### HotelInfo

The response model containing complete hotel information after creation.

**Key Fields**:
- `hotelId` - Unique hotel identifier
- `nameForDefaultLocale` - Hotel name in default language
- `userId` - Owner user ID
- `accommodationType` - Type of accommodation
- `starRating` - Hotel star rating (1-5)
- `latitude`/`longitude` - Geographic coordinates
- `handicapAccessible` - Accessibility flag
- `acceptedCreditCards` - Accepted payment methods
- `hotelCancelPolicy` - Cancellation policy
- `hotelChildPolicy` - Child policy
- `reservationContactEmail` - Reservations contact
- `pkTimeStamp` - Creation timestamp
- `groupBookingSettings` - Group booking configuration
- `roomBlockTransferConfig` - Room block transfer settings
- `rewardsProgram` - Associated rewards programs

### AutomationHotel

Simplified model for administrative hotel creation.

**Required Fields**:
- `userId` - User ID for the hotel owner

**Optional Fields**:
- `userRoleName` - Role name for the user

### AcceptedCreditCard

Credit card acceptance configuration.

**Required Fields**:
- `acceptedCreditCardID` - Credit card type identifier

### GroupBookingSettings

Configuration for group booking functionality.

**Fields**:
- `enabled` - Whether group booking is enabled
- `threshold` - Minimum number of rooms for group booking

### RoomBlockTransferConfig

Configuration for room block transfer operations.

**Fields**:
- `transferApproach` - Transfer approach (TRANSIENT, SEMI_AUTOMATED, AUTOMATED)
- `transferProvider` - Transfer provider information

## Error Handling

All endpoints return consistent error responses in the following format:

```json
{
  "errorCodeType": "BAD_REQUEST",
  "httpRequestId": "12345678-1234-1234-1234-123456789012",
  "message": "Validation failed for hotel settings",
  "details": [
    {
      "field": "address.city",
      "message": "City is required"
    }
  ]
}
```

**Common Error Codes**:
- `BAD_REQUEST` - Invalid input data or validation errors
- `UNAUTHORIZED` - Authentication required or invalid credentials
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Requested resource not found
- `INTERNAL_SERVER_ERROR` - Unexpected server error

## Rate Limiting

API endpoints are subject to rate limiting based on API key and user permissions. Contact your system administrator for specific rate limit information.

## Versioning

The API uses URL path versioning (v1). Breaking changes will result in a new version number, while backward-compatible changes will be made to the existing version.
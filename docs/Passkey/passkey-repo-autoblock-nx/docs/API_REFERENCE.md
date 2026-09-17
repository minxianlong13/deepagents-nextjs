# API Reference

## Base URL

The GraphQL API is available at:
- **Development**: `https://passkey-autoblock-apollo-dev.core.cvent.org/api/graphql`
- **Staging**: `https://passkey-autoblock-apollo-staging.core.cvent.org/api/graphql`
- **Production**: `https://passkey-autoblock-apollo.core.cvent.org/api/graphql`

## Authentication

All API requests require authentication using Bearer tokens:

```http
Authorization: Bearer <your-jwt-token>
```

### Required Roles
- `FULL_SITE_ACCESS`: Required for most autoblock operations
- Additional role-based permissions may apply to specific operations

## GraphQL Schema

### Queries

#### blockRequestConfigProperties

Retrieves configuration properties for autoblock requests.

**Query:**
```graphql
query GetBlockRequestConfig {
  blockRequestConfigProperties {
    requestName
    eventId
    startDate
    endDate
    deadlineDate
    publishOnDate
    participatingHotels
    freeSellDateTime
    isPreview
    siteState
    requestCampaignIds
    approveCampaignIds
    organizingParticipantId
    organizingUserId
    requestId
    autoConfigProperties {
      autoApprove
      organizationFieldLabel(locale: "en-US")
      confirmationMessage(locale: "en-US")
      guaranteeTypeId
      maxReservationsPerAttendeeTx
      showAdditionalReservationsLink
      guaranteedBlocks
      rollupGuaranteedBlocks
      bookingSitesCustomizable
      requestIntroductionMessage(locale: "en-US")
      displayAvailableRoomNumber
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "blockRequestConfigProperties": {
      "requestName": "Annual Conference 2024",
      "eventId": 12345,
      "startDate": "2024-06-01",
      "endDate": "2024-06-05",
      "deadlineDate": "2024-05-15",
      "publishOnDate": "2024-04-01",
      "participatingHotels": [101, 102, 103],
      "freeSellDateTime": "2024-05-20T10:00:00Z",
      "isPreview": false,
      "siteState": "ACTIVE",
      "requestCampaignIds": [201, 202],
      "approveCampaignIds": [301, 302],
      "organizingParticipantId": 1001,
      "organizingUserId": 2001,
      "requestId": 3001,
      "autoConfigProperties": {
        "autoApprove": true,
        "organizationFieldLabel": "Company Name",
        "confirmationMessage": "Your reservation has been confirmed",
        "guaranteeTypeId": 1,
        "maxReservationsPerAttendeeTx": 5,
        "showAdditionalReservationsLink": true,
        "guaranteedBlocks": true,
        "rollupGuaranteedBlocks": false,
        "bookingSitesCustomizable": true,
        "requestIntroductionMessage": "Welcome to our booking system",
        "displayAvailableRoomNumber": true
      }
    }
  }
}
```

**Authorization:** Requires `FULL_SITE_ACCESS` role
**Cache:** No caching applied

#### surveyConfigProperties

Retrieves survey configuration properties including hotel and inventory information.

**Query:**
```graphql
query GetSurveyConfig {
  surveyConfigProperties {
    blockRequestId
    eventId
    hotelList {
      hotelId
      displayInRequest
      roomTypeList {
        roomTypeId
        displayInRequest
        inventoryList {
          date
          maxInventory
        }
      }
      inventoryList {
        date
        maxInventory
      }
    }
    inventoryList {
      date
      maxInventory
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "surveyConfigProperties": {
      "blockRequestId": 4001,
      "eventId": 12345,
      "hotelList": [
        {
          "hotelId": 101,
          "displayInRequest": true,
          "roomTypeList": [
            {
              "roomTypeId": 501,
              "displayInRequest": true,
              "inventoryList": [
                {
                  "date": "2024-06-01",
                  "maxInventory": 50
                },
                {
                  "date": "2024-06-02",
                  "maxInventory": 45
                }
              ]
            }
          ],
          "inventoryList": [
            {
              "date": "2024-06-01",
              "maxInventory": 100
            }
          ]
        }
      ],
      "inventoryList": [
        {
          "date": "2024-06-01",
          "maxInventory": 200
        }
      ]
    }
  }
}
```

**Authorization:** Requires `FULL_SITE_ACCESS` role
**Cache:** 300 seconds (5 minutes)

## Data Types

### AutoblockRequestConfigProperties

Configuration properties for autoblock requests.

**Fields:**
- `requestName: String!` - Name of the block request
- `eventId: Int!` - Unique identifier for the event
- `startDate: String!` - Start date of the event (ISO 8601 format)
- `endDate: String!` - End date of the event (ISO 8601 format)
- `deadlineDate: String!` - Deadline for reservations (ISO 8601 format)
- `publishOnDate: String!` - Date when the block becomes available (ISO 8601 format)
- `participatingHotels: [Int]!` - List of participating hotel IDs
- `freeSellDateTime: String` - Date/time when free sell begins (ISO 8601 format)
- `isPreview: Boolean` - Whether this is a preview mode
- `siteState: String!` - Current state of the booking site
- `requestCampaignIds: [Int]` - Associated request campaign IDs
- `approveCampaignIds: [Int]` - Associated approval campaign IDs
- `organizingParticipantId: Int` - ID of the organizing participant
- `organizingUserId: Int` - ID of the organizing user
- `requestId: Int` - Unique request identifier
- `autoConfigProperties: AutoConfigProperties` - Additional configuration properties

### AutoConfigProperties

Additional configuration properties for autoblock functionality.

**Fields:**
- `autoApprove: Boolean` - Whether to automatically approve reservations
- `organizationFieldLabel(locale: String): String` - Localized label for organization field
- `confirmationMessage(locale: String): String` - Localized confirmation message
- `guaranteeTypeId: Int` - Type of guarantee required
- `maxReservationsPerAttendeeTx: Int` - Maximum reservations per attendee transaction
- `showAdditionalReservationsLink: Boolean` - Whether to show additional reservations link
- `guaranteedBlocks: Boolean` - Whether blocks are guaranteed
- `rollupGuaranteedBlocks: Boolean` - Whether to rollup guaranteed blocks
- `bookingSitesCustomizable: Boolean` - Whether booking sites can be customized
- `requestIntroductionMessage(locale: String): String` - Localized introduction message
- `displayAvailableRoomNumber: Boolean` - Whether to display available room numbers

### SurveyConfigProperties

Configuration properties for survey functionality.

**Fields:**
- `blockRequestId: Int!` - Unique identifier for the block request
- `eventId: Int!` - Unique identifier for the event
- `hotelList: [HotelConfig]!` - List of hotel configurations
- `inventoryList: [Inventory]!` - List of inventory items

### HotelConfig

Configuration for individual hotels.

**Fields:**
- `hotelId: Int!` - Unique identifier for the hotel
- `displayInRequest: Boolean!` - Whether to display this hotel in requests
- `roomTypeList: [RoomTypeConfig]` - List of room type configurations
- `inventoryList: [Inventory]` - List of inventory items for this hotel

### RoomTypeConfig

Configuration for individual room types.

**Fields:**
- `roomTypeId: Int!` - Unique identifier for the room type
- `displayInRequest: Boolean!` - Whether to display this room type in requests
- `inventoryList: [Inventory]` - List of inventory items for this room type

### Inventory

Inventory information for specific dates.

**Fields:**
- `date: String!` - Date for the inventory (ISO 8601 format)
- `maxInventory: Int!` - Maximum inventory available for this date

## Error Handling

### Authentication Errors

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

### Authorization Errors

```json
{
  "errors": [
    {
      "message": "Insufficient permissions",
      "extensions": {
        "code": "FORBIDDEN"
      }
    }
  ]
}
```

### Validation Errors

```json
{
  "errors": [
    {
      "message": "Invalid input parameters",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "field": "eventId"
      }
    }
  ]
}
```

## Rate Limiting

- **Rate Limit**: 1000 requests per minute per authenticated user
- **Burst Limit**: 100 requests per 10 seconds
- **Headers**: Rate limit information is returned in response headers:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Caching

### Query-Level Caching

- `surveyConfigProperties`: Cached for 300 seconds (5 minutes)
- `AutoConfigProperties`: Cached for 300 seconds (5 minutes)
- `HotelConfig`: Cached for 300 seconds (5 minutes)
- `RoomTypeConfig`: Cached for 300 seconds (5 minutes)
- `Inventory`: Cached for 300 seconds (5 minutes)

### Cache Headers

Responses include cache control headers:
```http
Cache-Control: max-age=300, public
```

## Example Usage

### Complete Query Example

```graphql
query GetCompleteAutoblockData {
  blockRequestConfigProperties {
    requestName
    eventId
    startDate
    endDate
    participatingHotels
    autoConfigProperties {
      autoApprove
      organizationFieldLabel(locale: "en-US")
      guaranteedBlocks
    }
  }
  
  surveyConfigProperties {
    blockRequestId
    eventId
    hotelList {
      hotelId
      displayInRequest
      roomTypeList {
        roomTypeId
        displayInRequest
      }
    }
  }
}
```

### Using Variables

```graphql
query GetLocalizedConfig($locale: String!) {
  blockRequestConfigProperties {
    autoConfigProperties {
      organizationFieldLabel(locale: $locale)
      confirmationMessage(locale: $locale)
      requestIntroductionMessage(locale: $locale)
    }
  }
}
```

**Variables:**
```json
{
  "locale": "es-ES"
}
```

## GraphQL Introspection

The API supports GraphQL introspection for schema discovery:

```graphql
query IntrospectionQuery {
  __schema {
    types {
      name
      description
      fields {
        name
        type {
          name
        }
      }
    }
  }
}
```

## Status Codes

- **200 OK**: Successful GraphQL response (may contain errors in the errors array)
- **400 Bad Request**: Malformed GraphQL query
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
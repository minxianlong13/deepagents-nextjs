# Passkey Event Service API Reference

This document provides a comprehensive reference for all REST endpoints in the cvent-internal/passkey-event service.

## Base URL
All endpoints are prefixed with the service base path.

## Authentication
All endpoints require API Key authentication using the `apiKey` security scheme (HTTP API Key) or Bearer token authentication where specified.

---

## Event Resource (`/passkey-event/v1/events`)

### Event Management

#### Get Event by ID
- **Method**: `GET`
- **Path**: `/{eventId}`
- **Auth**: API Key, Bearer Token
- **Parameters**:
  - `eventId` (path): Event ID
  - `fetchedFields` (query): List of fields to fetch
  - `participantId` (query): Participant ID
  - `includeTemplateEvents` (query): Include template events (boolean)
- **Response**: Event object

#### Search Events
- **Method**: `GET`
- **Path**: `/`
- **Auth**: API Key, Bearer Token
- **Parameters**: Various query parameters for filtering
- **Response**: Array of Event objects

#### Get Event Basic Info
- **Method**: `GET`
- **Path**: `/basic-info/{eventId}`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Response**: Basic event information as string

#### Get Recently Viewed Events
- **Method**: `GET`
- **Path**: `/recently-viewed/{userId}`
- **Auth**: API Key
- **Parameters**:
  - `userId` (path): User ID
  - `includeBasic` (query): Include basic info (boolean)
- **Response**: Recently viewed events as string

### Event Summaries

#### Search Event Summaries
- **Method**: `GET`
- **Path**: `/summaries/{participantId}`
- **Auth**: API Key, Bearer Token
- **Parameters**:
  - `participantId` (path): Participant ID
  - `filter` (query): Filter expression
  - `limit` (query): Result limit (1-100, default 50)
  - `offset` (query): Result offset
- **Response**: EventSummariesSearchResponse

### Planner Operations

#### Get Event Planner Summary
- **Method**: `GET`
- **Path**: `/{eventId}/planner-summary`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Response**: Planner summary as string

#### Search Events by Planner
- **Method**: `POST`
- **Path**: `/planners/{plannerId}/search`
- **Auth**: API Key
- **Parameters**:
  - `plannerId` (path): Planner ID
  - `sortBy` (query): Sort field
  - `sortDirection` (query): Sort direction
- **Body**: PlannerEventSearchRequest
- **Response**: Array of Event objects

#### Get Event Owners by Planner
- **Method**: `GET`
- **Path**: `/planners/{plannerId}/event-owners`
- **Auth**: API Key
- **Parameters**: `plannerId` (path)
- **Response**: PlannerEventOwnerResponse

#### Check Planner Exclusion by Event Owners
- **Method**: `POST`
- **Path**: `/planners/{plannerId}/event-owners-excluded`
- **Auth**: API Key
- **Parameters**: `plannerId` (path)
- **Body**: List of excluded event owner participant IDs
- **Response**: PlannerExcludedByEventOwnerResponse

### WebInfo Management

#### Get Event WebInfo
- **Method**: `GET`
- **Path**: `/{eventId}/webinfo`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `fetchedFields` (query): List of WebInfo fields
- **Response**: Array of WebInfo objects

#### Search WebInfo
- **Method**: `GET`
- **Path**: `/webinfo`
- **Auth**: API Key
- **Parameters**:
  - `inventoryBlockId` (query): Inventory block ID
  - `fetchedFields` (query): List of WebInfo fields
- **Response**: Array of WebInfo objects

### Ecommerce Rules

#### Get Ecommerce Rules by Group Type
- **Method**: `GET`
- **Path**: `/ecommerce-rules/{attendeeGroupTypeId}`
- **Auth**: API Key
- **Parameters**: `attendeeGroupTypeId` (path)
- **Response**: EcommercePolicy object

#### Get Ecommerce Rules by Guarantee Plan Revision
- **Method**: `GET`
- **Path**: `/ecommerce-rules/revisions/{guaranteePlanRevisionId}`
- **Auth**: API Key
- **Parameters**: `guaranteePlanRevisionId` (path)
- **Response**: EcommercePolicy object

### Guarantee Types

#### Get Guarantee Types by Event
- **Method**: `GET`
- **Path**: `/{eventId}/guarantee-types`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Response**: Array of GuaranteePlan objects

#### Get Current Guarantee Plan
- **Method**: `GET`
- **Path**: `/attendee-group-types/{attendeeGroupTypeId}/guarantee-plan`
- **Auth**: API Key
- **Parameters**: `attendeeGroupTypeId` (path)
- **Response**: GuaranteePlan object

### Attendee Group Types

#### Get Attendee Group Types
- **Method**: `GET`
- **Path**: `/{eventId}/attendee-group-types`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `includeSbgId` (query): Include SBG ID (boolean)
- **Response**: Array of AttendeeGroupTypeFetchResponse objects

#### Create Attendee Group Type
- **Method**: `POST`
- **Path**: `/{eventId}/attendeeGroups`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `participantId` (query): Participant ID
  - `includeTemplateEvents` (query): Include template events
- **Body**: AttendeeGroupTypeRequest
- **Response**: AttendeeGroupTypeResponse (201 Created)

#### Get Attendee Group Type by ID
- **Method**: `GET`
- **Path**: `/attendee-group-types/{attendeeGroupTypeId}`
- **Auth**: API Key
- **Parameters**:
  - `attendeeGroupTypeId` (path): Group type ID
  - `fetchedFields` (query): List of fetched fields
- **Response**: AttendeeGroupTypeFetchResponse

#### Update Attendee Group Type
- **Method**: `PUT`
- **Path**: `/{eventId}/attendeeGroups/{attendeeGroupId}`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `attendeeGroupId` (path): Group ID
- **Body**: AttendeeGroupTypeRequest
- **Response**: AttendeeGroupTypeResponse

#### Delete Attendee Group Type
- **Method**: `DELETE`
- **Path**: `/attendee-group-types/{attendeeGroupTypeId}`
- **Auth**: API Key
- **Parameters**: `attendeeGroupTypeId` (path)
- **Response**: 204 No Content

#### Validate Group Code
- **Method**: `PUT`
- **Path**: `/attendee-group-types/{attendeeGroupTypeId}/valid-group-code`
- **Auth**: API Key
- **Parameters**: `attendeeGroupTypeId` (path)
- **Body**: ValidGroupCodeRequest
- **Response**: 204 No Content

### Hotel Operations

#### Get Hotel
- **Method**: `GET`
- **Path**: `/{eventId}/hotels/{hotelId}`
- **Auth**: API Key, Bearer Token
- **Parameters**:
  - `eventId` (path): Event ID
  - `hotelId` (path): Hotel ID
  - `locale` (query): Locale (default: EN_US)
- **Response**: Hotel object

#### Get Hotel Location
- **Method**: `GET`
- **Path**: `/{eventId}/hotels/{hotelId}/location`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `hotelId` (path): Hotel ID
- **Response**: HotelLocation object

### Merchant Account

#### Get Merchant Account
- **Method**: `GET`
- **Path**: `/merchant-account/{eventId}`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Response**: MerchantAccount object

### Consent Agreements

#### Get Consent Agreements
- **Method**: `GET`
- **Path**: `/{eventId}/consent-agreements`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Response**: ConsentAgreementsResponse

### User Profile

#### Update Event User Profile
- **Method**: `PUT`
- **Path**: `/profile`
- **Auth**: API Key
- **Body**: UserEventProfileV2
- **Response**: 200 OK

### Locations

#### Get Events Locations
- **Method**: `GET`
- **Path**: `/locations`
- **Auth**: API Key
- **Parameters**:
  - `plannerId` (query): Planner ID (required)
  - `fetchedFields` (query): List of location fields
- **Response**: Array of LocationSearchFilter objects

---

## Event Resource V2 (`/passkey-event/v2/events`)

### Event Search V2

#### Search Events V2
- **Method**: `GET`
- **Path**: `/`
- **Auth**: API Key
- **Parameters**: Various query parameters via BeanParam
- **Response**: Array of EventSearchResponseV2 objects

---

## Block Resource (`/passkey-event/v1/events`)

### Block Request Operations

#### Get Block Request Info
- **Method**: `GET`
- **Path**: `/blockrequest/{blockRequestId}`
- **Auth**: API Key
- **Parameters**: `blockRequestId` (path)
- **Response**: BlockRequestInfo object

#### Submit Public Block Request
- **Method**: `POST`
- **Path**: `/blockrequest`
- **Auth**: API Key
- **Parameters**: `blockRequestId` (query)
- **Body**: BlockRequestResp
- **Response**: Long (block ID)

### Block Management

#### Get Block Info
- **Method**: `GET`
- **Path**: `/blocks/{blockId}`
- **Auth**: API Key
- **Parameters**: `blockId` (path)
- **Response**: Block object

#### Search Blocks
- **Method**: `GET`
- **Path**: `/blocks`
- **Auth**: API Key
- **Parameters**: Various block search parameters
- **Response**: Array of Event objects

#### Get Block IDs
- **Method**: `GET`
- **Path**: `/{eventId}/block-ids`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `attendeeTypeId` (query): Attendee type ID (required)
  - `hotelId` (query): Hotel ID (required)
  - `fetchLimit` (query): Fetch limit
  - `sortBy` (query): Sort field
  - `sortOrder` (query): Sort order
- **Response**: Array of block IDs

---

## Admin Resource (`/passkey-event/v1/admin`)

### Cache Management

#### Clear WebInfo Cache
- **Method**: `DELETE`
- **Path**: `/cache/webinfo`
- **Auth**: API Key
- **Response**: 204 No Content

### User Profile Management

#### Set Event User Profile
- **Method**: `PUT`
- **Path**: `/events/{eventId}/users/{userId}/user-profile`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `userId` (path): User ID
- **Body**: UserEventProfile
- **Response**: UserEventProfile

### Event Block Code

#### Get Event Block Code
- **Method**: `GET`
- **Path**: `/event-block-code/{eventId}`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Response**: EventBlockCode object

### Reservation Details

#### Get Reservation Details
- **Method**: `GET`
- **Path**: `/res-details/{eventId}`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `resStatus` (query): Reservation status
  - `onlyActive` (query): Only active reservations (boolean)
- **Response**: Array of ReservationDetails objects

### Ecommerce Rules Management

#### Revise Guarantee Plan Ecommerce Policies
- **Method**: `POST`
- **Path**: `/ecommerce-rules/{guaranteePlanId}`
- **Auth**: API Key
- **Parameters**: `guaranteePlanId` (path)
- **Body**: EcommercePolicy
- **Response**: 200 OK

### Guarantee Plan Management

#### Create Guarantee Plan
- **Method**: `POST`
- **Path**: `/guarantee-plan`
- **Auth**: API Key
- **Body**: GuaranteePlanReq
- **Response**: GuaranteePlan (201 Created)

#### Update Guarantee Payment Types
- **Method**: `POST`
- **Path**: `/guarantee-payment-types`
- **Auth**: API Key
- **Body**: GuaranteePlan
- **Response**: 200 OK

### Block Management

#### Update Block Inventory Settings
- **Method**: `PUT`
- **Path**: `/blocks/{blockId}/inventory`
- **Auth**: API Key
- **Parameters**: `blockId` (path)
- **Body**: BlockInventory
- **Response**: 200 OK

#### Save Block
- **Method**: `PUT`
- **Path**: `/blocks`
- **Auth**: API Key
- **Parameters**: `useDefaults` (query): Use default values
- **Body**: Block
- **Response**: Long (block ID)

### WebInfo Management

#### Save WebInfo
- **Method**: `PUT`
- **Path**: `/webInfo`
- **Auth**: API Key
- **Parameters**: `useDefaults` (query): Use default values
- **Body**: WebInfo
- **Response**: 200 OK

### Credit Card Management

#### Revise Participant Card Types
- **Method**: `PUT`
- **Path**: `/accepted-credit-cards/{participantId}`
- **Auth**: API Key
- **Parameters**: `participantId` (path)
- **Body**: List of card type IDs
- **Response**: 200 OK

### Merchant Account Management

#### Assign Event Merchant Account
- **Method**: `POST`
- **Path**: `/merchant-account/{eventId}`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Body**: EventMerchantAccountRequest
- **Response**: 200 OK

#### Get Merchant Account by Participant
- **Method**: `GET`
- **Path**: `/merchant-account/{participantId}`
- **Auth**: API Key
- **Parameters**: `participantId` (path)
- **Response**: Array of MerchantAccount objects

### Consent Agreement Management

#### Update Consent Agreements
- **Method**: `PUT`
- **Path**: `/events/{participantId}/consent-agreements`
- **Auth**: API Key
- **Parameters**: `participantId` (path)
- **Body**: ConsentAgreementsRequest
- **Response**: ConsentAgreement object

### Children Settings

#### Update Child Settings
- **Method**: `PUT`
- **Path**: `/events/{eventId}/child-settings`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Body**: ChildrenSettings
- **Response**: Integer (rows affected)

### Guarantee Rules Management

#### Delete Event Guarantee Rules
- **Method**: `DELETE`
- **Path**: `/events/{eventId}/guarantee-plans/rules`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Response**: 204 No Content

### Event Status

#### Update Event Status
- **Method**: `POST`
- **Path**: `/events/{eventId}/event-status/{eventStatusId}`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `eventStatusId` (path): Event status ID
- **Response**: 200 OK

---

## Guarantee Rules Resource (`/passkey-event/v1/events/{eventId}/guarantee-plans`)

### Guarantee Rule Operations

#### Calculate Guarantee Rule
- **Method**: `POST`
- **Path**: `/`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Body**: CalculateGuaranteeRuleRequest
- **Response**: GuaranteePlan object

#### Get Event Rules
- **Method**: `GET`
- **Path**: `/rules`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Response**: GetEventRulesResponse

#### Create Guarantee Rule
- **Method**: `POST`
- **Path**: `/rules`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Body**: GuaranteeRule
- **Response**: CreateGuaranteeRuleResponse

#### Edit Guarantee Rule
- **Method**: `PUT`
- **Path**: `/rules/{ruleId}`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `ruleId` (path): Rule ID
- **Body**: GuaranteeRule
- **Response**: EditGuaranteeRuleResponse

#### Delete Guarantee Rule
- **Method**: `DELETE`
- **Path**: `/rules/{ruleId}`
- **Auth**: API Key
- **Parameters**:
  - `eventId` (path): Event ID
  - `ruleId` (path): Rule ID
- **Response**: 204 No Content

### Guarantee Rule Settings

#### Save Guarantee Rule Settings
- **Method**: `PUT`
- **Path**: `/rules/settings`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Body**: GuaranteeRuleSettingsRequest
- **Response**: GuaranteeRuleSettingsResponse

#### Get Guarantee Rule Settings
- **Method**: `GET`
- **Path**: `/rules/settings`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Response**: GuaranteeRuleSettingsResponse

---

## Accepted Credit Cards Resource (`/passkey-event/v1/accepted-credit-cards`)

### Credit Card Operations

#### Get Accepted Credit Cards
- **Method**: `GET`
- **Path**: `/`
- **Auth**: API Key
- **Parameters**: `participantId` (query): List of participant IDs
- **Response**: Array of CreditCardType objects

---

## Callbacks Resource (`/passkey-event/v1/events`)

### Callback Operations

#### Get Callbacks
- **Method**: `GET`
- **Path**: `/{eventId}/callbacks`
- **Auth**: API Key
- **Parameters**: `eventId` (path)
- **Response**: Array of CallbackConfig objects

---

## Additional Resources

The service also includes the following smaller resources that were identified but not fully detailed:

- **EventQueueResource**: Event queue operations
- **ImagesResource**: Image URL management
- **MessagesResource**: Message handling
- **OpenApiResource**: OpenAPI documentation
- **PermissionDetailsResource**: Permission management
- **ReservationProcessingResource**: Reservation processing

---

## Common Response Codes

- **200**: Successful operation
- **201**: Resource created successfully
- **204**: Successful operation with no content
- **400**: Bad request - invalid parameters
- **401**: Unauthorized - invalid authentication
- **404**: Resource not found
- **500**: Internal server error

## Security

All endpoints require authentication via:
- **API Key**: HTTP API Key authentication
- **Bearer Token**: HTTP Bearer token authentication (where specified)

## Content Types

- **Request Content-Type**: `application/json`
- **Response Content-Type**: `application/json`

---

*This API reference was generated by analyzing the JAX-RS annotated resource classes in the passkey-event service codebase.*
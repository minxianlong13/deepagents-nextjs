# API Reference

## Base URL

**Development**: `http://localhost:7000`
**Production**: `https://passkey-vendor-mock-service.cvent.net`

## Authentication

Most endpoints simulate vendor authentication requirements:
- **OAuth2**: Amadeus, Disney endpoints
- **Basic Auth**: Various vendor systems
- **API Key**: Some vendor-specific endpoints

## Endpoints

### Health & Monitoring

#### GET /health
**Description**: Service health check endpoint

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 200: Service is healthy
- 503: Service is unhealthy

---

### Amadeus CRS

#### POST /v1/amadeus/oauth/token
**Description**: OAuth2 token endpoint for Amadeus authentication

**Request Headers**:
- `Content-Type: application/x-www-form-urlencoded`

**Request Body**:
```
grant_type=client_credentials&client_id={client_id}&client_secret={client_secret}
```

**Response**:
```json
{
  "access_token": "mock_access_token_12345",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Status Codes**:
- 200: Token generated successfully
- 400: Invalid request parameters
- 401: Invalid credentials

#### POST /v1/amadeus/async/ota
**Description**: Asynchronous OTA message processing for Amadeus

**Query Parameters**:
- `vendorSystemId` (required) - Vendor system identifier

**Request Headers**:
- `Content-Type: application/xml`
- `Authorization: Bearer {access_token}`

**Request Body**:
```xml
<OTA_HotelResRQ>
  <POS>
    <Source>
      <RequestorID ID="CVENT"/>
    </Source>
  </POS>
  <HotelReservations>
    <HotelReservation>
      <ResGuests>
        <ResGuest>
          <Profiles>
            <ProfileInfo>
              <Profile>
                <Customer>
                  <PersonName>
                    <GivenName>RESPONSE success</GivenName>
                    <Surname>TestGuest</Surname>
                  </PersonName>
                </Customer>
              </Profile>
            </ProfileInfo>
          </Profiles>
        </ResGuest>
      </ResGuests>
    </HotelReservation>
  </HotelReservations>
</OTA_HotelResRQ>
```

**Response**:
```xml
<OTA_HotelResRS>
  <Success/>
  <HotelReservations>
    <HotelReservation>
      <UniqueID Type="14" ID="MOCK123456"/>
    </HotelReservation>
  </HotelReservations>
</OTA_HotelResRS>
```

**Status Codes**:
- 202: Request accepted for processing
- 400: Invalid XML or parameters
- 401: Authentication required

---

### Hilton Systems

#### POST /v1/sync/hilton
**Description**: Synchronous Hilton reservation transfer

**Request Headers**:
- `Content-Type: application/xml`

**Request Body**:
```xml
<HiltonReservation>
  <Guest>
    <FirstName>RESPONSE success</FirstName>
    <LastName>TestGuest</LastName>
  </Guest>
  <Reservation>
    <ConfirmationNumber>HIL123456</ConfirmationNumber>
  </Reservation>
</HiltonReservation>
```

**Response**:
```xml
<HiltonResponse>
  <Status>Success</Status>
  <ConfirmationNumber>HIL123456</ConfirmationNumber>
  <Message>Reservation processed successfully</Message>
</HiltonResponse>
```

#### POST /v1/hilton/v2/dcres
**Description**: Create Hilton DC reservation

**Request Headers**:
- `Content-Type: application/json`

**Request Body**:
```json
{
  "guestName": "RESPONSE success",
  "checkIn": "2024-02-01",
  "checkOut": "2024-02-03",
  "roomType": "KING"
}
```

**Response**:
```json
{
  "confirmationNumber": "DC123456",
  "gnrNumber": "GNR789",
  "status": "confirmed"
}
```

#### PUT /v1/hilton/v2/dcres/{confNumber}/gnr/{gnrNumber}
**Description**: Update Hilton DC reservation

**Path Parameters**:
- `confNumber` - Confirmation number
- `gnrNumber` - GNR number

**Request Body**: Same as create request

**Response**: Same as create response

#### POST /v1/hilton/v2/dcres/{confNumber}/gnr/{gnrNumber}/cancel
**Description**: Cancel Hilton DC reservation

**Path Parameters**:
- `confNumber` - Confirmation number
- `gnrNumber` - GNR number

**Response**:
```json
{
  "status": "cancelled",
  "cancellationNumber": "CXL123456"
}
```

---

### Opera OHIP

#### GET /v1/fof/config/v1/creditCardInfo
**Description**: Get credit card information

**Query Parameters**:
- `cardId` (required) - Credit card identifier

**Response**:
```json
{
  "cardId": "12345",
  "cardType": "VISA",
  "lastFour": "1234",
  "expiryDate": "12/25"
}
```

#### GET /v1/blk/v1/hotels/{hotelCode}/blocks/{blockCode}
**Description**: Get hotel block information with special instruction support

**Path Parameters**:
- `hotelCode` - Hotel identifier
- `blockCode` - Block code (supports special instructions)

**Block Code Instructions**:
The block code can include special instructions using format `code~value` separated by `!`:

| Code | Description | Example |
|------|-------------|---------|
| BC | Bundle Code | `12345!BC~BNDL34` |
| BIC | Base inventory count | `12345!BIC~25` |
| BR | Base Rate | `12345!BR~123.45` |
| CDD | Cutoff date difference | `12345!CDD~10` |
| INI | Increment nightly inventory | `12345!INI~5` |
| IT | Inventory Type (BLOCK/CONTRACT) | `12345!IT~BLOCK` |

**Response**:
```json
{
  "blockCode": "12345",
  "hotelCode": "HOTEL001",
  "startDate": "2024-02-01",
  "endDate": "2024-02-05",
  "cutoffDate": "2024-01-18",
  "inventoryType": "BLOCK",
  "rooms": [
    {
      "roomType": "KING",
      "rate": 123.45,
      "inventory": 25
    }
  ]
}
```

#### GET /v1/rsv/v1/hotels/{hotelId}/reservations/{reservationId}
**Description**: Get reservation with special instruction support

**Path Parameters**:
- `hotelId` - Hotel identifier
- `reservationId` - Reservation ID (supports special instructions)

**Reservation ID Instructions**:
| Code | Description | Example |
|------|-------------|---------|
| AD | Arrival Date (required) | `12345!AD~2` |
| AC | Adults count | `12345!AC~3` |
| BC | Block Code | `12345!BC~TSTBLC` |
| GC | Guarantee Code | `12345!GC~OP` |
| RS | Reservation Status | `12345!RS~Cancelled` |
| RTC | Room Type Code | `12345!RTC~STA` |
| SD | Stay duration | `12345!SD~1` |

**Response**:
```json
{
  "reservationId": "12345",
  "status": "Reserved",
  "guestName": "Test Guest",
  "arrivalDate": "2024-02-01",
  "departureDate": "2024-02-03",
  "adults": 2,
  "roomType": "KING",
  "guaranteeCode": "CC",
  "blockCode": "TSTBLC"
}
```

---

### DerbySoft

#### POST /v1/derbysoft/group/book
**Description**: Book group reservation

**Request Headers**:
- `Content-Type: application/xml`

**Request Body**:
```xml
<GroupBookingRequest>
  <GroupName>RESPONSE success</GroupName>
  <HotelCode>HOTEL001</HotelCode>
  <CheckIn>2024-02-01</CheckIn>
  <CheckOut>2024-02-03</CheckOut>
  <Rooms>10</Rooms>
</GroupBookingRequest>
```

**Response**:
```xml
<GroupBookingResponse>
  <Status>Success</Status>
  <GroupId>GRP123456</GroupId>
  <ConfirmationNumber>CONF789</ConfirmationNumber>
</GroupBookingResponse>
```

#### POST /v1/derbysoft/individual/book
**Description**: Book individual reservation

**Request Body**:
```xml
<IndividualBookingRequest>
  <GuestName>RESPONSE success</GuestName>
  <HotelCode>HOTEL001</HotelCode>
  <CheckIn>2024-02-01</CheckIn>
  <CheckOut>2024-02-03</CheckOut>
</IndividualBookingRequest>
```

**Response**:
```xml
<IndividualBookingResponse>
  <Status>Success</Status>
  <ReservationId>RES123456</ReservationId>
</IndividualBookingResponse>
```

---

### Async Operations

#### POST /v1/async/{vendor}
**Description**: Generic asynchronous vendor operations

**Path Parameters**:
- `vendor` - Vendor system (agilysys, opera, maestro, smshtng)

**Query Parameters**:
- `partnerId` - Partner identifier
- `vendorSystemId` - Vendor system identifier
- `mode` - Operation mode (optional)

**Request Headers**:
- `Content-Type: application/xml`

**Request Body**:
```xml
<ReservationRequest>
  <Guest>
    <FirstName>RESPONSE delayResult=5</FirstName>
    <LastName>TestGuest</LastName>
  </Guest>
</ReservationRequest>
```

**Response**:
```json
{
  "status": "accepted",
  "requestId": "REQ123456",
  "message": "Request queued for processing"
}
```

**Status Codes**:
- 202: Request accepted for async processing
- 400: Invalid request parameters

---

### Sync Operations

#### POST /v1/sync/{vendor}
**Description**: Generic synchronous vendor operations

**Path Parameters**:
- `vendor` - Vendor system (marriott, ihg, synxis, traveltripper, v1htng, hms, lms, disney)

**Request Headers**:
- `Content-Type: application/xml`

**Request Body**:
```xml
<ReservationRequest>
  <Guest>
    <FirstName>RESPONSE success</FirstName>
    <LastName>TestGuest</LastName>
  </Guest>
</ReservationRequest>
```

**Response**:
```xml
<ReservationResponse>
  <Status>Success</Status>
  <ConfirmationNumber>CONF123456</ConfirmationNumber>
</ReservationResponse>
```

---

### Callback Messages

#### POST /v1/messages/callbacks/{eventId}
**Description**: Store callback parameters for testing

**Path Parameters**:
- `eventId` - Event identifier

**Query Parameters** (all optional):
- `eventID` - Event ID
- `guestURL` - Guest URL
- `lastName` - Guest last name
- `resAckNum` - Reservation acknowledgment number
- `bridgeID` - Bridge identifier
- `bridgeMode` - Bridge mode
- `masterResAckNum` - Master reservation acknowledgment number
- `hotelConfNumber` - Hotel confirmation number
- `ResContactPhone` - Contact phone
- `resStatus` - Reservation status
- `extAckNumber` - External acknowledgment number

**Response**:
```json
{
  "status": "stored",
  "eventId": "EVENT123",
  "parametersCount": 5
}
```

#### GET /v1/messages/callbacks/{eventId}
**Description**: Retrieve stored callback parameters

**Path Parameters**:
- `eventId` - Event identifier

**Response**:
```json
{
  "eventId": "EVENT123",
  "parameters": {
    "eventID": "EVENT123",
    "guestURL": "https://example.com/guest",
    "lastName": "TestGuest",
    "resAckNum": "RES123456",
    "bridgeID": "BRIDGE001"
  }
}
```

---

### Choice Hotels

#### GET /v1/choice/getHotelContent
**Description**: Get hotel content information

**Response**:
```json
{
  "hotels": [
    {
      "hotelCode": "CHOICE001",
      "hotelName": "Choice Hotel Test",
      "address": "123 Test Street",
      "city": "Test City",
      "state": "TS",
      "country": "US"
    }
  ]
}
```

---

### IcePortal

#### POST /v1/iceportal/service
**Description**: IcePortal service endpoint

**Request Headers**:
- `Content-Type: application/xml`

**Request Body**:
```xml
<IcePortalRequest>
  <ServiceType>RESPONSE success</ServiceType>
  <Data>Test data</Data>
</IcePortalRequest>
```

**Response**:
```xml
<IcePortalResponse>
  <Status>Success</Status>
  <Result>Service processed successfully</Result>
</IcePortalResponse>
```

## Magic Keywords

All endpoints support magic keywords in request payloads to control response behavior:

### Success Responses
- `RESPONSE success` - Returns successful response

### Error Responses
- `RESPONSE error` - Returns error with reason
- `RESPONSE serverError` - Returns 500 status
- `RESPONSE clientError` - Returns 400 status
- `RESPONSE authError` - Returns 401 status
- `RESPONSE 200error` - Returns error with 200 status
- `RESPONSE 200badXmlChars` - Returns malformed XML with 200 status

### Special Behaviors
- `RESPONSE succeedOnRetry` - Fails first call, succeeds on retry
- `RESPONSE noResult` - No result message (async only)
- `RESPONSE delayResult` - Default delay
- `RESPONSE delayResult=n` - Delay by n seconds

## Error Responses

### Standard Error Format
```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/v1/sync/marriott"
}
```

### Common Error Codes
- `INVALID_REQUEST` - Malformed request
- `AUTHENTICATION_FAILED` - Invalid credentials
- `VENDOR_ERROR` - Simulated vendor system error
- `TIMEOUT` - Request timeout
- `RATE_LIMITED` - Too many requests

## Rate Limiting

No rate limiting is implemented as this is a testing service. However, delay simulation can be used to test timeout scenarios.

## Versioning

API versioning is handled through URL paths:
- `/v1/` - Version 1 (current)
- `/v2/` - Version 2 (Hilton DC endpoints)

## Content Types

### Supported Request Types
- `application/xml` - Most vendor endpoints
- `application/json` - Modern endpoints (Hilton DC, callbacks)
- `application/x-www-form-urlencoded` - OAuth2 endpoints

### Response Types
- `application/xml` - Traditional vendor responses
- `application/json` - Modern API responses
- `text/plain` - Simple status responses
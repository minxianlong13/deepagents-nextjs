# API Reference

## Base URL

The Passkey Autoblock UI applications communicate with backend services through GraphQL APIs:

- **Production**: `https://api.passkey.com/graphql`
- **Staging**: `https://api-staging.passkey.com/graphql`
- **Development**: `https://api-dev.passkey.com/graphql`

## GraphQL Schema Overview

The applications use Apollo Client to interact with GraphQL APIs for:
- Hotel search and information
- Room availability and pricing
- Booking and reservation management
- Site configuration and content management

## Core GraphQL Operations

### Hotel Operations

#### Query: searchHotels
**Description**: Search for hotels based on location, dates, and criteria

**Variables**:
```graphql
{
  searchCriteria: {
    location: String!
    checkIn: Date!
    checkOut: Date!
    roomCount: Int
    guestCount: Int
  }
  filters: {
    amenities: [String]
    priceRange: PriceRangeInput
    starRating: [Int]
  }
}
```

**Response**:
```graphql
{
  hotels: [Hotel!]! {
    id: ID!
    name: String!
    address: Address!
    starRating: Int
    amenities: [Amenity!]!
    images: [Image!]!
    location: GeoLocation!
    pricing: PricingInfo!
  }
}
```

#### Query: getHotelDetails
**Description**: Get detailed information for a specific hotel

**Variables**:
```graphql
{
  hotelId: ID!
  checkIn: Date!
  checkOut: Date!
}
```

**Response**:
```graphql
{
  hotel: Hotel! {
    id: ID!
    name: String!
    description: String
    address: Address!
    contactInfo: ContactInfo!
    amenities: [Amenity!]!
    rooms: [Room!]!
    policies: [Policy!]!
    images: [Image!]!
    location: GeoLocation!
  }
}
```

### Room Operations

#### Query: getRoomAvailability
**Description**: Get available rooms for specific dates and hotel

**Variables**:
```graphql
{
  hotelId: ID!
  checkIn: Date!
  checkOut: Date!
  roomCount: Int!
  guestCount: Int!
}
```

**Response**:
```graphql
{
  rooms: [Room!]! {
    id: ID!
    name: String!
    description: String
    capacity: Int!
    amenities: [Amenity!]!
    images: [Image!]!
    pricing: RoomPricing! {
      baseRate: Money!
      totalRate: Money!
      taxes: Money!
      fees: [Fee!]!
    }
    availability: Availability! {
      available: Boolean!
      remainingRooms: Int
    }
  }
}
```

#### Mutation: selectRooms
**Description**: Select rooms for booking

**Variables**:
```graphql
{
  selections: [RoomSelection!]! {
    roomId: ID!
    quantity: Int!
    guestInfo: GuestInfoInput
  }
}
```

**Response**:
```graphql
{
  booking: Booking! {
    id: ID!
    status: BookingStatus!
    rooms: [SelectedRoom!]!
    totalCost: Money!
    expiresAt: DateTime!
  }
}
```

### Booking Operations

#### Mutation: createBooking
**Description**: Create a new hotel room booking

**Variables**:
```graphql
{
  bookingInput: BookingInput! {
    hotelId: ID!
    rooms: [RoomSelection!]!
    guestInfo: GuestInfoInput! {
      firstName: String!
      lastName: String!
      email: String!
      phone: String
    }
    checkIn: Date!
    checkOut: Date!
    specialRequests: String
  }
}
```

**Response**:
```graphql
{
  booking: Booking! {
    id: ID!
    confirmationNumber: String!
    status: BookingStatus!
    hotel: Hotel!
    rooms: [BookedRoom!]!
    guest: GuestInfo!
    dates: DateRange!
    totalCost: Money!
    createdAt: DateTime!
  }
}
```

#### Query: getBookingStatus
**Description**: Get current status of a booking

**Variables**:
```graphql
{
  bookingId: ID!
}
```

**Response**:
```graphql
{
  booking: Booking! {
    id: ID!
    status: BookingStatus!
    confirmationNumber: String
    hotel: Hotel!
    rooms: [BookedRoom!]!
    totalCost: Money!
    lastUpdated: DateTime!
  }
}
```

### Site Configuration Operations (Site Editor)

#### Query: getSiteConfiguration
**Description**: Get configuration for an autoblock site

**Variables**:
```graphql
{
  siteId: ID!
}
```

**Response**:
```graphql
{
  site: Site! {
    id: ID!
    name: String!
    configuration: SiteConfiguration! {
      theme: ThemeConfiguration!
      widgets: [WidgetConfiguration!]!
      content: ContentConfiguration!
      settings: SiteSettings!
    }
  }
}
```

#### Mutation: updateSiteConfiguration
**Description**: Update site configuration

**Variables**:
```graphql
{
  siteId: ID!
  configuration: SiteConfigurationInput! {
    theme: ThemeConfigurationInput
    widgets: [WidgetConfigurationInput!]
    content: ContentConfigurationInput
    settings: SiteSettingsInput
  }
}
```

**Response**:
```graphql
{
  site: Site! {
    id: ID!
    configuration: SiteConfiguration!
    lastUpdated: DateTime!
  }
}
```

## Widget-Specific APIs

### HotelBanner Widget
**GraphQL Fragment**:
```graphql
fragment HotelBannerData on Hotel {
  id
  name
  starRating
  images {
    url
    alt
    type
  }
  address {
    street
    city
    state
    country
    postalCode
  }
}
```

### HotelList Widget
**GraphQL Fragment**:
```graphql
fragment HotelListData on Hotel {
  id
  name
  starRating
  images {
    url
    alt
  }
  amenities {
    id
    name
    icon
  }
  pricing {
    startingRate {
      amount
      currency
    }
  }
  location {
    latitude
    longitude
  }
}
```

### RoomList Widget
**GraphQL Fragment**:
```graphql
fragment RoomListData on Room {
  id
  name
  description
  capacity
  images {
    url
    alt
  }
  amenities {
    id
    name
    icon
  }
  pricing {
    baseRate {
      amount
      currency
    }
    totalRate {
      amount
      currency
    }
  }
  availability {
    available
    remainingRooms
  }
}
```

## Error Handling

### GraphQL Error Format
```json
{
  "errors": [
    {
      "message": "Hotel not found",
      "locations": [{"line": 2, "column": 3}],
      "path": ["hotel"],
      "extensions": {
        "code": "HOTEL_NOT_FOUND",
        "hotelId": "12345"
      }
    }
  ],
  "data": null
}
```

### Common Error Codes
- `HOTEL_NOT_FOUND` - Requested hotel does not exist
- `ROOM_UNAVAILABLE` - Selected room is no longer available
- `BOOKING_EXPIRED` - Booking session has expired
- `INVALID_DATES` - Check-in/check-out dates are invalid
- `PAYMENT_FAILED` - Payment processing failed
- `VALIDATION_ERROR` - Input validation failed

## Authentication

### Headers Required
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-Cvent-Client-Id: passkey-autoblock-ui
```

### Token Refresh
Tokens are automatically refreshed by the Apollo Client authentication link.

## Rate Limiting

- **Search Operations**: 100 requests per minute per user
- **Booking Operations**: 10 requests per minute per user
- **Configuration Operations**: 50 requests per minute per user

## Caching Strategy

### Apollo Client Cache
- **Hotel data**: Cached for 5 minutes
- **Room availability**: Cached for 1 minute
- **Site configuration**: Cached for 30 minutes
- **User preferences**: Cached indefinitely with manual invalidation

### Cache Keys
```javascript
// Hotel cache key
`Hotel:${hotelId}`

// Room availability cache key
`RoomAvailability:${hotelId}:${checkIn}:${checkOut}`

// Site configuration cache key
`SiteConfiguration:${siteId}`
```

## WebSocket Subscriptions

### Real-time Room Availability
```graphql
subscription roomAvailabilityUpdates($hotelId: ID!) {
  roomAvailabilityUpdated(hotelId: $hotelId) {
    roomId: ID!
    available: Boolean!
    remainingRooms: Int
    pricing: RoomPricing!
  }
}
```

### Booking Status Updates
```graphql
subscription bookingStatusUpdates($bookingId: ID!) {
  bookingStatusUpdated(bookingId: $bookingId) {
    id: ID!
    status: BookingStatus!
    lastUpdated: DateTime!
  }
}
```
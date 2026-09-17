# API Reference

## Base URL
- **Development**: `http://localhost:3000/api/graphql`
- **Production**: `https://passkey-call-center.core.cvent.org/api/graphql`

## GraphQL Endpoint

### POST /api/graphql
**Description**: Main GraphQL endpoint for all queries and mutations

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (required for authenticated operations)

**Request Body**:
```json
{
  "query": "query or mutation string",
  "variables": {
    "key": "value"
  },
  "operationName": "optional operation name"
}
```

## Core Operations

### Queries

#### searchAvailability
**Description**: Search for available rooms based on criteria

**Query**:
```graphql
query SearchAvailability($input: AvailabilitySearchInput!) {
  searchAvailability(input: $input) {
    results {
      hotelId
      hotelName
      roomTypes {
        id
        name
        description
        capacity
        amenities
        rates {
          date
          amount
          currency
        }
      }
      availability {
        date
        available
        remaining
      }
    }
    totalCount
    hasMore
  }
}
```

**Variables**:
```json
{
  "input": {
    "checkInDate": "2024-03-15",
    "checkOutDate": "2024-03-17",
    "location": {
      "city": "New York",
      "state": "NY",
      "country": "US"
    },
    "guests": 2,
    "rooms": 1
  }
}
```

**Response**:
```json
{
  "data": {
    "searchAvailability": {
      "results": [
        {
          "hotelId": "hotel_123",
          "hotelName": "Grand Hotel NYC",
          "roomTypes": [
            {
              "id": "room_456",
              "name": "Deluxe King",
              "description": "Spacious room with king bed",
              "capacity": 2,
              "amenities": ["WiFi", "TV", "Mini Bar"],
              "rates": [
                {
                  "date": "2024-03-15",
                  "amount": 299.99,
                  "currency": "USD"
                }
              ]
            }
          ],
          "availability": [
            {
              "date": "2024-03-15",
              "available": true,
              "remaining": 5
            }
          ]
        }
      ],
      "totalCount": 1,
      "hasMore": false
    }
  }
}
```

#### getReservation
**Description**: Retrieve details of a specific reservation

**Query**:
```graphql
query GetReservation($reservationId: ID!) {
  getReservation(id: $reservationId) {
    id
    confirmationNumber
    status
    guest {
      firstName
      lastName
      email
      phone
    }
    hotel {
      id
      name
      address
    }
    room {
      type
      number
      rate
    }
    dates {
      checkIn
      checkOut
      nights
    }
    totalAmount
    currency
    createdAt
    updatedAt
  }
}
```

### Mutations

#### createReservation
**Description**: Create a new hotel reservation

**Mutation**:
```graphql
mutation CreateReservation($input: CreateReservationInput!) {
  createReservation(input: $input) {
    reservation {
      id
      confirmationNumber
      status
    }
    success
    errors {
      field
      message
      code
    }
  }
}
```

**Variables**:
```json
{
  "input": {
    "hotelId": "hotel_123",
    "roomTypeId": "room_456",
    "checkInDate": "2024-03-15",
    "checkOutDate": "2024-03-17",
    "guest": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-123-4567"
    },
    "specialRequests": "Late check-in requested",
    "paymentMethod": {
      "type": "CREDIT_CARD",
      "cardNumber": "****-****-****-1234",
      "expiryDate": "12/25"
    }
  }
}
```

**Response**:
```json
{
  "data": {
    "createReservation": {
      "reservation": {
        "id": "res_789",
        "confirmationNumber": "CNF123456",
        "status": "ACTIVE"
      },
      "success": true,
      "errors": []
    }
  }
}
```

#### updateReservation
**Description**: Update an existing reservation

**Mutation**:
```graphql
mutation UpdateReservation($id: ID!, $input: UpdateReservationInput!) {
  updateReservation(id: $id, input: $input) {
    reservation {
      id
      status
      updatedAt
    }
    success
    errors {
      field
      message
      code
    }
  }
}
```

#### cancelReservation
**Description**: Cancel a reservation

**Mutation**:
```graphql
mutation CancelReservation($id: ID!, $reason: String) {
  cancelReservation(id: $id, reason: $reason) {
    reservation {
      id
      status
      cancelledAt
    }
    success
    errors {
      field
      message
      code
    }
  }
}
```

## REST Endpoints

### Health Check Endpoints

#### GET /api/ok
**Description**: Basic health check endpoint

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- 200: Service is healthy
- 500: Service is unhealthy

#### GET /api/log
**Description**: Logging endpoint for client-side errors

**Query Parameters**:
- `level` - Log level (error, warn, info, debug)
- `message` - Log message
- `context` - Additional context data

#### GET /api/loglevel
**Description**: Get or set current log level

**Response**:
```json
{
  "level": "info"
}
```

## Error Handling

### GraphQL Errors
GraphQL errors follow the standard format:

```json
{
  "errors": [
    {
      "message": "Reservation not found",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["getReservation"],
      "extensions": {
        "code": "NOT_FOUND",
        "field": "reservationId"
      }
    }
  ],
  "data": null
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Requested resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes
- 200: Success (GraphQL always returns 200, check errors array)
- 400: Bad Request (malformed GraphQL query)
- 401: Unauthorized (missing or invalid authentication)
- 403: Forbidden (insufficient permissions)
- 429: Too Many Requests (rate limiting)
- 500: Internal Server Error

## Authentication

### Bearer Token Authentication
All authenticated operations require a valid JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Validation
Tokens are validated against Cvent's auth service. Invalid or expired tokens will result in a 401 Unauthorized response.

## Rate Limiting

- **Default Limit**: 1000 requests per hour per user
- **Burst Limit**: 100 requests per minute
- **Headers**: Rate limit information is returned in response headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when rate limit resets

## Pagination

Large result sets use cursor-based pagination:

```graphql
query SearchResults($first: Int, $after: String) {
  searchResults(first: $first, after: $after) {
    edges {
      node {
        id
        # ... other fields
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

## Subscriptions

Real-time updates are available through GraphQL subscriptions:

```graphql
subscription ReservationUpdates($reservationId: ID!) {
  reservationUpdated(id: $reservationId) {
    id
    status
    updatedAt
  }
}
```

## Schema Introspection

The GraphQL schema supports introspection queries for development:

```graphql
query IntrospectionQuery {
  __schema {
    types {
      name
      description
    }
  }
}
```

Note: Introspection is disabled in production environments for security.
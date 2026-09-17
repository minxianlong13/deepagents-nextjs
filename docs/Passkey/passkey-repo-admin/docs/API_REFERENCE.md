# API Reference

## Base URL

The application communicates with backend services through GraphQL endpoints. The GraphQL endpoint is configured through environment variables and varies by environment:

- **Development**: Configured via `.env.development`
- **Production**: Configured through deployment environment variables

## GraphQL Integration

### Apollo Client Configuration

The application uses Apollo Client for GraphQL operations with the following features:

- **Caching**: Intelligent caching with automatic cache updates
- **Error Handling**: Centralized error handling and retry logic
- **Subscriptions**: Real-time updates via GraphQL subscriptions
- **Optimistic Updates**: Immediate UI updates for better user experience

### Authentication

All GraphQL requests include authentication headers:

```typescript
headers: {
  'Authorization': 'Bearer <session-token>',
  'Content-Type': 'application/json'
}
```

## Core GraphQL Operations

### SSO Identity Provider Management

#### Query: Get IDP Configuration
```graphql
query GetIdpConfiguration($id: ID!) {
  idpConfiguration(id: $id) {
    id
    name
    type
    status
    configuration {
      entityId
      ssoUrl
      certificate
      attributeMapping {
        email
        firstName
        lastName
        groups
      }
    }
    createdAt
    updatedAt
  }
}
```

**Variables**:
- `id`: String - The unique identifier for the IDP configuration

**Response**:
```json
{
  "data": {
    "idpConfiguration": {
      "id": "idp-123",
      "name": "Corporate SAML IDP",
      "type": "SAML",
      "status": "ACTIVE",
      "configuration": {
        "entityId": "https://company.com/saml",
        "ssoUrl": "https://company.com/sso",
        "certificate": "-----BEGIN CERTIFICATE-----...",
        "attributeMapping": {
          "email": "email",
          "firstName": "givenName",
          "lastName": "surname",
          "groups": "memberOf"
        }
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    }
  }
}
```

#### Mutation: Create IDP Configuration
```graphql
mutation CreateIdpConfiguration($input: CreateIdpConfigurationInput!) {
  createIdpConfiguration(input: $input) {
    id
    name
    type
    status
    configuration {
      entityId
      ssoUrl
      certificate
    }
  }
}
```

**Input Variables**:
```json
{
  "input": {
    "name": "New Corporate IDP",
    "type": "SAML",
    "configuration": {
      "entityId": "https://newcompany.com/saml",
      "ssoUrl": "https://newcompany.com/sso",
      "certificate": "-----BEGIN CERTIFICATE-----..."
    }
  }
}
```

#### Mutation: Update IDP Configuration
```graphql
mutation UpdateIdpConfiguration($id: ID!, $input: UpdateIdpConfigurationInput!) {
  updateIdpConfiguration(id: $id, input: $input) {
    id
    name
    status
    configuration {
      entityId
      ssoUrl
      attributeMapping {
        email
        firstName
        lastName
      }
    }
  }
}
```

#### Mutation: Delete IDP Configuration
```graphql
mutation DeleteIdpConfiguration($id: ID!) {
  deleteIdpConfiguration(id: $id) {
    success
    message
  }
}
```

### User Management

#### Query: List Users
```graphql
query ListUsers($filter: UserFilter, $pagination: PaginationInput) {
  users(filter: $filter, pagination: $pagination) {
    nodes {
      id
      email
      firstName
      lastName
      status
      roles
      lastLoginAt
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

#### Query: Get User Details
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
    firstName
    lastName
    status
    roles
    permissions
    idpAssignments {
      idpId
      idpName
      assignedAt
    }
    createdAt
    lastLoginAt
  }
}
```

### Audit Logging

#### Query: Get Audit Logs
```graphql
query GetAuditLogs($filter: AuditLogFilter, $pagination: PaginationInput) {
  auditLogs(filter: $filter, pagination: $pagination) {
    nodes {
      id
      action
      resource
      resourceId
      userId
      userEmail
      timestamp
      details
      ipAddress
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}
```

## REST API Endpoints

### Health Check
```
GET /api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T15:30:00Z",
  "version": "2.15.1"
}
```

### Authentication Status
```
GET /api/auth/status
```

**Response**:
```json
{
  "authenticated": true,
  "user": {
    "id": "user-123",
    "email": "admin@company.com",
    "roles": ["admin"]
  },
  "session": {
    "expiresAt": "2024-01-20T18:30:00Z"
  }
}
```

### Logout
```
POST /api/auth/logout
```

**Response**:
```json
{
  "success": true,
  "redirectUrl": "/login"
}
```

## Error Handling

### GraphQL Errors

GraphQL errors follow a standard format:

```json
{
  "errors": [
    {
      "message": "IDP configuration not found",
      "extensions": {
        "code": "NOT_FOUND",
        "field": "id"
      },
      "path": ["idpConfiguration"]
    }
  ]
}
```

### Common Error Codes

- `UNAUTHENTICATED`: User is not authenticated
- `UNAUTHORIZED`: User lacks required permissions
- `NOT_FOUND`: Requested resource does not exist
- `VALIDATION_ERROR`: Input validation failed
- `INTERNAL_ERROR`: Server-side error occurred

### HTTP Status Codes

- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

## Rate Limiting

API requests are subject to rate limiting:

- **GraphQL**: 100 requests per minute per user
- **REST**: 60 requests per minute per IP address

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## Pagination

GraphQL queries support cursor-based pagination:

```graphql
{
  users(first: 10, after: "cursor-123") {
    nodes {
      id
      email
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

## Real-time Updates

The application supports real-time updates via GraphQL subscriptions:

```graphql
subscription IdpConfigurationUpdated($id: ID!) {
  idpConfigurationUpdated(id: $id) {
    id
    status
    lastModified
  }
}
```

## Example Usage

### Complete IDP Configuration Flow

```typescript
// 1. Create new IDP configuration
const { data } = await createIdpConfiguration({
  variables: {
    input: {
      name: "Corporate SAML",
      type: "SAML",
      configuration: {
        entityId: "https://corp.com/saml",
        ssoUrl: "https://corp.com/sso",
        certificate: certificateData
      }
    }
  }
});

// 2. Update configuration
await updateIdpConfiguration({
  variables: {
    id: data.createIdpConfiguration.id,
    input: {
      status: "ACTIVE"
    }
  }
});

// 3. Subscribe to updates
const subscription = subscribeToMore({
  document: IDP_CONFIGURATION_UPDATED,
  variables: { id: data.createIdpConfiguration.id },
  updateQuery: (prev, { subscriptionData }) => {
    // Update local cache with real-time changes
  }
});
```
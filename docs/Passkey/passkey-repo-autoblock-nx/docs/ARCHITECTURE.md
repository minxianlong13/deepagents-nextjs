# Architecture

## System Overview

Passkey Autoblock NX is a modern full-stack application built as a TypeScript monorepo using Nx. The system follows a layered architecture pattern with clear separation between the frontend (Next.js), backend (Apollo GraphQL), and data access layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Next.js App   │  │  React Components│  │  Navigation  │ │
│  │   (Pages/API)   │  │   & Stories      │  │   & Config   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   GraphQL Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Apollo Server   │  │   Resolvers     │  │  Data Sources│ │
│  │   & Schema      │  │   & Context     │  │   & Clients  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 External Services                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Auth Service   │  │  Passkey APIs   │  │ LaunchDarkly │ │
│  │   (Cvent)       │  │   & Services    │  │ Feature Flags│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Frontend Layer

#### Next.js Application
- **Purpose**: Server-side rendered React application providing the user interface
- **Location**: `packages/passkey-autoblock-apollo/app/src/pages/`
- **Key Features**:
  - Server-side rendering (SSR)
  - API routes for backend integration
  - Static asset optimization
  - Internationalization support

#### React Components
- **Purpose**: Reusable UI components with Storybook documentation
- **Location**: `packages/passkey-autoblock-apollo/app/src/components/`
- **Key Features**:
  - Component-driven development
  - Storybook integration for documentation
  - Emotion-based styling
  - Accessibility compliance

#### Navigation & Configuration
- **Purpose**: Application routing and configuration management
- **Location**: `packages/passkey-autoblock-apollo/app/src/navigation/`
- **Key Features**:
  - Cvent Planner Navigation integration
  - Environment-specific configuration
  - Feature flag integration

### GraphQL Layer

#### Apollo Server
- **Purpose**: GraphQL API server providing unified data access
- **Location**: `packages/passkey-autoblock-apollo/app/src/pages/api/graphql.ts`
- **Key Features**:
  - Type-safe GraphQL schema
  - Subscription support via Redis
  - Authentication middleware
  - Error handling and logging

#### Resolvers
- **Purpose**: GraphQL query and mutation handlers
- **Location**: `packages/passkey-autoblock-apollo/app/src/resolvers/`
- **Key Features**:
  - Business logic implementation
  - Data source orchestration
  - Context-aware operations
  - Error handling

#### Data Sources
- **Purpose**: External service integration and data fetching
- **Location**: `packages/passkey-autoblock-apollo/app/src/data-sources/`
- **Key Features**:
  - RESTful API clients
  - Caching strategies
  - Connection pooling
  - Retry mechanisms

### Model Layer

#### GraphQL Schema
- **Purpose**: Type definitions and API contract
- **Location**: `packages/passkey-autoblock-apollo/model/src/schema/`
- **Key Features**:
  - Code-first schema generation
  - Type safety across frontend and backend
  - Automatic documentation generation

#### Generated Types
- **Purpose**: TypeScript types generated from GraphQL schema
- **Location**: `packages/passkey-autoblock-apollo/model/src/types/`
- **Key Features**:
  - Compile-time type checking
  - IDE autocompletion
  - Consistent data structures

## Data Flow

### Request Flow
1. **Client Request**: User interacts with Next.js frontend
2. **GraphQL Query**: Frontend sends GraphQL query to Apollo Server
3. **Resolver Execution**: Apollo Server executes appropriate resolver
4. **Data Source Call**: Resolver calls external services via data sources
5. **Response Assembly**: Data is assembled and returned through GraphQL
6. **UI Update**: Frontend receives typed response and updates UI

### Authentication Flow
1. **Session Check**: Middleware validates user session
2. **Auth Service**: Integration with Cvent's auth-service
3. **Context Injection**: User context added to GraphQL context
4. **Authorization**: Resolvers check permissions before data access

### Feature Flag Flow
1. **LaunchDarkly Client**: Server-side feature flag evaluation
2. **Context Enrichment**: User and environment context
3. **Flag Resolution**: Feature flags resolved per request
4. **Conditional Logic**: Features enabled/disabled based on flags

## Design Patterns

### Repository Pattern
- Data sources act as repositories for external service integration
- Abstraction layer between business logic and external APIs
- Consistent interface for data access operations

### Dependency Injection
- Apollo Server context provides dependency injection
- Services and clients injected into resolvers
- Testable and modular architecture

### Command Query Responsibility Segregation (CQRS)
- Separate resolvers for queries and mutations
- Read and write operations optimized independently
- Clear separation of concerns

### Event-Driven Architecture
- GraphQL subscriptions for real-time updates
- Redis pub/sub for event distribution
- Decoupled component communication

## Module Structure

### Nx Workspace Organization
```
packages/
├── passkey-autoblock-apollo/
│   ├── app/                    # Next.js application
│   ├── model/                  # GraphQL schema and types
│   ├── e2e/                    # End-to-end tests
│   ├── it/                     # Integration tests
│   └── infra/                  # Infrastructure as code
```

### Application Structure
```
app/src/
├── components/                 # React components
├── pages/                      # Next.js pages and API routes
├── resolvers/                  # GraphQL resolvers
├── data-sources/              # External service clients
├── config/                    # Configuration management
├── navigation/                # Routing and navigation
├── launchdarkly/             # Feature flag integration
└── stories/                   # Storybook stories
```

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Load balancer compatible
- Session management via external store

### Caching Strategy
- Apollo Server caching
- Redis for session and subscription data
- CDN for static assets

### Performance Optimization
- GraphQL query optimization
- Lazy loading of components
- Bundle splitting and code optimization
- Image optimization via Next.js

## Security Architecture

### Authentication
- Integration with Cvent's centralized auth service
- JWT token validation
- Session management

### Authorization
- Role-based access control
- GraphQL field-level permissions
- Context-aware authorization

### Data Protection
- HTTPS enforcement
- Input validation and sanitization
- SQL injection prevention
- XSS protection via React

## Monitoring and Observability

### Application Performance Monitoring
- Datadog APM integration
- Custom metrics and traces
- Error tracking and alerting

### Logging
- Structured logging with correlation IDs
- Log aggregation via Datadog
- Different log levels per environment

### Health Checks
- Application health endpoints
- Dependency health monitoring
- Automated alerting on failures
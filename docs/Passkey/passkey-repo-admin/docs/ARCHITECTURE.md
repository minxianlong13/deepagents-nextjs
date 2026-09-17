# Architecture

## System Overview

Passkey Admin follows a modern monorepo architecture built with Nx, containing a Next.js application with supporting packages for infrastructure, testing, and shared models. The application serves as the administrative frontend for SSO Identity Provider management within the Passkey platform.

```
┌─────────────────────────────────────────────────────────────┐
│                    Passkey Admin Frontend                   │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router │ React Components │ Apollo GraphQL    │
├─────────────────────────────────────────────────────────────┤
│  Carina UI Library  │ Tailwind CSS     │ LaunchDarkly      │
├─────────────────────────────────────────────────────────────┤
│  Authentication     │ Session Handling │ Feature Flags     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend GraphQL APIs                     │
│              (SSO IDP Management Services)                 │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Core Application (`packages/app`)
- **Purpose**: Main Next.js application providing the administrative interface
- **Location**: `packages/app/src/`
- **Key Features**:
  - App Router architecture with server-side rendering
  - GraphQL client integration via Apollo
  - Authentication and session management
  - Responsive UI with Carina design system

### Infrastructure (`packages/infra`)
- **Purpose**: AWS CDK infrastructure definitions for deployment
- **Location**: `packages/infra/`
- **Key Components**:
  - CDK stacks for different environments
  - Container deployment configurations
  - AWS resource definitions

### End-to-End Testing (`packages/e2e`)
- **Purpose**: WebDriverIO-based end-to-end test suite
- **Location**: `packages/e2e/`
- **Key Features**:
  - Browser automation tests
  - User journey validation
  - Cross-browser compatibility testing

### Integration Testing (`packages/it`)
- **Purpose**: Integration test suite for API interactions
- **Location**: `packages/it/`
- **Key Features**:
  - GraphQL API testing
  - Service integration validation

### Shared Models (`packages/model`)
- **Purpose**: Shared TypeScript types and data models
- **Location**: `packages/model/`
- **Key Features**:
  - GraphQL schema types
  - Domain model definitions
  - Shared interfaces

## Data Flow

### Authentication Flow
1. User accesses the application
2. Authentication middleware validates session
3. If unauthenticated, redirects to login page
4. Successful authentication establishes session
5. User gains access to administrative features

### GraphQL Data Flow
1. React components trigger GraphQL queries/mutations
2. Apollo Client manages request lifecycle
3. Server-side GraphQL resolvers process requests
4. Data flows back through Apollo cache
5. Components re-render with updated data

### Feature Flag Flow
1. Application initializes LaunchDarkly client
2. Feature flags are evaluated based on user context
3. UI components conditionally render based on flag values
4. Real-time flag updates trigger component re-renders

## Design Patterns

### Component Architecture
- **Atomic Design**: Components organized by complexity (atoms, molecules, organisms)
- **Container/Presentational**: Separation of data logic and presentation
- **Compound Components**: Complex UI patterns built from smaller components

### State Management
- **Apollo Client**: GraphQL data and cache management
- **React Context**: Application-wide state (theme, user context)
- **Local State**: Component-specific state with React hooks

### Error Handling
- **Error Boundaries**: React error boundaries for graceful failure handling
- **GraphQL Errors**: Centralized error handling through Apollo Client
- **Logging**: Structured logging with DataDog integration

## Module Structure

```
packages/
├── app/                    # Main Next.js application
│   ├── src/
│   │   ├── app/           # Next.js App Router pages and layouts
│   │   ├── components/    # Reusable React components
│   │   ├── graphql/       # GraphQL queries, mutations, and types
│   │   ├── hooks/         # Custom React hooks
│   │   ├── config/        # Application configuration
│   │   ├── util/          # Utility functions
│   │   └── styles/        # Global styles and Tailwind config
│   ├── public/            # Static assets
│   └── locales/           # Internationalization files
├── infra/                 # AWS CDK infrastructure code
├── e2e/                   # End-to-end tests
├── it/                    # Integration tests
└── model/                 # Shared TypeScript models
```

## Security Architecture

### Authentication
- Session-based authentication with secure cookies
- Integration with Cvent's centralized auth services
- Automatic session refresh and timeout handling

### Authorization
- Role-based access control for administrative features
- Feature-level permissions through LaunchDarkly flags
- API-level authorization validation

### Data Protection
- HTTPS enforcement for all communications
- Secure cookie configuration
- Content Security Policy (CSP) headers
- Input validation and sanitization

## Performance Considerations

### Client-Side Optimization
- Next.js automatic code splitting
- Apollo Client caching and query optimization
- Lazy loading of components and routes
- Image optimization with Next.js Image component

### Server-Side Optimization
- Server-side rendering for initial page loads
- Static generation where applicable
- CDN integration for asset delivery
- Efficient GraphQL query batching

## Monitoring and Observability

### Application Monitoring
- DataDog RUM (Real User Monitoring) integration
- Custom metrics and dashboards
- Error tracking and alerting
- Performance monitoring

### Logging
- Structured logging with correlation IDs
- Client-side error logging
- Server-side request/response logging
- Integration with centralized logging systems
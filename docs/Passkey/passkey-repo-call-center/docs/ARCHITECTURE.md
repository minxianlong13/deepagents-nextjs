# Architecture

## System Overview

The Passkey Call Center is built as a modern TypeScript monorepo using Next.js and follows a layered architecture pattern. The application serves as a web-based interface for hotel call center agents to manage guest reservations, replacing the legacy Passkey Call Center form.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │     Pages       │  │   Components    │  │   Hooks     │ │
│  │   (Routes)      │  │   (Carina UI)   │  │  (State)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   GraphQL API Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Resolvers     │  │   Data Sources  │  │ Middleware  │ │
│  │  (Business      │  │   (External     │  │ (Auth,      │ │
│  │   Logic)        │  │    APIs)        │  │  Logging)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Auth Service   │  │   Passkey       │  │ Elasticsearch│ │
│  │                 │  │  Reservation    │  │              │ │
│  │                 │  │    System       │  │              │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Frontend Layer
- **Purpose**: User interface and client-side logic
- **Location**: `packages/app/src/pages/`, `packages/app/src/components/`
- **Key Technologies**: Next.js, React, Carina UI components, TailwindCSS
- **Responsibilities**:
  - Rendering reservation booking forms
  - Managing client-side state
  - Handling user interactions
  - Responsive design for various screen sizes

### GraphQL API Layer
- **Purpose**: Business logic and data orchestration
- **Location**: `packages/app/src/pages/api/graphql.ts`, `packages/app/src/resolvers/`
- **Key Technologies**: Apollo Server, GraphQL
- **Responsibilities**:
  - Processing reservation queries and mutations
  - Orchestrating calls to external services
  - Data transformation and validation
  - Authentication and authorization

### Data Sources Layer
- **Purpose**: External service integration
- **Location**: `packages/app/src/datasources/`
- **Key Technologies**: Apollo DataSource, REST clients
- **Responsibilities**:
  - Communicating with Passkey reservation system
  - Elasticsearch integration for search
  - Caching and request optimization

### Model Layer
- **Purpose**: Type definitions and schema management
- **Location**: `packages/model/src/`
- **Key Technologies**: GraphQL Code Generator, TypeScript
- **Responsibilities**:
  - GraphQL schema definitions
  - TypeScript type generation
  - Operation definitions for queries/mutations

## Data Flow

### Reservation Booking Flow
1. **User Input**: Agent enters guest information and preferences in the web form
2. **GraphQL Mutation**: Frontend sends booking mutation to GraphQL API
3. **Validation**: Resolver validates input data and business rules
4. **External API Call**: Data source makes request to Passkey reservation system
5. **Response Processing**: API response is transformed and returned to frontend
6. **UI Update**: Frontend updates to show booking confirmation or errors

### Search Flow
1. **Search Query**: Agent enters search criteria (dates, location, etc.)
2. **GraphQL Query**: Frontend sends search query to GraphQL API
3. **Elasticsearch Query**: Data source queries Elasticsearch for available rooms
4. **Results Aggregation**: Multiple data sources are combined and filtered
5. **Response**: Formatted results returned to frontend for display

## Design Patterns

### Repository Pattern
- Data sources act as repositories for external services
- Abstracts external API details from business logic
- Enables easier testing and mocking

### Service Layer Pattern
- GraphQL resolvers contain business logic
- Separates concerns between data access and business rules
- Facilitates code reuse across different operations

### Component Composition
- React components follow composition over inheritance
- Carina design system provides consistent UI patterns
- Custom hooks manage shared state logic

### Event-Driven Architecture
- LaunchDarkly feature flags for runtime configuration
- Real-time updates through GraphQL subscriptions
- Analytics events for user behavior tracking

## Module Structure

### Monorepo Organization
```
packages/
├── app/                    # Main Next.js application
│   ├── src/
│   │   ├── pages/         # Next.js pages and API routes
│   │   ├── components/    # React components
│   │   ├── resolvers/     # GraphQL resolvers
│   │   ├── datasources/   # External service clients
│   │   └── config/        # Application configuration
├── model/                 # GraphQL schema and types
│   ├── src/
│   │   ├── schema/        # GraphQL schema definitions
│   │   ├── operations/    # Query/mutation definitions
│   │   └── types/         # Generated TypeScript types
├── e2e/                   # End-to-end tests
├── it/                    # Integration tests
├── infra/                 # Infrastructure as code
└── dev-tools/             # Development utilities
```

### Key Architectural Decisions

1. **Monorepo Structure**: Enables shared code and coordinated releases
2. **GraphQL API**: Provides flexible data fetching and strong typing
3. **Next.js Framework**: Server-side rendering and API routes in one framework
4. **Carina Design System**: Consistent UI/UX across Cvent applications
5. **TypeScript**: Type safety and better developer experience
6. **pnpm Workspaces**: Efficient dependency management and build caching

### Scalability Considerations

- **Horizontal Scaling**: Stateless Next.js application can be scaled horizontally
- **Caching Strategy**: Apollo Server caching and CDN for static assets
- **Database Optimization**: Elasticsearch for fast search queries
- **Monitoring**: Datadog integration for performance monitoring
- **Feature Flags**: LaunchDarkly for gradual feature rollouts
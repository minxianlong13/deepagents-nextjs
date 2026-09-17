# Technical Details

## Technology Stack

- **Framework**: Next.js 12.3.6 with CDF (Cvent Development Framework)
- **Language**: TypeScript 4.9.4
- **Build Tool**: pnpm with Nx monorepo
- **UI Library**: Carina v1.138.1 & v2.94.14, Tailwind CSS 3
- **GraphQL**: Apollo Server & Client
- **Database**: Elasticsearch 7.13.0
- **Cache**: Redis (ioredis)
- **Authentication**: Cvent Auth Service
- **Feature Flags**: LaunchDarkly
- **Monitoring**: Datadog APM & Logs

## Architecture

This is a TypeScript monorepo using pnpm workspaces with the following packages:

- **app**: Main Next.js application with GraphQL API
- **model**: Shared TypeScript types and GraphQL schema
- **infra**: AWS CDK infrastructure as code
- **e2e**: End-to-end tests using WebdriverIO
- **it**: Integration tests
- **dev-tools**: Development utilities

## Key Dependencies

### Core Framework
- `@cvent/cdf`: 1.72.187 - Cvent Development Framework
- `@cvent/nextjs`: ^1.6.0 - Next.js integration
- `@cvent/apollo-server`: 1.1.32 - GraphQL server
- `@cvent/apollo-client`: ^1.6.13 - GraphQL client

### UI Components
- `@cvent/carina`: ^1.138.1 - Cvent's design system
- `@cvent/carina-v2`: ^2.94.14 - Next generation design system
- `@cvent/passkey-components`: ^0.0.8 - Passkey-specific components
- `nucleus-text`: 9.8.9 - Typography system

### Data & Search
- `@cvent/elasticsearch-client`: 0.4.0 - Elasticsearch integration
- `@elastic/elasticsearch`: ^7.13.0 - Elasticsearch client
- `ioredis`: ^4.28.5 - Redis client

### Authentication & Authorization
- `@cvent/auth-client`: ^4.0.0 - Authentication client
- `@cvent/session-handler`: ^0.0.17 - Session management

### Feature Management
- `@launchdarkly/node-server-sdk`: ^9.7.4 - Feature flags

### Monitoring & Observability
- `@datadog/browser-rum`: ^5.21.0 - Real User Monitoring
- `@datadog/browser-logs`: ^5.21.0 - Browser logging
- `dd-trace`: ^4.29.0 - APM tracing
- `@cvent/logging`: 1.0.40 - Structured logging

## Configuration

### Environment Variables

The application uses environment-specific configuration through `.env.template`:

```bash
# Core Application
NODE_ENV=development
PORT=3000
API_KEY=<staging-api-key>

# Authentication
CVENT_AUTH_URL=<auth-service-url>
RESDESK_URL=<resdesk-environment-url>

# Elasticsearch
ES_HOST=<elasticsearch-host>
ES_USER=<elasticsearch-user>
ES_PASS=<elasticsearch-password>

# Redis
REDIS_URL=<redis-connection-string>

# LaunchDarkly
LAUNCHDARKLY_PROJECT_SDK_KEY=<sdk-key>
CHECK_LD_FIND_RES=false

# Monitoring
DATADOG_SERVICE_NAME=passkey-call-center
```

### Build Configuration

- **Next.js**: Custom configuration in `next.config.mjs`
- **TypeScript**: Multiple tsconfig files for different contexts
- **Tailwind**: Custom configuration with Cvent design tokens
- **ESLint**: Extends `@cvent/eslint-config`
- **Prettier**: Uses `@cvent/prettier-config`

## GraphQL Schema

The application uses GraphQL with code generation:

- Schema files in `packages/model/src/`
- Generated types via `@graphql-codegen/cli`
- Resolvers organized by domain in `packages/app/src/resolvers/`

### Resolver Domains
- **Authentication**: User login and session management
- **Reservation**: Hotel reservation search and management
- **Hotel**: Hotel information and availability
- **Event**: Event-related data
- **Admin**: Administrative functions
- **RDK2**: Legacy Resdesk integration
- **Smart Campaign**: Marketing campaign data

## Database Schema

### Elasticsearch Indices
The application primarily uses Elasticsearch for reservation search:

- Reservation documents with flattened schema
- Search across multiple fields (guest name, confirmation number, hotel)
- Aggregations for filtering and faceting

### Redis Cache
- Session storage
- GraphQL query caching
- Rate limiting data

## Build Process

### Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server
pnpm generate         # Generate GraphQL types
```

### Production
```bash
pnpm build            # Build all packages
pnpm start            # Start production server
```

### Testing
```bash
pnpm test             # Unit tests
pnpm e2e              # End-to-end tests
pnpm lint             # Code linting
```

## Monitoring & Logging

### Datadog Integration
- **APM**: Distributed tracing with `dd-trace`
- **RUM**: Browser performance monitoring
- **Logs**: Structured logging with correlation IDs
- **Metrics**: Custom business metrics

### Health Checks
- Application health endpoint
- Database connectivity checks
- External service dependency checks

### Error Handling
- Global error boundaries in React
- GraphQL error handling with proper status codes
- Structured error logging with context

## Security

### Authentication Flow
1. User authenticates via Cvent Auth Service
2. Session cookie (`cvent-auth`) stored in browser
3. Server validates token on each request
4. 60-minute token expiration with refresh capability

### Authorization
- Role-based access control
- LaunchDarkly feature flags for user-specific access
- API key authentication for service-to-service calls

### Data Protection
- HTTPS enforcement
- Secure cookie settings
- Input validation and sanitization
- SQL injection prevention through parameterized queries

## Performance Optimizations

### Frontend
- Next.js static generation where possible
- Code splitting and lazy loading
- Image optimization with Next.js Image component
- Tailwind CSS purging for smaller bundle sizes

### Backend
- GraphQL query optimization
- Elasticsearch query tuning
- Redis caching for frequently accessed data
- Connection pooling for database connections

### Monitoring
- Core Web Vitals tracking
- GraphQL query performance metrics
- Elasticsearch query performance monitoring
- Memory and CPU usage tracking
# Technical Details

## Technology Stack

### Frontend Framework
- **Next.js 14**: React framework with App Router for server-side rendering and static generation
- **React 18**: Component library with concurrent features and improved performance
- **TypeScript 4.9**: Static type checking for enhanced developer experience and code quality

### Build Tools & Package Management
- **Nx 20.7**: Monorepo management and build orchestration
- **pnpm**: Fast, disk space efficient package manager
- **Changesets**: Version management and changelog generation
- **SWC**: Fast TypeScript/JavaScript compiler for builds and tests

### UI & Styling
- **Carina Design System**: Cvent's component library for consistent UI/UX
  - `@cvent/carina`: v1.151.3 - Core component library
  - `@cvent/carina-v2`: v2.95.2 - Next generation components
  - `@cvent/carina-layout`: Layout and navigation components
- **Tailwind CSS 3.4**: Utility-first CSS framework for responsive design
- **Emotion**: CSS-in-JS library for styled components
- **PostCSS**: CSS processing with autoprefixer

### Data Management
- **Apollo Client 3.11**: GraphQL client with caching and state management
- **GraphQL 16.8**: Query language and runtime for APIs
- **GraphQL Code Generator**: Automatic TypeScript type generation from schemas

### Authentication & Security
- **Cvent Auth Client 5.0**: Integration with Cvent's authentication services
- **Session Handler**: Secure session management with cookies
- **CORS**: Cross-origin resource sharing configuration

### Feature Management
- **LaunchDarkly**: Feature flag management for controlled rollouts
  - Node SDK: v5.13.1 for server-side evaluation
  - Client-side integration for real-time flag updates

### Testing
- **Jest 29**: JavaScript testing framework with coverage reporting
- **Testing Library**: React component testing utilities
- **WebDriverIO 7.33**: End-to-end browser automation testing
- **Storybook 6.5**: Component development and documentation environment
- **MSW 2.0**: Mock Service Worker for API mocking in tests

### Development Tools
- **ESLint**: Code linting with Cvent's configuration
- **Prettier**: Code formatting with consistent style
- **Husky**: Git hooks for pre-commit validation
- **asdf**: Runtime version management

### Monitoring & Observability
- **DataDog**: Application performance monitoring and logging
  - Browser RUM: Real user monitoring
  - Browser Logs: Client-side error tracking
  - dd-trace: Distributed tracing
- **Hot Shots**: StatsD client for custom metrics

## Dependencies

### Core Production Dependencies

```json
{
  "@apollo/client": "^3.11.0",
  "@cvent/apollo-client": "^1.3.21",
  "@cvent/carina": "^1.151.3",
  "@cvent/carina-v2": "npm:@cvent/carina@^2.95.2",
  "@cvent/auth-client": "^5.0.2",
  "@cvent/logging": "2.0.26",
  "@cvent/nextjs": "^2.4.0",
  "next": "^14.2.35",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^4.9.4",
  "tailwindcss": "^3.4.3",
  "launchdarkly-node-server-sdk": "5.13.1",
  "graphql": "16.8.1"
}
```

### Development Dependencies

```json
{
  "@cvent/eslint-config": "1.0.33",
  "@cvent/prettier-config": "^1.0.40",
  "@cvent/jest-config": "^1.3.7",
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^5.17.0",
  "jest": "^29.2.2",
  "eslint": "^8.57.0",
  "prettier": "^2.8.4",
  "nx": "20.7.0"
}
```

## Configuration

### Environment Variables

#### Required Variables
```bash
# Authentication
API_KEY=<cvent-api-key>
AUTH_SERVICE_URL=<authentication-service-endpoint>

# GraphQL
GRAPHQL_ENDPOINT=<backend-graphql-url>

# Feature Flags
LAUNCHDARKLY_SDK_KEY=<launchdarkly-server-key>
LAUNCHDARKLY_CLIENT_ID=<launchdarkly-client-id>

# Monitoring
DATADOG_APPLICATION_ID=<datadog-app-id>
DATADOG_CLIENT_TOKEN=<datadog-client-token>
DATADOG_SERVICE_NAME=passkey-admin

# Application
NODE_ENV=<development|production>
LOG_LEVEL=<debug|info|warn|error>
```

#### Optional Variables
```bash
# Development
PORT=3000
NEXT_PUBLIC_APP_ENV=development

# Security
SESSION_SECRET=<session-encryption-key>
CORS_ORIGIN=<allowed-origins>

# Performance
APOLLO_CACHE_SIZE=100
GRAPHQL_TIMEOUT=30000
```

### Configuration Files

#### Next.js Configuration (`next.config.mjs`)
```javascript
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['dd-trace']
  },
  images: {
    domains: ['assets.cvent.com']
  },
  webpack: (config) => {
    // Custom webpack configuration
    return config;
  }
};
```

#### TypeScript Configuration (`tsconfig.json`)
```json
{
  "extends": "@cvent/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/graphql/*": ["./src/graphql/*"]
    }
  },
  "include": ["src/**/*", "next-env.d.ts"],
  "exclude": ["node_modules", ".next", "dist"]
}
```

#### Tailwind Configuration (`tailwind.config.js`)
```javascript
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cvent brand colors
        primary: '#1a365d',
        secondary: '#2d3748'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries')
  ]
};
```

## Database Schema

The application primarily consumes data through GraphQL APIs and does not maintain its own database. However, it interacts with the following data structures:

### GraphQL Schema Types
```typescript
interface IdpConfiguration {
  id: string;
  name: string;
  type: IdpType;
  status: IdpStatus;
  entityId: string;
  ssoUrl: string;
  certificate: string;
  attributeMapping: AttributeMapping;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roles: string[];
  permissions: string[];
  lastLoginAt?: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  timestamp: string;
  details: Record<string, any>;
}
```

## Build Process

### Development Build
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run with debugging
pnpm dev:debug
```

### Production Build
```bash
# Build application
pnpm build

# Start production server
pnpm start
```

### Testing
```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run linting
pnpm lint

# Fix linting issues
pnpm fix
```

## Performance Optimizations

### Client-Side Optimizations
- **Code Splitting**: Automatic route-based code splitting with Next.js
- **Image Optimization**: Next.js Image component with WebP support
- **Bundle Analysis**: Webpack bundle analyzer for size optimization
- **Tree Shaking**: Unused code elimination during build

### Server-Side Optimizations
- **SSR/SSG**: Server-side rendering and static generation where appropriate
- **API Route Optimization**: Efficient API route handlers
- **Caching**: Apollo Client caching with intelligent cache policies
- **Compression**: Gzip compression for static assets

### GraphQL Optimizations
- **Query Batching**: Multiple queries combined into single requests
- **Field Selection**: Only requested fields are fetched
- **Cache Normalization**: Efficient data normalization in Apollo cache
- **Subscription Management**: Efficient WebSocket connection handling

## Security Measures

### Authentication Security
- **Secure Cookies**: HttpOnly, Secure, SameSite cookie configuration
- **Session Management**: Automatic session refresh and timeout
- **CSRF Protection**: Cross-site request forgery prevention
- **XSS Prevention**: Content Security Policy headers

### Data Security
- **Input Validation**: Comprehensive input sanitization
- **Output Encoding**: Proper encoding of user-generated content
- **Dependency Scanning**: Regular security audits of dependencies
- **Environment Isolation**: Separate configurations per environment

## Monitoring & Logging

### Application Metrics
- **Performance Metrics**: Page load times, API response times
- **Error Tracking**: Client and server-side error monitoring
- **User Analytics**: User interaction and feature usage tracking
- **Custom Metrics**: Business-specific metrics and KPIs

### Logging Configuration
```typescript
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new transports.Console(),
    new transports.DataDog({
      apiKey: process.env.DATADOG_API_KEY,
      service: 'passkey-admin'
    })
  ]
});
```

### Health Checks
- **Application Health**: `/api/health` endpoint for service monitoring
- **Dependency Health**: Checks for GraphQL API availability
- **Database Connectivity**: Validation of external service connections
- **Feature Flag Status**: LaunchDarkly connection validation
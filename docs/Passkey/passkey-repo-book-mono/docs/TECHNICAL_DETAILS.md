# Technical Details

## Technology Stack

### Frontend Framework
- **Next.js 14**: React framework with App Router for server-side rendering and static generation
- **React 18**: UI library with concurrent features and improved performance
- **TypeScript 5.x**: Type-safe JavaScript with advanced type system features

### Build Tools & Package Management
- **Nx**: Monorepo build system with intelligent caching and task orchestration
- **PNPM**: Fast, disk space efficient package manager with workspace support
- **Changeset**: Version management and changelog generation for monorepo packages

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Nucleus Text**: Cvent's design system component library
- **PostCSS**: CSS processing with autoprefixer and optimization plugins

### Development Tools
- **ESLint**: Code linting with Cvent's configuration standards
- **Prettier**: Code formatting with consistent style rules
- **Jest**: Unit testing framework with coverage reporting
- **Playwright**: End-to-end testing with cross-browser support

### Runtime Environment
- **Node.js 18**: JavaScript runtime with LTS support
- **Server-only**: Package ensuring server-side only code execution
- **Morgan**: HTTP request logger middleware

### Observability & Monitoring
- **OpenTelemetry**: Distributed tracing and metrics collection
- **Pino**: High-performance JSON logger
- **DataDog**: Application performance monitoring and alerting

## Dependencies

### Core Dependencies

```json
{
  "@cvent/passkey-book-lib": "workspace:*",
  "@cvent/passkey-book-ui-e2e": "workspace:*", 
  "@cvent/passkey-book-ui-infra": "workspace:*",
  "morgan": "^1.10.0",
  "normalize.css": "^8.0.1",
  "nucleus-text": "^9.8.16",
  "resize-observer-polyfill": "^1.5.1",
  "server-only": "^0.0.1"
}
```

### Development Dependencies

```json
{
  "pino-pretty": "^11.2.2",
  "whatwg-fetch": "^3.6.20",
  "@cvent/eslint-config": "latest",
  "@cvent/prettier-config": "latest"
}
```

### Workspace Dependencies

The monorepo structure includes several internal packages:

- **@cvent/passkey-book-lib**: Shared utilities and business logic
- **@cvent/passkey-book-ui-e2e**: Playwright end-to-end tests
- **@cvent/passkey-book-ui-infra**: AWS CDK infrastructure definitions

## Configuration

### Environment Variables

#### Application Configuration
```bash
# Application Settings
NODE_ENV=production|development|test
PORT=3000
HOST=0.0.0.0

# Feature Flags
LAUNCHDARKLY_SDK_KEY=<launchdarkly-key>
FEATURE_FLAGS_ENABLED=true

# Internationalization
PHRASEAPP_PROJECT_ID=<phraseapp-project-id>
PHRASEAPP_ACCESS_TOKEN=<phraseapp-token>
DEFAULT_LOCALE=en

# Logging
LOG_LEVEL=info|debug|warn|error
LOG_FORMAT=json|pretty

# Monitoring
DATADOG_API_KEY=<datadog-key>
DATADOG_SERVICE_NAME=passkey-book-ui
OTEL_EXPORTER_OTLP_ENDPOINT=<telemetry-endpoint>
```

#### External Service Configuration
```bash
# Backend Services
PASSKEY_API_BASE_URL=<passkey-api-url>
PASSKEY_API_KEY=<api-key>
PASSKEY_API_TIMEOUT=30000

# Authentication
AUTH_SECRET=<jwt-secret>
AUTH_ISSUER=<jwt-issuer>
SESSION_TIMEOUT=3600

# Database (if applicable)
DATABASE_URL=<connection-string>
DATABASE_POOL_SIZE=10
DATABASE_TIMEOUT=5000
```

### Configuration Files

#### Next.js Configuration (`next.config.mjs`)
```javascript
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@cvent/passkey-book-lib']
  },
  images: {
    domains: ['images.cvent.com', 'cdn.cvent.com']
  },
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'it'],
    defaultLocale: 'en'
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options', 
          value: 'nosniff'
        }
      ]
    }
  ]
}
```

#### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

#### Nx Configuration (`nx.json`)
```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@cvent/cdf/task-runners/default",
      "options": {
        "useCloudFrontForRemoteCache": true
      }
    }
  },
  "cli": {
    "packageManager": "pnpm"
  },
  "defaultBase": "master",
  "useDaemonProcess": false,
  "useInferencePlugins": true,
  "plugins": ["@cvent/cdf"]
}
```

## Database Schema

### Primary Data Storage

The application primarily consumes data from existing Passkey microservices rather than maintaining its own database. However, it may cache certain data for performance:

#### Session Storage (Redis)
```
sessions:{sessionId} -> {
  userId: string,
  email: string,
  preferences: object,
  createdAt: timestamp,
  expiresAt: timestamp
}
```

#### Feature Flag Cache (Redis)
```
features:{userId} -> {
  flags: object,
  lastUpdated: timestamp,
  ttl: number
}
```

### External Data Sources

#### Passkey Hotel Service
- Hotel information and metadata
- Room types and availability
- Pricing and rate plans

#### Passkey Booking Service  
- Booking creation and management
- Reservation status and history
- Guest information

#### Passkey Payment Service
- Payment processing and validation
- Transaction history and receipts
- Refund and cancellation handling

## Build Process

### Development Build
```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm dev

# Run in development mode with production build
pnpm dev:prod

# Run with Docker
pnpm dev:docker
```

### Production Build
```bash
# Clean previous builds
pnpm clean

# Build all packages
nx build

# Run tests
nx test

# Lint code
nx lint

# Build and start production server
pnpm build && pnpm start
```

### Nx Build Targets

#### Application Targets
- `build`: Create production build
- `dev`: Start development server
- `test`: Run unit tests
- `lint`: Run ESLint
- `fix`: Auto-fix linting issues
- `deploy`: Deploy to AWS

#### Infrastructure Targets
- `deploy:sandbox`: Deploy to sandbox environment
- `deploy`: Deploy to production
- `synth`: Generate CloudFormation templates

### Build Optimization

#### Code Splitting
- Automatic route-based code splitting
- Dynamic imports for large components
- Vendor chunk optimization

#### Bundle Analysis
```bash
# Analyze bundle size
ANALYZE=true pnpm build

# Generate bundle report
nx run report
```

#### Caching Strategy
- Nx computation caching for faster builds
- CloudFront remote caching for CI/CD
- Next.js build caching for incremental builds

## Monitoring & Logging

### Application Metrics

#### Performance Metrics
- Page load times and Core Web Vitals
- API response times and error rates
- Database query performance
- Cache hit/miss ratios

#### Business Metrics
- Booking conversion rates
- User engagement metrics
- Feature flag adoption rates
- Error rates by feature

### Logging Configuration

#### Structured Logging (Pino)
```javascript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
      service: 'passkey-book-ui'
    })
  }
})
```

#### Request Logging (Morgan)
```javascript
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}))
```

### Error Tracking

#### Error Boundaries
- React error boundaries for component error handling
- Global error handler for unhandled exceptions
- Graceful degradation for non-critical features

#### Error Reporting
- Automatic error reporting to DataDog
- Error context including user session and feature flags
- Performance impact tracking for errors

### Health Checks

#### Application Health
```javascript
// /api/health
{
  status: 'healthy',
  timestamp: '2024-01-15T10:30:00Z',
  version: '0.2.4',
  uptime: 3600,
  memory: {
    used: 150,
    total: 512
  }
}
```

#### Dependency Health
```javascript
// /api/health/dependencies
{
  database: 'healthy',
  passkey_api: 'healthy', 
  launchdarkly: 'healthy',
  redis: 'degraded'
}
```

## Security Implementation

### Content Security Policy
```javascript
const csp = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.cvent.com'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https://images.cvent.com'],
  'connect-src': ["'self'", 'https://api.cvent.com']
}
```

### Authentication Middleware
```javascript
export function authMiddleware(request) {
  const token = request.headers.get('authorization')
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  try {
    const payload = jwt.verify(token, process.env.AUTH_SECRET)
    request.user = payload
  } catch (error) {
    return new Response('Invalid token', { status: 401 })
  }
}
```

### Data Validation
- Input sanitization using Zod schemas
- SQL injection prevention through parameterized queries
- XSS protection through React's built-in escaping
- CSRF protection using SameSite cookies

## Performance Optimization

### Server-Side Rendering
- Static generation for marketing pages
- Server-side rendering for dynamic content
- Incremental static regeneration for data updates

### Client-Side Optimization
- Image optimization with Next.js Image component
- Font optimization with next/font
- Service worker for offline functionality
- Resource preloading for critical assets

### Caching Strategy
- CDN caching for static assets
- API response caching with appropriate TTL
- Browser caching with cache-control headers
- Redis caching for session and feature flag data
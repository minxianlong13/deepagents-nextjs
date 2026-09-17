# Technical Details

## Technology Stack

### Frontend
- **Framework**: Next.js 12.3.6 - React-based full-stack framework
- **Language**: TypeScript 4.9.4 - Type-safe JavaScript
- **UI Library**: React 18.3.1 - Component-based UI framework
- **Styling**: Emotion 11.9.0 - CSS-in-JS styling solution
- **Component Library**: Cvent Carina 1.99.0 - Internal component library
- **State Management**: Apollo Client 3.11.0 - GraphQL client with caching
- **Build Tool**: Nx 20.7.0 - Monorepo build system

### Backend
- **GraphQL Server**: Apollo Server 1.1.32 - GraphQL API server
- **Runtime**: Node.js 20.19.0 - JavaScript runtime
- **Package Manager**: pnpm - Fast, disk space efficient package manager
- **Schema Generation**: GraphQL Code Generator - Type-safe GraphQL operations

### Development Tools
- **Monorepo**: Nx Workspace - Integrated development experience
- **Testing**: Jest 29.2.2 - JavaScript testing framework
- **E2E Testing**: WebdriverIO 7.33.0 - Browser automation
- **Linting**: ESLint 8.57.0 - Code quality and style enforcement
- **Formatting**: Prettier 2.8.3 - Code formatting
- **Storybook**: 6.5.16 - Component development and documentation

### Infrastructure
- **Cloud Provider**: AWS - Amazon Web Services
- **Infrastructure as Code**: AWS CDK 2.178.2 - Cloud Development Kit
- **Containerization**: Docker - Application containerization
- **Deployment**: Octopus Deploy - Automated deployment platform
- **CI/CD**: Jenkins - Continuous integration and deployment

### Monitoring & Observability
- **APM**: Datadog - Application performance monitoring
- **Logging**: Datadog Logs - Centralized log management
- **Tracing**: dd-trace 4.29.0 - Distributed tracing
- **Metrics**: Hot-shots 9 - StatsD client for custom metrics

### External Integrations
- **Authentication**: Cvent Auth Service - Centralized authentication
- **Feature Flags**: LaunchDarkly 9.7.4 - Feature flag management
- **Session Management**: Redis - In-memory data store
- **Configuration**: AWS Systems Manager - Parameter store

## Dependencies

### Core Dependencies

```json
{
  "@apollo/client": "^3.11.0",
  "@apollo/client-integration-nextjs": "^0.12.2",
  "@cvent/apollo-server": "1.1.32",
  "@cvent/auth-client": "^4.0.0",
  "@cvent/carina": "^1.99.0",
  "@cvent/feature-flags": "2.7.21",
  "@cvent/nextjs": "^1.6.0",
  "@launchdarkly/node-server-sdk": "^9.7.4",
  "next": "^12.3.6",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^4.9.4"
}
```

### Build & Development Dependencies

```json
{
  "@cvent/builder-cdk": "4.0.1",
  "@cvent/builder-docker": "^3.2.0",
  "@cvent/builder-pnpm": "^1.5.1",
  "@cvent/eslint-config": "1.0.33",
  "@cvent/jest-config": "^1.3.7",
  "@cvent/prettier-config": "^1.0.40",
  "@cvent/tsconfig": "1.2.5",
  "nx": "20.7.0"
}
```

### AWS & Infrastructure Dependencies

```json
{
  "@aws-sdk/client-secrets-manager": "^3.714.0",
  "@aws-sdk/client-ssm": "^3.540.0",
  "@cvent/cdk-applications": "^1.45.2",
  "@cvent/cdk-lib": "^1.34.1",
  "@cvent/octopusdeploy-cdk": "^4.5.4",
  "aws-cdk": "^2.1007.0",
  "aws-cdk-lib": "^2.178.2"
}
```

## Configuration

### Environment Variables

#### Application Configuration
- `NODE_ENV` - Application environment (development, staging, production)
- `PORT` - Server port (default: 3000)
- `NEXT_PUBLIC_ENVIRONMENT` - Public environment identifier
- `NEXT_PUBLIC_API_URL` - GraphQL API endpoint URL

#### Authentication
- `AUTH_SERVICE_URL` - Cvent authentication service endpoint
- `JWT_SECRET` - JWT token validation secret
- `SESSION_SECRET` - Session encryption secret

#### Feature Flags
- `LAUNCHDARKLY_SDK_KEY` - LaunchDarkly SDK key
- `LAUNCHDARKLY_ENVIRONMENT` - LaunchDarkly environment

#### External Services
- `PASSKEY_API_BASE_URL` - Base URL for Passkey services
- `REDIS_URL` - Redis connection string for sessions and caching
- `DATADOG_API_KEY` - Datadog API key for monitoring

#### AWS Configuration
- `AWS_REGION` - AWS region for services
- `AWS_ACCOUNT_ID` - AWS account identifier
- `SECRETS_MANAGER_PREFIX` - Prefix for AWS Secrets Manager

### Configuration Files

#### Next.js Configuration (`next.config.mjs`)
```javascript
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@cvent/logging']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: '/api/graphql'
      }
    ];
  }
};
```

#### Nx Configuration (`nx.json`)
```json
{
  "extends": "@nx/workspace/presets/npm.json",
  "targetDefaults": {
    "build": {
      "cache": true
    },
    "test": {
      "cache": true
    }
  },
  "generators": {
    "@nx/react": {
      "application": {
        "style": "emotion",
        "linter": "eslint",
        "bundler": "webpack"
      }
    }
  }
}
```

#### TypeScript Configuration (`tsconfig.json`)
```json
{
  "extends": "@cvent/tsconfig/base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Database Schema

### Data Storage Strategy

The application primarily acts as a gateway service and does not maintain its own persistent database. Instead, it:

1. **Caches data** in Redis for performance optimization
2. **Retrieves data** from upstream Passkey services via REST APIs
3. **Stores session data** in Redis for user state management
4. **Manages configuration** through AWS Systems Manager Parameter Store

### Redis Schema

#### Session Storage
```
Key Pattern: session:{sessionId}
Value: JSON object containing user session data
TTL: 24 hours
```

#### GraphQL Query Cache
```
Key Pattern: gql:cache:{queryHash}
Value: Serialized GraphQL response
TTL: 300 seconds (5 minutes)
```

#### Feature Flag Cache
```
Key Pattern: ff:{userId}:{flagKey}
Value: Boolean flag value
TTL: 60 seconds
```

## API Integration

### Upstream Services

#### Passkey Services Integration
- **Base URL**: Configurable via environment variables
- **Authentication**: Service-to-service JWT tokens
- **Retry Logic**: Exponential backoff with circuit breaker
- **Timeout**: 30 seconds for API calls
- **Rate Limiting**: Respects upstream service limits

#### Auth Service Integration
- **Protocol**: OAuth 2.0 / JWT
- **Token Validation**: Real-time validation with caching
- **Role Resolution**: User roles fetched and cached
- **Session Management**: Stateless JWT with Redis session store

### Data Sources Architecture

```typescript
// Example data source implementation
class PasskeyDataSource extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = process.env.PASSKEY_API_BASE_URL;
  }

  willSendRequest(request) {
    request.headers.set('Authorization', `Bearer ${this.context.token}`);
    request.headers.set('Content-Type', 'application/json');
  }

  async getBlockRequestConfig(requestId: number) {
    return this.get(`/api/v1/block-requests/${requestId}/config`);
  }
}
```

## Performance Optimization

### Caching Strategy

#### GraphQL Response Caching
- **Level**: Query-level caching with cache control directives
- **Duration**: 300 seconds for configuration data
- **Invalidation**: Time-based expiration
- **Storage**: Redis cluster for distributed caching

#### Static Asset Optimization
- **Next.js Image Optimization**: Automatic image resizing and format optimization
- **Bundle Splitting**: Automatic code splitting for optimal loading
- **Tree Shaking**: Unused code elimination
- **Compression**: Gzip compression for all text assets

#### Database Query Optimization
- **Connection Pooling**: Reuse of database connections
- **Query Batching**: DataLoader pattern for N+1 query prevention
- **Lazy Loading**: On-demand data fetching

### Memory Management

- **Heap Size**: Configured based on container resources
- **Garbage Collection**: Optimized for low-latency applications
- **Memory Monitoring**: Datadog memory usage tracking
- **Leak Detection**: Automated memory leak detection in non-production

## Security

### Authentication & Authorization

#### JWT Token Validation
```typescript
const validateToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new AuthenticationError('Invalid token');
  }
};
```

#### Role-Based Access Control
```typescript
const requireRole = (requiredRoles: string[]) => {
  return (resolver) => {
    return (parent, args, context) => {
      if (!context.user?.roles?.some(role => requiredRoles.includes(role))) {
        throw new ForbiddenError('Insufficient permissions');
      }
      return resolver(parent, args, context);
    };
  };
};
```

### Data Protection

#### Input Validation
- **GraphQL Schema Validation**: Automatic type checking
- **Custom Validators**: Business rule validation
- **Sanitization**: Input sanitization to prevent injection attacks
- **Rate Limiting**: Request rate limiting per user/IP

#### Secure Headers
```typescript
// Security headers configuration
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'"
};
```

## Monitoring & Logging

### Application Performance Monitoring

#### Datadog Integration
```typescript
import tracer from 'dd-trace';

tracer.init({
  service: 'passkey-autoblock-apollo',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION
});
```

#### Custom Metrics
```typescript
import { StatsD } from 'hot-shots';

const statsD = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'passkey.autoblock.'
});

// Track GraphQL query performance
statsD.timing('graphql.query.duration', duration, {
  query: queryName,
  success: success.toString()
});
```

### Structured Logging

```typescript
import { Logger } from '@cvent/logging';

const logger = new Logger({
  service: 'passkey-autoblock-apollo',
  level: process.env.LOG_LEVEL || 'info'
});

logger.info('GraphQL query executed', {
  query: queryName,
  duration: executionTime,
  userId: context.user?.id,
  correlationId: context.correlationId
});
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      redis: await checkRedisHealth(),
      passkeyApi: await checkPasskeyApiHealth()
    }
  };
  
  res.json(health);
});
```

## Build & Deployment

### Build Process

#### Nx Build Pipeline
```bash
# Install dependencies
pnpm install

# Generate GraphQL types
pnpm nx run model:codegen

# Build application
pnpm nx build passkey-autoblock-apollo

# Run tests
pnpm nx test passkey-autoblock-apollo

# Build Docker image
pnpm nx run passkey-autoblock-apollo:docker-build
```

#### Docker Configuration
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Deployment Strategy

#### Blue-Green Deployment
- **Zero Downtime**: Seamless switching between environments
- **Rollback Capability**: Instant rollback to previous version
- **Health Checks**: Automated health verification before traffic switch

#### Environment Promotion
1. **Development**: Continuous deployment from main branch
2. **Staging**: Manual promotion with automated testing
3. **Production**: Manual promotion with approval gates

### Infrastructure as Code

#### AWS CDK Stack
```typescript
export class PasskeyAutoblockStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // ECS Fargate service
    const service = new ApplicationLoadBalancedFargateService(this, 'Service', {
      taskImageOptions: {
        image: ContainerImage.fromRegistry('passkey-autoblock-apollo:latest'),
        containerPort: 3000,
        environment: {
          NODE_ENV: 'production'
        }
      },
      memoryLimitMiB: 1024,
      cpu: 512,
      desiredCount: 2
    });

    // Auto scaling
    const scaling = service.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70
    });
  }
}
```
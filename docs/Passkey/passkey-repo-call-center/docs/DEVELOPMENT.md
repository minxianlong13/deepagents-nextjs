# Development Guide

## Prerequisites

### Required Tools
- **ASDF**: Version manager for Node.js and other tools
- **Node.js**: 18.x (specified in `.tool-versions`)
- **pnpm**: Package manager (installed via ASDF)
- **Docker**: For containerized services (Rancher Desktop recommended)
- **Redis**: Local Redis server for caching

### Cvent-Specific Tools
- **oktaws**: AWS credential management
- **Rancher Desktop**: Docker alternative for macOS

### Installation
```bash
# Install ASDF and required tools
asdf install

# Install Redis (macOS)
brew install redis

# Verify installations
node --version    # Should be 18.x
pnpm --version    # Should be latest
redis-server --version
```

## Local Setup

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/cvent-internal/passkey-call-center.git
cd passkey-call-center

# Install all dependencies
pnpm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp packages/app/.env.local.example packages/app/.env.local

# Edit with your specific values
vim packages/app/.env.local
```

### Required Environment Variables
```bash
# Core Application
NODE_ENV=development
PORT=3000

# Authentication (get from Backstage)
API_KEY=<staging-api-key-from-backstage>

# Elasticsearch (contact Steakholders team for password)
ES_HOST=<elasticsearch-staging-host>
ES_USER=<elasticsearch-user>
ES_PASS=<elasticsearch-password>

# LaunchDarkly (get SDK key from LaunchDarkly dashboard)
LAUNCHDARKLY_PROJECT_SDK_KEY=<development-sdk-key>
CHECK_LD_FIND_RES=false  # Skip flag checks for local dev

# Legacy Integration
RESDESK_URL=<staging-resdesk-url>

# Redis
REDIS_URL=redis://localhost:6379
```

### 3. Start Services
```bash
# Start Redis server (in separate terminal)
redis-server

# Start the application
pnpm dev
```

The application will be available at http://localhost:3000

## Development Workflow

### Running the Application
```bash
# Development mode with hot reload
pnpm dev

# Production build locally
pnpm build
pnpm start

# Run in Docker
pnpm dev:docker
```

### Code Generation
```bash
# Generate GraphQL types from schema
pnpm generate
```

### Testing
```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run E2E tests
pnpm e2e

# Run integration tests
pnpm --prefix packages/it test
```

### Code Quality
```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm fix

# Format code
pnpm format

# Run all quality checks
pnpm verify
```

## Project Structure

```
passkey-call-center/
├── packages/
│   ├── app/                    # Main Next.js application
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Next.js pages
│   │   │   ├── resolvers/      # GraphQL resolvers
│   │   │   ├── datasources/    # Data access layer
│   │   │   ├── config/         # Configuration
│   │   │   └── util/           # Utility functions
│   │   ├── public/             # Static assets
│   │   ├── locales/            # Internationalization
│   │   └── .storybook/         # Storybook configuration
│   ├── model/                  # Shared TypeScript types
│   │   └── src/                # GraphQL schema and types
│   ├── infra/                  # AWS CDK infrastructure
│   ├── e2e/                    # End-to-end tests
│   ├── it/                     # Integration tests
│   └── dev-tools/              # Development utilities
├── docs/                       # Documentation
└── .changeset/                 # Changeset configuration
```

### Key Directories

#### `packages/app/src/`
- **components/**: Reusable React components
- **pages/**: Next.js pages and API routes
- **resolvers/**: GraphQL resolvers organized by domain
- **datasources/**: Data access layer (Elasticsearch, REST APIs)
- **config/**: Application configuration and environment setup
- **util/**: Shared utility functions and helpers

#### `packages/model/src/`
- GraphQL schema definitions (`.graphql` files)
- Generated TypeScript types
- Shared interfaces and enums

## Authentication & Authorization

### Local Authentication
1. Navigate to http://localhost:3000/login
2. Sign in with your Resdesk username and password
3. You'll be redirected to the main application
4. The `cvent-auth` cookie will be set for API access

### Session Management
- Sessions expire after 60 minutes
- Re-authenticate by visiting `/login` again
- Session data is stored in Redis

### LaunchDarkly Integration
```bash
# Skip feature flag checks (recommended for development)
CHECK_LD_FIND_RES=false

# Enable feature flag evaluation (for testing flags)
CHECK_LD_FIND_RES=true
```

When enabled, the app checks the `enable-find-reservations` flag based on your user context.

## GraphQL Development

### Schema Location
GraphQL schema files are in `packages/model/src/`:
- `schema.graphql`: Main schema
- Domain-specific schema files

### Adding New Resolvers
1. Create resolver file in `packages/app/src/resolvers/{domain}/`
2. Implement resolver functions
3. Add to resolver map in main resolver index
4. Run `pnpm generate` to update types

### GraphQL Playground
Access the GraphQL Playground at http://localhost:3000/api/graphql

Example query:
```graphql
query SearchReservations($input: ReservationSearchInput!) {
  searchReservations(input: $input) {
    reservations {
      id
      confirmationNumber
      guestName
      hotelName
    }
    totalCount
  }
}
```

## Component Development

### Storybook
```bash
# Start Storybook
pnpm storybook
```

Access at http://localhost:6006

### Component Guidelines
- Use Carina design system components
- Follow atomic design principles
- Include TypeScript interfaces for props
- Add Storybook stories for complex components
- Write unit tests for business logic

### Example Component Structure
```typescript
// components/ReservationCard/ReservationCard.tsx
import { Card } from '@cvent/carina';
import { Reservation } from '@cvent/passkey-call-center-model';

interface ReservationCardProps {
  reservation: Reservation;
  onSelect?: (id: string) => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onSelect
}) => {
  return (
    <Card>
      {/* Component implementation */}
    </Card>
  );
};
```

## Data Access Patterns

### Elasticsearch Queries
```typescript
// datasources/ReservationDataSource.ts
import { ElasticsearchDataSource } from '@cvent/elasticsearch-client';

export class ReservationDataSource extends ElasticsearchDataSource {
  async searchReservations(criteria: SearchCriteria) {
    const query = {
      bool: {
        must: [
          // Build query based on criteria
        ]
      }
    };
    
    return this.search({
      index: 'reservations',
      body: { query }
    });
  }
}
```

### Redis Caching
```typescript
// util/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cacheGet = async (key: string) => {
  return redis.get(key);
};

export const cacheSet = async (key: string, value: string, ttl = 3600) => {
  return redis.setex(key, ttl, value);
};
```

## Debugging

### VS Code Configuration
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/packages/app",
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    }
  ]
}
```

### Logging
```typescript
import { logger } from '@cvent/logging';

// Structured logging
logger.info('Processing reservation search', {
  userId: user.id,
  searchCriteria: criteria,
  correlationId: req.headers['x-correlation-id']
});

// Error logging
logger.error('Failed to search reservations', {
  error: error.message,
  stack: error.stack,
  userId: user.id
});
```

### Common Debug Commands
```bash
# Enable debug logging
DEBUG=* pnpm dev

# Check Redis connection
redis-cli ping

# Test Elasticsearch connection
curl -X GET "localhost:9200/_cluster/health"

# View application logs
tail -f logs/application.log
```

## Testing Guidelines

### Unit Tests
- Use Jest with React Testing Library
- Test business logic and component behavior
- Mock external dependencies
- Aim for >80% code coverage

```typescript
// __tests__/ReservationCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ReservationCard } from '../ReservationCard';

describe('ReservationCard', () => {
  it('displays reservation information', () => {
    const reservation = {
      id: '123',
      confirmationNumber: 'ABC123',
      guestName: 'John Doe'
    };
    
    render(<ReservationCard reservation={reservation} />);
    
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Integration Tests
- Test GraphQL resolvers with real data sources
- Use test databases/indices
- Verify end-to-end data flow

### E2E Tests
- Use WebdriverIO for browser automation
- Test critical user journeys
- Run against staging environment

## Coding Standards

### TypeScript
- Use strict mode
- Define interfaces for all data structures
- Avoid `any` type
- Use meaningful variable names

### React
- Use functional components with hooks
- Implement proper error boundaries
- Follow React best practices for performance

### GraphQL
- Use descriptive field names
- Implement proper error handling
- Add documentation to schema fields

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/reservation-search

# Make changes and commit
git add .
git commit -m "feat: add reservation search functionality"

# Push and create PR
git push origin feature/reservation-search
```

## Common Tasks

### Adding a New GraphQL Endpoint
1. Define schema in `packages/model/src/`
2. Create resolver in `packages/app/src/resolvers/`
3. Add data source if needed
4. Run `pnpm generate` to update types
5. Add tests
6. Update documentation

### Adding a New React Component
1. Create component in `packages/app/src/components/`
2. Add TypeScript interfaces
3. Create Storybook story
4. Add unit tests
5. Export from index file

### Updating Dependencies
```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm add @cvent/carina@latest

# Check for outdated packages
pnpm outdated
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

#### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping

# Start Redis if not running
redis-server
```

#### GraphQL Type Generation Fails
```bash
# Clear generated files and regenerate
rm -rf packages/model/src/generated
pnpm generate
```

#### Authentication Issues
- Verify API key in `.env.local`
- Check if session cookie is set
- Try logging in again at `/login`

### Getting Help
- **Team Slack**: `#passkey-steak-holders`
- **Framework Support**: `#tech-dev-framework`
- **General Questions**: `#passkey-project-redwood`

### Useful Resources
- [Figma Mockups](https://www.figma.com/file/z6sQXAVTM6uMLevLUvQn2o/Project-Redwood)
- [Cvent Framework Docs](https://framework.docs.cvent.org/)
- [Carina Design System](https://carina.cvent.com/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 18+
- pnpm package manager
- Docker (for local development)

### Local Development
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-call-center.git

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Access the application at http://localhost:3000
```

### Running Tests
```bash
# Run unit tests
pnpm test

# Run end-to-end tests
pnpm e2e

# Run integration tests
pnpm --prefix packages/it test
```

## Service Ownership


| Role      | Team          | Slack Channel            |
|-----------|---------------|--------------------------| 
| Primary   | Steakholders  | `#passkey-steak-holders` |

## Useful Links


- [GitHub Repository](https://github.com/cvent-internal/passkey-call-center)
- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/passkey-cdk/job/passkey-call-center/)
- [Octopus Deployer](https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-call-center)
- [SonarQube](https://sonar.core.cvent.org/dashboard?id=cventpasskey-call-center)
- [Backstage](https://backstage.core.cvent.org/catalog/default/component/passkey-call-center)
- [Datadog APM](https://cvent.datadoghq.com/apm/services/passkey-call-center)
- [Datadog Logs](https://cvent.datadoghq.com/logs?query=service%3Apasskey-call-center)

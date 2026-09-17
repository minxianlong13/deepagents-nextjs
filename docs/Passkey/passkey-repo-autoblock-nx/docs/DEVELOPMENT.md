# Development Guide

## Prerequisites

### Required Software

- **Node.js**: Version 20.19.0 or higher
  ```bash
  # Using nvm (recommended)
  nvm install 20.19.0
  nvm use 20.19.0
  
  # Or download from https://nodejs.org/
  ```

- **pnpm**: Fast, disk space efficient package manager
  ```bash
  npm install -g pnpm@latest
  ```

- **Docker**: For local development services
  ```bash
  # macOS
  brew install --cask docker
  
  # Windows
  # Download Docker Desktop from https://docker.com
  
  # Linux
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  ```

- **AWS CLI**: For infrastructure operations (optional)
  ```bash
  # macOS
  brew install awscli
  
  # Windows/Linux
  pip install awscli
  ```

### Development Tools (Recommended)

- **Visual Studio Code**: With recommended extensions
- **Git**: Version control
- **Postman** or **Insomnia**: API testing
- **Redis CLI**: For cache debugging

### VS Code Extensions

Create `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "graphql.vscode-graphql",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers"
  ]
}
```

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-autoblock-nx.git
cd passkey-autoblock-nx
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm nx --version
```

### 3. Environment Configuration

#### Copy Environment Template
```bash
cp packages/passkey-autoblock-apollo/app/.env.template packages/passkey-autoblock-apollo/app/.env.local
```

#### Configure Environment Variables
Edit `.env.local`:
```bash
# Application
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_ENVIRONMENT=development

# External Services (use development endpoints)
AUTH_SERVICE_URL=https://auth-dev.core.cvent.org
PASSKEY_API_BASE_URL=https://passkey-api-dev.core.cvent.org

# Local Redis (via Docker)
REDIS_URL=redis://localhost:6379

# Feature Flags (development keys)
LAUNCHDARKLY_SDK_KEY=your-dev-sdk-key
LAUNCHDARKLY_ENVIRONMENT=development

# Monitoring (optional for local development)
DATADOG_API_KEY=your-dev-api-key
LOG_LEVEL=debug
```

### 4. Start Local Services

#### Start Redis with Docker
```bash
# Start Redis container
docker run -d \
  --name passkey-redis \
  -p 6379:6379 \
  redis:7-alpine

# Verify Redis is running
docker ps | grep redis
```

#### Alternative: Docker Compose
Create `docker-compose.local.yml`:
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

Start services:
```bash
docker-compose -f docker-compose.local.yml up -d
```

### 5. Generate GraphQL Types

```bash
# Generate TypeScript types from GraphQL schema
pnpm nx run model:codegen
```

### 6. Start Development Server

```bash
# Start the application in development mode
pnpm nx serve passkey-autoblock-apollo

# Or with specific port
pnpm nx serve passkey-autoblock-apollo --port 3001
```

The application will be available at:
- **Main App**: http://localhost:3000
- **GraphQL Playground**: http://localhost:3000/api/graphql
- **Health Check**: http://localhost:3000/health

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests for specific project
pnpm nx test passkey-autoblock-apollo

# Run tests in watch mode
pnpm nx test passkey-autoblock-apollo --watch

# Run tests with coverage
pnpm nx test passkey-autoblock-apollo --coverage
```

### Integration Tests

```bash
# Run integration tests
pnpm nx run passkey-autoblock-apollo:ci:test

# Run specific integration test suite
pnpm nx run passkey-autoblock-apollo:ci:test --testNamePattern="GraphQL API"
```

### End-to-End Tests

```bash
# Start application first
pnpm nx serve passkey-autoblock-apollo &

# Run E2E tests
pnpm nx run passkey-autoblock-apollo:e2e

# Run E2E tests with specific browser
pnpm nx run passkey-autoblock-apollo:e2e --browser chrome
```

### Test Configuration

#### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  displayName: 'passkey-autoblock-apollo',
  preset: '@cvent/jest-config',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Code Structure

### Project Organization

```
packages/passkey-autoblock-apollo/
├── app/                          # Next.js application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── common/         # Shared components
│   │   │   ├── forms/          # Form components
│   │   │   └── layout/         # Layout components
│   │   ├── pages/              # Next.js pages and API routes
│   │   │   ├── api/            # API endpoints
│   │   │   │   └── graphql.ts  # GraphQL endpoint
│   │   │   ├── _app.tsx        # App component
│   │   │   └── index.tsx       # Home page
│   │   ├── resolvers/          # GraphQL resolvers
│   │   │   ├── autoblock-data/ # Autoblock resolvers
│   │   │   ├── hotel-info/     # Hotel resolvers
│   │   │   └── util/           # Shared resolver utilities
│   │   ├── data-sources/       # External API clients
│   │   │   ├── passkey-api.ts  # Passkey service client
│   │   │   └── auth-service.ts # Auth service client
│   │   ├── config/             # Configuration management
│   │   │   ├── apollo.ts       # Apollo server config
│   │   │   ├── auth.ts         # Authentication config
│   │   │   └── redis.ts        # Redis configuration
│   │   ├── navigation/         # Navigation components
│   │   ├── launchdarkly/       # Feature flag utilities
│   │   └── stories/            # Storybook stories
│   ├── public/                 # Static assets
│   ├── locales/                # Internationalization files
│   └── __tests__/              # Test files
├── model/                       # GraphQL schema and types
│   └── src/
│       ├── schema/             # GraphQL schema definitions
│       ├── operations/         # GraphQL operations
│       ├── types/              # Generated TypeScript types
│       └── gql/                # Generated GraphQL files
├── e2e/                        # End-to-end tests
├── it/                         # Integration tests
└── infra/                      # Infrastructure as code
```

### Naming Conventions

#### Files and Directories
- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Types**: PascalCase (`UserType.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`

#### Code
- **Variables**: camelCase (`userName`)
- **Functions**: camelCase (`getUserData`)
- **Classes**: PascalCase (`UserService`)
- **Interfaces**: PascalCase with 'I' prefix (`IUserData`)
- **Types**: PascalCase (`UserRole`)
- **Enums**: PascalCase (`UserStatus`)

## Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface UserData {
  id: number;
  name: string;
  email: string;
  roles: UserRole[];
}

// Use types for unions and computed types
type UserRole = 'admin' | 'user' | 'guest';
type UserWithPermissions = UserData & {
  permissions: string[];
};

// Use enums for constants
enum ApiStatus {
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}
```

#### Function Signatures
```typescript
// Prefer explicit return types
const fetchUserData = async (userId: number): Promise<UserData> => {
  // Implementation
};

// Use generic types appropriately
const createApiClient = <T>(baseUrl: string): ApiClient<T> => {
  // Implementation
};
```

### React Guidelines

#### Component Structure
```typescript
import React from 'react';
import { styled } from '@emotion/styled';

// Props interface
interface UserProfileProps {
  user: UserData;
  onEdit?: (user: UserData) => void;
  className?: string;
}

// Styled components
const Container = styled.div`
  padding: 16px;
  border-radius: 8px;
`;

// Main component
export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onEdit,
  className
}) => {
  // Hooks at the top
  const [isEditing, setIsEditing] = React.useState(false);

  // Event handlers
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Render
  return (
    <Container className={className}>
      {/* Component content */}
    </Container>
  );
};
```

#### Hooks Usage
```typescript
// Custom hooks
const useUserData = (userId: number) => {
  const [user, setUser] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchUserData(userId)
      .then(setUser)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
};
```

### GraphQL Guidelines

#### Schema Definitions
```typescript
// Use descriptive names and comments
export default gql`
  """
  Configuration properties for autoblock requests
  """
  type AutoblockRequestConfigProperties {
    """
    Human-readable name for the block request
    """
    requestName: String!
    
    """
    Unique identifier for the associated event
    """
    eventId: Int!
    
    # Use appropriate scalar types
    startDate: String! # ISO 8601 date
    endDate: String!   # ISO 8601 date
    
    # Use arrays for collections
    participatingHotels: [Int]!
  }
`;
```

#### Resolver Implementation
```typescript
// Resolver with proper typing
const resolvers: Resolvers = {
  Query: {
    blockRequestConfigProperties: async (
      _parent,
      _args,
      context: GraphQLContext
    ): Promise<AutoblockRequestConfigProperties> => {
      // Validate authentication
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check permissions
      if (!context.user.roles.includes('FULL_SITE_ACCESS')) {
        throw new ForbiddenError('Insufficient permissions');
      }

      // Fetch data
      return context.dataSources.passkeyApi.getBlockRequestConfig();
    }
  }
};
```

## Common Tasks

### Adding a New GraphQL Query

1. **Define Schema** (`packages/passkey-autoblock-apollo/model/src/schema/`)
```typescript
// new-feature.ts
export default gql`
  extend type Query {
    newFeatureData: NewFeatureData
  }
  
  type NewFeatureData {
    id: Int!
    name: String!
  }
`;
```

2. **Create Resolver** (`packages/passkey-autoblock-apollo/app/src/resolvers/`)
```typescript
// new-feature/index.ts
export const newFeatureResolvers = {
  Query: {
    newFeatureData: async (_parent, _args, context) => {
      return context.dataSources.passkeyApi.getNewFeatureData();
    }
  }
};
```

3. **Add Data Source Method**
```typescript
// data-sources/passkey-api.ts
class PasskeyApiDataSource extends RESTDataSource {
  async getNewFeatureData() {
    return this.get('/api/v1/new-feature');
  }
}
```

4. **Generate Types**
```bash
pnpm nx run model:codegen
```

5. **Add Tests**
```typescript
// __tests__/new-feature.test.ts
describe('New Feature Query', () => {
  it('should return new feature data', async () => {
    // Test implementation
  });
});
```

### Adding a New React Component

1. **Create Component File**
```typescript
// src/components/NewComponent.tsx
import React from 'react';
import { styled } from '@emotion/styled';

interface NewComponentProps {
  title: string;
  onAction?: () => void;
}

const Container = styled.div`
  /* Styles */
`;

export const NewComponent: React.FC<NewComponentProps> = ({
  title,
  onAction
}) => {
  return (
    <Container>
      <h2>{title}</h2>
      {onAction && (
        <button onClick={onAction}>Action</button>
      )}
    </Container>
  );
};
```

2. **Create Storybook Story**
```typescript
// src/stories/NewComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { NewComponent } from '../components/NewComponent';

const meta: Meta<typeof NewComponent> = {
  title: 'Components/NewComponent',
  component: NewComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Default Title',
  },
};

export const WithAction: Story = {
  args: {
    title: 'With Action',
    onAction: () => alert('Action clicked!'),
  },
};
```

3. **Add Tests**
```typescript
// __tests__/NewComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NewComponent } from '../components/NewComponent';

describe('NewComponent', () => {
  it('renders title correctly', () => {
    render(<NewComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', () => {
    const mockAction = jest.fn();
    render(<NewComponent title="Test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByText('Action'));
    expect(mockAction).toHaveBeenCalled();
  });
});
```

### Adding Environment Variables

1. **Add to Environment Template**
```bash
# .env.template
NEW_FEATURE_ENABLED=false
NEW_API_ENDPOINT=https://api.example.com
```

2. **Update Type Definitions**
```typescript
// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEW_FEATURE_ENABLED: string;
    NEW_API_ENDPOINT: string;
  }
}
```

3. **Use in Configuration**
```typescript
// src/config/features.ts
export const featureConfig = {
  newFeatureEnabled: process.env.NEW_FEATURE_ENABLED === 'true',
  newApiEndpoint: process.env.NEW_API_ENDPOINT || 'https://default-api.com'
};
```

## Debugging

### VS Code Debug Configuration

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
      "cwd": "${workspaceFolder}/packages/passkey-autoblock-apollo/app",
      "env": {
        "NODE_OPTIONS": "--inspect"
      },
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "ready - started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### GraphQL Debugging

#### Enable GraphQL Playground
```typescript
// pages/api/graphql.ts
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production'
});
```

#### Debug Resolvers
```typescript
const resolvers = {
  Query: {
    exampleQuery: async (parent, args, context) => {
      console.log('Resolver called with:', { parent, args, context });
      
      try {
        const result = await context.dataSources.api.getData();
        console.log('API result:', result);
        return result;
      } catch (error) {
        console.error('Resolver error:', error);
        throw error;
      }
    }
  }
};
```

### Redis Debugging

```bash
# Connect to Redis CLI
redis-cli -h localhost -p 6379

# List all keys
KEYS *

# Get specific key
GET "session:abc123"

# Monitor Redis commands
MONITOR
```

### Application Logs

```bash
# View application logs
pnpm nx serve passkey-autoblock-apollo | bunyan

# Filter logs by level
pnpm nx serve passkey-autoblock-apollo | bunyan -l warn

# View structured logs
pnpm nx serve passkey-autoblock-apollo | jq '.'
```

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
pnpm nx run passkey-autoblock-apollo:analyze

# Generate bundle report
ANALYZE=true pnpm nx build passkey-autoblock-apollo
```

### Performance Monitoring

```typescript
// Add performance marks
performance.mark('graphql-query-start');
const result = await executeQuery();
performance.mark('graphql-query-end');

performance.measure(
  'graphql-query-duration',
  'graphql-query-start',
  'graphql-query-end'
);
```

### Memory Profiling

```bash
# Start with memory profiling
node --inspect --max-old-space-size=4096 node_modules/.bin/next dev

# Generate heap snapshot
kill -USR2 <process-id>
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

#### Redis Connection Issues
```bash
# Check Redis status
docker ps | grep redis

# Restart Redis
docker restart passkey-redis

# Check Redis logs
docker logs passkey-redis
```

#### GraphQL Schema Issues
```bash
# Clear generated files
rm -rf packages/passkey-autoblock-apollo/model/src/types/generated

# Regenerate types
pnpm nx run model:codegen
```

#### Node Modules Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Getting Help

- **Internal Documentation**: Check Confluence for team-specific guides
- **Slack Channels**: 
  - `#passkey-dev` - Development questions
  - `#metre-stick` - Team channel
- **Code Reviews**: Create PR for feedback
- **Pair Programming**: Schedule sessions with team members

## Additional Resources

## Quick Start


### Prerequisites
- Node.js >= 20.19.0
- pnpm package manager
- Docker (for local development)

### Local Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm nx serve passkey-autoblock-apollo

# Run tests
pnpm test

# Build application
pnpm build
```

## Links


- **GitHub**: https://github.com/cvent-internal/passkey-autoblock-nx
- **Jenkins**: https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PC)/job/passkey-autoblock-nx
- **Datadog**: https://cvent.datadoghq.com/apm/entity/service%3Apasskey-autoblock-apollo
- **Octopus Deploy**: https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-autoblock-apollo/deployments

## Team


- **Owner**: metre-stick team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels

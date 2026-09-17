# Development Guide

## Prerequisites

### Required Software
- **Node.js 18+**: JavaScript runtime (managed via asdf)
- **pnpm**: Package manager for efficient dependency management
- **Docker**: Container runtime for local development
- **Git**: Version control system
- **asdf**: Runtime version manager

### Development Tools (Recommended)
- **Visual Studio Code**: IDE with TypeScript and React extensions
- **Chrome DevTools**: Browser debugging and performance analysis
- **Postman**: API testing and GraphQL query development
- **DataDog Browser Extension**: Performance monitoring during development

### System Requirements
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: 5GB free space for dependencies and build artifacts
- **Network**: Stable internet connection for package downloads and API calls

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-admin.git
cd passkey-admin
```

### 2. Install Runtime Dependencies
```bash
# Install Node.js version specified in .tool-versions
asdf install

# Verify installation
node --version  # Should match version in .tool-versions
pnpm --version  # Should be latest stable version
```

### 3. Install Project Dependencies
```bash
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

### 4. Environment Configuration
```bash
# Navigate to app package
cd packages/app

# Copy environment template
cp .env.template .env.development

# Edit environment variables
# Replace placeholder values with actual configuration
vim .env.development
```

Required environment variables:
```bash
# Authentication (obtain from team)
API_KEY=your-actual-api-key-here

# GraphQL endpoint
GRAPHQL_ENDPOINT=https://api-dev.cvent.com/graphql

# LaunchDarkly (obtain from team)
LAUNCHDARKLY_SDK_KEY=your-launchdarkly-key
LAUNCHDARKLY_CLIENT_ID=your-client-id

# Development settings
NODE_ENV=development
LOG_LEVEL=debug
NEXT_PUBLIC_APP_ENV=development
```

### 5. Build and Start Development Server
```bash
# Build the project
pnpm build

# Start development server with hot reload
pnpm dev

# Alternative: Start with debug logging
pnpm dev:debug
```

### 6. Verify Setup
- Open browser to `http://localhost:3000`
- Check console for any errors
- Verify authentication flow works
- Test GraphQL connectivity

## Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test src/components/Button.test.tsx
```

### End-to-End Tests
```bash
# Run E2E tests (requires app to be running)
cd packages/e2e
pnpm test

# Run E2E tests with specific browser
pnpm test --browser=chrome

# Run E2E tests headlessly
pnpm test --headless
```

### Integration Tests
```bash
# Run integration tests
cd packages/it
pnpm test

# Run with specific environment
pnpm test --env=development
```

### Linting and Formatting
```bash
# Run ESLint
pnpm lint

# Fix linting issues automatically
pnpm fix

# Format code with Prettier
pnpm exec -- prettier --write .

# Check formatting
pnpm exec -- prettier --check .
```

## Code Structure

### Monorepo Organization
```
passkey-admin/
├── packages/
│   ├── app/                 # Main Next.js application
│   │   ├── src/
│   │   │   ├── app/        # Next.js App Router pages
│   │   │   ├── components/ # Reusable React components
│   │   │   ├── graphql/    # GraphQL queries and mutations
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── config/     # Configuration files
│   │   │   ├── util/       # Utility functions
│   │   │   └── styles/     # Global styles
│   │   ├── public/         # Static assets
│   │   └── locales/        # i18n translation files
│   ├── infra/              # AWS CDK infrastructure
│   ├── e2e/                # End-to-end tests
│   ├── it/                 # Integration tests
│   └── model/              # Shared TypeScript models
├── docs/                   # Documentation
└── .changeset/             # Changeset configuration
```

### Component Organization
```
src/components/
├── atoms/                  # Basic building blocks
│   ├── Button/
│   ├── Input/
│   └── Icon/
├── molecules/              # Simple component combinations
│   ├── SearchBox/
│   ├── FormField/
│   └── Card/
├── organisms/              # Complex component combinations
│   ├── Header/
│   ├── Sidebar/
│   └── DataTable/
└── templates/              # Page-level layouts
    ├── DashboardLayout/
    └── AuthLayout/
```

### GraphQL Organization
```
src/graphql/
├── queries/                # GraphQL queries
│   ├── idp.queries.ts
│   └── user.queries.ts
├── mutations/              # GraphQL mutations
│   ├── idp.mutations.ts
│   └── user.mutations.ts
├── subscriptions/          # GraphQL subscriptions
├── fragments/              # Reusable query fragments
├── types/                  # Generated TypeScript types
└── client.ts               # Apollo Client configuration
```

## Coding Standards

### TypeScript Guidelines
```typescript
// Use explicit types for function parameters and return values
function createUser(userData: CreateUserInput): Promise<User> {
  return userService.create(userData);
}

// Use interfaces for object shapes
interface IdpConfiguration {
  id: string;
  name: string;
  type: IdpType;
  status: IdpStatus;
}

// Use enums for constants
enum IdpStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

// Use generic types for reusable components
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}
```

### React Component Guidelines
```typescript
// Use functional components with hooks
const IdpConfigurationForm: React.FC<IdpConfigurationFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState(initialData);
  
  // Custom hooks for complex logic
  const { loading, error, submitForm } = useIdpForm();
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Component JSX */}
    </form>
  );
};

// Export with display name for debugging
IdpConfigurationForm.displayName = 'IdpConfigurationForm';
export default IdpConfigurationForm;
```

### GraphQL Guidelines
```typescript
// Use fragments for reusable field selections
const IDP_FRAGMENT = gql`
  fragment IdpFields on IdpConfiguration {
    id
    name
    type
    status
    entityId
    ssoUrl
  }
`;

// Use typed queries with generated types
const GET_IDP_CONFIGURATION = gql`
  query GetIdpConfiguration($id: ID!) {
    idpConfiguration(id: $id) {
      ...IdpFields
      configuration {
        attributeMapping {
          email
          firstName
          lastName
        }
      }
    }
  }
  ${IDP_FRAGMENT}
`;

// Use custom hooks for GraphQL operations
const useIdpConfiguration = (id: string) => {
  return useQuery<GetIdpConfigurationQuery, GetIdpConfigurationQueryVariables>(
    GET_IDP_CONFIGURATION,
    { variables: { id } }
  );
};
```

### Styling Guidelines
```typescript
// Use Tailwind classes for styling
const Button: React.FC<ButtonProps> = ({ variant, children, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Use Carina components when available
import { Button, Input, Card } from '@cvent/carina';

const MyComponent = () => (
  <Card>
    <Input placeholder="Enter value" />
    <Button variant="primary">Submit</Button>
  </Card>
);
```

## Common Development Tasks

### Adding a New Page
```bash
# 1. Create page component
mkdir -p packages/app/src/app/new-page
touch packages/app/src/app/new-page/page.tsx

# 2. Implement page component
cat > packages/app/src/app/new-page/page.tsx << 'EOF'
import React from 'react';

const NewPage: React.FC = () => {
  return (
    <div>
      <h1>New Page</h1>
      <p>Page content goes here</p>
    </div>
  );
};

export default NewPage;
EOF

# 3. Add navigation link (if needed)
# Edit packages/app/src/components/Navigation/Navigation.tsx
```

### Adding a New GraphQL Query
```bash
# 1. Define query in appropriate file
cat >> packages/app/src/graphql/queries/example.queries.ts << 'EOF'
export const GET_EXAMPLE_DATA = gql`
  query GetExampleData($filter: ExampleFilter) {
    examples(filter: $filter) {
      id
      name
      status
    }
  }
`;
EOF

# 2. Generate TypeScript types
pnpm graphql:codegen

# 3. Create custom hook
cat >> packages/app/src/hooks/useExampleData.ts << 'EOF'
import { useQuery } from '@apollo/client';
import { GET_EXAMPLE_DATA } from '@/graphql/queries/example.queries';

export const useExampleData = (filter?: ExampleFilter) => {
  return useQuery(GET_EXAMPLE_DATA, {
    variables: { filter },
    errorPolicy: 'all'
  });
};
EOF
```

### Adding a New Component
```bash
# 1. Create component directory
mkdir -p packages/app/src/components/ExampleComponent

# 2. Create component files
touch packages/app/src/components/ExampleComponent/ExampleComponent.tsx
touch packages/app/src/components/ExampleComponent/ExampleComponent.test.tsx
touch packages/app/src/components/ExampleComponent/ExampleComponent.stories.tsx
touch packages/app/src/components/ExampleComponent/index.ts

# 3. Implement component
# Edit the created files with component implementation

# 4. Add to Storybook
pnpm storybook
# Navigate to http://localhost:6006 to see component
```

### Running Storybook
```bash
# Start Storybook development server
cd packages/app
pnpm storybook

# Build Storybook for production
pnpm build-storybook

# Deploy Storybook to static hosting
pnpm deploy-storybook
```

### Database Schema Changes
```bash
# Generate new migration (if applicable)
pnpm migrate:generate --name="add-new-field"

# Run migrations in development
pnpm migrate:up

# Rollback migration
pnpm migrate:down
```

### Adding Feature Flags
```typescript
// 1. Add flag to LaunchDarkly dashboard
// 2. Use flag in component
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const MyComponent = () => {
  const showNewFeature = useFeatureFlag('new-feature-flag');
  
  return (
    <div>
      {showNewFeature && <NewFeatureComponent />}
      <ExistingComponent />
    </div>
  );
};
```

## Debugging

### Browser DevTools
- **React DevTools**: Inspect component state and props
- **Apollo DevTools**: Debug GraphQL queries and cache
- **Network Tab**: Monitor API requests and responses
- **Console**: View application logs and errors

### Server-Side Debugging
```bash
# Start with Node.js debugger
node --inspect packages/app/server.js

# Use VS Code debugger
# Add launch configuration in .vscode/launch.json
```

### Common Issues and Solutions

#### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 pnpm dev
```

#### GraphQL Connection Issues
```bash
# Check GraphQL endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}' \
  $GRAPHQL_ENDPOINT

# Verify authentication
curl -H "Authorization: Bearer $API_KEY" $GRAPHQL_ENDPOINT
```

#### Build Failures
```bash
# Clear build cache
pnpm clean

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for TypeScript errors
pnpm tsc --noEmit
```

## Contributing

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push branch
git push origin feature/new-feature

# Create pull request via GitHub UI
```

### Commit Message Format
```
type(scope): description

feat: add new IDP configuration wizard
fix: resolve authentication redirect issue
docs: update API documentation
test: add unit tests for user service
refactor: simplify component structure
```

### Pull Request Process
1. **Create Branch**: Feature branch from `development`
2. **Implement Changes**: Follow coding standards
3. **Add Tests**: Unit and integration tests
4. **Update Documentation**: If applicable
5. **Create Changeset**: `pnpm changeset`
6. **Submit PR**: With clear description
7. **Code Review**: Address feedback
8. **Merge**: After approval and CI passes

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 18+ (managed via asdf)
- pnpm package manager
- Docker (for containerized development)

### Local Setup

1. **Install dependencies**:
   ```bash
   asdf install
   pnpm install
   ```

2. **Build the project**:
   ```bash
   pnpm build
   ```

3. **Configure environment**:
   ```bash
   cd packages/app
   # Update .env.development with actual API_KEY value
   ```

4. **Start development server**:
   ```bash
   cd packages/app
   pnpm dev
   ```

5. **Access the application**:
   - Local development: http://localhost:3000
   - Storybook: `pnpm storybook` (port 6006)

## Service Ownership


| Role    | Team   | Slack Channel     |
|---------|--------|-------------------|
| Primary | Maurya | `#passkey-maurya` |

## Useful Links


- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/Incubator/job/passkey-admin/)
- [Octopus Deployer](https://octo.core.cvent.org/app#/Spaces-1/projects/passkey-admin/deployments)
- [Backstage](https://backstage.core.cvent.org/catalog/default/component/passkey-admin)
- [Stash Repository](https://stash.cvent.net/projects/INCB/repos/passkey-admin/browse)

# Development Guide

## Prerequisites

### Required Software

#### Node.js and Package Manager
- **Node.js**: 22+ (managed via asdf)
- **pnpm**: 8+ (enforced via preinstall script)
- **asdf**: Version manager for Node.js

#### Development Tools
- **Git**: Version control
- **VS Code**: Recommended IDE with extensions
- **Docker**: For containerized development (optional)

#### IDE Extensions (VS Code)
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "GraphQL.vscode-graphql",
    "ms-vscode.vscode-jest"
  ]
}
```

### System Requirements
- **OS**: macOS, Linux, or Windows with WSL2
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 10GB free space for dependencies and cache

## Local Setup

### Initial Setup

#### 1. Clone Repository
```bash
git clone https://github.com/cvent-internal/passkey-shared-mono.git
cd passkey-shared-mono
```

#### 2. Install Version Manager
```bash
# Install asdf (if not already installed)
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.12.0

# Add to shell profile
echo '. ~/.asdf/asdf.sh' >> ~/.bashrc
echo '. ~/.asdf/completions/asdf.bash' >> ~/.bashrc

# Restart shell or source profile
source ~/.bashrc
```

#### 3. Install Node.js
```bash
# Install Node.js plugin
asdf plugin add nodejs

# Install Node.js version from .tool-versions
asdf install

# Verify installation
node --version
npm --version
```

#### 4. Install Dependencies
```bash
# Install pnpm globally
npm install -g pnpm@8

# Install project dependencies
pnpm install

# Verify installation
pnpm --version
nx --version
```

### Development Environment Setup

#### Environment Configuration
```bash
# Copy environment template (if exists)
cp .env.template .env.local

# Configure local environment variables
export NODE_ENV=development
export NX_DAEMON=false  # Disable for debugging
```

#### IDE Configuration

##### VS Code Settings (.vscode/settings.json)
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.workingDirectories": ["packages/*"],
  "jest.jestCommandLine": "pnpm test",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.nx": true
  }
}
```

##### Launch Configuration (.vscode/launch.json)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## Running Tests

### Test Commands

#### Run All Tests
```bash
# Run tests for all packages
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode
pnpm test --watch
```

#### Run Specific Package Tests
```bash
# Test specific package
nx test passkey-navigation-model

# Test with coverage
nx test passkey-components --coverage

# Test in watch mode
nx test passkey-navigation-model --watch
```

#### Run Affected Tests Only
```bash
# Test only affected packages
pnpm test

# Test affected with coverage
nx affected --target=test --coverage
```

### Test Types

#### Unit Tests
```bash
# Run unit tests
nx test passkey-components

# Run specific test file
nx test passkey-components --testPathPattern=GlobalNavigation
```

#### Integration Tests
```bash
# Run integration tests (if configured)
nx test passkey-navigation-model --testPathPattern=integration
```

#### E2E Tests
```bash
# Run end-to-end tests (if configured)
nx e2e passkey-components-e2e
```

### Test Debugging

#### Debug in VS Code
1. Set breakpoints in test files
2. Run "Debug Jest Tests" configuration
3. Tests will pause at breakpoints

#### Debug in Terminal
```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand --testPathPattern=GlobalNavigation

# Debug with Chrome DevTools
node --inspect node_modules/.bin/jest --runInBand --testPathPattern=GlobalNavigation
```

## Code Structure

### Repository Organization

```
passkey-shared-mono/
├── .changeset/                 # Version management files
├── .github/                    # GitHub workflows and templates
├── .vscode/                    # VS Code configuration
├── docs/                       # Documentation
├── packages/                   # Individual packages
│   ├── passkey-navigation-model/
│   │   ├── src/
│   │   │   ├── gql/           # Generated GraphQL code
│   │   │   ├── operations/    # GraphQL operations
│   │   │   ├── resolvers/     # GraphQL resolvers
│   │   │   ├── schema/        # GraphQL schema definitions
│   │   │   └── types/         # TypeScript type definitions
│   │   ├── package.json
│   │   ├── project.json       # Nx project configuration
│   │   └── tsconfig.json
│   └── passkey-components/
│       ├── src/
│       │   ├── __tests__/     # Component tests
│       │   ├── GlobalNavigation.tsx
│       │   └── index.ts       # Package exports
│       ├── package.json
│       ├── project.json
│       └── tsconfig.json
├── nx.json                     # Nx workspace configuration
├── package.json               # Root package configuration
├── pnpm-workspace.yaml        # pnpm workspace definition
└── tsconfig.json              # Root TypeScript configuration
```

### Package Structure Guidelines

#### Source Code Organization
```
src/
├── components/        # React components
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── __tests__/        # Test files
└── index.ts          # Main export file
```

#### File Naming Conventions
- **Components**: PascalCase (e.g., `GlobalNavigation.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useNavigation.ts`)
- **Types**: PascalCase (e.g., `NavigationItem.ts`)
- **Utils**: camelCase (e.g., `formatUrl.ts`)
- **Tests**: Same as source with `.test.` suffix

## Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface NavigationItem {
  id: string;
  label: string;
  url?: string;
  children?: NavigationItem[];
}

// Use type aliases for unions and primitives
type NavigationVariant = 'light' | 'dark';
type NavigationId = string;

// Use enums for constants
enum NavigationState {
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}
```

#### Function Definitions
```typescript
// Use function declarations for top-level functions
function processNavigationItems(items: NavigationItem[]): NavigationItem[] {
  return items.filter(item => item.isVisible);
}

// Use arrow functions for callbacks and inline functions
const handleNavigate = useCallback((item: NavigationItem) => {
  onNavigate?.(item);
}, [onNavigate]);
```

#### Import/Export Patterns
```typescript
// Named imports/exports preferred
export { GlobalNavigation } from './GlobalNavigation';
export type { NavigationItem } from './types';

// Default exports for main component
export default GlobalNavigation;

// Barrel exports in index files
export * from './components';
export * from './hooks';
export * from './types';
```

### React Guidelines

#### Component Structure
```typescript
interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  ...props
}) => {
  // Hooks at the top
  const [state, setState] = useState();
  const memoizedValue = useMemo(() => computation, [deps]);
  const callback = useCallback(() => {}, [deps]);

  // Early returns for loading/error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  // Main render
  return (
    <div {...props}>
      {/* Component JSX */}
    </div>
  );
};
```

#### Hook Guidelines
```typescript
// Custom hook naming and structure
export function useNavigation(context: NavigationContext) {
  const [state, setState] = useState<NavigationState>({
    items: [],
    loading: true,
    error: null
  });

  // Effects
  useEffect(() => {
    // Effect logic
  }, [context]);

  // Return stable object
  return useMemo(() => ({
    ...state,
    refresh: () => {/* refresh logic */}
  }), [state]);
}
```

### Testing Guidelines

#### Test Structure
```typescript
describe('ComponentName', () => {
  // Setup
  const defaultProps = {
    prop1: 'value1',
    prop2: 'value2'
  };

  // Helper function
  const renderComponent = (props = {}) => {
    return render(<ComponentName {...defaultProps} {...props} />);
  };

  // Test cases
  it('should render correctly', () => {
    renderComponent();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const onNavigate = jest.fn();
    renderComponent({ onNavigate });
    
    await user.click(screen.getByText('Home'));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({
      label: 'Home'
    }));
  });
});
```

#### Mock Guidelines
```typescript
// Mock external dependencies
jest.mock('@cvent/passkey-navigation-model', () => ({
  useGetNavigationQuery: jest.fn()
}));

// Mock implementation
const mockUseGetNavigationQuery = useGetNavigationQuery as jest.MockedFunction<
  typeof useGetNavigationQuery
>;

beforeEach(() => {
  mockUseGetNavigationQuery.mockReturnValue([
    { data: mockNavigationData, fetching: false, error: undefined },
    jest.fn()
  ]);
});
```

## Common Tasks

### Adding a New Package

#### 1. Generate Package Structure
```bash
# Use Nx generator
nx generate @cvent/cdf:library my-new-package

# Or create manually
mkdir packages/my-new-package
cd packages/my-new-package
```

#### 2. Configure Package
```json
// package.json
{
  "name": "@cvent/my-new-package",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

#### 3. Add to Workspace
```yaml
# pnpm-workspace.yaml (already includes packages/*)
packages:
  - 'packages/*'
```

#### 4. Create Changeset
```bash
pnpm changeset
# Select packages and change type
# Write description of changes
```

### Adding a New Component

#### 1. Create Component File
```typescript
// packages/passkey-components/src/NewComponent.tsx
import React from 'react';

export interface NewComponentProps {
  // Props definition
}

export const NewComponent: React.FC<NewComponentProps> = (props) => {
  return <div>New Component</div>;
};
```

#### 2. Add Tests
```typescript
// packages/passkey-components/src/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { NewComponent } from '../NewComponent';

describe('NewComponent', () => {
  it('should render', () => {
    render(<NewComponent />);
    expect(screen.getByText('New Component')).toBeInTheDocument();
  });
});
```

#### 3. Export Component
```typescript
// packages/passkey-components/src/index.ts
export { NewComponent } from './NewComponent';
export type { NewComponentProps } from './NewComponent';
```

### Adding GraphQL Operations

#### 1. Define Schema
```graphql
# packages/passkey-navigation-model/src/schema/navigation.graphql
type Query {
  navigation(context: NavigationContext!): NavigationResponse!
}
```

#### 2. Create Operation
```graphql
# packages/passkey-navigation-model/src/operations/getNavigation.graphql
query GetNavigation($context: NavigationContext!) {
  navigation(context: $context) {
    items {
      id
      label
      url
    }
  }
}
```

#### 3. Generate Types
```bash
# Run code generation
nx run passkey-navigation-model:codegen

# Or watch for changes
nx run passkey-navigation-model:codegen --watch
```

### Running Quality Checks

#### Linting
```bash
# Lint all packages
pnpm lint

# Lint specific package
nx lint passkey-components

# Fix linting issues
pnpm fix
```

#### Formatting
```bash
# Format all packages
pnpm format

# Format specific files
prettier --write "packages/*/src/**/*.{ts,tsx}"
```

#### Type Checking
```bash
# Type check all packages
nx run-many --target=type-check

# Type check specific package
nx run passkey-components:type-check
```

### Creating a Release

#### 1. Create Changeset
```bash
# Add changeset for changes
pnpm changeset

# Review pending changesets
pnpm changeset status
```

#### 2. Version Packages
```bash
# Update versions (done automatically in CI)
pnpm changeset version
```

#### 3. Publish (Automatic)
- Merge to master branch
- CI pipeline automatically publishes to Nexus
- Packages available for consumption

### Debugging Common Issues

#### Build Issues
```bash
# Clear Nx cache
nx reset

# Clear node_modules
rm -rf node_modules packages/*/node_modules
pnpm install

# Check for circular dependencies
nx graph --file=graph.html
```

#### Test Issues
```bash
# Run tests with verbose output
nx test passkey-components --verbose

# Run tests without cache
nx test passkey-components --skip-cache

# Debug test with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### TypeScript Issues
```bash
# Check TypeScript configuration
nx run passkey-components:type-check

# Build TypeScript incrementally
tsc --build --incremental

# Clear TypeScript cache
rm -rf packages/*/tsconfig.tsbuildinfo
```

## Additional Resources

## Packages


### [@cvent/passkey-navigation-model](packages/passkey-navigation-model/)
A GraphQL model package providing data structures and operations for global navigation in Passkey microfrontend applications. Includes schema definitions, resolvers, and generated TypeScript types.

### [@cvent/passkey-components](packages/passkey-components/)
A React component library providing reusable UI components for Passkey applications, including the GlobalNavigation component for consistent navigation experiences.

## Quick Start


### Prerequisites

- **Node.js**: 22+ (managed via `.tool-versions`)
- **pnpm**: 8+ (enforced via preinstall script)
- **Nx**: Workspace management and task orchestration

### Installation

```bash
# Install version manager plugins
asdf install

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests across all packages
pnpm test
```

### Development Workflow

```bash
# Work on a specific package
cd packages/passkey-navigation-model
pnpm build && pnpm test

# Run affected tasks only
pnpm lint    # Lint affected packages
pnpm format  # Format affected packages
pnpm verify  # Verify affected packages
```

## Repository Structure


```
passkey-shared-mono/
├── packages/                    # Individual packages
│   ├── passkey-navigation-model/   # GraphQL models and types
│   └── passkey-components/         # React UI components
├── .changeset/                  # Version management
├── .github/                     # GitHub workflows and templates
├── docs/                        # Documentation
├── nx.json                      # Nx workspace configuration
├── package.json                 # Root package configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
└── Jenkinsfile                 # CI/CD pipeline configuration
```

## Contributing


1. Create feature branch from `master`
2. Make changes with appropriate tests
3. Add changeset: `pnpm changeset`
4. Submit PR using the provided template
5. Merge triggers automatic release to Nexus

## Ownership


- **Team**: Steakholders
- **Slack Channels**: #passkey-api, #passkey-steakholders-alerts
- **Repository**: [cvent-internal/passkey-shared-mono](https://github.com/cvent-internal/passkey-shared-mono)

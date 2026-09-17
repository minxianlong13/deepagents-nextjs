# Technical Details

## Technology Stack

### Core Framework
- **Monorepo Management**: Nx 20.7.0
- **Package Manager**: pnpm 8+
- **Language**: TypeScript 5.5.3
- **Node.js**: 22+ (managed via asdf)
- **Build System**: Nx with CDF integration

### Frontend Technologies
- **UI Framework**: React 17+
- **Component Testing**: React Testing Library
- **Styling**: CSS Modules / Styled Components
- **Type Generation**: GraphQL Code Generator

### GraphQL Stack
- **Schema Definition**: GraphQL SDL
- **Code Generation**: @graphql-codegen/cli
- **Client Libraries**: urql / Apollo Client compatible
- **Type Safety**: Generated TypeScript definitions

### Development Tools
- **Linting**: ESLint with @cvent/eslint-config
- **Formatting**: Prettier with @cvent/prettier-config
- **Testing**: Jest with @cvent/jest-config
- **Version Management**: Changesets

## Dependencies

### Root Dependencies

#### Development Dependencies
```json
{
  "@changesets/cli": "^2.27.1",
  "@cvent/analytics": "1.9.5",
  "@cvent/builder-changesets": "^1.11.1",
  "@cvent/builder-pnpm": "^1.5.1",
  "@cvent/builder-prettier": "^1.2.13",
  "@cvent/builder-sonar": "^4.3.3",
  "@cvent/cdf": "1.72.9",
  "@cvent/environments": "^1.45.30",
  "@cvent/eslint-config": "2.0.22",
  "@cvent/feature-flags": "2.7.21",
  "@cvent/framework-scripts": "1.5.86",
  "@cvent/jest-config": "1.3.3",
  "@cvent/prettier-config": "1.0.38",
  "@cvent/tsconfig": "2.0.28"
}
```

#### Build Tools
```json
{
  "@swc/core": "^1.3.53",
  "@swc/jest": "^0.2.26",
  "@swc-node/register": "^1.10.10",
  "nx": "20.7.0",
  "typescript": "5.5.3",
  "tsx": "^4.17.0",
  "tsc-alias": "^1.8.8"
}
```

#### Testing Framework
```json
{
  "jest": "^29.2.2",
  "jest-environment-node": "^29.2.2",
  "jest-fetch-mock": "^3.0.3",
  "jest-junit": "^12.3.0",
  "@jest/globals": "^29.2.2",
  "@jest/reporters": "^29.2.2",
  "@jest/types": "^29.2.2"
}
```

### Package-Specific Dependencies

#### passkey-navigation-model
```json
{
  "dependencies": {
    "@graphql-codegen/cli": "^4.0.0",
    "@graphql-codegen/typescript": "^4.0.0",
    "@graphql-codegen/typescript-operations": "^4.0.0",
    "@graphql-codegen/typescript-urql": "^4.0.0",
    "graphql": "^16.0.0"
  }
}
```

#### passkey-components
```json
{
  "dependencies": {
    "react": "^17.0.0 || ^18.0.0",
    "react-dom": "^17.0.0 || ^18.0.0",
    "@cvent/passkey-navigation-model": "workspace:*"
  },
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0",
    "react-dom": "^17.0.0 || ^18.0.0"
  }
}
```

## Configuration

### Workspace Configuration

#### nx.json
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

#### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
```

### TypeScript Configuration

#### Root tsconfig.json
```json
{
  "extends": "@cvent/tsconfig/base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@cvent/passkey-navigation-model": ["packages/passkey-navigation-model/src"],
      "@cvent/passkey-components": ["packages/passkey-components/src"]
    }
  },
  "include": [],
  "references": [
    { "path": "./packages/passkey-navigation-model" },
    { "path": "./packages/passkey-components" }
  ]
}
```

#### Package tsconfig.json
```json
{
  "extends": "@cvent/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.test.tsx", "dist"]
}
```

### Build Configuration

#### CDF Configuration (cdf.config.mjs)
```javascript
export default {
  type: 'library',
  build: {
    formats: ['esm', 'cjs'],
    sourcemap: true,
    declaration: true
  },
  test: {
    coverage: {
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
};
```

### GraphQL Code Generation

#### codegen.ts
```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/schema/**/*.graphql',
  documents: 'src/operations/**/*.graphql',
  generates: {
    'src/gql/': {
      preset: 'client',
      plugins: []
    },
    'src/types/generated.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-urql'
      ]
    }
  }
};

export default config;
```

## Build Process

### Nx Task Pipeline

1. **Affected Analysis**
   ```bash
   nx affected:graph --base=origin/master
   ```

2. **Dependency Resolution**
   ```bash
   nx show projects --affected --base=origin/master
   ```

3. **Parallel Task Execution**
   ```bash
   nx affected --target=build,test,lint --parallel=3
   ```

### Package Build Steps

1. **TypeScript Compilation**
   ```bash
   tsc --build --verbose
   ```

2. **Type Declaration Generation**
   ```bash
   tsc --emitDeclarationOnly --outDir dist/types
   ```

3. **Source Map Generation**
   ```bash
   tsc --sourceMap --declarationMap
   ```

4. **Alias Resolution**
   ```bash
   tsc-alias -p tsconfig.json
   ```

### GraphQL Code Generation

1. **Schema Validation**
   ```bash
   graphql-codegen --config codegen.ts --check
   ```

2. **Type Generation**
   ```bash
   graphql-codegen --config codegen.ts
   ```

3. **Operation Generation**
   ```bash
   graphql-codegen --config codegen.ts --watch
   ```

## Testing Strategy

### Unit Testing

#### Jest Configuration
```typescript
export default {
  preset: '@cvent/jest-config',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/gql/**/*'
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

#### Test Structure
```
src/
├── __tests__/           # Unit tests
├── __mocks__/          # Test mocks
└── components/
    └── Component.test.tsx
```

### Component Testing

#### React Testing Library Setup
```typescript
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });
```

#### Example Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { GlobalNavigation } from '../GlobalNavigation';

describe('GlobalNavigation', () => {
  it('renders navigation items', () => {
    const context = {
      userId: 'test-user',
      accountId: 'test-account',
      permissions: [],
      features: []
    };

    render(<GlobalNavigation context={context} />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Build Performance

#### Nx Caching
- Local task caching enabled
- Remote cache via CloudFront
- Incremental builds based on file changes
- Parallel task execution

#### TypeScript Performance
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

### Runtime Performance

#### Component Optimization
```typescript
import { memo, useMemo, useCallback } from 'react';

export const GlobalNavigation = memo(({ context, onNavigate }) => {
  const memoizedItems = useMemo(() => 
    processNavigationItems(context), [context]
  );

  const handleNavigate = useCallback((item) => {
    onNavigate?.(item);
  }, [onNavigate]);

  return <nav>{/* Component JSX */}</nav>;
});
```

#### Bundle Optimization
- Tree shaking enabled
- Code splitting at package boundaries
- Dynamic imports for large dependencies
- Peer dependency optimization

## Monitoring & Logging

### Build Monitoring

#### SonarQube Integration
```properties
sonar.projectKey=passkey-shared-mono
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx
sonar.coverage.exclusions=**/*.test.ts,**/*.test.tsx,**/gql/**
```

#### Jenkins Pipeline Monitoring
- Build duration tracking
- Test result reporting
- Coverage trend analysis
- Dependency vulnerability scanning

### Runtime Monitoring

#### Error Tracking
```typescript
// Component error boundaries
class NavigationErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigation Error:', error, errorInfo);
    // Report to monitoring service
  }
}
```

#### Performance Metrics
```typescript
// Performance monitoring hooks
const usePerformanceMonitoring = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      console.log(`${componentName} render time: ${endTime - startTime}ms`);
    };
  });
};
```

## Security Considerations

### Dependency Security
- Automated dependency updates via Renovate
- Security vulnerability scanning
- License compliance checking
- Supply chain security validation

### Code Security
- ESLint security rules enabled
- TypeScript strict mode enforced
- Input validation in components
- XSS prevention in dynamic content

### Build Security
- Signed commits required
- Branch protection rules
- Required status checks
- Automated security scanning
# Development Guide

## Prerequisites

### Required Software

#### Node.js and Package Manager
- **Node.js 18+**: JavaScript runtime (specified in `.tool-versions`)
- **PNPM**: Fast, disk space efficient package manager
- **Nx CLI**: Monorepo development toolkit

```bash
# Install Node.js using asdf (recommended)
asdf install nodejs 18.19.0

# Install PNPM globally
npm install -g pnpm

# Install Nx CLI globally
pnpm add -g nx
```

#### Development Tools
- **Docker**: Container runtime for local services
- **Git**: Version control system
- **VS Code**: Recommended IDE with workspace settings

```bash
# Install Docker Desktop
# Download from https://www.docker.com/products/docker-desktop

# Verify installations
node --version    # Should be 18.x
pnpm --version    # Should be 8.x+
docker --version  # Should be 20.x+
```

### Optional Tools
- **AWS CLI**: For infrastructure management
- **Playwright**: Browser automation (installed via pnpm)
- **asdf**: Version manager for Node.js and other tools

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-book-mono.git
cd passkey-book-mono
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

### 3. Environment Configuration

#### Copy Environment Templates
```bash
# Copy environment template for the main app
cp packages/passkey-book-ui/app/.env.template packages/passkey-book-ui/app/.env.local

# Edit with your local configuration
code packages/passkey-book-ui/app/.env.local
```

#### Local Environment Variables
```bash
# packages/passkey-book-ui/app/.env.local
NODE_ENV=development
PORT=3000
HOST=localhost

# Feature Flags (optional for local development)
LAUNCHDARKLY_SDK_KEY=your-dev-key-here
FEATURE_FLAGS_ENABLED=true

# Backend Services (point to dev environment)
PASSKEY_API_BASE_URL=https://dev-api.passkey.cvent.com
PASSKEY_API_KEY=your-dev-api-key

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty

# Database (if running locally)
DATABASE_URL=postgresql://localhost:5432/passkey_book_dev
REDIS_URL=redis://localhost:6379
```

### 4. Start Development Environment

#### Option A: Full Development Setup
```bash
# Start all services with Docker Compose
docker-compose up -d

# Start the Next.js development server
cd packages/passkey-book-ui/app
pnpm dev
```

#### Option B: Application Only
```bash
# Start just the Next.js app (uses external services)
cd packages/passkey-book-ui/app
pnpm dev
```

#### Option C: Using Nx
```bash
# Start development server using Nx
nx dev passkey-book-ui-app

# Or from the root directory
pnpm nx dev passkey-book-ui-app
```

### 5. Verify Setup

Open your browser and navigate to:
- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

You should see the Passkey Book UI application running with hot reload enabled.

## Running Tests

### Unit Tests

```bash
# Run all unit tests
nx test

# Run tests for specific package
nx test passkey-book-ui-app
nx test passkey-book-ui-lib

# Run tests in watch mode
nx test passkey-book-ui-app --watch

# Run tests with coverage
nx test passkey-book-ui-app --coverage
```

### Integration Tests

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
nx test:integration

# Clean up test environment
docker-compose -f docker-compose.test.yml down
```

### End-to-End Tests

```bash
# Install Playwright browsers (first time only)
cd packages/passkey-book-ui/e2e
pnpm playwright install

# Run E2E tests
nx e2e passkey-book-ui-e2e

# Run E2E tests in headed mode (see browser)
nx e2e passkey-book-ui-e2e --headed

# Run specific test file
nx e2e passkey-book-ui-e2e --spec="booking.spec.ts"
```

### Test Configuration

#### Jest Configuration (`jest.config.ts`)
```typescript
export default {
  displayName: 'passkey-book-ui-app',
  preset: '@cvent/cdf/jest',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

#### Playwright Configuration (`playwright.config.ts`)
```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
```

## Code Structure

### Workspace Organization

```
passkey-book-mono/
├── packages/
│   └── passkey-book-ui/
│       ├── app/                    # Next.js application
│       │   ├── src/
│       │   │   ├── app/           # App Router pages and layouts
│       │   │   │   ├── globals.css
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx
│       │   │   │   └── book/
│       │   │   │       ├── page.tsx
│       │   │   │       └── confirmation/
│       │   │   ├── components/    # Reusable React components
│       │   │   │   ├── ui/        # Basic UI components
│       │   │   │   ├── forms/     # Form components
│       │   │   │   └── booking/   # Booking-specific components
│       │   │   ├── hooks/         # Custom React hooks
│       │   │   │   ├── useBooking.ts
│       │   │   │   ├── useFeatureFlags.ts
│       │   │   │   └── useLocalStorage.ts
│       │   │   ├── utils/         # Utility functions
│       │   │   │   ├── api.ts
│       │   │   │   ├── validation.ts
│       │   │   │   └── formatting.ts
│       │   │   ├── config/        # Configuration files
│       │   │   │   ├── constants.ts
│       │   │   │   └── environment.ts
│       │   │   └── middleware.ts  # Next.js middleware
│       │   ├── public/            # Static assets
│       │   ├── locales/           # Internationalization files
│       │   └── __tests__/         # Test files
│       ├── lib/                   # Shared library
│       │   ├── src/
│       │   │   ├── types/         # TypeScript type definitions
│       │   │   ├── utils/         # Shared utilities
│       │   │   └── constants/     # Shared constants
│       │   └── __tests__/
│       ├── e2e/                   # End-to-end tests
│       │   ├── tests/
│       │   │   ├── booking.spec.ts
│       │   │   ├── navigation.spec.ts
│       │   │   └── accessibility.spec.ts
│       │   └── fixtures/          # Test data and helpers
│       └── infra/                 # Infrastructure as code
│           ├── bin/
│           ├── lib/
│           └── test/
├── .changeset/                    # Version management
├── tools/                         # Development tools and scripts
└── docs/                          # Documentation
```

### Component Architecture

#### Component Categories

**1. Page Components** (`src/app/`)
- Server and client components for routes
- Layout components for shared UI structure
- Loading and error boundary components

**2. UI Components** (`src/components/ui/`)
- Basic reusable components (Button, Input, Modal)
- Follow atomic design principles
- Styled with Tailwind CSS

**3. Feature Components** (`src/components/booking/`)
- Business logic components
- Booking flow components
- Integration with backend services

**4. Layout Components**
- Header, footer, navigation
- Responsive design patterns
- Accessibility considerations

#### Component Example

```typescript
// src/components/booking/RoomSelector.tsx
import { useState } from 'react'
import { Room } from '@/types/booking'
import { Button } from '@/components/ui/Button'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'

interface RoomSelectorProps {
  rooms: Room[]
  onSelect: (room: Room) => void
  selectedRoom?: Room
}

export function RoomSelector({ rooms, onSelect, selectedRoom }: RoomSelectorProps) {
  const { isEnabled } = useFeatureFlags()
  const showPriceComparison = isEnabled('priceComparison')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <div
          key={room.id}
          className={`border rounded-lg p-4 ${
            selectedRoom?.id === room.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <h3 className="text-lg font-semibold">{room.name}</h3>
          <p className="text-gray-600">{room.description}</p>
          
          {showPriceComparison && (
            <div className="mt-2">
              <span className="text-sm text-gray-500">Compare prices</span>
            </div>
          )}
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-xl font-bold">${room.price}/night</span>
            <Button
              onClick={() => onSelect(room)}
              variant={selectedRoom?.id === room.id ? 'primary' : 'secondary'}
            >
              {selectedRoom?.id === room.id ? 'Selected' : 'Select'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface BookingRequest {
  hotelId: string
  roomTypeId: string
  checkIn: Date
  checkOut: Date
  guests: Guest[]
}

// Use types for unions and computed types
type BookingStatus = 'pending' | 'confirmed' | 'cancelled'
type BookingWithStatus = BookingRequest & { status: BookingStatus }

// Use enums for constants
enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal'
}
```

#### Function Signatures
```typescript
// Use explicit return types for public functions
export function calculateTotalPrice(
  roomRate: number,
  nights: number,
  taxRate: number
): number {
  return (roomRate * nights) * (1 + taxRate)
}

// Use generic types for reusable functions
export function createApiClient<T>(baseUrl: string): ApiClient<T> {
  return new ApiClient<T>(baseUrl)
}
```

### React Guidelines

#### Component Props
```typescript
// Use interfaces for component props
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
}

// Use default parameters for optional props
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  onClick 
}: ButtonProps) {
  // Component implementation
}
```

#### Hooks Usage
```typescript
// Custom hooks should start with 'use'
export function useBooking(hotelId: string) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createBooking = useCallback(async (data: BookingRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await api.createBooking(data)
      setBooking(result)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { booking, loading, error, createBooking }
}
```

### CSS and Styling

#### Tailwind CSS Usage
```typescript
// Use Tailwind utility classes
<div className="max-w-4xl mx-auto px-4 py-8">
  <h1 className="text-3xl font-bold text-gray-900 mb-6">
    Book Your Stay
  </h1>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Content */}
  </div>
</div>

// Create reusable class combinations
const buttonStyles = {
  base: 'px-4 py-2 rounded-md font-medium transition-colors',
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
}
```

#### CSS Modules (when needed)
```css
/* styles/components/BookingForm.module.css */
.container {
  @apply max-w-2xl mx-auto p-6;
}

.field {
  @apply mb-4;
}

.label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}
```

### Error Handling

#### API Error Handling
```typescript
// Create custom error classes
export class BookingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'BookingError'
  }
}

// Handle errors consistently
export async function createBooking(data: BookingRequest): Promise<Booking> {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new BookingError(
        error.message,
        error.code,
        response.status
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof BookingError) {
      throw error
    }
    
    throw new BookingError(
      'Failed to create booking',
      'NETWORK_ERROR',
      500
    )
  }
}
```

#### React Error Boundaries
```typescript
// Error boundary component
export class BookingErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Booking error:', error, errorInfo)
    // Report to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            We're sorry, but there was an error processing your booking.
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Common Tasks

### Adding a New Page

1. **Create the page component**:
```bash
# Create new page in app directory
mkdir -p packages/passkey-book-ui/app/src/app/new-page
touch packages/passkey-book-ui/app/src/app/new-page/page.tsx
```

2. **Implement the page**:
```typescript
// packages/passkey-book-ui/app/src/app/new-page/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Page - Passkey Book',
  description: 'Description of the new page'
}

export default function NewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">New Page</h1>
      <p>Page content goes here.</p>
    </div>
  )
}
```

3. **Add navigation (if needed)**:
```typescript
// Update navigation component
<Link href="/new-page" className="nav-link">
  New Page
</Link>
```

### Adding a New Component

1. **Create component file**:
```bash
touch packages/passkey-book-ui/app/src/components/NewComponent.tsx
```

2. **Implement component**:
```typescript
// packages/passkey-book-ui/app/src/components/NewComponent.tsx
interface NewComponentProps {
  title: string
  children?: React.ReactNode
}

export function NewComponent({ title, children }: NewComponentProps) {
  return (
    <div className="new-component">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  )
}
```

3. **Add tests**:
```typescript
// packages/passkey-book-ui/app/src/components/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { NewComponent } from '../NewComponent'

describe('NewComponent', () => {
  it('renders title correctly', () => {
    render(<NewComponent title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })
})
```

### Adding a New API Route

1. **Create API route file**:
```bash
mkdir -p packages/passkey-book-ui/app/src/app/api/new-endpoint
touch packages/passkey-book-ui/app/src/app/api/new-endpoint/route.ts
```

2. **Implement API handler**:
```typescript
// packages/passkey-book-ui/app/src/app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // API logic here
    const data = { message: 'Hello from new endpoint' }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Process POST data
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Bad request' },
      { status: 400 }
    )
  }
}
```

### Adding Environment Variables

1. **Add to environment template**:
```bash
# packages/passkey-book-ui/app/.env.template
NEW_FEATURE_ENABLED=false
NEW_API_ENDPOINT=https://api.example.com
```

2. **Update TypeScript environment types**:
```typescript
// packages/passkey-book-ui/app/src/types/environment.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEW_FEATURE_ENABLED: string
    NEW_API_ENDPOINT: string
  }
}
```

3. **Use in configuration**:
```typescript
// packages/passkey-book-ui/app/src/config/environment.ts
export const config = {
  newFeatureEnabled: process.env.NEW_FEATURE_ENABLED === 'true',
  newApiEndpoint: process.env.NEW_API_ENDPOINT || 'https://api.default.com'
}
```

### Debugging Tips

#### VS Code Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

#### Common Debug Commands
```bash
# Debug with Node.js inspector
NODE_OPTIONS='--inspect' pnpm dev

# Debug with verbose logging
DEBUG=* pnpm dev

# Debug specific modules
DEBUG=booking:* pnpm dev

# Profile performance
NODE_OPTIONS='--prof' pnpm dev
```

#### Browser DevTools
- Use React Developer Tools extension
- Enable Next.js source maps for debugging
- Use Network tab to debug API calls
- Use Performance tab to identify bottlenecks

## Additional Resources

## Repository Structure


```
passkey-book-mono/
├── packages/
│   └── passkey-book-ui/
│       ├── app/           # Next.js application
│       ├── lib/           # Shared library components
│       ├── infra/         # AWS CDK infrastructure
│       └── e2e/           # Playwright E2E tests
├── .changeset/            # Changeset configuration for versioning
├── nx.json               # Nx workspace configuration
├── pnpm-workspace.yaml   # PNPM workspace configuration
└── Jenkinsfile           # CI/CD pipeline configuration
```

## Quick Start


### Prerequisites

- Node.js 18+ (specified in `.tool-versions`)
- PNPM package manager
- Docker (for containerized development)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-book-mono.git
   cd passkey-book-mono
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start development server**:
   ```bash
   cd packages/passkey-book-ui/app
   pnpm dev
   ```

4. **Access the application**:
   - Local development: `http://localhost:3000`
   - The application will hot-reload on code changes

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
cd packages/passkey-book-ui/e2e
pnpm test

# Linting
pnpm lint
```

## Team & Support


- **Owner**: Maurya team
- **Platform**: Passkey
- **Product**: Passkey for Hotels
- **Slack Channel**: `#passkey-maurya-alerts`
- **Service Registry ID**: `960c77cb-ce69-5dbc-aad1-c895abdb12c5`

## Contributing


This repository follows Cvent's standard development practices:

1. Create feature branches from `master`
2. Use conventional commits for clear change history
3. Run tests and linting before submitting PRs
4. Use changesets for version management
5. Follow TypeScript and React best practices

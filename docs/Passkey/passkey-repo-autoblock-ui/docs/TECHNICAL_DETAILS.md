# Technical Details

## Technology Stack

### Frontend Framework
- **Guestside Site**: React 18.3.1 with modern hooks and concurrent features
- **Site Editor**: React 16.5.1 with class components and legacy patterns
- **Build System**: Webpack 5 with modern bundling and optimization
- **Package Manager**: pnpm with workspace support for monorepo management

### State Management
- **Redux**: 4.0.0 for predictable state management
- **Redux Thunk**: 2.1.0 for async action creators
- **Reselect**: 4.0.0 for memoized state selectors
- **Redux DevTools**: Integration for development debugging

### Data Layer
- **Apollo Client**: 3.5.10 for GraphQL client with caching
- **GraphQL**: 16.3.0 for type-safe API communication
- **Node Fetch**: 2.6.12 for HTTP requests in Node.js environments
- **Abort Controller**: 3.0.0 for request cancellation

### UI Components & Styling
- **Carina Design System**: 1.117.37 for consistent UI components
- **Nucleus Components**: Various versions for form controls and widgets
- **Emotion**: 11.9.3 for CSS-in-JS styling
- **Less**: 3.9.0 for CSS preprocessing

### Development Tools
- **TypeScript**: Parser support for type checking
- **ESLint**: 6.5.1 with Nucleus config for code quality
- **Prettier**: 1.18.2 for code formatting
- **Jest**: 25.0.0 for unit testing
- **Testing Library**: React testing utilities

### Build & Deployment
- **Nucleus Build**: 12.0.13 (guestside) / 9.1.1 (editor) for standardized builds
- **Webpack**: 5.95.0 (guestside) / 4.30.0 (editor) for bundling
- **Babel**: 7.x for JavaScript transpilation
- **PostCSS**: 8.4.49 for CSS processing

## Dependencies

### Core Dependencies (Guestside Site)
```json
{
  "@apollo/client": "3.5.10",
  "@cvent/blocks": "^7.2.3",
  "@cvent/carina-illustration": "^3.5.0",
  "@cvent/fetch": "^1.0.49",
  "@cvent/nucleus-text": "8.1.6",
  "@emotion/react": "^11.9.3",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-redux": "^7.1.1",
  "redux": "^4.0.0",
  "lodash": "4.17.21",
  "graphql": "16.3.0"
}
```

### Core Dependencies (Site Editor)
```json
{
  "@apollo/client": "3.5.10",
  "@cvent/carina-rich-text-editor": "^3.2.0",
  "@cvent/nucleus-core": "8.12.5",
  "react": "^16.5.1",
  "react-dom": "^16.7.0",
  "react-redux": "5.1.2",
  "redux": "^4.0.0",
  "nucleus-site-editor": "^8.1.0"
}
```

### Shared Widgets Dependencies
```json
{
  "@cvent/carina": "1.117.37",
  "@cvent/nucleus-core-datetime-utils": "^1.0.8",
  "@cvent/nucleus-networking": "1.4.1",
  "google-map-react": "^2.1.10",
  "reaptcha": "^1.7.2",
  "stable": "^0.1.6"
}
```

## Configuration

### Environment Variables

#### Guestside Site
```bash
# Development
IS_DEV_MODE=true
NODE_ENV=development
WEBPACK_DEV_SERVER_PORT=3000

# API Configuration
GRAPHQL_ENDPOINT=https://api-dev.passkey.com/graphql
API_BASE_URL=https://api-dev.passkey.com

# Feature Flags
ENABLE_MAPS=true
ENABLE_RECAPTCHA=true
ENABLE_ANALYTICS=true

# Monitoring
DATADOG_APPLICATION_ID=passkey-autoblock-guestside
DATADOG_CLIENT_TOKEN=<token>
```

#### Site Editor
```bash
# Development
IS_DEV_MODE=true
NODE_ENV=development

# API Configuration
GRAPHQL_ENDPOINT=https://api-dev.passkey.com/graphql
SITE_EDITOR_API=https://api-dev.passkey.com/site-editor

# Editor Features
ENABLE_RICH_TEXT_EDITOR=true
ENABLE_PREVIEW_MODE=true
```

### Build Configuration

#### Webpack Configuration (Guestside)
```javascript
// webpack.config.js
module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/autoblock-guestside-site/'
  },
  resolve: {
    alias: {
      '@cvent/fetch': path.resolve(__dirname, 'src/__mocks__/cventFetchShim.js')
    }
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};
```

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testURL: 'https://app-fake.cvent.com/autoblock-guestside-site',
  setupFilesAfterEnv: ['<rootDir>/jest.js'],
  moduleNameMapper: {
    '^@cvent/fetch$': '<rootDir>/src/__mocks__/cventFetchShim.js',
    '^.+\\.(css|less)$': '<rootDir>/__mocks__/cssMock.js'
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/dialogs/**',
    '!src/WidgetFactory/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Database Schema

### GraphQL Schema Types
```graphql
type Hotel {
  id: ID!
  name: String!
  description: String
  starRating: Int
  address: Address!
  amenities: [Amenity!]!
  rooms: [Room!]!
  images: [Image!]!
  location: GeoLocation!
}

type Room {
  id: ID!
  name: String!
  description: String
  capacity: Int!
  amenities: [Amenity!]!
  pricing: RoomPricing!
  availability: Availability!
}

type Booking {
  id: ID!
  confirmationNumber: String!
  status: BookingStatus!
  hotel: Hotel!
  rooms: [BookedRoom!]!
  guest: GuestInfo!
  totalCost: Money!
}
```

### Local State Schema (Redux)
```javascript
// Redux state shape
{
  website: {
    eventInfo: {
      name: string,
      dates: { start: Date, end: Date },
      location: string
    },
    siteConfiguration: {
      theme: ThemeConfig,
      widgets: WidgetConfig[],
      content: ContentConfig
    }
  },
  hotels: {
    searchResults: Hotel[],
    selectedHotel: Hotel | null,
    filters: SearchFilters,
    loading: boolean
  },
  rooms: {
    availableRooms: Room[],
    selectedRooms: RoomSelection[],
    pricing: PricingInfo,
    loading: boolean
  },
  booking: {
    currentBooking: Booking | null,
    guestInfo: GuestInfo,
    status: BookingStatus,
    errors: string[]
  }
}
```

## Monitoring & Logging

### Datadog Integration
```javascript
// Datadog RUM initialization
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: process.env.DATADOG_APPLICATION_ID,
  clientToken: process.env.DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'passkey-autoblock-guestside-service',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
  sampleRate: 100,
  trackInteractions: true,
  defaultPrivacyLevel: 'mask-user-input'
});
```

### Logging Configuration
```javascript
// Nucleus logging setup
import { createLogger } from '@cvent/nucleus-logging';

const logger = createLogger({
  service: 'passkey-autoblock-ui',
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    type: 'datadog',
    options: {
      apiKey: process.env.DATADOG_API_KEY,
      service: 'passkey-autoblock-guestside-service'
    }
  }
});
```

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Custom Metrics**: Widget load times, API response times
- **Error Tracking**: JavaScript errors and GraphQL failures
- **User Journey**: Booking funnel analytics

## Security

### Content Security Policy
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' *.cvent.com *.datadoghq.com;
  style-src 'self' 'unsafe-inline' *.cvent.com;
  img-src 'self' data: *.cvent.com *.amazonaws.com;
  connect-src 'self' *.cvent.com *.datadoghq.com;
  font-src 'self' *.cvent.com;
```

### Authentication
- **JWT Tokens**: Bearer token authentication
- **Token Refresh**: Automatic token renewal
- **Session Management**: 2-hour session timeout
- **CSRF Protection**: SameSite cookie attributes

### Input Validation
```javascript
// Form validation example
import { validateEmail, validatePhone } from '@cvent/nucleus-form-validations';

const validateGuestInfo = (guestInfo) => {
  const errors = {};
  
  if (!validateEmail(guestInfo.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (guestInfo.phone && !validatePhone(guestInfo.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  return errors;
};
```

## Performance Optimization

### Code Splitting
```javascript
// Dynamic imports for widgets
const HotelListWidget = lazy(() => 
  import('../widgets/HotelListWidget')
);

const RoomListWidget = lazy(() => 
  import('../widgets/RoomListWidget')
);
```

### Caching Strategy
- **Apollo Cache**: 5-minute TTL for hotel data
- **Browser Cache**: Static assets cached for 1 year
- **CDN Cache**: CloudFront with regional edge locations
- **Service Worker**: Offline capability for critical resources

### Bundle Optimization
- **Tree Shaking**: Unused code elimination
- **Minification**: Terser for JavaScript compression
- **Image Optimization**: WebP format with fallbacks
- **Lazy Loading**: Components loaded on demand

### Memory Management
- **Component Cleanup**: useEffect cleanup functions
- **Event Listener Removal**: Prevent memory leaks
- **Large List Virtualization**: React Virtualized for hotel/room lists
- **Image Lazy Loading**: Intersection Observer API
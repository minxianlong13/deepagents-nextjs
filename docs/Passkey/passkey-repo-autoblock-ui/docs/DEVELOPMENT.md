# Development Guide

## Prerequisites

### Required Software
- **Node.js**: 18.x (specified in `.tool-versions`)
- **pnpm**: Latest version for package management
- **Docker**: For local service dependencies
- **Git**: Version control
- **AWS CLI**: For deployment and infrastructure management

### Development Tools
- **VS Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - GitLens
  - Thunder Client (for API testing)
- **Chrome DevTools**: React Developer Tools extension
- **Datadog Browser Extension**: For monitoring integration

### Access Requirements
- **GitHub**: Access to `cvent-internal` organization
- **Jenkins**: Access to CI/CD pipelines
- **Octo**: Deployment platform access
- **AWS**: Development account permissions
- **Datadog**: Monitoring dashboard access

## Local Setup

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-autoblock-ui.git
cd passkey-autoblock-ui

# Install Node.js version (using asdf)
asdf install nodejs

# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm install
```

### 2. Environment Configuration
Create environment files for local development:

```bash
# Create .env.local for guestside site
cat > apps/passkey-autoblock-guestside-site/.env.local << EOF
IS_DEV_MODE=true
NODE_ENV=development
GRAPHQL_ENDPOINT=https://api-dev.passkey.com/graphql
ENABLE_MAPS=true
ENABLE_RECAPTCHA=false
ENABLE_ANALYTICS=false
DATADOG_APPLICATION_ID=dev-passkey-autoblock
EOF

# Create .env.local for site editor
cat > apps/passkey-autoblock-site-editor/.env.local << EOF
IS_DEV_MODE=true
NODE_ENV=development
GRAPHQL_ENDPOINT=https://api-dev.passkey.com/graphql
ENABLE_RICH_TEXT_EDITOR=true
ENABLE_PREVIEW_MODE=true
EOF
```

### 3. Start Development Servers
```bash
# Start all applications (from root)
pnpm dev

# Or start individual applications
cd apps/passkey-autoblock-guestside-site
pnpm dev  # Runs on http://localhost:3000

cd apps/passkey-autoblock-site-editor
pnpm dev  # Runs on http://localhost:3001
```

### 4. Widget Development
```bash
# Start Storybook for widget development
cd pkgs/passkey-autoblock-widgets
pnpm storybook  # Runs on http://localhost:9001
```

## Running Tests

### Unit Tests
```bash
# Run all tests
pnpm test

# Run tests for specific package
cd apps/passkey-autoblock-guestside-site
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

### Test Coverage Requirements
- **Global**: 80% lines, 80% functions, 76% branches
- **Redux Modules**: 90% lines, 90% functions, 89% branches
- **Widgets**: 80% lines, 72% functions, 75% branches

### Integration Tests
```bash
# Run integration tests (if available)
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

### Linting and Formatting
```bash
# Run ESLint
pnpm lint

# Fix linting issues
pnpm lint --fix

# Format code with Prettier
pnpm format

# Verify code formatting
pnpm verify
```

## Code Structure

### Monorepo Organization
```
passkey-autoblock-ui/
├── apps/                           # Applications
│   ├── passkey-autoblock-guestside-site/
│   │   ├── src/
│   │   │   ├── components/         # Presentation components
│   │   │   ├── containers/         # Container components
│   │   │   ├── redux/              # State management
│   │   │   │   ├── modules/        # Redux modules
│   │   │   │   ├── selectors/      # Reselect selectors
│   │   │   │   └── util/           # Redux utilities
│   │   │   ├── widgets/            # Business widgets
│   │   │   ├── graphql/            # GraphQL queries
│   │   │   ├── util/               # Utility functions
│   │   │   └── main.js             # Application entry
│   │   ├── __mocks__/              # Jest mocks
│   │   ├── __tests__/              # Test files
│   │   └── package.json
│   └── passkey-autoblock-site-editor/
│       └── [similar structure]
├── pkgs/                           # Shared packages
│   └── passkey-autoblock-widgets/
│       ├── lib/                    # Widget components
│       │   ├── HotelBanner/
│       │   ├── HotelList/
│       │   ├── RoomList/
│       │   └── [other widgets]/
│       ├── clients/                # API clients
│       ├── utils/                  # Shared utilities
│       └── __tests__/              # Widget tests
├── cdk/                            # Infrastructure
├── tools/                          # Build tools
└── docs/                           # Documentation
```

### Component Architecture
```javascript
// Container Component Pattern
// containers/HotelListContainer.js
import { connect } from 'react-redux';
import { searchHotels } from '../redux/modules/hotels';
import HotelListWidget from '../widgets/HotelListWidget';

const mapStateToProps = (state) => ({
  hotels: state.hotels.searchResults,
  loading: state.hotels.loading
});

const mapDispatchToProps = {
  searchHotels
};

export default connect(mapStateToProps, mapDispatchToProps)(HotelListWidget);
```

### Redux Module Pattern
```javascript
// redux/modules/hotels.js
const SEARCH_HOTELS_REQUEST = 'hotels/SEARCH_HOTELS_REQUEST';
const SEARCH_HOTELS_SUCCESS = 'hotels/SEARCH_HOTELS_SUCCESS';
const SEARCH_HOTELS_FAILURE = 'hotels/SEARCH_HOTELS_FAILURE';

// Action creators
export const searchHotels = (criteria) => async (dispatch, getState) => {
  dispatch({ type: SEARCH_HOTELS_REQUEST });
  
  try {
    const response = await apolloClient.query({
      query: SEARCH_HOTELS_QUERY,
      variables: { criteria }
    });
    
    dispatch({
      type: SEARCH_HOTELS_SUCCESS,
      payload: response.data.hotels
    });
  } catch (error) {
    dispatch({
      type: SEARCH_HOTELS_FAILURE,
      payload: error.message
    });
  }
};

// Reducer
const initialState = {
  searchResults: [],
  loading: false,
  error: null
};

export default function hotelsReducer(state = initialState, action) {
  switch (action.type) {
    case SEARCH_HOTELS_REQUEST:
      return { ...state, loading: true, error: null };
    case SEARCH_HOTELS_SUCCESS:
      return { ...state, loading: false, searchResults: action.payload };
    case SEARCH_HOTELS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}
```

## Coding Standards

### JavaScript/React Guidelines
- **ES6+**: Use modern JavaScript features
- **Functional Components**: Prefer hooks over class components (guestside)
- **PropTypes**: Define prop types for all components
- **Destructuring**: Use object/array destructuring
- **Arrow Functions**: Use arrow functions for callbacks

### Code Style
```javascript
// Good: Functional component with hooks
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const HotelCard = ({ hotel, onSelect }) => {
  const [isSelected, setIsSelected] = useState(false);
  
  useEffect(() => {
    // Effect logic
  }, [hotel.id]);
  
  const handleClick = () => {
    setIsSelected(true);
    onSelect(hotel);
  };
  
  return (
    <div className="hotel-card" onClick={handleClick}>
      <h3>{hotel.name}</h3>
      <p>{hotel.description}</p>
    </div>
  );
};

HotelCard.propTypes = {
  hotel: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string
  }).isRequired,
  onSelect: PropTypes.func.isRequired
};

export default HotelCard;
```

### CSS/Styling Guidelines
- **Carina Components**: Use Carina design system components
- **CSS Modules**: Use CSS modules for component-specific styles
- **Emotion**: Use Emotion for dynamic styling
- **Responsive Design**: Mobile-first approach

### Testing Guidelines
```javascript
// Good: Comprehensive test
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import HotelCard from '../HotelCard';

const mockStore = createStore(() => ({}));

describe('HotelCard', () => {
  const mockHotel = {
    id: '1',
    name: 'Test Hotel',
    description: 'A test hotel'
  };
  
  const mockOnSelect = jest.fn();
  
  beforeEach(() => {
    mockOnSelect.mockClear();
  });
  
  it('renders hotel information', () => {
    render(
      <Provider store={mockStore}>
        <HotelCard hotel={mockHotel} onSelect={mockOnSelect} />
      </Provider>
    );
    
    expect(screen.getByText('Test Hotel')).toBeInTheDocument();
    expect(screen.getByText('A test hotel')).toBeInTheDocument();
  });
  
  it('calls onSelect when clicked', () => {
    render(
      <Provider store={mockStore}>
        <HotelCard hotel={mockHotel} onSelect={mockOnSelect} />
      </Provider>
    );
    
    fireEvent.click(screen.getByText('Test Hotel'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockHotel);
  });
});
```

## Common Tasks

### Adding a New Widget

#### 1. Create Widget Component
```bash
# Create widget directory
mkdir pkgs/passkey-autoblock-widgets/lib/NewWidget

# Create component files
touch pkgs/passkey-autoblock-widgets/lib/NewWidget/index.js
touch pkgs/passkey-autoblock-widgets/lib/NewWidget/NewWidget.js
touch pkgs/passkey-autoblock-widgets/lib/NewWidget/NewWidget.less
touch pkgs/passkey-autoblock-widgets/lib/NewWidget/__tests__/NewWidget.test.js
```

#### 2. Implement Widget
```javascript
// lib/NewWidget/NewWidget.js
import React from 'react';
import PropTypes from 'prop-types';
import './NewWidget.less';

const NewWidget = ({ title, content, onAction }) => {
  return (
    <div className="new-widget">
      <h2>{title}</h2>
      <p>{content}</p>
      <button onClick={onAction}>Action</button>
    </div>
  );
};

NewWidget.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.string,
  onAction: PropTypes.func
};

export default NewWidget;
```

#### 3. Add to Widget Factory
```javascript
// apps/passkey-autoblock-guestside-site/src/WidgetFactory/index.js
import NewWidget from '@cvent-internal/passkey-autoblock-widgets/lib/NewWidget';

const WidgetFactory = {
  // ... existing widgets
  NewWidget: () => Promise.resolve(NewWidget)
};
```

#### 4. Create Storybook Story
```javascript
// lib/NewWidget/NewWidget.stories.js
import React from 'react';
import NewWidget from './NewWidget';

export default {
  title: 'Widgets/NewWidget',
  component: NewWidget
};

export const Default = () => (
  <NewWidget 
    title="Sample Title"
    content="Sample content"
    onAction={() => console.log('Action clicked')}
  />
);
```

### Adding a New API Endpoint

#### 1. Define GraphQL Query
```javascript
// src/graphql/queries.js
import { gql } from '@apollo/client';

export const GET_NEW_DATA = gql`
  query GetNewData($id: ID!) {
    newData(id: $id) {
      id
      name
      description
      createdAt
    }
  }
`;
```

#### 2. Create Redux Module
```javascript
// src/redux/modules/newData.js
import { GET_NEW_DATA } from '../../graphql/queries';

const FETCH_NEW_DATA_REQUEST = 'newData/FETCH_NEW_DATA_REQUEST';
const FETCH_NEW_DATA_SUCCESS = 'newData/FETCH_NEW_DATA_SUCCESS';
const FETCH_NEW_DATA_FAILURE = 'newData/FETCH_NEW_DATA_FAILURE';

export const fetchNewData = (id) => async (dispatch, getState, { apolloClient }) => {
  dispatch({ type: FETCH_NEW_DATA_REQUEST });
  
  try {
    const { data } = await apolloClient.query({
      query: GET_NEW_DATA,
      variables: { id }
    });
    
    dispatch({
      type: FETCH_NEW_DATA_SUCCESS,
      payload: data.newData
    });
  } catch (error) {
    dispatch({
      type: FETCH_NEW_DATA_FAILURE,
      payload: error.message
    });
  }
};

// Reducer implementation...
```

#### 3. Add to Root Reducer
```javascript
// src/redux/reducer.js
import { combineReducers } from 'redux';
import newDataReducer from './modules/newData';

export default combineReducers({
  // ... existing reducers
  newData: newDataReducer
});
```

### Debugging Tips

#### React DevTools
- Install React Developer Tools browser extension
- Use Components tab to inspect component props and state
- Use Profiler tab to identify performance issues

#### Redux DevTools
- Install Redux DevTools browser extension
- Monitor action dispatching and state changes
- Time-travel debugging capabilities

#### GraphQL Debugging
```javascript
// Enable GraphQL debugging
const apolloClient = new ApolloClient({
  uri: process.env.GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all'
    },
    query: {
      errorPolicy: 'all'
    }
  }
});

// Log GraphQL operations
apolloClient.setLink(
  from([
    new ApolloLink((operation, forward) => {
      console.log('GraphQL Operation:', operation.operationName);
      return forward(operation);
    }),
    httpLink
  ])
);
```

#### Network Debugging
- Use browser Network tab to inspect API calls
- Check request/response headers and payloads
- Monitor GraphQL query performance

### Performance Optimization

#### Bundle Analysis
```bash
# Analyze bundle size
pnpm build
npx webpack-bundle-analyzer dist/static/js/*.js
```

#### Memory Profiling
- Use Chrome DevTools Memory tab
- Take heap snapshots to identify memory leaks
- Monitor component mount/unmount cycles

#### Performance Monitoring
- Use React Profiler to identify slow components
- Monitor Core Web Vitals in development
- Use Lighthouse for performance audits

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear build cache
pnpm clean
pnpm build
```

#### Test Failures
```bash
# Update snapshots
pnpm test -- --updateSnapshot

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Development Server Issues
```bash
# Check port availability
lsof -i :3000

# Restart with clean cache
pnpm dev --reset-cache
```

### Getting Help

- **Wiki**: [Passkey UI Local Development](https://wiki.cvent.com/display/PASKY/Local+Development)
- **Slack**: #passkey-ui-builds channel
- **Team**: metre-stick team members
- **Documentation**: This repository's docs/ directory

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 18+
- pnpm package manager
- Docker (for local development)

### Local Development Setup
```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-autoblock-ui.git
cd passkey-autoblock-ui

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Running Individual Applications
```bash
# Start guestside site
cd apps/passkey-autoblock-guestside-site
pnpm dev

# Start site editor
cd apps/passkey-autoblock-site-editor
pnpm dev
```

## Architecture Overview


```
passkey-autoblock-ui/
├── apps/
│   ├── passkey-autoblock-guestside-site/    # Guest-facing application
│   └── passkey-autoblock-site-editor/       # Site editor application
├── pkgs/
│   └── passkey-autoblock-widgets/           # Shared widget library
├── cdk/
│   ├── passkey-autoblock-guestside-site-cdk/
│   └── passkey-autoblock-site-editor-cdk/
└── tools/                                   # Build and development tools
```

## Applications


### Passkey Autoblock Guestside Site
- **Purpose**: Guest-facing interface for hotel room selection and booking
- **Technology**: React 18, Redux, Apollo GraphQL
- **Features**: Hotel search, room selection, booking workflow, maps integration

### Passkey Autoblock Site Editor
- **Purpose**: Administrative interface for configuring autoblock sites
- **Technology**: React 16, Redux, Rich text editor
- **Features**: Site configuration, content management, preview functionality

### Shared Widgets Package
- **Purpose**: Reusable UI components shared between applications
- **Components**: 30+ widgets including HotelBanner, RoomList, ContactInfo, etc.
- **Technology**: React components with Storybook documentation

## Team & Support


- **Owner**: metre-stick team
- **Business Unit**: Hospitality
- **Platform**: Passkey
- **Product**: Passkey for Hotels

For development questions, see the [Passkey UI Local Development](https://wiki.cvent.com/display/PASKY/Local+Development) wiki.

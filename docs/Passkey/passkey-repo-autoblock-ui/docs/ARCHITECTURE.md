# Architecture

## System Overview

Passkey Autoblock UI follows a **monorepo architecture** with multiple applications sharing common components and build infrastructure. The system is designed as a **micro-frontend architecture** where each application can be deployed independently while sharing a common widget library.

```
┌─────────────────────────────────────────────────────────────┐
│                    Passkey Autoblock UI                     │
├─────────────────────────────────────────────────────────────┤
│  Guest App          │  Site Editor       │  Shared Widgets  │
│  (React 18)         │  (React 16)        │  (Component Lib) │
│  ┌─────────────┐    │  ┌─────────────┐   │  ┌─────────────┐ │
│  │ Redux Store │    │  │ Redux Store │   │  │ 30+ Widgets │ │
│  │ Apollo GQL  │    │  │ Apollo GQL  │   │  │ Storybook   │ │
│  │ Routing     │    │  │ Rich Editor │   │  │ Tests       │ │
│  └─────────────┘    │  └─────────────┘   │  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   GraphQL APIs    │
                    │ (Passkey Backend) │
                    └───────────────────┘
```

## Components

### Passkey Autoblock Guestside Site
- **Purpose**: Customer-facing hotel booking interface
- **Location**: `apps/passkey-autoblock-guestside-site/`
- **Key Classes**:
  - `AppContainer.js` - Main application container
  - `PageRenderer.js` - Dynamic page rendering
  - `WidgetFactory/` - Widget instantiation system
  - `redux/modules/` - State management modules

**Architecture Pattern**: **Container-Component Pattern** with Redux for state management

### Passkey Autoblock Site Editor
- **Purpose**: Administrative interface for site configuration
- **Location**: `apps/passkey-autoblock-site-editor/`
- **Key Classes**:
  - `AppContainer.js` - Main application container
  - `WidgetFactory/` - Widget configuration system
  - Rich text editor integration
  - Preview functionality

**Architecture Pattern**: **WYSIWYG Editor Pattern** with real-time preview

### Shared Widgets Library
- **Purpose**: Reusable UI components across applications
- **Location**: `pkgs/passkey-autoblock-widgets/lib/`
- **Key Components**:
  - `HotelBanner/` - Hotel information display
  - `HotelList/` - Hotel search results
  - `RoomList/` - Available rooms display
  - `ContactInfo/` - Guest information forms
  - `MapPanel/` - Interactive hotel maps
  - `Stepper/` - Multi-step workflow navigation

## Data Flow

### Guest Application Flow
```
User Request → Redux Action → GraphQL Query → Backend API
     ↓
UI Update ← Redux State ← GraphQL Response ← API Response
```

1. **User Interaction**: User interacts with widgets (search, select rooms)
2. **State Management**: Redux actions update application state
3. **Data Fetching**: Apollo Client executes GraphQL queries
4. **Backend Communication**: Queries sent to Passkey backend services
5. **UI Updates**: Components re-render based on new state

### Site Editor Flow
```
Editor Action → Widget Configuration → Preview Update → Save to Backend
```

1. **Configuration**: Admin configures widgets and content
2. **Real-time Preview**: Changes reflected immediately in preview
3. **Persistence**: Configuration saved to backend
4. **Deployment**: Changes deployed to guest-facing site

## Design Patterns

### Widget Factory Pattern
Both applications use a **Widget Factory Pattern** for dynamic component instantiation:

```javascript
// WidgetFactory/index.js
const WidgetFactory = {
  HotelBanner: () => import('../widgets/HotelBannerWidget'),
  HotelList: () => import('../widgets/HotelListWidget'),
  RoomList: () => import('../widgets/RoomListWidget')
};
```

### Container-Component Pattern
Clear separation between:
- **Containers**: Handle state management and data fetching
- **Components**: Pure presentation components
- **Widgets**: Business logic components with internal state

### Redux Module Pattern
State management organized by feature modules:
```
redux/modules/
├── website/          # Site configuration
├── hotels/           # Hotel data
├── rooms/            # Room availability
├── booking/          # Booking workflow
└── pathInfo.js       # Routing state
```

### GraphQL Integration Pattern
Apollo Client integration with:
- **Query components** for data fetching
- **Mutation components** for data updates
- **Cache management** for performance
- **Error handling** for resilience

## Module Structure

### Monorepo Organization
```
passkey-autoblock-ui/
├── apps/                           # Applications
│   ├── passkey-autoblock-guestside-site/
│   │   ├── src/
│   │   │   ├── components/         # Presentation components
│   │   │   ├── containers/         # Container components
│   │   │   ├── redux/              # State management
│   │   │   ├── widgets/            # Business widgets
│   │   │   ├── graphql/            # GraphQL queries
│   │   │   └── main.js             # Application entry
│   │   └── package.json
│   └── passkey-autoblock-site-editor/
│       └── [similar structure]
├── pkgs/                           # Shared packages
│   └── passkey-autoblock-widgets/
│       ├── lib/                    # Widget components
│       ├── clients/                # API clients
│       ├── utils/                  # Utility functions
│       └── package.json
├── cdk/                            # Infrastructure as Code
│   ├── passkey-autoblock-guestside-site-cdk/
│   └── passkey-autoblock-site-editor-cdk/
└── tools/                          # Build tools
    └── autoblock-ui-build-scripts/
```

### Build System Architecture
- **pnpm workspaces** for dependency management
- **Nucleus build system** for standardized builds
- **Webpack** for bundling and optimization
- **Changesets** for version management
- **Jenkins** for CI/CD pipeline

### Deployment Architecture
- **AWS CDK** for infrastructure provisioning
- **CloudFront** for global content delivery
- **S3** for static asset hosting
- **Lambda@Edge** for dynamic routing
- **Octo** for deployment orchestration

## Cross-Cutting Concerns

### Internationalization
- **nucleus-text** for localization
- Multi-language support for global events
- Dynamic locale loading

### Monitoring & Observability
- **Datadog RUM** for real user monitoring
- **Datadog Logs** for application logging
- Performance tracking and error reporting

### Security
- **Content Security Policy** headers
- **HTTPS** enforcement
- **Input validation** and sanitization
- **Authentication** via Cvent platform

### Performance
- **Code splitting** for optimal loading
- **Lazy loading** of widgets
- **GraphQL caching** for data efficiency
- **Image optimization** for fast rendering
# Architecture

## System Overview
RDK2 is a Next.js application that acts as a BFF (Backend-for-Frontend). The browser communicates with RDK2 via GraphQL at `/api/graphql`. RDK2's server-side resolvers then fan out REST calls to ~30 backend Passkey microservices. Redis provides server-side caching.

## Module Structure (Monorepo)
```
packages/
├── app/                    # Main Next.js application
│   ├── src/
│   │   ├── pages/          # Next.js pages (routes)
│   │   ├── components/     # React UI components
│   │   ├── graphql/        # GraphQL schema, operations, fragments
│   │   ├── resolvers/      # GraphQL resolvers (server-side)
│   │   ├── data-sources/   # REST API clients to backend services
│   │   ├── hooks/          # React hooks
│   │   ├── navigation/     # Navigation configuration
│   │   ├── config/         # App configuration
│   │   ├── datadog/        # Datadog RUM/APM integration
│   │   ├── launchdarkly/   # Feature flag configuration
│   │   ├── shared-nextjs-server-resources/  # Server-side utilities
│   │   ├── stories/        # Storybook stories
│   │   ├── util/ & utils/  # Utility functions
│   │   └── images/         # Static images
│   ├── locales/            # i18n translation files
│   ├── public/             # Static assets
│   ├── docker/             # Docker configuration
│   └── tests/              # Test files
├── infra/                  # AWS CDK infrastructure
│   ├── lib/                # CDK stack definitions
│   │   ├── Application.ts  # Main CDK application
│   │   ├── commonProps.ts  # Shared CDK properties
│   │   └── tags.ts         # Resource tagging
│   └── bin/                # CDK entry points
├── it/                     # Integration tests
└── passkey-rdk2-lib/       # Shared library
    ├── src/
    │   ├── components/     # Shared React components
    │   ├── types/          # Shared TypeScript types
    │   └── util/           # Shared utilities
    └── locales/            # Shared translations
```

## Data Flow
1. Browser → Next.js page (SSR with `getServerSideProps` for auth)
2. Browser → Apollo Client → `/api/graphql` (GraphQL queries/mutations)
3. GraphQL resolvers → `data-sources/*-api.ts` → Backend REST microservices
4. Redis cache layer for server-side response caching

## Design Patterns
- **BFF Pattern**: GraphQL API aggregates multiple backend REST services
- **Data Source Factory**: `ds-factory-api.ts` creates and manages all REST data source instances
- **Server-Side Auth**: `getAuthPropsOrRedirect` validates auth tokens on every page load via `getServerSideProps`
- **CSRF Protection**: CSRF tokens generated and stored in localStorage
- **Feature Flags**: LaunchDarkly for feature toggling
- **Code Generation**: GraphQL codegen generates TypeScript types from schema
- **Component Library**: Carina UI (`@cvent/carina`) for consistent design system

## Data Sources (REST API Clients)
Each file in `src/data-sources/` extends `RDK2RESTDataSource` and wraps a backend service:

| Data Source | Backend Service | Domain |
|---|---|---|
| `event-api.ts` | passkey-event | Events (largest, ~39KB) |
| `subBlockGroupData-api.ts` | passkey-subblock-group-data | Sub-block groups (~35KB) |
| `notification-api.ts` | passkey-notifications | Notifications (~20KB) |
| `hotel-api.ts` | passkey-hotel | Hotels |
| `planners-api.ts` | passkey-planners | Planner portal |
| `permission-api.ts` | passkey-permission | Permissions |
| `ledger-api.ts` | passkey-ledger-service | Financial ledger |
| `inventory-api.ts` | passkey-inventory | Room inventory |
| `user-api.ts` | passkey-user-service | Users |
| `roomCategories-api.ts` | passkey-room-type-data | Room categories |
| `launchDarkly-api.ts` | LaunchDarkly | Feature flags |
| `reporting-api.ts` | passkey-reporting | Reports |
| `smartRoomAssistant-api.ts` | passkey-smart-room-assistant | AI room assistant |
| `smartcampCfgData-api.ts` | passkey-smartcamp-cfg-data | SmartCamp config |
| `housingLibrary-api.ts` | passkey-housing-library | Housing library |
| `event-data-api.ts` | passkey-event-data | Event data |
| `auth-api.ts` | auth-service | Authentication |
| `passkeyAuthentication-api.ts` | passkey-authentication | Passkey auth |
| `createEvent-api.ts` | passkey-create-event | Event creation |
| `autoblockData-api.ts` | passkey-autoblock-data | Autoblock |
| `bookingSupplierMatch-api.ts` | booking-supplier-match-svc | Supplier matching |
| `businessText-api.ts` | passkey-business-text | Business text |
| `bundle-api.ts` | passkey-event | Bundles |
| `cventAccount-api.ts` | auth-service | Cvent accounts |
| `org-api.ts` | passkey-event | Organizations |
| `participant-search-api.ts` | passkey-reservation | Participant search |
| `reservation-api.ts` | passkey-reservation | Reservations |
| `admin-api.ts` | passkey-admin-sb | Admin |
| `provision-api.ts` | passkey-autoblock-autoprovision | Provisioning |
| `reglink-api.ts` | passkey-reglink | Registration links |
| `vendorSystem-api.ts` | passkey-vendor-service | Vendor systems |
| `venueCertifications-api.ts` | venue-stats-service | Venue certs |
| `image-api.ts` | passkey-hotel | Images |
| `transferLog-api.ts` | passkey-transfer-log-service | Transfer logs |
| `universalLogin-api.ts` | auth-service | Universal login |
| `experiment-api.ts` | experiments-service | Experiments |
| `passkeySettings-api.ts` | passkey-admin-sb | Settings |

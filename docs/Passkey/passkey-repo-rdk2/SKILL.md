---
name: "passkey-repo-rdk2"
description: "Passkey RDK2 (Resdesk2) — the Next.js manage UI for Passkey hotel housing. Use when working on the RDK2 frontend, its GraphQL API, data sources, UI components, or deployment."
---

# Passkey RDK2

Use this skill when working with the Passkey Resdesk2 UI, its GraphQL BFF layer, React components, data sources, or CDK infrastructure.

## Service Identity
- **Repo**: `cvent-internal/passkey-rdk2`
- **Type**: TypeScript Next.js monorepo (CDF-based, pnpm + Nx)
- **Owner**: metre-stick (`#passkey-api`)
- **DB**: Redis (server-side cache)
- **Registry ID**: passkey-rdk2

## What This Service Does
RDK2 is the primary web UI for Passkey hotel housing management. It serves as a BFF (Backend-for-Frontend) — the browser talks GraphQL to RDK2, and RDK2's server-side resolvers fan out REST calls to ~30 backend Passkey microservices. It handles event management, hotel associations, room blocks, sub-block groups, reservation viewing/management, notifications, reporting, and planner portal access.

## Key Domain Concepts

| Term | Definition |
|---|---|
| Event | A housing event (conference/convention) requiring hotel room blocks |
| Event Hotel | A hotel associated with a specific event |
| Room Block | Allocated hotel rooms at negotiated rates for an event |
| Sub-Block Group (SBG) | Subdivision of a room block for a specific group |
| Reservation | A hotel room booking by an attendee |
| Planner | Event planner managing housing for their organization |
| Notification Template | Email templates for housing communications |
| Housing Library | Reusable hotel/housing configurations across events |
| Ledger | Financial tracking of room block commitments |
| RegLink | Self-registration URL for attendee housing booking |
| Smart Room Assistant | AI-powered room assignment suggestions |
| Business Text | Customizable UI labels per organization |

## Architecture at a Glance
```
packages/
├── app/                    # Next.js application
│   └── src/
│       ├── pages/          # Routes: /, /event/*, /manage/*, /reports, /request-queue/*, /reservations/*
│       ├── components/     # React UI (Carina UI + Tailwind)
│       ├── graphql/        # Schema, operations, fragments, codegen
│       ├── resolvers/      # Server-side GQL resolvers
│       ├── data-sources/   # ~35 REST API clients to backend services
│       └── hooks/          # Custom React hooks
├── infra/                  # AWS CDK infrastructure
├── it/                     # Integration tests
└── passkey-rdk2-lib/       # Shared library (components, types, utils)
```

**Data flow**: Browser → Apollo Client → `/api/graphql` → Resolvers → data-sources → Backend REST APIs. Redis caches server-side responses.

## API Surface
Single GraphQL endpoint: `POST /api/graphql`

| Domain | Data Source | Backend Service |
|---|---|---|
| Events | `event-api.ts` | passkey-event |
| Hotels | `hotel-api.ts` | passkey-hotel |
| Sub-Block Groups | `subBlockGroupData-api.ts` | passkey-subblock-group-data |
| Notifications | `notification-api.ts` | passkey-notifications |
| Reservations | `reservation-api.ts` | passkey-reservation |
| Permissions | `permission-api.ts` | passkey-permission |
| Users | `user-api.ts` | passkey-user-service |
| Planners | `planners-api.ts` | passkey-planners |
| Ledger | `ledger-api.ts` | passkey-ledger-service |
| Inventory | `inventory-api.ts` | passkey-inventory |
| Reports | `reporting-api.ts` | passkey-reporting |
| Room Categories | `roomCategories-api.ts` | passkey-room-type-data |
| Feature Flags | `launchDarkly-api.ts` | LaunchDarkly |

## Key Business Rules
- Auth tokens validated server-side on every page via `getAuthPropsOrRedirect` in `getServerSideProps`
- CSRF tokens generated and stored in localStorage
- Permissions checked via passkey-permission before rendering protected pages
- LaunchDarkly feature flags control feature availability
- Redis caching with configurable TTLs per data type
- Integrates with legacy Resdesk for login flow (cookie-based session sharing)
- GraphQL types auto-generated via codegen from schema files

## Service Dependencies

| Service | Purpose |
|---|---|
| auth-service | Access tokens, Cvent auth |
| passkey-authentication | Passkey auth token validation |
| passkey-permission | User permission checks |
| passkey-event | Event CRUD (largest data source) |
| passkey-hotel | Hotel profiles and images |
| passkey-reservation | Reservations and participant search |
| passkey-subblock-group-data | Sub-block group management |
| passkey-notifications | Notification templates |
| passkey-inventory | Room inventory |
| passkey-ledger-service | Financial ledger |
| passkey-planners | Planner portal |
| passkey-reporting | Reports |
| LaunchDarkly | Feature flags |
| Redis | Server-side caching |

## Getting Deeper Information

### Tier 2: Detailed Documentation (local)
- `docs/README.md` — Overview, features, related services
- `docs/ARCHITECTURE.md` — Full module structure, data flow, all 35 data sources mapped
- `docs/API_REFERENCE.md` — GraphQL schema structure, query domains, codegen setup
- `docs/DOMAIN_MODEL.md` — Complete glossary, entity definitions, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, config variables, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environments, CDK commands, rollback
- `docs/DEVELOPMENT.md` — Local setup, testing, code structure, commands
- `docs/UI.md` — Pages, routes, navigation, component library

### Tier 3: Source Code (GitHub)
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-rdk2` to browse:
- `packages/app/src/pages/` — Next.js routes
- `packages/app/src/components/` — React components
- `packages/app/src/graphql/schema/` — GraphQL schema definitions
- `packages/app/src/resolvers/` — GraphQL resolvers
- `packages/app/src/data-sources/` — REST API clients
- `packages/app/.env.template` — Environment configuration
- `packages/infra/lib/` — CDK infrastructure
- `catalog-info.yaml` — Backstage service metadata

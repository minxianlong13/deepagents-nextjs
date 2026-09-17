---
name: "passkey-repo-autoblock-nx"
description: "Provides a GraphQL gateway and Next.js UI for autoblock functionality in the Passkey system. Acts as the frontend interface for managing hotel room blocks for events, allowing event organizers to configure and manage room inventory allocations across participating hotels. Use when working with: the passkey-autoblock-nx repository; Autoblock, Block Request, Participating Hotel, Room Type Configuration, Inventory."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-autoblock-nx`
- **Type**: TypeScript Nx Monorepo with Next.js/Apollo GraphQL
- **Owner**: metre-stick team (`#metre-stick`)
- **DB**: None (Gateway service)
- **Registry ID**: passkey-autoblock-apollo

## What This Service Does
Provides a GraphQL gateway and Next.js UI for autoblock functionality in the Passkey system. Acts as the frontend interface for managing hotel room blocks for events, allowing event organizers to configure and manage room inventory allocations across participating hotels.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Autoblock** | Hotel room inventory management system for event attendees |
| **Block Request** | Formal request to reserve hotel room blocks for events |
| **Participating Hotel** | Hotel providing rooms for an autoblock request |
| **Room Type Configuration** | Settings for specific room types (standard, deluxe, suite) |
| **Inventory** | Available room capacity for specific dates and room types |
| **Free Sell DateTime** | When unbooked rooms become available to general public |
| **Site State** | Operational status (ACTIVE, INACTIVE, PREVIEW) |
| **Survey Configuration** | Settings for booking forms and surveys |
| **Guarantee Type** | Commitment level for room reservations |
| **Campaign** | Marketing campaigns associated with autoblock requests |

## Architecture at a Glance
```
passkey-autoblock-nx/
├── packages/
│   └── passkey-autoblock-apollo/
│       ├── app/                    # Next.js application
│       │   ├── src/
│       │   │   ├── pages/         # Next.js pages
│       │   │   ├── components/    # React components
│       │   │   ├── resolvers/     # GraphQL resolvers
│       │   │   └── data-sources/  # External service integrations
│       │   └── .storybook/        # Component documentation
│       ├── model/                 # GraphQL schema definitions
│       ├── infra/                 # AWS CDK infrastructure
│       ├── e2e/                   # End-to-end tests
│       └── it/                    # Integration tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **GraphQL API** | `/api/graphql` | blockRequestConfigProperties, mutations |
| **Next.js Pages** | `/` | UI for autoblock management |
| **Health Check** | `/health` | Service health monitoring |

## Key Business Rules
- Block requests must have valid start/end dates and participating hotels
- Free sell datetime determines when rooms become publicly available
- Site state controls operational availability (ACTIVE/INACTIVE/PREVIEW)
- Survey configurations control booking form presentation
- Guarantee types determine payment and cancellation policies
- Room type configurations define availability and display preferences
- Campaign associations enable tracking and targeting
- Organization fields capture attendee company information
- Rollup guaranteed blocks combine allocations across hotels

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **auth-service** | Authentication and authorization |
| **passkey-* services** | Core Passkey platform functionality |
| **LaunchDarkly** | Feature flag management |
| **Datadog** | Monitoring and observability |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full GraphQL API docs with queries, mutations, examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards
- `docs/UI.md` — UI pages, user flows, navigation structure

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-autoblock-nx` to browse:
- `packages/passkey-autoblock-apollo/app/src/pages/` — Next.js pages and routing
- `packages/passkey-autoblock-apollo/app/src/components/` — React UI components
- `packages/passkey-autoblock-apollo/app/src/resolvers/` — GraphQL resolvers
- `packages/passkey-autoblock-apollo/model/` — GraphQL schema definitions
- `packages/passkey-autoblock-apollo/infra/` — AWS CDK infrastructure code
- `catalog-info.yaml` — Backstage service metadata

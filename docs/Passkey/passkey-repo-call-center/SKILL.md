---
name: "passkey-repo-call-center"
description: "A CDF+Carina-based redesign of the legacy Passkey Call Center form. Provides a modern, web-based interface for hotel call center agents to book reservations on behalf of customers, replacing the legacy booking system with a responsive and efficient solution. Use when working with: the passkey-call-center repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-call-center`
- **Type**: TypeScript Next.js Web Application
- **Owner**: Passkey Team (`#passkey`)
- **DB**: None (Frontend Application)
- **Registry ID**: passkey-call-center

## What This Service Does
A CDF+Carina-based redesign of the legacy Passkey Call Center form. Provides a modern, web-based interface for hotel call center agents to create reservations on behalf of customers, replacing the legacy booking system with a responsive and efficient solution. This is one of the primary applications where reservations ARE made in the Passkey ecosystem.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Call Center Agent | Hotel staff member who books reservations on behalf of customers |
| Guest Reservation | Hotel booking made by agents for customers via phone/email |
| Real-time Availability | Live room inventory and pricing information |
| Booking Workflow | Step-by-step process for creating customer reservations |
| CDF+Carina | Cvent Development Framework with Carina UI components |
| Legacy Form Redesign | Modernization of existing call center booking interface |
| Agent Interface | User interface optimized for hotel staff workflows |
| Customer Proxy Booking | Reservations made by agents acting on behalf of guests |

## Architecture at a Glance
```
passkey-call-center/
├── packages/
│   └── call-center-app/
│       ├── app/           # Next.js application
│       ├── components/    # React UI components
│       ├── lib/          # Shared utilities
│       ├── graphql/      # GraphQL queries and mutations
│       └── infra/        # Infrastructure code
├── tools/                # Build and development tools
└── nx.json              # Nx workspace configuration
```

## API Surface

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| Next.js App | Main call center interface | Server-side rendering, responsive design |
| GraphQL API | Data querying and mutations | Flexible reservation management |
| React Components | UI elements | Carina-based components, form handling |
| Real-time Updates | Live data synchronization | Availability and booking status |

## Key Business Rules
- Call center agents create reservations on behalf of customers (this is a primary reservation creation channel)
- Real-time availability checking prevents overbooking
- Modern web interface improves agent efficiency
- GraphQL API provides flexible data operations
- Authentication ensures secure access for hotel staff
- Responsive design supports various device types
- Integration with Passkey reservation system required
- Streamlined workflow reduces booking time and errors

## Service Dependencies

| Service | Purpose |
|---------|---------|
| Passkey Reservation System | Core booking functionality and data |
| GraphQL API | Data querying and reservation mutations |
| Cvent Auth Service | Authentication and authorization |
| CDF+Carina | Development framework and UI components |
| Real-time Data Services | Live availability and pricing updates |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full component docs with usage examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-call-center` to browse:
- `packages/call-center-app/app/` — Next.js application code
- `packages/call-center-app/components/` — React UI components
- `packages/call-center-app/graphql/` — GraphQL queries and mutations
- `packages/call-center-app/lib/` — Shared utilities
- `catalog-info.yaml` — Backstage service metadata

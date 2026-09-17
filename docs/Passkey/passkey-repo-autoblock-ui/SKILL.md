---
name: "passkey-repo-autoblock-ui"
description: "Provides comprehensive React-based user interfaces for hotel room autoblock workflows. Includes guest-facing booking interfaces, administrative site editor tools, and a shared widget library for consistent UI components across the Passkey platform. Use when working with: the passkey-autoblock-ui repository; Guestside Site, Site Editor, Shared Widgets, Hotel Search, Room Management."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-autoblock-ui`
- **Type**: React Monorepo with Multiple Applications
- **Owner**: metre-stick team (`#metre-stick`)
- **DB**: None (Frontend applications)
- **Registry ID**: passkey-autoblock-ui

## What This Service Does
Provides comprehensive React-based user interfaces for hotel room autoblock workflows. Includes guest-facing booking interfaces, administrative site editor tools, and a shared widget library for consistent UI components across the Passkey platform.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Guestside Site** | Guest-facing interface for browsing and booking hotel rooms |
| **Site Editor** | Administrative interface for configuring autoblock sites |
| **Shared Widgets** | Reusable React components for consistent UX |
| **Hotel Search** | Interactive hotel browsing with maps and filters |
| **Room Management** | Room selection, amenities, and booking workflows |
| **Autoblock Configuration** | Site setup and content management tools |
| **Responsive Design** | Mobile-friendly interfaces using Carina design system |
| **Real-time Updates** | Live availability and pricing information |
| **Internationalization** | Multi-language support for global events |

## Architecture at a Glance
```
passkey-autoblock-ui/
├── apps/
│   ├── passkey-autoblock-guestside-site/    # Guest-facing React app
│   └── passkey-autoblock-site-editor/       # Site editor React app
├── pkgs/
│   └── passkey-autoblock-widgets/           # Shared widget library (30+ components)
├── cdk/
│   ├── passkey-autoblock-guestside-site-cdk/
│   └── passkey-autoblock-site-editor-cdk/
└── tools/                                   # Build and development tools
```

## API Surface
| Application | Base Path | Key Features |
|-------------|-----------|--------------|
| **Guestside Site** | `/` | Hotel search, room selection, booking workflow |
| **Site Editor** | `/editor` | Site configuration, content management, preview |
| **Shared Widgets** | N/A | HotelBanner, RoomList, ContactInfo, etc. |

## Key Business Rules
- Guest-facing site provides intuitive hotel search and booking experience
- Site editor enables event organizers to configure autoblock sites
- Shared widgets ensure consistent UX across all applications
- Responsive design supports mobile and desktop experiences
- Real-time data integration provides live availability and pricing
- Internationalization supports global event requirements
- GraphQL integration with Apollo Client for efficient data fetching
- Carina design system ensures brand consistency
- Component library includes 30+ reusable widgets

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **Passkey Backend Services** | GraphQL APIs for hotel and reservation data |
| **Cvent Core Platform** | Authentication and user management |
| **AWS Infrastructure** | CloudFront, S3, and Lambda for hosting |
| **Datadog** | Monitoring and observability |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Component APIs, GraphQL integration, data flow
- `docs/ARCHITECTURE.md` — Detailed app structure, shared components, build system
- `docs/DOMAIN_MODEL.md` — UI concepts, user workflows, data models
- `docs/TECHNICAL_DETAILS.md` — React setup, build tools, deployment
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, CDK deployment
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards
- `docs/UI.md` — UI pages, user flows, navigation structure

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-autoblock-ui` to browse:
- `apps/passkey-autoblock-guestside-site/src/` — Guest-facing application code
- `apps/passkey-autoblock-site-editor/src/` — Site editor application code
- `pkgs/passkey-autoblock-widgets/src/` — Shared widget library
- `cdk/` — AWS CDK infrastructure definitions
- `catalog-info.yaml` — Backstage service metadata

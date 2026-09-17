---
name: "passkey-repo-admin"
description: "Passkey Admin provides frontend UI capabilities for administrative tasks related to Single Sign-On Identity Provider management within the Passkey ecosystem. Built as a modern Next.js application with a monorepo architecture, it offers administrators a web-based interface to configure and manage identity provider settings. Use when working with: the passkey-admin repository; SSO IDP, Admin Portal, Hotel Contact Management, GraphQL Client, Feature Flags."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-admin`
- **Type**: TypeScript Next.js Web Application with React UI
- **Owner**: Maurya (`#passkey-maurya`)
- **DB**: None (Frontend application)
- **Registry ID**: Not specified

## What This Service Does
Passkey Admin provides frontend UI capabilities for administrative tasks related to Single Sign-On Identity Provider management within the Passkey ecosystem. Built as a modern Next.js application with a monorepo architecture, it offers administrators a web-based interface to configure and manage identity provider settings.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **SSO IDP** | Single Sign-On Identity Provider configuration and management |
| **Admin Portal** | Web-based administrative interface for system configuration |
| **Hotel Contact Management** | Administrative interface for managing organizational contact information for hotel participants |
| **GraphQL Client** | Apollo Client for efficient data fetching and state management |
| **Feature Flags** | LaunchDarkly integration for controlled feature rollouts |
| **Component Library** | Cvent's Carina design system for consistent UI/UX |
| **Monorepo** | Nx-powered workspace with multiple packages |
| **Storybook** | Component documentation and development environment |

## Architecture at a Glance
```
passkey-admin/
├── packages/app/                    # Main Next.js application
│   ├── src/app/                    # Next.js App Router pages
│   ├── src/pages/                  # Next.js Pages Router (legacy)
│   ├── src/components/             # React components
│   ├── .storybook/                 # Storybook configuration
│   ├── locales/                    # Internationalization files
│   └── public/                     # Static assets
├── packages/model/                 # Shared data models
├── packages/infra/                 # Infrastructure as code
├── packages/e2e/                   # End-to-end tests
└── packages/it/                    # Integration tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **SSO IDP Management** | `/ssoidp` | Identity provider configuration and management |
| **Hotel Contact** | `/hotel/[hotelId]/contact` | Organizational contact information management for hotel participants |
| **GraphQL APIs** | `/api/graphql` | Data operations via Apollo Client |
| **Authentication** | `/auth` | User authentication and session management |

## Key Business Rules
- Administrators must authenticate to access the admin portal
- SSO IDP configurations are managed at the participant (organization) level
- Passkey maintains its own authentication system separate from Cvent-wide auth
- Sister property relationships enable centralized SSO management across hotel chains
- Hotel contact information represents organizational contacts for hotel participants
- Feature flags control access to new functionality
- GraphQL queries are cached for performance optimization
- Component library ensures consistent user experience
- Storybook provides component documentation and testing

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **GraphQL Backend APIs** | Data operations and business logic |
| **Cvent Authentication** | User authentication and authorization |
| **LaunchDarkly** | Feature flag management |
| **DataDog** | Application monitoring and observability |
| **Octopus Deploy** | Deployment management |

## User Interface
The service is a comprehensive Next.js-based web application with:
- **SSO IDP Management** - Administrative interface for identity provider configuration
- **Hotel Contact Management** - Forms and interfaces for managing organizational contact information for hotel participants
- **Component Library** - Carina design system components for consistent UI
- **Storybook** - Interactive component documentation and development environment
- **Responsive Design** - Tailwind CSS for modern, responsive styling
- **Internationalization** - Multi-language support via locales

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards
- `docs/UI.md` — UI pages, user flows, navigation structure

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-admin` to browse:
- `packages/app/src/app/` — Next.js App Router pages and layouts
- `packages/app/src/pages/` — Next.js Pages Router (legacy pages)
- `packages/app/src/components/` — React components and UI elements
- `packages/app/.storybook/` — Storybook configuration and stories
- `packages/app/next.config.mjs` — Next.js configuration
- `catalog-info.yaml` — Backstage service metadata

---
name: "passkey-repo-book-mono"
description: "A TypeScript monorepo containing applications and packages for Passkey Book 3.0. Provides a modern, scalable booking interface for hotels using Next.js and TypeScript, replacing legacy booking systems with a more maintainable and feature-rich solution. Use when working with: the passkey-book-mono repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-book-mono`
- **Type**: TypeScript Next.js Monorepo
- **Owner**: Passkey Team (`#passkey`)
- **DB**: None (Frontend Application)
- **Registry ID**: passkey-book-mono

## What This Service Does
A TypeScript monorepo containing applications and packages for Passkey Book 3.0. Provides a modern, scalable booking interface for hotels using Next.js and TypeScript, replacing legacy booking systems with a more maintainable and feature-rich solution.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Passkey Book 3.0 | Next-generation hotel booking platform within Cvent Passkey |
| Next.js Application | Modern React-based web application with server-side rendering |
| TypeScript Monorepo | Type-safe development with shared libraries and components |
| Nx Workspace | Advanced build system and development tools for monorepo management |
| CDF Integration | Built on Cvent's Common Development Framework |
| Room Reservations | Hotel booking functionality for guest accommodations |
| Inventory Management | Real-time availability and room inventory tracking |
| Guest Experience | User interface and workflow for hotel booking process |
| Feature Flags | LaunchDarkly integration for controlled feature rollouts |
| Internationalization | Multi-language support with PhraseApp integration |

## Architecture at a Glance
```
passkey-book-mono/
├── packages/
│   └── passkey-book-ui/
│       ├── app/           # Next.js application
│       ├── lib/           # Shared library components
│       ├── infra/         # AWS CDK infrastructure
│       ├── e2e/           # Playwright testing suite
│       └── locales/       # Internationalization files
├── tools/                 # Build and development tools
└── nx.json               # Nx workspace configuration
```

## API Surface

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| Next.js App | Main booking interface | Server-side rendering, React components |
| Shared Libraries | Reusable components | TypeScript utilities, UI components |
| E2E Tests | Quality assurance | Playwright automated testing |
| Infrastructure | AWS deployment | CDK infrastructure as code |
| Localization | Multi-language support | PhraseApp integration |

## Key Business Rules
- Modern React-based booking interface replaces legacy systems
- Type-safe development ensures code quality and maintainability
- Server-side rendering improves performance and SEO
- Nx workspace enables efficient monorepo management
- CDF integration provides standardized development framework
- Feature flags enable controlled rollout of new functionality
- Internationalization supports global hotel booking requirements
- E2E testing ensures booking workflow reliability
- AWS infrastructure provides scalable cloud deployment
- Shared libraries promote code reuse across applications

## Service Dependencies

| Service | Purpose |
|---------|---------|
| Passkey Backend Services | Hotel data, inventory, reservations |
| AWS CDK | Infrastructure deployment and management |
| LaunchDarkly | Feature flag management |
| PhraseApp | Internationalization and localization |
| Playwright | End-to-end testing framework |
| Nx | Monorepo build system and tools |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full component docs with usage examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-book-mono` to browse:
- `packages/passkey-book-ui/app/` — Next.js application code
- `packages/passkey-book-ui/lib/` — Shared library components
- `packages/passkey-book-ui/infra/` — AWS CDK infrastructure
- `packages/passkey-book-ui/e2e/` — Playwright test suite
- `nx.json` — Nx workspace configuration
- `catalog-info.yaml` — Backstage service metadata

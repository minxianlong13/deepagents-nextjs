---
name: "passkey-repo-shared-monorepo"
description: "A TypeScript monorepo containing shared libraries and tools for Passkey applications. Provides reusable components, GraphQL models, and utilities that enable consistent user experiences across the Passkey ecosystem using the Cvent Development Framework (CDF). Use when working with: the passkey-shared-mono repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-shared-mono`
- **Type**: TypeScript Monorepo (Shared Libraries)
- **Owner**: Passkey Team (`#passkey`)
- **DB**: None (Library Package)
- **Registry ID**: passkey-shared-mono

## What This Service Does
A TypeScript monorepo containing shared libraries and tools for Passkey applications. Provides reusable components, GraphQL models, and utilities that enable consistent user experiences across the Passkey ecosystem using the Cvent Development Framework (CDF).

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Shared Libraries | Reusable code packages distributed across Passkey applications |
| UI Components | Consistent React components for common interface elements |
| GraphQL Models | Standardized data structures and operations for navigation |
| Microfrontend Applications | Distributed frontend architecture with shared dependencies |
| CDF Integration | Built on Cvent Development Framework for standardized tooling |
| Navigation Model | Data structures for global navigation across Passkey apps |
| Type Safety | TypeScript definitions for cross-application consistency |
| Automated Publishing | Changesets-based versioning with NPM distribution |
| Code Generation | Automated type generation from GraphQL schemas |
| Nx Monorepo | Efficient workspace management with task orchestration |

## Architecture at a Glance
```
passkey-shared-mono/
├── packages/
│   ├── passkey-navigation-model/  # GraphQL navigation data structures
│   ├── passkey-components/        # Reusable React UI components
│   └── [other-shared-packages]/   # Additional shared utilities
├── tools/                         # Build and development tools
├── .changeset/                    # Version management configuration
└── nx.json                       # Nx workspace configuration
```

## API Surface

| Package | Purpose | Key Features |
|---------|---------|--------------|
| @cvent/passkey-navigation-model | GraphQL navigation data | Schema definitions, resolvers, TypeScript types |
| @cvent/passkey-components | UI component library | Reusable React components, consistent styling |
| Shared Utilities | Common functionality | TypeScript utilities, helper functions |
| Development Tools | Build configuration | Shared build configs, development utilities |

## Key Business Rules
- Provides consistent UI components across Passkey microfrontends
- GraphQL models standardize data structures for navigation
- Automated publishing ensures version consistency across applications
- Type safety maintained through TypeScript definitions
- CDF integration provides standardized development tooling
- Nx monorepo enables efficient workspace management
- Changesets manage versioning and release automation
- Code generation creates types from GraphQL schemas
- Comprehensive testing ensures library reliability
- CI/CD pipeline automates testing and publishing

## Service Dependencies

| Service | Purpose |
|---------|---------|
| NPM Registry | Package distribution and version management |
| GraphQL Schemas | Source for automated type generation |
| Nx | Monorepo build system and task orchestration |
| Changesets | Version management and release automation |
| Jest | Testing framework for library validation |
| Jenkins | Continuous integration and deployment |
| CDF | Cvent Development Framework tooling |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full package docs with usage examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-shared-mono` to browse:
- `packages/passkey-navigation-model/` — GraphQL navigation models
- `packages/passkey-components/` — Reusable React UI components
- `packages/[other-packages]/` — Additional shared utilities
- `.changeset/` — Version management configuration
- `nx.json` — Nx workspace configuration
- `catalog-info.yaml` — Backstage service metadata

---
name: "passkey-repo-business-text-service"
description: "Provides translation and localization capabilities for the Passkey platform. Manages locale-specific labels and business text, enabling multi-language support across all Passkey applications and services. Use when working with: the passkey-business-text repository; Business Text, Internationalization (i18n), Localization (l10n), Locale, Custom Business Text."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-business-text`
- **Type**: Java 21 Dropwizard Multi-Module
- **Owner**: metre-stick team (`#metre-stick`)
- **DB**: Oracle Database
- **Registry ID**: passkey-business-text-service

## What This Service Does
Provides translation and localization capabilities for the Passkey platform. Manages locale-specific labels and business text, enabling multi-language support across all Passkey applications and services.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Business Text** | Locale-specific labels and content for UI elements |
| **Internationalization (i18n)** | Process of designing software for multiple locales |
| **Localization (l10n)** | Adapting software for specific languages and regions |
| **Locale** | Language and region combination (e.g., en-US, fr-FR) |
| **Custom Business Text** | User-defined overrides for default business text |
| **Business Text ID** | Unique identifier for business text entries |
| **Country Information** | Locale and regional data for internationalization |
| **Bulk Operations** | Mass creation/update of business text entries |
| **Text Override** | Custom text that replaces default localized content |

## Architecture at a Glance
```
passkey-business-text/
├── passkey-business-text-api/           # API definitions and models
├── passkey-business-text-service/       # Main Dropwizard service
├── passkey-business-text-data-access/   # Database access layer
├── passkey-business-text-java-client/   # Java client library
└── passkey-business-text-integration-test/ # Integration tests
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Business Text** | `/business-text` | CRUD operations for localized text |
| **Custom Text** | `/custom-business-text` | Custom text overrides |
| **Locales** | `/locales` | Locale management and information |
| **Countries** | `/countries` | Country and regional data |
| **Bulk Operations** | `/business-text/bulk` | Mass text operations |
| **Health Check** | `/healthcheck` | Service health monitoring |

## Key Business Rules
- All business text must be associated with a valid locale
- Custom business text overrides take precedence over default text
- Business text IDs are generated based on business elements
- Bulk operations support efficient mass text management
- API key authentication required for all operations
- Locale information includes language and region specifications
- Country data supports regional customization requirements
- Text entries support versioning and audit trails
- Default fallback text provided when localized version unavailable

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **auth-service** | Authentication and authorization |
| **Oracle Database** | Data persistence and storage |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full REST API docs with endpoints, parameters, examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-business-text` to browse:
- `passkey-business-text-service/src/main/java/` — Main service implementation
- `passkey-business-text-api/src/main/java/` — API definitions and models
- `passkey-business-text-data-access/src/main/java/` — Database access layer
- `passkey-business-text-java-client/src/main/java/` — Java client library
- `catalog-info.yaml` — Backstage service metadata

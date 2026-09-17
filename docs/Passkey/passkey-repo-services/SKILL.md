---
name: "passkey-repo-services"
description: "Aggregates multiple Java-based microservices into a centralized deployment and management hub. Handles critical scheduled operations including currency exchange rates, billing reports, reservation processing, guest management, and third-party integrations through automated cron-based scheduling. Use when working with: the passkey-services repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-services`
- **Type**: TypeScript/JavaScript Monorepo (Java Service Aggregator)
- **Owner**: Passkey Team (`#passkey`)
- **DB**: Various (per service)
- **Registry ID**: Not specified

## What This Service Does
Aggregates multiple Java-based microservices into a centralized deployment and management hub. Handles critical scheduled operations including currency exchange rates, billing reports, reservation processing, guest management, and third-party integrations through automated cron-based scheduling.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| Service Aggregator | Design pattern consolidating multiple independent services into single deployable unit |
| GML | Guest Management Layer - centralized guest information and lifecycle management |
| CRTS | Central Reservation Transaction System for GL integration and financial reporting |
| Exchange Rate Management | Maintaining current/historical currency rates for multi-currency transactions |
| Nor1 | Third-party revenue optimization platform for hotel upselling/cross-selling |
| Roche Integration | Specialized reporting system for healthcare/pharmaceutical event management |
| Billing Report Generation | Automated financial reports for billing and revenue summaries |
| Cron-based Scheduling | Time-based job scheduling using Unix cron syntax |
| Monorepo | Single repository storing multiple related projects with shared tooling |
| Changeset Management | Version control system tracking changes across multiple packages |

## Architecture at a Glance
```
packages/
├── app/                     # TypeScript orchestration layer
├── GMLService/              # Guest management (runs every minute)
├── ExchangeRates/           # Currency updates (monthly on 1st at 9 AM)
├── GLResCRTSService/        # GL reservation processing
├── Nor1Processor/           # Nor1 integration (daily at 6 AM)
├── billing-report/          # Web billing reports (monthly on 2nd at 6 AM)
├── roche-report/            # Roche reports (daily at 8:50 PM)
└── exchange-rates/          # Alternative currency service
```

## API Surface
| Service | Schedule | Key Operations |
|---------|----------|----------------|
| GMLService | Every minute | Guest management layer processing |
| ExchangeRates | Monthly (1st at 9 AM) | Currency rate updates |
| GLResCRTSService | On-demand | GL reservation transaction processing |
| Nor1Processor | Daily at 6 AM | Revenue optimization integration |
| billing-report | Monthly (2nd at 6 AM) | Web billing report generation |
| roche-report | Daily at 8:50 PM | Roche-specific reporting |

## Key Business Rules
- Services run on predefined schedules via cron jobs for automated processing
- Each service maintains independence while sharing deployment infrastructure
- Exchange rates updated monthly to ensure accurate multi-currency transactions
- Guest management processes run frequently (every minute) for real-time updates
- Billing reports generated monthly for financial reconciliation
- Third-party integrations (Nor1, Roche) run on daily schedules
- Unified logging and monitoring across all aggregated services

## Service Dependencies
| Service | Purpose |
|---------|---------|
| Various Passkey Services | Data sources for guest, reservation, and financial information |
| Third-party APIs | Nor1 and Roche integration endpoints |
| Currency Exchange APIs | Real-time exchange rate data |
| Financial Systems | GL and billing system integrations |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Service endpoints and scheduling details
- `docs/ARCHITECTURE.md` — Detailed aggregator structure, design patterns
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, business concepts
- `docs/TECHNICAL_DETAILS.md` — Dependencies, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, scheduling, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, service management

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-services` to browse:
- `packages/app/` — TypeScript orchestration layer
- `packages/*/` — Individual Java service implementations
- `package.json` — Monorepo configuration and scripts
- `.changeset/` — Version management configuration
- `catalog-info.yaml` — Backstage service metadata

---
name: "passkey-repo-smart"
description: "Provides automated email campaign functionality for the Passkey platform. Manages smart email setup, template management, and campaign scheduling. Note: Passkey Manage configures campaigns but other applications handle bulk email sending. Use when working with: the passkey-smart repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-smart`
- **Type**: Java 17 WildFly Application Server
- **Owner**: Cherry Pickers Team (`#passkey-api`)
- **DB**: Oracle Database
- **Registry ID**: Not specified in docs

## What This Service Does
Provides automated email campaign functionality for the Passkey platform. Manages smart email setup, template management, and campaign scheduling. Note: Passkey Manage configures campaigns but other applications handle bulk email sending.

## Key Domain Concepts

| Term | Definition |
|------|------------|
| Email Campaign | Automated email marketing or notification campaign configuration |
| Smart Email Setup | Configuration and management of intelligent email systems |
| Email Template | Reusable email format with personalization capabilities |
| Campaign Scheduling | Automated timing configuration for email campaigns |
| Template Processing | Handling of email templates and personalization |
| Scheduled Execution | Support for scheduled and triggered email campaign configuration |
| Campaign Management | Configure and manage email campaigns by ID |
| Campaign Configuration | Setup and configuration of email campaigns (actual sending handled by other systems) |
| Campaign Monitoring | Tracking and observability of email campaign configuration |
| Email Personalization | Customization of email content for individual recipients |

## Architecture at a Glance
```
passkey-smart/
├── Java Application (WildFly)
├── Email Campaign Configuration Engine
├── Template Processing System
├── Campaign Setup & Scheduling
└── Monitoring & Observability

Email Campaign Requests → Smart Service → Template Processing → Campaign Configuration
                                                                ↓
                                                    Other Systems Handle Bulk Sending
```

## API Surface

| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Campaign Management | `/passkey-smart/v1/campaigns` | Configure and manage email campaigns |
| Smart Email Setup | `/passkey-smart/v1/setup` | Configure smart email systems |
| Template Management | `/passkey-smart/v1/templates` | Email template operations |
| Campaign Scheduling | `/passkey-smart/v1/schedule` | Schedule and configure campaign triggers |
| Configuration Tracking | `/passkey-smart/v1/tracking` | Monitor campaign configuration status |
| Admin Operations | `/passkey-smart/v1/admin` | System management and monitoring |

## Key Business Rules
- Email campaigns can be configured and managed by unique campaign ID
- Smart email setup enables configuration of intelligent email systems
- Template processing handles personalization and dynamic content configuration
- Scheduled execution supports both time-based and event-triggered campaign configuration
- Campaign configuration integrates with other systems that handle actual email sending
- Campaign monitoring provides observability through Datadog integration
- Template management ensures consistent email formatting and branding
- All email configuration must comply with anti-spam regulations
- Integration with hotel reservation systems enables booking-related notification configuration

## Service Dependencies

| Service | Purpose |
|---------|---------|
| passkey-authentication-service | Authentication and authorization |
| passkey-autoblock-guestside-service | Guest-side blocking functionality |
| passkey-housing-library | Housing and inventory management |
| passkey-event-housing | Event housing services |
| Other Email Services | Bulk email sending and delivery |
| Datadog | Monitoring and observability |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-smart` to browse:
- `src/main/java/com/cvent/passkey/smart/` — Email campaign and template processing
- `scripts/` — Setup and deployment scripts
- `catalog-info.yaml` — Backstage service metadata

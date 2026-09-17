---
name: "passkey-repo-addons-portal"
description: "The Passkey Addons Portal provides hotel staff and administrators with detailed insights into addon transactions and attendee preferences. It serves as a comprehensive reporting platform for tracking addon purchases, modifications, and cancellations across multiple time periods and dimensions. Use when working with: the passkey-addons-ng repository; Addon, Addon Transaction, Participant Profile, Reporting Dashboard, Time Period Filter."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-addons-ng`
- **Type**: Java 17 WildFly Web Application with JSP UI
- **Owner**: Maurya (`#passkey-api`)
- **DB**: Oracle Database
- **Registry ID**: c3527771-84d8-483d-92ee-5faa92c648f4

## What This Service Does
The Passkey Addons Portal provides hotel staff and administrators with detailed insights into addon transactions and attendee preferences. It serves as a comprehensive reporting platform for tracking addon purchases, modifications, and cancellations across multiple time periods and dimensions.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **Addon** | Additional services or products that can be purchased with hotel reservations |
| **Addon Transaction** | A purchase, modification, or cancellation event for an addon |
| **Participant Profile** | Customer information and addon purchase history |
| **Event** | A housing event (conference, convention, trade show) that requires hotel room blocks |
| **Reporting Dashboard** | Main interface for viewing addon activity across multiple dimensions |
| **Time Period Filter** | Date range selection for historical addon reporting |
| **Revenue Analytics** | Financial analysis of addon sales and trends |
| **Task Scheduling** | Automated email notifications and fulfillment workflows |
| **Hotel Search** | Functionality to find and filter hotels for addon reporting |

## Architecture at a Glance
```
passkey-addons-ng/
├── packages/app/                    # Main WildFly web application
│   ├── src/main/java/              # Java backend controllers and services
│   ├── src/main/webapp/            # JSP views and web resources
│   │   ├── WEB-INF/views/          # JSP page templates
│   │   ├── WEB-INF/layouts/        # Apache Tiles layout templates
│   │   ├── js/                     # JavaScript assets
│   │   └── styles/                 # CSS stylesheets
│   └── configs/                    # Environment-specific configurations
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **Portal Views** | `/addon` | Main dashboard, login, hotel search |
| **Account Management** | `/addon/account` | Password reset, profile management |
| **Authentication** | `/addon/auth` | Login, logout, session management |
| **Reporting** | `/addon/reports` | Addon transaction reports and analytics |

## Key Business Rules
- Users must authenticate through Passkey authentication service to access the portal
- Addon reports can be filtered by date ranges, hotel properties, and transaction types
- Attendee addon history is tracked across multiple reservations and properties
- Revenue analytics provide insights into addon sales trends and performance
- Task scheduling enables automated email notifications for addon fulfillment
- Session timeout redirects users to login page for security
- Hotel search functionality allows filtering by property characteristics

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **Passkey Authentication Service** | User authentication and authorization |
| **Passkey Reservation Service** | Core reservation data and booking information |
| **Passkey Payment Service** | Payment processing and transaction history |
| **Passkey Inventory Service** | Room and addon availability management |
| **Passkey GDPR Service** | Data privacy and compliance management |

## User Interface
The service includes a comprehensive JSP-based web interface with:
- **Login Portal** - User authentication and session management
- **Main Dashboard** - Addon reporting and analytics overview
- **Hotel Search** - Property selection and filtering
- **Account Management** - Password reset and profile settings
- **Error Handling** - Custom error pages and session timeout handling

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
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-addons-ng` to browse:
- `packages/app/src/main/java/` — Java controllers, services, and business logic
- `packages/app/src/main/webapp/WEB-INF/views/` — JSP page templates
- `packages/app/src/main/webapp/WEB-INF/layouts/` — Apache Tiles layouts
- `packages/app/pom.xml` — Maven dependencies and build configuration
- `packages/app/catalog-info.yaml` — Backstage service metadata

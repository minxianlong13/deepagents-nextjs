# Passkey RDK2

## Overview
Passkey RDK2 (Resdesk2) is the CDF-based Next.js UI that serves as the Passkey Manage landing/launch home page. It is the modern replacement for the legacy Resdesk JSP application, providing hotel housing management capabilities for event planners and hotel operators.

## Purpose
Provides the primary web interface for Passkey hotel housing management — event creation, hotel management, room block configuration, sub-block groups, reservation viewing/management, notifications, reporting, and planner portal access.

## Key Features
- Event management dashboard with search, sort, and filtering
- Hotel profile management and event-hotel associations
- Room block and sub-block group configuration
- Reservation management and participant search
- Notification template editing and management
- Reporting integration via embedded reporting service
- Request queue for housing block requests
- GraphQL BFF (Backend-for-Frontend) API layer
- LaunchDarkly feature flags
- Carina UI component library integration
- Gainsight analytics integration

## Quick Start
```bash
asdf install                    # Install correct Node version
brew install redis && redis-server  # Start Redis
cd packages/app
pnpm install
pnpm dev                        # http://localhost:3000
```

## Related Services
- `passkey-authentication` — Auth token validation
- `auth-service` — Cvent auth (access tokens)
- `passkey-hotel` — Hotel data
- `passkey-event` — Event data
- `passkey-permission` — User permissions
- `passkey-inventory` — Room inventory
- `passkey-reservation` — Reservations
- `passkey-event-data` — Event data service
- `passkey-create-event` — Event creation
- `passkey-event-housing` — Event housing
- `passkey-notifications` — Notification templates
- `passkey-transfer-log-service` — Transfer logs
- `passkey-vendor-service` — Vendor systems
- `passkey-housing-library-service` — Housing library
- `passkey-subblock-group-data` — Sub-block group data
- `passkey-autoblock-data` — Autoblock data
- `passkey-planners` — Planner portal
- `passkey-ledger-service` — Financial ledger
- `passkey-business-text` — Business text/labels
- `passkey-user-service` — User management
- `passkey-smart-room-assistant` — Smart room assistant
- `passkey-reglink` — Registration links
- `passkey-reporting` — Reporting service
- `passkey-room-type-data` — Room type data
- `passkey-admin-sb` — Admin microservice
- `booking-supplier-match-svc` — Booking supplier matching
- `venue-stats-service` — Venue statistics
- `reporting-service` — Cvent reporting
- `experiments-service` — A/B experiments
- `passkey-resdesk` — Legacy Resdesk (login redirect)

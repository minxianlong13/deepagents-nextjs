# Passkey Service Map

## Overview
Passkey is a hotel housing management platform within Cvent's Hospitality Cloud. It consists of ~75+ repositories in the `cvent-internal` GitHub org, prefixed with `passkey-`.

## Frontend Layer
| Service | Type | Purpose |
|---|---|---|
| passkey-resdesk | Java/WildFly JSP | Legacy Manage UI (being replaced by RDK2) |
| passkey-rdk2 | Next.js/React | Modern Manage UI (BFF with GraphQL) |
| passkey-booking | — | Guest-facing booking UI |
| passkey-planner-portal | — | Planner-facing portal |
| passkey-rlm | — | Room list management UI |

## Core Backend Services
| Service | Type | Domain |
|---|---|---|
| passkey-event | Java | Event management (CRUD, search) |
| passkey-hotel | Java | Hotel profiles, images, event-hotel associations |
| passkey-reservation | Java | Reservations and participant data |
| passkey-inventory | Java | Room inventory management |
| passkey-permission | Java | User permissions (dual legacy DB + strategy pattern) |
| passkey-authentication | Java | Passkey-specific auth token handling |
| passkey-user-service | — | User management |
| passkey-admin / passkey-admin-sb | Java | Admin operations (legacy + Spring Boot) |

## Housing & Blocks
| Service | Domain |
|---|---|
| passkey-event-housing | Event housing configuration |
| passkey-housing-library-service | Reusable housing templates |
| passkey-subblock-group-data | Sub-block group management |
| passkey-autoblock-data | Autoblock data |
| passkey-autoblock-autoprovision | Automated block provisioning |
| passkey-room-type-data | Room type/category data |

## Event Data & Creation
| Service | Domain |
|---|---|
| passkey-event-data | Event data queries and requests |
| passkey-create-event | Event creation workflow |
| passkey-smartcamp-cfg-data | SmartCamp (campus event) configuration |

## Financial & Reporting
| Service | Domain |
|---|---|
| passkey-ledger-service | Financial ledger (deposits, transactions) |
| passkey-reporting | Passkey-specific reporting |
| passkey-transfer-log-service | Room block transfer logs |
| passkey-sbg-deposit-site-service | Sub-block group deposit site |

## Communication & Integration
| Service | Domain |
|---|---|
| passkey-notifications | Email notification templates |
| passkey-business-text | Customizable UI labels/text |
| passkey-vendor-service | External PMS integrations |
| passkey-reglink | Registration link management |
| passkey-planners | Planner portal backend |
| passkey-smart-room-assistant | AI room assignment |

## Shared / Platform
| Service | Domain |
|---|---|
| auth-service | Cvent-wide authentication |
| reporting-service | Cvent-wide reporting |
| experiments-service | A/B experiments |
| venue-stats-service | Venue statistics/certifications |
| booking-supplier-match-svc | Booking supplier matching |

## Notes
- Most Java services inherit from `cvent-internal/mono-java` (shared parent POM)
- TypeScript services use CDF (Cvent Development Framework) with pnpm + Nx
- Services communicate via REST APIs; RDK2 is the only GraphQL layer
- Deployed to AWS via CDK, managed through Octopus Deploy, built with Jenkins

---
name: "passkey-repo-resdesk"
description: "Resdesk is part of **Passkey Manage** — a traditional Java EE web application (not a microservice). Hotel staff and call center agents use it to view and manage existing reservations, process guest requests, and handle day-to-day hotel operations. Note: Resdesk does NOT create new reservations — those are made through booking applications like passkey-book, call center systems, or vendor integrations. Use when working with: the passkey-resdesk repository."
---

## Service Identity

- **Repo**: `cvent-internal/passkey-resdesk`
- **Type**: Java 17 EE application on WildFly 16.0.0.Final
- **Owner**: Metre Stick (`#passkey-metre-stick`)
- **DB**: Oracle (via Hibernate/JPA)
- **Version**: 4.1.9
- **Deploy**: Octopus Deploy → WildFly (EAR)

## What This Service Does

Resdesk is part of **Passkey Manage** — a traditional Java EE web application (not a microservice). Hotel staff and call center agents use it to view and manage existing reservations, process guest requests, and handle day-to-day hotel operations. Note: Resdesk does NOT create new reservations — those are made through booking applications like passkey-book, call center systems, or vendor integrations. It's a frontend that integrates with many Passkey microservices.

## Key Domain Concepts

| Term | Meaning |
|------|---------|
| Reservation | A guest's hotel booking with dates, room, and payment details |
| Confirmation Number | Unique human-readable code for a reservation |
| Guest | Individual associated with a reservation |
| Resdesk | The reservation desk UI for hotel staff/agents |
| Autoblock | Automatic room blocking based on business rules |
| Subblock | Subset of rooms within a larger block reservation |
| Call Center | Agent interface for managing reservations remotely |

## Architecture at a Glance

This is a **Java EE layered application** (not a microservice):

```
passkey-resdesk/
├── packages/app/core/              # Domain models, DTOs, shared utilities
├── packages/app/ejb/               # EJB session beans, business logic, transactions
├── packages/app/web/               # Servlets, JSPs, REST endpoints, static assets
├── packages/app/ear/               # EAR packaging for WildFly deployment
├── packages/app/malware-scanner/   # ClamAV-based file scanning
└── packages/app/configs/           # Hogan templates for env-specific config
```

```
Client (Browser) → Web Layer (Servlets/JSPs/REST)
                     → EJB Layer (Session Beans/Business Logic)
                       → Core Layer (Domain Models)
                         → Oracle DB + Passkey Microservices
```

## Service Dependencies (many)

| Service | Purpose |
|---------|---------|
| passkey-authentication-service | User auth |
| passkey-reservation-saga | Reservation orchestration |
| passkey-autoblock-guestside-service | Guest-side blocking |
| commerce | Commerce operations |
| passkey-gl | General ledger |
| passkey-sputnik | Analytics/reporting |
| passkey-subblock-dashboard | Subblock management |
| reporting-service | Report generation |
| auth-service | Authorization |

## Key API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/reservations` | List/search reservations (paginated, filterable) |
| GET | `/reservations/{id}` | Get reservation details |
| POST | `/reservations` | Update/modify existing reservation |
| PUT | `/reservations/{id}` | Update reservation |
| DELETE | `/reservations/{id}` | Cancel reservation |
| GET | `/hotels` | List hotels |
| GET | `/guests/{id}` | Get guest details |
| POST | `/reports/generate` | Generate reports |

Auth: Session cookie (`JSESSIONID`) or Bearer token.

## Key Differences from Microservices

- **Deployed as EAR** to WildFly, not as a Docker container to ECS
- **Uses EJBs** for business logic with JTA transactions, not Spring/Dropwizard
- **Serves JSPs** — has a server-rendered UI, not just an API
- **Hogan configs** for environment-specific settings (not YAML/properties)
- **Octopus Deploy** for deployments (not just Jenkins)
- **Local dev** requires WildFly setup, port forwarding, `/etc/hosts` entries

## Local Development Quick Ref

```bash
# Prerequisites: passkey-legacy must be built first
mvn install  # in passkey-legacy repo

# Setup
scripts/setup.sh
sudo pfctl -evf scripts/wildfly.pfanchors  # macOS port forwarding
echo "127.0.0.1 dev-manage.passkey.com" | sudo tee -a /etc/hosts

# Deploy
scripts/deploy.sh

# Access at https://dev-manage.passkey.com
```

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, EJB patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, WildFly config, build setup
- `docs/DEPLOYMENT.md` — Octopus Deploy pipeline, environment configs, rollback
- `docs/DEVELOPMENT.md` — Local WildFly setup, HotSwap, debugging, testing
- `docs/UI.md` — UI pages, user flows, navigation structure

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-resdesk` to browse:
- `pom.xml` — Current dependencies and versions
- `packages/app/web/src/main/java/` — Servlets and REST endpoints
- `packages/app/ejb/src/main/java/` — Business logic (EJBs)
- `packages/app/core/src/main/java/` — Domain models and DTOs
- `packages/app/configs/` — Environment configurations
- `catalog-info.yaml` — Backstage service metadata

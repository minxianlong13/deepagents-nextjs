---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: index
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [index, navigation, passkey, event-housing]
---

# Passkey Event Housing Service — Knowledge Base

This folder is a retrieval-oriented knowledge base for the **Passkey Event Housing Service** (`passkey-event-housing`), a Java 21 / Dropwizard microservice owned by team **Metrestick** (`#passkey-metre-stick`). It manages hotel, room, room-category, image, GroupLink and registration-connection data for Passkey events.

All facts were derived from source in this repository at revision `1.8.2-SNAPSHOT` (last release `1.8.1`). Where something could not be verified it is marked **Unknown** or carries a **Confidence:** tag.

## How to read these documents

- **Verified** = read directly in code/config (file and line given).
- **Inferred** = reasoned from code; always labelled with `Confidence: High | Medium | Low`.
- Diagrams are standalone Mermaid files in [diagrams/](diagrams/) and are embedded or linked from the docs.

## Document map

| Document | Answers |
|---|---|
| [project-overview.md](project-overview.md) | What the service is, who owns it, scope |
| [architecture.md](architecture.md) | Layers, components, runtime topology |
| [technology-stack.md](technology-stack.md) | Languages, frameworks, libraries, versions |
| [directory-structure.md](directory-structure.md) | Where things live in the repo |
| [data-model.md](data-model.md) | Oracle tables, columns, sequences, API models |
| [api-reference.md](api-reference.md) | Every REST endpoint, auth, status codes, errors |
| [business-workflows.md](business-workflows.md) | GroupLink setup, connections, images, room categories |
| [technical-decisions.md](technical-decisions.md) | Summary of design decisions (links to [adr/](adr/)) |
| [dependency-map.md](dependency-map.md) | Module and external-service dependencies |
| [code-navigation.md](code-navigation.md) | "Where is X implemented?" lookup |
| [development-guide.md](development-guide.md) | Build, run, configure, add features |
| [testing-guide.md](testing-guide.md) | Unit tests, Karate ITs, coverage gates |
| [deployment-operations.md](deployment-operations.md) | CI/CD, environments, config, health, logging |
| [known-issues-roadmap.md](known-issues-roadmap.md) | Bugs, risks, tech debt found in code |
| [glossary.md](glossary.md) | Domain terms and acronyms |
| [documentation-audit.md](documentation-audit.md) | What was / was not verifiable |
| [architecture-dashboard.html](architecture-dashboard.html) | Interactive single-page view of these docs (stack, architecture, dependencies, DB, workflows, API, risks). Published privately as a claude.ai Artifact; this file is its source. |

## Architecture Decision Records

See [adr/README.md](adr/README.md). ADRs here are **reconstructed from code**, not copied from an existing decision log (none exists in the repo).

## Diagrams

| File | Shows |
|---|---|
| [system-architecture.mmd](diagrams/system-architecture.mmd) | Service, callers, DB, S3, downstream services |
| [component-relationships.mmd](diagrams/component-relationships.mmd) | Resource → Service → Provider/DAO wiring |
| [er-diagram.mmd](diagrams/er-diagram.mmd) | Oracle tables touched by the service |
| [api-request-flow.mmd](diagrams/api-request-flow.mmd) | Request pipeline (auth, MDC, resource, mappers) |
| [workflow-grouplink-setup.mmd](diagrams/workflow-grouplink-setup.mmd) | GroupLink setup sequence |
| [workflow-connection.mmd](diagrams/workflow-connection.mmd) | Registration-provider connection flow |
| [workflow-image-upload.mmd](diagrams/workflow-image-upload.mmd) | Direct and PFU image upload |
| [async-flows.mmd](diagrams/async-flows.mmd) | Image lifecycle; note that no async messaging exists |
| [service-dependencies.mmd](diagrams/service-dependencies.mmd) | Maven modules and runtime dependencies |

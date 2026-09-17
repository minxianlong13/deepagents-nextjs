---
name: "passkey-repo-file-uploader"
description: "Provides secure multi-part file upload capabilities with malware scanning, metadata management, and AWS S3 storage. Handles complete file lifecycle operations including upload, download, status tracking, and deletion with OAuth-based security. Use when working with: the passkey-file-uploader repository; File Upload, Upload Metadata, File Metadata, Upload Status, Application Context."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-file-uploader`
- **Type**: TypeScript Monorepo (Next.js + Spring Boot)
- **Owner**: Steakholders team (`#passkey-steakholders-alerts`)
- **DB**: AWS S3 (file storage)
- **Registry ID**: passkey-file-uploader

## What This Service Does
Provides secure multi-part file upload capabilities with malware scanning, metadata management, and AWS S3 storage. Handles complete file lifecycle operations including upload, download, status tracking, and deletion with OAuth-based security.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| **File Upload** | Complete file transfer operation with metadata and processing |
| **Upload Metadata** | System-generated file information and processing status |
| **File Metadata** | Application-provided context (application, type) |
| **Upload Status** | Processing state (uploaded, processing, ready, error) |
| **Application Context** | Identifier of the Passkey service uploading files |
| **File Type** | Logical categorization distinct from MIME type |
| **Malware Scanning** | ClamAV-based security validation before file availability |
| **Alternate Version** | Processed variants (thumbnails, compressed, converted) |
| **File Identifier** | System-generated UUID for file lifecycle operations |
| **Multipart Upload** | HTTP mechanism for file + metadata in single request |

## Architecture at a Glance
```
passkey-file-uploader/
├── packages/
│   ├── passkey-file-uploader/        # Next.js Frontend UI
│   │   ├── app/                      # Next.js App Router pages
│   │   ├── e2e/                      # End-to-end tests
│   │   └── infra/                    # Infrastructure code
│   └── passkey-file-uploader-sb/     # Spring Boot Backend
│       ├── service/                  # Main Spring Boot service
│       └── infra/                    # LocalStack infrastructure
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| **File Operations** | `/api/files` | Upload, download, status, delete |
| **Metadata** | `/api/metadata` | File information and processing status |
| **Health** | `/health` | Service health and readiness checks |

## Key Business Rules
- All uploads require application context and file type metadata
- Files undergo mandatory ClamAV malware scanning before availability
- Upload status progresses: uploaded → processing → ready/error
- File identifiers are system-generated UUIDs for all operations
- OAuth-based authorization with scope-based access control
- AWS S3 provides scalable and reliable file storage backend
- Alternate versions supported for processed file variants
- Multipart uploads handle both file content and metadata

## Service Dependencies
| Service | Purpose |
|---------|---------|
| **passkey-clamav** | Malware scanning and security validation |
| **AWS S3** | Scalable file storage backend |
| **Cvent OAuth** | Authentication and authorization |
| **Datadog** | Monitoring and observability |

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
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-file-uploader` to browse:
- `packages/passkey-file-uploader/app/` — Next.js frontend pages and components
- `packages/passkey-file-uploader-sb/service/` — Spring Boot backend service
- `packages/passkey-file-uploader/infra/` — Infrastructure and deployment code
- `package.json` — Dependencies and build scripts
- `catalog-info.yaml` — Backstage service metadata

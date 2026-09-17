---
name: "passkey-repo-screenshot-service"
description: "Provides website screenshot functionality for the Passkey platform using Puppeteer and Google Chrome. Captures high-quality screenshots of hotel websites and booking pages with built-in caching, image resizing, and security controls restricted to approved Passkey domains. Use when working with: the passkey-screenshot-service repository."
---

## Service Identity
- **Repo**: `cvent-internal/passkey-screenshot-service`
- **Type**: TypeScript Node.js Microservice
- **Owner**: Passkey Team (`#passkey`)
- **DB**: None (S3 for caching)
- **Registry ID**: Not specified

## What This Service Does
Provides website screenshot functionality for the Passkey platform using Puppeteer and Google Chrome. Captures high-quality screenshots of hotel websites and booking pages with built-in caching, image resizing, and security controls restricted to approved Passkey domains.

## Key Domain Concepts
| Term | Definition |
|------|------------|
| Screenshot | Digital image capture of web page's visual content as rendered in browser |
| Image ID | Unique identifier in URL path for screenshot requests (routing purposes) |
| Website URL | Target web address to capture, must be approved Passkey domain |
| Viewport | Visible browser window area defined by width/height dimensions |
| Cache Key | Unique S3 storage identifier based on hostname and pathname |
| Semaphore | Concurrency control limiting simultaneous screenshot operations |
| Fallback Image | Pre-generated "unavailable" image for failed captures |
| Preview Token | Authentication token for accessing preview/staging websites |
| Force Refresh | Parameter to bypass cache and generate new screenshot |
| Approved Domains | Whitelist of allowed domains (.passkey.com, .cvent.org) |

## Architecture at a Glance
```
packages/service/src/
├── App.ts                    # HTTPS server and routing
├── ScreenshotService.ts      # Main orchestration layer
├── WebScreenshotService.ts   # Puppeteer screenshot capture
├── ResizeService.ts          # Image resizing with Sharp
├── DbClientService.ts        # S3 storage operations
└── utils/                    # Request validation and utilities
```

## API Surface
| Endpoint Group | Base Path | Key Operations |
|----------------|-----------|----------------|
| Screenshots | `/screenshot/{imageId}` | GET - Capture website screenshot |
| Health Check | `/health` | GET - Service health monitoring |
| Resize | `/screenshot/{imageId}?width=X&height=Y` | GET - Resized screenshot |

## Key Business Rules
- Screenshots restricted to approved Passkey domains (.passkey.com, .cvent.org)
- Concurrency limited to 3 simultaneous operations to prevent resource exhaustion
- Screenshots cached in S3 using hostname/pathname-based keys
- Fallback images returned when capture fails due to timeouts or errors
- Cookie banners automatically removed from screenshots
- Force refresh parameter bypasses cache for new captures
- Dynamic image resizing available on-demand using Sharp library

## Service Dependencies
| Service | Purpose |
|---------|---------|
| AWS S3 | Screenshot caching and storage |
| Google Chrome | Web page rendering engine |
| Puppeteer | Browser automation for screenshot capture |
| Sharp Library | Image processing and resizing |

## Getting Deeper Information


### Detailed Documentation
- `docs/API_REFERENCE.md` — Full endpoint docs with parameters, request/response examples
- `docs/ARCHITECTURE.md` — Detailed module structure, design patterns, data flow
- `docs/DOMAIN_MODEL.md` — Complete entity definitions, relationships, business rules
- `docs/TECHNICAL_DETAILS.md` — Full dependency list, build config, monitoring
- `docs/DEPLOYMENT.md` — CI/CD pipeline, environment configs, rollback procedures
- `docs/DEVELOPMENT.md` — Local setup, testing, coding standards

### Source Code
Use `get_file_contents` with `owner: cvent-internal`, `repo: passkey-screenshot-service` to browse:
- `packages/service/src/` — Main service implementation
- `packages/service/src/utils/` — Request validation and utilities
- `Dockerfile` — Container configuration
- `package.json` — Dependencies and scripts
- `catalog-info.yaml` — Backstage service metadata

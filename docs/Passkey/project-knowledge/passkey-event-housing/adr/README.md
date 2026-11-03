---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: adr-index
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [adr, index, decisions]
---

# Architecture Decision Records

Reconstructed from source; none existed before. Status for all: *Accepted (inferred)*. Dates are **Unknown**.

| ADR | Title |
|---|---|
| [001](001-manual-wiring-no-di.md) | Manual object wiring without a DI framework |
| [002](002-mybatis-oracle-xml-mappers.md) | MyBatis XML mappers on the shared Oracle database |
| [003](003-threadlocal-transaction-manager.md) | ThreadLocal transaction manager for multi-DAO operations |
| [004](004-immutables-and-java11-client.md) | Immutables API models and a Java 11 client |
| [005](005-pfu-bearer-token-forwarding.md) | Forward the caller's Bearer token to the file uploader |
| [006](006-s3-image-storage-md5-dedupe.md) | Image bytes in S3, keyed by MD5, metadata in Oracle |
| [007](007-karate-its-against-deployed-envs.md) | Karate integration tests against deployed environments |

Summary table with evidence: [../technical-decisions.md](../technical-decisions.md).

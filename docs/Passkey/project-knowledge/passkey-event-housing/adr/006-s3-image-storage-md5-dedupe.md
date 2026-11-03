---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: adr
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [adr, images, s3, md5, storage]
---

# ADR-006: Image bytes in S3, keyed by MD5, metadata in Oracle

- **Status:** Accepted (inferred from code — no original ADR exists)
- **Date:** Unknown
- **Confidence:** High

## Context

Images are attached to hotels, room types and room categories and can be copied between owners.

## Decision

Bytes are stored in the shared `groupmax-content` S3 bucket at a path derived from the MD5 (`prefix/ff[0:2]/ff[2:4]/md5.ext`). Metadata rows in `GUI.S3IMAGEMETADATA` reference the MD5. Uploads skip S3 when the MD5 already exists; deletes remove the S3 object only when no row references it.

## Consequences

- Copies are cheap (metadata only).
- S3 and DB are not transactional; the code compensates by deleting the row on S3 failure.
- Region is hard-coded to US_EAST_1.

## Evidence

- [ImageUtil.java:73-85](../../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/util/ImageUtil.java#L73-L85)
- [ImageService.java](../../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/ImageService.java)
- [ImagesMapper.xml](../../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/ImagesMapper.xml)

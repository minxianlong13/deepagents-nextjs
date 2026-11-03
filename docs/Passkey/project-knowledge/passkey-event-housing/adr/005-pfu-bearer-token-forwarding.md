---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: adr
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [adr, pfu, auth, bearer-token, images]
---

# ADR-005: Forward the caller's Bearer token to the file uploader

- **Status:** Accepted (inferred from code — no original ADR exists)
- **Date:** Unknown
- **Confidence:** High

## Context

Images can be uploaded first to passkey-file-uploader (PFU), which enforces its own per-file authorization.

## Decision

`POST /events/{eventId}/images/pfu` has no `@Authority` annotation. The resource passes the raw `Authorization` header to `ImageService.saveImageFromPfu`, which strips `Bearer `, wraps it in `BearerTokenHeader` and calls PFU. The PFU Retrofit client is built **without** the shared API-key interceptor.

## Consequences

- PFU decides whether the caller may read the file; this service does not authenticate that endpoint itself.
- A missing/malformed header currently surfaces as a plain-text 500 rather than 401 (see [known-issues-roadmap.md](../known-issues-roadmap.md)).
- `PfuFileProvider` calls `execute()` directly to read `Content-Disposition` for the filename.

## Evidence

- [ClientCreator.java](../../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/util/ClientCreator.java) (comment: "auth is forwarded per-call via BearerTokenHeader")
- [ImageService.java:44,69-86](../../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/ImageService.java#L44)
- [PfuFileProvider.java](../../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/PfuFileProvider.java)

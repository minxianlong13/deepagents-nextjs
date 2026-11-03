---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: business-workflows
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [workflows, grouplink, images, connections, room-categories, hotels]
---

# Business Workflows

Each workflow below is traced from code. Business intent beyond what code expresses is marked **Inferred**. Where the code does not explain *why* something happens, that is stated as **Unknown**.

## 1. Read hotels & rooms for an event

**Callers:** registration/booking front-ends via API key (exact consumers **Unknown**; catalog lists none).

1. `GET /events/{eventId}/hotels` → [EventResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/EventResource.java#L85) resolves locale (request param, else event default locale from passkey-event service via `EventProvider`).
2. [HotelDetailsService.getHotels](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/HotelDetailsService.java#L81) runs in one DB session: count hotels, page hotels, then enrich with GroupLink status, hotel images (DB, `ImagesDataAccess.getImagesForHotels`), amenities and reward programs.
3. GroupLink status mapping: statuses 102/103/104 (fail) and 105 (suspended) map to `INCOMPLETE` ([HotelDetailsService.java:40-43](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/HotelDetailsService.java#L40-L43)).
4. Rooms (`/hotels/{hotelId}/rooms`) go through `RoomDetailsService.getHotelRooms` in one session, optionally filtered by attendee type.
5. Block-based room (`/events/{eventId}/rooms/{blockId}`) calls the **inventory service** for the block, checks event ownership (404 otherwise), then pulls messages from passkey-event (`MessageProvider`) and images from passkey-event's images client (`ImageProvider.getRoomImages(BlockIds)`).

<a id="grouplink-setup"></a>
## 2. GroupLink setup (vendor-system transfer configuration)

Diagram: [diagrams/workflow-grouplink-setup.mmd](diagrams/workflow-grouplink-setup.mmd). Source: [GroupLinkResource.java:57-88](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/GroupLinkResource.java#L57-L88), [GroupLinkService.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/GroupLinkService.java).

1. Resolve vendor system: by `vendorSystemId` if > 0, else by hotel. None → 400 `VendorSystemNotFound`.
2. Load hotel default mapping codes (`getTransferDefaults`).
3. `approveEvent`: if start/end dates given, compute transfer window as event-local midnight → 23:59:59, converted to **America/New_York** (ResDesk server zone, per the code comment at [GroupLinkService.java:103-112](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/GroupLinkService.java#L103-L112)). Invalid/missing time zone falls back to New York. Create outbound (direction 1) and/or inbound (direction 2) transfer definitions depending on the vendor system's transfer types. If `complete`, mark event approved (status 101).
4. `createMappings`: meeting code, block, group-type meeting code, rate + occupancy rates, room code, guarantee (only when `approveBlocks`), pre-code, sub-event code, meeting code when no rooms, reason-for-visit, source-of-business. Then update external event mapping.
5. If `approveBlocks` and rooms present → `approveBlocks`.
6. Return 204.

**Atomicity:** each DAO write in `GroupLinkDataAccess` opens its own auto-commit session, so a failure mid-way leaves partial setup (Confidence High). Re-running is likely safe because writes use `MERGE` (Confidence Medium).

`POST /grouplink/blocks` is a narrower variant: vendor system by hotel only, meeting-code mappings per block, then approve blocks with `approve=true`.

## 3. Registration-provider connection

Diagram: [diagrams/workflow-connection.mmd](diagrams/workflow-connection.mmd). Source: [ConnectionService.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/ConnectionService.java), `ConnectionDataAccess`.

1. Validate partner → 400 `InvalidPartner`.
2. Look up the event by registration access code → 400 `InvalidApiAccessCode` if unknown.
3. If a connection for event + partner already exists and is tied to the code, return it.
4. Otherwise `linkEventAndRegProvider` runs **one explicit JDBC transaction** (commit/rollback) covering participation, bridge registration records, event flags, partner/access-code association and default callback association.
5. `DELETE /connections/{accessCode}` removes the link (explicit transaction too); 404 if nothing deleted.

## 4. Admin: event access codes and participant association

- `POST /admin/codes/event/{eventId}` creates an API access code ([AdminService.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/AdminService.java)).
- `PUT /admin/connections/{eventId}`: for **each** participant id: associate participant with the event (as the configured default Passkey user), then call passkey-event to create default **WebInfo**. First failure → 400 `ParticipantAssociationFailure`; earlier participants stay associated (no rollback, Confidence High).

## 5. Image management

Diagram: [diagrams/workflow-image-upload.mmd](diagrams/workflow-image-upload.mmd), lifecycle: [diagrams/async-flows.mmd](diagrams/async-flows.mmd).

- **Direct upload** (`POST /events/{eventId}/images`, multipart): validate (≤10 MB, ≤50 M pixels, allowed types), convert TIFF→JPEG, MD5 the bytes, assign next image number in the partition, write metadata (active), upload to S3 only if the MD5 object is new; S3 failure deletes the row.
- **PFU two-phase:** `POST /images/pfu` downloads the file from passkey-file-uploader using the caller's Bearer token and stores a **draft**; `POST /images/{imageId}` or `/bulk` then activates drafts in place or **copies** active images to a new owner/partition ([ImageService.java:126-169](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/ImageService.java#L126-L169)).
- **Reorder** (`PUT /images`): requested images get requested numbers; others fill remaining slots in current order.
- **Delete:** delete + compact numbers in one DB session ([ImageService.java:190-218](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/ImageService.java#L190-L218)); S3 object removed only when no other row references the MD5.

Partition = event + image type + participant + room type + campaign (from `getImagesInPartition` arguments).

## 6. Room categories

Source: [RoomCategoryService.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/RoomCategoryService.java).

- Every operation validates the hotel: participant object type must be hotel (101) → otherwise 400.
- Category CRUD, assigned rooms, beds and amenities are separate sub-resources.
- **Delete category** deletes the DB category, then calls `ImageService.deleteAll(... ROOM_CATEGORY_IMAGES, categoryId)`; the two steps are not in one transaction (Confidence High).
- What a "room category" means to end users (e.g. grouping room types for display) is **Inferred**, Confidence Medium.

## 7. Room block transfer state

Simple upsert/get/delete of a per event+hotel state record ([RoomBlockTransferStateService.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/RoomBlockTransferStateService.java)). Which system reads this state and why is **Unknown**.

## 8. Not active: callbacks

`CallbackService` / `CallbackResource` (Couchbase-backed callback registration) exist but are not registered in the application → no runtime workflow. See [known-issues-roadmap.md](known-issues-roadmap.md).

## Asynchronous processing

None found: no queues, schedulers or event consumers. All work is synchronous within the HTTP request (Confidence High).

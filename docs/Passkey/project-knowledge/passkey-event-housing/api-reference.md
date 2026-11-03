---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: api-reference
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [api, rest, endpoints, jax-rs, auth, errors]
---

# API Reference

## Conventions

- **Base path:** `/{env}/passkey-event-housing/v1` — `API_ROOT` = `/passkey-event-housing/v1` in [ApiConstants.java](../passkey-event-housing-shared/src/main/java/com/cvent/passkey/eventhousing/constants/ApiConstants.java); the `/{env}` prefix comes from Dropwizard `rootPath: "/{{environment.name}}/*"` in [template.yaml](../passkey-event-housing-service/configs/template.yaml) (`/dev/*` locally).
- **Auth:** unless noted, every endpoint takes `@Authority(methods = API_KEY)` (Cvent API key validated by remote auth-service).
- **Media type:** JSON, except multipart image upload.
- **Error body:** `ErrorResponse { errorCodeType, httpRequestId, details? }` produced by the exception mappers. `ImagesResource` is the exception: many failures return **plain-text** bodies.
- **Pagination:** `limit` / `offset` on list endpoints; `Pagination.DEFAULT_LIMIT = 100`.
- **Locale:** many reads take `locale`; when absent, the event's default locale is fetched from the passkey-event service.
- **Spec:** [api.raml](../passkey-event-housing-api/src/main/resources/api/api.raml) documents only 5 paths and is **out of date**; the code below is authoritative.

Request pipeline diagram: [diagrams/api-request-flow.mmd](diagrams/api-request-flow.mmd).

## Event hotels & rooms — `EventResource` (`/events`)

Source: [EventResource.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/EventResource.java)

| Method | Path | Params | Returns | Line |
|---|---|---|---|---|
| GET | `/events/{eventId}/hotels` | `limit`, `offset`, `locale` | `EventHotels` | 87 |
| GET | `/events/{eventId}/hotels/{hotelId}` | `locale` | `HotelDetails` (404 `HotelNotFound`) | 115 |
| GET | `/events/{eventId}/hotels/{hotelId}/commerce-shutoff` | — | `HotelDetails` with only `commerceShutoffDate` | 141 |
| GET | `/events/{eventId}/hotels/{hotelId}/rooms` | `limit`, `offset`, `filter`, `locale` | `HotelRooms` | 165 |
| GET | `/events/{eventId}/hotels/{hotelId}/rooms/{roomId}` | `locale` | `RoomDetails` | 198 |
| GET | `/events/{eventId}/rooms/{blockId}` | `locale` | `room.RoomDetails` — block lookup via inventory service; 404 if block's event ≠ `eventId`; messages & images from remote services | 226 |
| GET | `/events/{eventId}/blocks-summary` | `hotelId`, `attendeeTypeId`, `roomTypeId`, `locale` | `List<BlockSummary>` — **API_KEY or BEARER** | 267 |

`filter` grammar (rooms): fields `attendeeTypes.id` (long > 0) and `attendeeTypes.codes` (non-blank string), operator `EQ` only; invalid → 400 `INVALID_FILTER_FIELD` / `INVALID_COMPARISON_TYPE` ([RoomTypesFilterPredicateValidator.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/pagination/filters/validators/RoomTypesFilterPredicateValidator.java)).

## Blocks — `BlockResource`

| Method | Path | Params | Returns |
|---|---|---|---|
| GET | `/blocks-summary` | `blockIds` (list), `locale` | `List<BlockSummary>` (empty list for empty ids) |

## Registration connections — `ConnectionResource` (`/connections`)

| Method | Path | Body | Result |
|---|---|---|---|
| POST | `/connections` | `ConnectionRequest` | `Connection` or 404 `ReglinkConnectionError`; 400 `InvalidPartner` / `InvalidApiAccessCode` |
| DELETE | `/connections/{accessCode}` | — | 204, or 404 if nothing deleted |

## Admin — `AdminResource` (`/admin`)

| Method | Path | Body | Result |
|---|---|---|---|
| POST | `/admin/codes/event/{eventId}` | — | New API access code; 404 if not creatable |
| PUT | `/admin/connections/{eventId}` | `AdminConnectionRequest` | 201; per-participant association + web-info creation in passkey-event; 400 `ParticipantAssociationFailure` |

## GroupLink — `GroupLinkResource` (`/grouplink`)

| Method | Path | Body / Params | Result | Line |
|---|---|---|---|---|
| POST | `/grouplink` | `GroupLinkSetupRequest` | 204; 400 `VendorSystemNotFound` | 57 |
| POST | `/grouplink/blocks` | `BlockSetupRequest` | 204 | 96 |
| GET | `/grouplink/event/{eventId}/hotel/{hotelId}` | — | `GroupLinkSetup` | 129 |
| GET | `/grouplink/event/{eventId}/hotel/{hotelId}/external-codes` | — | `ExternalEventCodes` (optional) | 141 |
| GET | `/grouplink/pre-code-events` | `preCode` | `List<PreCodeEvent>` (max 100) | 155 |

Workflow detail: [business-workflows.md](business-workflows.md#grouplink-setup).

## Room block transfer state — `RoomBlockTransferStateResource` (`/roomblock/transfer/state`)

| Method | Path | Result |
|---|---|---|
| POST | `/roomblock/transfer/state` (body `RoomBlockTransferStateRequest`) | 204 (upsert) |
| GET | `/roomblock/transfer/state/event/{eventId}/hotel/{hotelId}` | `RoomBlockTransferStateResponse` |
| DELETE | `/roomblock/transfer/state/event/{eventId}/hotel/{hotelId}` | 204 |

## Room categories — `RoomCategoryResource` (`/events/{eventId}/hotels/{hotelId}/room-categories`)

Source: [RoomCategoryResource.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/RoomCategoryResource.java). All return 200 with JSON unless noted. Hotel must be a participant of object type 101, else 400.

| Method | Sub-path | Purpose | Line |
|---|---|---|---|
| GET | `/` | List categories | 53 |
| GET | `/rooms?localeId=` | Hotel categories with assigned rooms | 67 |
| GET | `/rooms/blocks/{blockId}` | Category for a block (204 if none) | 84 |
| GET | `/rooms/room-types/{roomTypeId}` | Category for a room type (204 if none) | 105 |
| POST | `/` | Create category (`CategoryRequest`) | 126 |
| GET / PUT / DELETE | `/{categoryId}` | Read / update / delete (delete also removes category images) | 141 / 158 / 175 |
| GET / PUT | `/{categoryId}/rooms` | List / bulk upsert assigned rooms | 191 / 225 |
| GET / PUT / DELETE | `/{categoryId}/rooms/{roomId}` | Single assigned room | 244 / 208 / 262 |
| GET / PUT | `/{categoryId}/beds` | List / replace beds | 276 / 287 |
| PUT / DELETE | `/{categoryId}/beds/{bedId}` | Upsert bed / delete (204) | 299 / 312 |
| GET / PUT | `/{categoryId}/amenities` | List / replace amenities | 327 / 338 |
| PUT / DELETE | `/{categoryId}/amenities/{amenityId}` | Add / delete amenity | 350 / 363 |

`EventRoomCategoryResource`: GET `/events/{eventId}/room-categories/rooms?localeId=` — all hotels' categories for an event.

## Images — `ImagesResource` (`/events/{eventId}/images`)

Source: [ImagesResource.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/ImagesResource.java)

| Method | Sub-path | Auth | Purpose | Success | Line |
|---|---|---|---|---|---|
| POST | `/` (multipart `file` + `data` JSON) | API key | Upload new active image | 200 `ImageResponse`; 400 invalid JSON (plain text) | 63 |
| POST | `/{imageId}` | API key | Activate draft / copy active image | 200 | 93 |
| POST | `/bulk` | API key | Bulk activate / copy | 200 list; 400/500 plain text | 111 |
| POST | `/pfu` (`PfuImageUploadRequest`) | **None on this service** — `Authorization: Bearer` forwarded to PFU | Create draft from PFU file | 201; 500 plain text on any non-WebApplication error (incl. missing header) | 155 |
| PUT | `/` (`List<ImageMetadataUpdateRequest>`) | API key | Reorder | 204; 500 plain text | 186 |
| GET | `/?imageType=&participantId=&roomTypeId=&campaignId=` | API key | List (imageType + ≥1 scope param required) | 200; 400 "Missing required parameters" | 211 |
| DELETE | `/{imageId}` | API key | Delete + renumber | 204; 500 plain text | 249 |

Validation: max 10 MB, max 50,000,000 pixels, name ≤ 80 chars, TIFF converted to JPEG (quality 0.9) ([ImageUtil.java:36-55](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/util/ImageUtil.java#L36-L55)). The class javadoc mentions a `PUT /commit` endpoint that **does not exist**.

## Not exposed

`CallbackResource` (`GET/POST /callbacks`, `GET /callbacks/verify/{acknumber}`) is in source and RAML but **not registered** → returns 404 at runtime. Confidence High.

## Health & admin

- `GET http://{host}:7001/healthcheck` — `PasskeyEventHousingHealthCheck` always returns healthy (no DB or downstream check).
- `/{env}/ok` is excluded from the request log ([template.yaml:43](../passkey-event-housing-service/configs/template.yaml#L43)), which suggests a platform liveness path; its handler is not in this repo — **Unknown**.

## Error codes

`RegistrationErrorCodeType` ([RegistrationErrorCodeType.java](../passkey-event-housing-shared/src/main/java/com/cvent/passkey/eventhousing/constants/RegistrationErrorCodeType.java)):

| Enum | Code | Enum HTTP |
|---|---|---|
| EVENT_ID_NOT_PROVIDED, HOTEL_ID_NOT_PROVIDED, INVALID_CARD_TYPE, UNABLE_TO_PROCESS_JSON | InvalidRegistrationObject | 400 |
| ARRIVAL_AFTER_DEPARTURE | ArrivalAfterDeparture | 400 |
| ATTENDEE_CODE_REQUIRED | AttendeeCodeRequired | 400 |
| GROUP_TYPE_NOT_FOUND | GroupTypeNotFound | 404 |
| EVENT_NOT_FOUND | EventNotFound | 404 |
| HOTEL_NOT_FOUND, ROOM_NOT_FOUND | HotelNotFound | 404 |
| BLOCK_NOT_FOUND | BlockNotFound | 404 |
| INNER_SERVER_ERROR | InnerServerError | 500 |
| ERROR_DURING_REGLINK_CONNECTION | ReglinkConnectionError | 404 |
| INVALID_API_ACCESS_CODE | InvalidApiAccessCode | 404 (but `InvalidAccessCodeException` sends **400**) |
| REG_CONNECTION_ALREADY_EXISTS | RegConnectionAlreadyExists | — |
| REG_CONNECTION_NOT_FOUND | ReglinkConnectionNotFound | 404 |
| INVALID_PARTNER | InvalidPartner | 404 (but `InvalidPartnerException` sends **400**) |
| PARTICIPANT_ASSOC_ERROR | ParticipantAssociationFailure | 400 |
| CREATE_ROOM_CATEGORY_ERROR | RoomCategoriesFailure | 400 |

The HTTP status actually returned is the exception's `statusCode`, not the enum's value. `GroupLinkErrorCode.VENDOR_NOT_FOUND` → `VendorSystemNotFound`, 400.

## Java client coverage

`PasskeyEventHousingClient` covers hotels, rooms, connections, GroupLink, blocks summaries and pre-code events; separate interfaces exist for admin, images, room categories and transfer state ([java-client](../passkey-event-housing-java-client/src/main/java/com/cvent/passkeyeventhousing/client/)).

---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: glossary
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [glossary, terms, acronyms, domain]
---

# Glossary

Definitions marked *(Inferred)* are derived from usage in code, not from a business document.

| Term | Meaning |
|---|---|
| **Passkey** | Cvent's hotel room-block and housing product family; this service is one Passkey microservice *(general product knowledge, not stated in repo; Confidence Medium)*. |
| **Event housing** | Hotels, room types and blocks attached to an event. |
| **Participant** | A hotel (object type 101) or other organisation participating in an event. |
| **Block** | Allocation of rooms of a room type for an attendee/group type in an event (`EVENTPROFILE.BLOCK`). |
| **Room type / room** | Hotel room type configured for an event (`EVENTPROFILE.ROOMTYPE`); API calls it "room". |
| **Attendee type / group type** | Category of attendee a block is for (`GROUPTYPEID`). |
| **Room category** | Grouping of room types for a hotel in an event, with beds, amenities and images *(Inferred)*. |
| **GroupLink** | Passkey feature that transfers event/block data between Passkey and a hotel's external system (vendor system) using code mappings *(Inferred)*. |
| **Vendor system** | External system configured for GroupLink transfer for a hotel (e.g. vendor id 1010 = DerbySoft constant). |
| **Transfer definition** | Row in `XFER.TRANSFERDEFINITION` defining a transfer window and direction (1 = outbound, 2 = inbound). |
| **ResDesk** | Downstream Passkey component that reads transfer dates anchored to America/New_York (from code comment). |
| **Pre-code** | Event pre-code mapping (id 413) used to find events (`/grouplink/pre-code-events`). |
| **Meeting code** | GroupLink mapping (id 401) identifying the group/event at the vendor. |
| **Registration provider / partner** | External registration system connected to an event via an access code (`/connections`). |
| **API access code** | Code generated for an event (`/admin/codes/event/{eventId}`) that partners use to connect. |
| **WebInfo** | Default web info record created in passkey-event when a participant is associated. |
| **PFU** | Passkey File Uploader service; holds uploaded files that this service downloads with the caller's Bearer token. |
| **Draft / active image** | Image status 0 (draft, from PFU) or 1 (active). |
| **Image partition** | event + image type + participant + room type + campaign; image numbers are ordered within it. |
| **Commerce shutoff** | Date after which hotel booking commerce is closed *(Inferred from field `commerceShutoffDate`)*. |
| **DAO** | Data Access Object (`*DataAccess` classes). |
| **MyBatis** | SQL mapping framework; SQL in XML mapper files. |
| **Immutables** | Annotation processor generating `ImmutableXxx` value classes from interfaces. |
| **Dropwizard** | Java REST framework (Jetty + Jersey + Jackson). |
| **JAX-RS / Jersey** | Java REST API standard / implementation. |
| **MDC** | Mapped Diagnostic Context — per-request logging fields. |
| **RAML** | RESTful API Modeling Language (stale spec in api module). |
| **IT** | Integration test (Karate, `*IT.java`). |
| **ADR** | Architecture Decision Record. |
| **Hogan** | Mustache-style template engine for `{{...}}` config placeholders. |
| **Pangaea** | Cvent library for multi-environment configuration (`multiEnvConfig`) *(Inferred)*. |

<a id="grouplink-mapping-ids"></a>
## GroupLink mapping ids

From [GroupLinkConstants.java](../passkey-event-housing-api/src/main/java/com/cvent/passkeyeventhousing/model/grouplink/GroupLinkConstants.java):

| Constant | Id |
|---|---|
| Guarantee (default code "Guarantee") | 350 |
| Meeting code | 401 |
| Sub-event code | 402 |
| Event pre-code | 413 |
| Rate | 501 |
| Double / triple / quad / quad-plus rate | 502 / 503 / 504 / 505 |
| Room code | 507 |
| Reason for visit | 2003 |
| Source of business | 2004 |
| Approved status | 101 |
| App id | 103 |
| DerbySoft vendor | 1010 |

## Image types (selected)

From [ImageTypes.java](../passkey-event-housing-api/src/main/java/com/cvent/passkeyeventhousing/model/images/imagesutils/ImageTypes.java): HOTEL_IMAGE 3, RT_IMAGE 4, AWS_RT_IMAGES 35, ROOM_CATEGORY_IMAGES 71, ROOM_CATEGORY_LIBRARY_IMAGES 72, GM_DEFAULTS_* 1001–1010.

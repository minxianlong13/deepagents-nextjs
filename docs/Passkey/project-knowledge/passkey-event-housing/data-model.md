---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: data-model
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [database, oracle, schema, tables, mybatis, s3, models]
---

# Data Model

## Overview

- **Primary store:** shared Passkey Oracle transactional database (service name differs per environment; URL injected via `{{passkey-oracle-database.txn.url}}` in [template.yaml](../passkey-event-housing-service/configs/template.yaml)).
- **Schema ownership:** this repository contains **no DDL**. Tables belong to shared Passkey schemas (`EVENTPROFILE`, `GUI`, `XFER`, `BRIDGE`, `API`, `PERM`). Column types, constraints and indexes are **Unknown** except where SQL reveals them.
- **Object store:** AWS S3 bucket configured by `groupmaxContentBucketName` (dev: `groupmax-content-alpha`), object keys under `groupmaxContentBucketTag`.
- **Couchbase:** declared for callbacks only; the callback feature is not wired at runtime.

ER view (inferred relationships, Confidence Medium): [diagrams/er-diagram.mmd](diagrams/er-diagram.mmd)

## Tables by mapper (verified from SQL)

| Mapper XML | Tables read | Tables written |
|---|---|---|
| [HotelMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/HotelMapper.xml) | EVENTPROFILE.PARTICIPANT, HOTELINFO, WEBINFO, AMENITY, HOTELAMENITY, HOTELROOMTYPEAMENITY, HOTELROOMTYPEBED, BED, REWARDSPROGRAM, HOTELREWARDSPROGRAM, DISABLECOMMERCE, PARTICIPANTDEFAULTEVENTLOCALES; GUI.BUSINESSTEXT; XFER.GLRESSTATUS | — |
| [RoomMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/RoomMapper.xml) | EVENTPROFILE.ROOMTYPE, HOTELROOMTYPE, BLOCK, EVENTCODE, WEBINFO, WEBSETUP; GUI.BUSINESSTEXT; XFER.EXTERNALROOMTYPEXREF | — |
| [AttendeeTypeMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/AttendeeTypeMapper.xml) | EVENTPROFILE.BLOCK, EVENTCODE, GROUPTYPE; GUI.BUSINESSTEXT | — |
| [BlockMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/BlockMapper.xml) | EVENTPROFILE.BLOCK, ROOMTYPE, PARTICIPANT; GUI.BUSINESSTEXT, PARTICIPANTAPPLICATION | — |
| [ImagesMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/ImagesMapper.xml) | GUI.S3IMAGEMETADATA | GUI.S3IMAGEMETADATA (MERGE, DELETE, batch renumber) |
| [RoomCategoryMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/RoomCategoryMapper.xml) | EVENTPROFILE.EVENTROOMCATEGORY*, ROOMTYPE, BLOCK, BED, AMENITY, AMENITYCATEGORY; GUI.BUSINESSTEXT | EVENTROOMCATEGORY, EVENTROOMCATEGORYASSIGNMENT, EVENTROOMCATEGORYBED, EVENTROOMCATEGORYAMENITY |
| [GroupLinkMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/GroupLinkMapper.xml) | XFER.GLMAPPINGVALUES, TRANSFERDEFINITION, EXTERNALEVENTXREF; EVENTPROFILE.* | XFER.TRANSFERDEFINITION, GLMAPPINGVALUES, EXTERNALEVENTXREF; EVENTPROFILE.PARTICIPANT, PARTICIPATION, ROOMTYPE, BLOCK (status columns) |
| [RoomBlockTransferStatusMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/RoomBlockTransferStatusMapper.xml) | XFER.ROOM_BLOCK_XFER_STATE, ROOM_BLOCK_XFER_APPROACH, ROOM_BLOCK_XFER_PROVIDER | XFER.ROOM_BLOCK_XFER_STATE |
| [ConnectionMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/ConnectionMapper.xml) | BRIDGE.*, API.CALLBACK, API.CALLBACKASSOC, EVENTPROFILE.EVENTINFO, ORGSISTERHOTELASSOCIATION | EVENTPROFILE.PARTICIPATION, PARTICIPANT_EVENTS, EVENTINFO; BRIDGE.REGEVENT, REGACCESS, PARTNER_ACCESS_CODE_ASSOC, REG_ACCESS_CODE, PLANNER_ACCESS_CODE_ASSOC; API.CALLBACKASSOC |
| [AdminMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/AdminMapper.xml) | EVENTPROFILE.PARTICIPANT | BRIDGE.REG_ACCESS_CODE, EVENTPROFILE.PARTEDESC |
| [ParticipantMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/ParticipantMapper.xml) | EVENTPROFILE.PARTICIPANT (object type) | — |
| [CachedMapper.xml](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/CachedMapper.xml) | PERM.USERIDENTITY (default PK user id) | — |

## Key written tables (columns from SQL)

### GUI.S3IMAGEMETADATA — image metadata
`IMAGEID` (from `IMAGEMETADATA_ID.NEXTVAL`), `EVENTID`, `PARTICIPANTID`, `ROOMTYPEID`, `MD5HASH`, `IMAGETYPEID`, `EXTENSION`, `IMAGESTATUS` (0 = draft, 1 = active), `IMAGENUMBER`, `IMAGEWIDTH`, `IMAGEHEIGHT`, `IMAGENAME`, `PKTIMESTAMP`. Upsert by `IMAGEID` (ImagesMapper.xml:72). A composite unique key that includes `IMAGENUMBER` is implied by a code comment in `ImageService` (draft rows set `IMAGENUMBER = IMAGEID` to avoid collisions) — exact key definition **Unknown**, Confidence Medium.

### EVENTPROFILE.EVENTROOMCATEGORY — room category
`EVENTROOMCATEGORYID` (from `SEQ_PK_EVENTROOMCATEGORY`), `EVENTID`, `HOTELID`, `NAMETEXTID` (`'RCELN_' || id`), `DESCRIPTIONTEXTID` (`'RCELD_' || id`), `SORTTYPEID` (enum ordinal), `ISENABLED`, `LIBRARYID`, `ISENABLEBED`, `ISRESPECTROOMCATEGORIESBED`, `ISENABLEAMENITY`, `ISRESPECTROOMCATEGORIESAMENITY`, `PKUSERID`, `PKTIMESTAMP` (RoomCategoryMapper.xml:269). Names/descriptions are stored in `GUI.BUSINESSTEXT` keyed by `BUSINESSTEXTID`.

### EVENTPROFILE.EVENTROOMCATEGORYASSIGNMENT / BED / AMENITY
- Assignment: `(EVENTROOMCATEGORYID, ROOMTYPEID)` merge key, `SORTORDER` (line 347).
- Bed: `(EVENTROOMCATEGORYID, BEDID)` merge key, `QUANTITY` (line 416).
- Amenity: `(EVENTROOMCATEGORYID, AMENITYID)` insert (line 474).

### XFER.TRANSFERDEFINITION — GroupLink transfer window
`TRANSFERDEFINITIONID` (`XFER.XFERDEF_XFERDEFID_SEQ`), `VENDORSYSTEMID`, `HOTELID`, `EVENTID`, `TRANSFERDIRECTIONID` (1 outbound, 2 inbound), `LASTXFERGUID`, `ISSUSPENDED` (0), `TRANSFERPERIODSTARTTIME`, `TRANSFERPERIODENDTIME`, `APPID`, `PKUSERID`, `PKTIMESTAMP`. Merge key: vendor + hotel + event + direction (GroupLinkMapper.xml:90).

### XFER.GLMAPPINGVALUES — GroupLink code mappings
`VENDORSYSTEMID`, `HOTELID`, `EVENTID`, `GROUPTYPEID`, `ROOMTYPEID`, `BLOCKID`, `MAPPINGID`, `SEQUENCENUMBER` (always 1), `VALUE` (`NVL(TRIM(v),' ')`), `CUSTOMCLASSNAME` (' '), `APPID`, `PKUSERID`, `PKTIMESTAMP` (line 143). Mapping ids: see [glossary.md](glossary.md#grouplink-mapping-ids).

### XFER.ROOM_BLOCK_XFER_STATE
`EVENT_ID`, `HOTEL_ID` (merge key), `APPROACH_ID`, `PROVIDER_ID`, `RATE_ID` (RoomBlockTransferStatusMapper.xml:8).

### GroupLink status columns (updated by approve)
`PARTICIPANT.GLPARTICIPANTSETUPSTATUSID`, `PARTICIPATION.EVTHTPARTICPATIONSETUPSTATUSID`, `ROOMTYPE.GROUPLINKROOMTYPESETUPSTATUSID`, `BLOCK.GROUPLINKGROUPSETUPSTATUSID`, `BLOCK.GROUPLINKBLOCKSETUPSTATUSID`; approved = `101` (`GroupLinkConstants.STATUS_APPROVED`).

### BRIDGE.* — registration connections
`REG_ACCESS_CODE (REG_ACCESS_CODE_ID, EVENT_ID, REG_ACCESS_CODE, PKUSERID, PKTIMESTAMP)`, `PARTNER_ACCESS_CODE_ASSOC`, `PLANNER_ACCESS_CODE_ASSOC`, `REGEVENT`, `REGACCESS (STATUS)`.

## Sequences (verified)

| Sequence | Used for |
|---|---|
| `IMAGEMETADATA_ID` | `GUI.S3IMAGEMETADATA.IMAGEID` |
| `SEQ_PK_EVENTROOMCATEGORY` | `EVENTROOMCATEGORY.EVENTROOMCATEGORYID` |
| `XFER.XFERDEF_XFERDEFID_SEQ` | `TRANSFERDEFINITION.TRANSFERDEFINITIONID` |

## Seed data

[res-master-script.sql](../passkey-event-housing-data-access/src/main/resources/res-master-script.sql) inserts `GUI.APPLICATION` row id `1001` "Event Housing Service". When/how it is applied: **Unknown**.

## Business-text key conventions (verified)

| Pattern | Meaning | Source |
|---|---|---|
| `RCELN_{categoryId}` / `RCELD_{categoryId}` | Room category name / description | RoomCategoryMapper.xml:269 |
| `EHDSC_P{participantId}_E{eventId}` | Participant event description | AdminMapper.xml:20 |
| `ERNAME_E%d_H%d_R%d`, `RTDSC_E%d_H%d_R%d` | Room name / description messages (remote messages service) | MessageProvider |
| `BLCXL_B%d`, `BLTXD_B%d` | Block cancellation policy / tax policy messages | MessageProvider |

## API models (passkey-event-housing-api)

All are `@Value.Immutable` interfaces (generated `ImmutableXxx`). Packages under [model/](../passkey-event-housing-api/src/main/java/com/cvent/passkeyeventhousing/model/):

| Package | Main types |
|---|---|
| `model` | `HotelDetails`, `RoomDetails`, `Address`, `Location`, `Image`, `AttendeeType`, `AttendeeMessages`, `GroupLinkStatusEnum` |
| `model.hotels` | `EventHotels`, `HotelRooms`, `HotelAmenity`, `HotelRoomTypeAmenity`, `HotelRewardProgram`, `RewardProgram`; `dao.*SearchCriteria` |
| `model.room` | `RoomDetails` (block view), `HotelRoomTypeBed`, `RoomBlockTransferStateRequest/Response` |
| `model.block` | `BlockSummary`, `HotelWithGroupLinkStatus` |
| `model.connections` | `ConnectionRequest`, `Connection`, `EventConnectionInfo`, `AdminConnectionRequest` |
| `model.grouplink` | `GroupLinkSetupRequest`, `GroupLinkSetup`, `BlockSetupRequest`, `BlockSetup`, `MappingCode`, `RoomType`, `TransferSettings`, `ExternalEventCodes`, `PreCodeEvent`, `GroupLinkConstants`, `TransferDirection` |
| `model.room_categories` | `Category`, `CategoryRequest/Response`, `AssignedRoom(Request)`, `CategoryBed(Request)`, `CategoryAmenity(Request/Group)`, `CategoryBlock`, `HotelCategory`, `HotelAssignedRoom` |
| `model.images` | `ImageMetadataRequest`, `ImageMetadataUpdateRequest`, `BulkImageMetadataRequest`, `PfuImageUploadRequest`, `ImageResponse`, `HotelImage`, `HotelRoomImage`, `imagesutils.ImageTypes` |
| `model.callback` | `CallbackRequest` (unused feature) |

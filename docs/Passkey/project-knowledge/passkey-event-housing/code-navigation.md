---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: code-navigation
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [code-navigation, entry-points, files, where-to-change]
---

# Code Navigation

## Entry points

| What | File |
|---|---|
| Main class / wiring | [PasskeyEventHousingServiceApplication.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/PasskeyEventHousingServiceApplication.java) |
| Configuration POJO | [PasskeyEventHousingServiceConfiguration.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/PasskeyEventHousingServiceConfiguration.java) |
| Config template / local config | [template.yaml](../passkey-event-housing-service/configs/template.yaml), `configs/dev.yaml` (contains committed credentials — see [known-issues-roadmap.md](known-issues-roadmap.md)) |
| URL constants | [ApiConstants.java](../passkey-event-housing-shared/src/main/java/com/cvent/passkey/eventhousing/constants/ApiConstants.java) |
| Health check | [PasskeyEventHousingHealthCheck.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/health/PasskeyEventHousingHealthCheck.java) |

## Request path: resource → service → DAO → mapper XML

| Feature | Resource | Service(s) | DAO | Mapper XML |
|---|---|---|---|---|
| Hotels | [EventResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/EventResource.java) | [HotelDetailsService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/HotelDetailsService.java) | [HotelDetailsDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/HotelDetailsDataAccess.java) | [mapper/](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/) |
| Rooms | EventResource | [RoomDetailsService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/RoomDetailsService.java), [AttendeeTypeService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/AttendeeTypeService.java) | [RoomDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/RoomDataAccess.java), [AttendeeTypeAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/AttendeeTypeAccess.java) | |
| Block room / summaries | EventResource, [BlockResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/BlockResource.java) | [BlockService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/BlockService.java), [InventoryProvider](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/InventoryProvider.java) | [BlockDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/BlockDataAccess.java) | |
| Connections | [ConnectionResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/ConnectionResource.java) | [ConnectionService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/ConnectionService.java) | [ConnectionDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/ConnectionDataAccess.java) (explicit txn) | |
| Admin | [AdminResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/AdminResource.java) | [AdminService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/AdminService.java), [EventProvider](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/EventProvider.java) | [AdminDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/AdminDataAccess.java) | |
| GroupLink | [GroupLinkResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/GroupLinkResource.java) | [GroupLinkService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/GroupLinkService.java) | [GroupLinkDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/GroupLinkDataAccess.java) | GroupLinkMapper.xml |
| Images | [ImagesResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/ImagesResource.java) | [ImageService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/ImageService.java), [PfuFileProvider](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/PfuFileProvider.java), [ImageUtil](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/util/ImageUtil.java) | [ImagesDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/ImagesDataAccess.java) | ImagesMapper.xml |
| Room categories | [RoomCategoryResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/RoomCategoryResource.java), [EventRoomCategoryResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/EventRoomCategoryResource.java) | [RoomCategoryService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/RoomCategoryService.java) | [RoomCategoriesDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/RoomCategoriesDataAccess.java), [ParticipantDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/ParticipantDataAccess.java) | RoomCategoryMapper.xml |
| Transfer state | [RoomBlockTransferStateResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/RoomBlockTransferStateResource.java) | [RoomBlockTransferStateService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/RoomBlockTransferStateService.java) | [RoomBlockTransferStateDataAccess](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/RoomBlockTransferStateDataAccess.java) | RoomBlockTransferStatusMapper.xml |
| Callbacks (dead) | [CallbackResource](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/CallbackResource.java) | [CallbackService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/CallbackService.java) | [couchbase/](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/couchbase/) | — |

## Cross-cutting

| Concern | Where |
|---|---|
| Transactions | [TransactionManager](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/transaction/TransactionManager.java), [AbstractDao](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/dataaccess/AbstractDao.java), [AbstractService](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/service/AbstractService.java) |
| Exceptions & mappers | [exceptions/](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/exceptions/), [DaoExceptionMapper](../passkey-event-housing-data-access/src/main/java/com/cvent/passkey/eventhousing/exceptions/DaoExceptionMapper.java) |
| Error codes | [RegistrationErrorCodeType.java](../passkey-event-housing-shared/src/main/java/com/cvent/passkey/eventhousing/constants/RegistrationErrorCodeType.java), [GroupLinkErrorCode.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/exceptions/GroupLinkErrorCode.java) |
| Downstream clients | [ClientCreator](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/util/ClientCreator.java), [ClientUtil](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/util/ClientUtil.java) |
| MyBatis session factory | [SessionFactoryCreator](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/util/SessionFactoryCreator.java) |
| Room filter | [pagination/filters/](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/pagination/filters/) |
| Logging context | `initializeLoggingContext()` in the application class |

## Where to change what

| Task | Touch |
|---|---|
| New endpoint | Resource (+ register in `run()`), service, DAO, mapper XML, API model in `api` module, path constant in `ApiConstants`, java-client interface, Karate feature |
| New downstream call | `ClientCreator` + a provider class; constructor call in `run()` |
| New error code | `RegistrationErrorCodeType` + exception subclass of `EventHousingBaseException` |
| Atomic multi-DAO write | Use `executeInSameDbSession` with `AbstractDao.dbCall`-based DAOs (raw-factory DAOs won't join) |
| Logging context for new request type | `initializeLoggingContext()` |

## Tests

Unit tests mirror main packages: 28 in service, 13 in data-access (`*Test.java`). ITs: [integration-test module](../passkey-event-housing-integration-test/). See [testing-guide.md](testing-guide.md).

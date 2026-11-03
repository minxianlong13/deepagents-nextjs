---
project_id: passkey-event-housing
project_name: Passkey Event Housing Service
document_type: directory-structure
version: "1.0"
generated_at: "2026-11-02T00:00:00Z"
source_repository: cvent-internal/passkey-event-housing
tags: [repository, layout, modules, files]
---

# Directory Structure

```text
passkey-event-housing/
├── pom.xml                         # Parent POM (com.cvent:maven-parent 57.0.0), revision 1.8.2-SNAPSHOT, profiles run-it/default
├── passkey-event-housing-api/      # Immutables model interfaces + RAML (Java 11)
│   └── src/main/resources/api/     # api.raml (partial), raml-parent/
├── passkey-event-housing-shared/   # ApiConstants, RegistrationErrorCodeType
├── passkey-event-housing-data-access/
│   ├── src/main/java/com/cvent/passkey/eventhousing/
│   │   ├── dataaccess/             # AbstractDao + 11 DAOs; couchbase/ (unused callbacks)
│   │   ├── mapper/                 # 12 MyBatis mapper interfaces
│   │   ├── transaction/            # TransactionManager (ThreadLocal SqlSession)
│   │   ├── configuration/          # MultiEnvConfig (per-env DataSource)
│   │   ├── handler/                # CurrencyTypeHandler, EmptyIfNullStringTypeHandler
│   │   ├── entity/, model/         # EventCategoryAmenity, S3ImageMetadataEntity, VendorSystemDetails
│   │   └── exceptions/             # DaoException + DaoExceptionMapper
│   └── src/main/resources/
│       ├── com/cvent/passkey/eventhousing/mapper/*.xml   # All SQL
│       └── res-master-script.sql   # GUI.APPLICATION seed row (app id 1001)
├── passkey-event-housing-service/
│   ├── configs/                    # dev.yaml, template.yaml (hogan), <env>.properties
│   └── src/main/java/com/cvent/passkeyeventhousing/
│       ├── PasskeyEventHousingServiceApplication.java    # main + all wiring
│       ├── PasskeyEventHousingServiceConfiguration.java  # YAML config bean
│       ├── resources/              # 10 JAX-RS resources (CallbackResource unregistered)
│       ├── service/                # Services + Providers + AbstractService
│       ├── exceptions/             # Exceptions + mappers
│       ├── pagination/filters/     # FilterConverter, RoomTypesFilterPredicateValidator
│       ├── util/                   # ClientCreator, ClientUtil, ImageUtil, SessionFactoryCreator
│       └── health/                 # PasskeyEventHousingHealthCheck
├── passkey-event-housing-java-client/   # Retrofit2 client interfaces + factory (Java 11)
├── passkey-event-housing-integration-test/
│   ├── src/test/java/.../featureFiles/  # Karate .feature files by area
│   ├── src/test/java/.../common/        # Reusable setup features (event, hotel, DB)
│   ├── src/test/resources/common/       # JSON templates, test images
│   └── test_configs/                    # karate-config-*.js
├── docs/index.md, mkdocs.yaml      # TechDocs stub
├── Jenkinsfile, jenkins.sh, build*.sh   # CI
├── Dockerfile                      # Legacy (JRE 11 base) — see known issues
├── dropkick*.sh                    # Original scaffolding commands (slush founder)
├── catalog-info.yaml               # Backstage
├── CHANGELOG.md, package.json, .changeset/   # Changesets release tooling
├── CODEOWNERS, pull_request.md     # Ownership, PR checklist
├── AGENTS.md                       # Agent guidance
├── openwiki/                       # Generated wiki (do not hand-edit)
└── project-knowledge/              # This knowledge base
```

## Where to look first

| Goal | Path |
|---|---|
| See how everything is wired | [PasskeyEventHousingServiceApplication.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/PasskeyEventHousingServiceApplication.java) |
| Find an endpoint | [resources/](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/resources/) and [ApiConstants.java](../passkey-event-housing-shared/src/main/java/com/cvent/passkey/eventhousing/constants/ApiConstants.java) |
| Find SQL | [mapper XML](../passkey-event-housing-data-access/src/main/resources/com/cvent/passkey/eventhousing/mapper/) |
| Find a DTO | [api model](../passkey-event-housing-api/src/main/java/com/cvent/passkeyeventhousing/model/) |
| Config keys | [PasskeyEventHousingServiceConfiguration.java](../passkey-event-housing-service/src/main/java/com/cvent/passkeyeventhousing/PasskeyEventHousingServiceConfiguration.java), [template.yaml](../passkey-event-housing-service/configs/template.yaml) |

More lookups: [code-navigation.md](code-navigation.md).

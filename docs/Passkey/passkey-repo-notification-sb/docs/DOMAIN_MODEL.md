# Domain Model

## Overview

The Passkey Notification Service domain model defines the core business entities and their relationships within the notification system. The model follows Domain-Driven Design principles with clear separation between request/response models and internal domain entities.

## Core Entities

### Entity

The primary domain entity representing a notification entity within the system.

#### Request Model (Input)

```java
public class Entity {
    private String id;
    private String field;
    private String anotherField;
    private ComplexEntity complexEntity;
}
```

**Properties**:

| Property | Type | Required | Constraints | Description |
|----------|------|----------|-------------|-------------|
| `id` | String | Yes | Non-null, Non-empty | Unique identifier for the entity |
| `field` | String | Yes | Non-null | Primary field containing entity data |
| `anotherField` | String | Yes | Non-null | Secondary field for additional data |
| `complexEntity` | ComplexEntity | Yes | Non-null | Nested complex entity |

#### Response Model (Output)

```java
public class ResponseEntity {
    private String id;
    private String field;
    private String anotherField;
    private ComplexEntityResponse complexEntityResponse;
}
```

**Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `id` | String | Entity identifier (echoed from request) |
| `field` | String | Primary field value (echoed from request) |
| `anotherField` | String | Secondary field value (echoed from request) |
| `complexEntityResponse` | ComplexEntityResponse | Processed complex entity response |

### ComplexEntity

Nested entity representing complex data structures within the main entity.

#### Request Model

```java
public class ComplexEntity {
    private Integer complex;
}
```

**Properties**:

| Property | Type | Required | Constraints | Description |
|----------|------|----------|-------------|-------------|
| `complex` | Integer | Yes | Non-null | Complex field value |

#### Response Model

```java
public class ComplexEntityResponse {
    private Integer complex;
}
```

**Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `complex` | Integer | Processed complex field value |

## Domain Relationships

### Entity Composition

```
Entity
├── id: String
├── field: String
├── anotherField: String
└── complexEntity: ComplexEntity
    └── complex: Integer
```

### Response Transformation

```
Entity (Request) → ResponseEntity (Response)
├── id → id (direct mapping)
├── field → field (direct mapping)
├── anotherField → anotherField (direct mapping)
└── complexEntity → complexEntityResponse
    └── complex → complex (direct mapping)
```

## Data Validation Rules

### Entity Validation

1. **ID Validation**
   - Must not be null or empty
   - Should be unique within the system
   - Recommended format: alphanumeric with hyphens

2. **Field Validation**
   - Must not be null
   - Can contain any string value
   - No specific length constraints currently enforced

3. **AnotherField Validation**
   - Must not be null
   - Can contain any string value
   - No specific length constraints currently enforced

4. **ComplexEntity Validation**
   - Must not be null
   - Must contain valid ComplexEntity object

### ComplexEntity Validation

1. **Complex Field Validation**
   - Must not be null
   - Must be a valid integer
   - No range constraints currently enforced

## Business Rules

### Entity Creation Rules

1. **Uniqueness**: Entity IDs should be unique within the system
2. **Immutability**: Once created, entity IDs cannot be changed
3. **Completeness**: All required fields must be provided
4. **Consistency**: Complex entity values must be consistent with business logic

### Entity Retrieval Rules

1. **Default Values**: When retrieving non-existent entities, default values are returned:
   - `field`: "field"
   - `anotherField`: "anotherField"
   - `complex`: 5 (DEFAULT_COMPLEX_VALUE)

2. **Access Control**: Entity access is controlled by OAuth2 scopes
3. **Data Integrity**: Retrieved data maintains referential integrity

## Data Transformation Patterns

### Request to Response Mapping

The service implements a direct mapping pattern for most fields:

```java
// Direct field mapping
responseEntity.setId(requestEntity.getId());
responseEntity.setField(requestEntity.getField());
responseEntity.setAnotherField(requestEntity.getAnotherField());

// Complex entity transformation
ComplexEntityResponse complexResponse = ComplexEntityResponse.builder()
    .withComplex(requestEntity.getComplexEntity().getComplex())
    .build();
responseEntity.setComplexEntityResponse(complexResponse);
```

### Default Value Assignment

For GET operations without existing data:

```java
// Default entity creation
ResponseEntity defaultEntity = ResponseEntity.builder()
    .withId(requestedId)
    .withField("field")
    .withAnotherField("anotherField")
    .withComplexEntityResponse(
        ComplexEntityResponse.builder()
            .withComplex(DEFAULT_COMPLEX_VALUE) // 5
            .build()
    )
    .build();
```

## Immutable Objects Pattern

The domain model uses the Immutables library for creating immutable value objects:

### Benefits

1. **Thread Safety**: Immutable objects are inherently thread-safe
2. **Predictability**: Objects cannot be modified after creation
3. **Caching**: Safe to cache immutable objects
4. **Debugging**: Easier to reason about object state

### Implementation

```java
@Value.Immutable
@JsonSerialize(as = ImmutableEntity.class)
@JsonDeserialize(as = ImmutableEntity.class)
public interface Entity {
    String getId();
    String getField();
    String getAnotherField();
    ComplexEntity getComplexEntity();
    
    static ImmutableEntity.Builder builder() {
        return ImmutableEntity.builder();
    }
}
```

## Database Mapping

### Entity Persistence

Currently, the service implements a stateless pattern where entities are not persisted to the database. However, the infrastructure is in place for future database integration:

#### Potential Database Schema

```sql
-- Entities table
CREATE TABLE entities (
    id VARCHAR2(255) PRIMARY KEY,
    field VARCHAR2(1000) NOT NULL,
    another_field VARCHAR2(1000) NOT NULL,
    complex_value NUMBER(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_entities_created_at ON entities(created_at);
CREATE INDEX idx_entities_updated_at ON entities(updated_at);
```

#### MyBatis Mapping

```xml
<mapper namespace="com.cvent.passkeynotificationsb.dao.EntityDao">
    <resultMap id="EntityResultMap" type="Entity">
        <id property="id" column="id"/>
        <result property="field" column="field"/>
        <result property="anotherField" column="another_field"/>
        <association property="complexEntity" javaType="ComplexEntity">
            <result property="complex" column="complex_value"/>
        </association>
    </resultMap>
    
    <select id="findById" resultMap="EntityResultMap">
        SELECT id, field, another_field, complex_value
        FROM entities
        WHERE id = #{id}
    </select>
    
    <insert id="insert">
        INSERT INTO entities (id, field, another_field, complex_value)
        VALUES (#{id}, #{field}, #{anotherField}, #{complexEntity.complex})
    </insert>
</mapper>
```

## Error Handling

### Domain Validation Errors

1. **Null Value Errors**: When required fields are null
2. **Invalid Format Errors**: When field values don't meet format requirements
3. **Business Rule Violations**: When entities violate business constraints

### Error Response Format

```java
public class DomainError {
    private String field;
    private String message;
    private String code;
    private Object rejectedValue;
}
```

## Future Enhancements

### Planned Domain Extensions

1. **Entity Versioning**: Support for entity version tracking
2. **Audit Trail**: Track entity creation and modification history
3. **Soft Deletion**: Mark entities as deleted without physical removal
4. **Entity Relationships**: Support for entity associations and references
5. **Custom Validation**: Pluggable validation framework
6. **Event Sourcing**: Track all entity state changes as events

### Advanced Features

1. **Entity Caching**: Cache frequently accessed entities
2. **Bulk Operations**: Support for batch entity operations
3. **Search Capabilities**: Full-text search across entity fields
4. **Data Encryption**: Encrypt sensitive entity data
5. **Multi-tenancy**: Support for tenant-specific entities

## Best Practices

### Domain Model Guidelines

1. **Immutability**: Use immutable objects for value types
2. **Validation**: Validate at domain boundaries
3. **Encapsulation**: Keep business logic within domain objects
4. **Separation**: Separate request/response models from domain models
5. **Consistency**: Maintain consistent naming conventions

### Performance Considerations

1. **Object Creation**: Minimize object creation in hot paths
2. **Memory Usage**: Consider memory footprint of domain objects
3. **Serialization**: Optimize JSON serialization/deserialization
4. **Caching**: Cache expensive domain calculations
5. **Database Access**: Minimize database round trips
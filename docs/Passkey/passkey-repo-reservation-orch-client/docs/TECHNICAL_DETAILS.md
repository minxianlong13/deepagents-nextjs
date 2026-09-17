# Technical Details

## Technology Stack

- **Language**: Java 11
- **Build Tool**: Maven 3.6+
- **Parent POM**: Cvent Maven Parent 35.3.3
- **Packaging**: JAR library
- **HTTP Client**: Cvent Common Client
- **JSON Processing**: Jackson (via common-client)
- **Immutable Objects**: Immutables library
- **Logging**: SLF4J API
- **Testing**: JUnit 5, Mockito

## Dependencies

### Core Dependencies

#### Cvent Common Client
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-client</artifactId>
    <version>${mono-java.version}</version>
</dependency>
```
- Provides HTTP client functionality
- Handles authentication and request/response processing
- Includes Jackson for JSON serialization

#### Immutables
```xml
<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
    <scope>provided</scope>
</dependency>
```
- Annotation processor for generating immutable value objects
- Provides builder pattern implementation
- Compile-time only dependency

#### SLF4J Logging
```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
</dependency>
```
- Logging facade for flexible logging implementation
- Allows consuming applications to choose logging framework

### Test Dependencies

#### JUnit 5
```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
```

#### Mockito
```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <scope>test</scope>
</dependency>
```

#### Jersey Common (Test)
```xml
<dependency>
    <groupId>org.glassfish.jersey.core</groupId>
    <artifactId>jersey-common</artifactId>
    <version>2.36</version>
    <scope>test</scope>
</dependency>
```

## Build Configuration

### Maven Properties
```xml
<properties>
    <mono-java.version>35.3.3</mono-java.version>
    <slf4j.version>1.7.32</slf4j.version>
    <java.version>11</java.version>
    <revision>1.11.20-SNAPSHOT</revision>
</properties>
```

### Code Coverage
- **Tool**: JaCoCo Maven Plugin
- **Exclusions**: Model classes in `com/cvent/passkey/reservationorchestratorclient/model/**`
- **SonarQube Integration**: Configured for code quality analysis

### Version Management
- Uses `${revision}` property for dynamic versioning
- Managed through Cvent's release pipeline
- Semantic versioning (MAJOR.MINOR.PATCH)

## Configuration

### Client Configuration
The library uses constructor-based configuration for simplicity:

```java
// Basic client setup
ReservationClient client = new ReservationClient("https://housing-api-alpha.passkey.com/bookings/");

// Batch client setup
BatchReservationClient batchClient = new BatchReservationClient("https://housing-api-alpha.passkey.com/bookings/");
```

### Environment-Specific URLs
- **Alpha**: `https://housing-api-alpha.passkey.com/bookings/`
- **Beta**: `https://housing-api-beta.passkey.com/bookings/`
- **Production**: `https://housing-api.passkey.com/bookings/`

### Authentication Configuration
All clients require API key authentication:
```java
String authHeader = "API_KEY " + apiKey;
```

### Timeout Configuration
Default timeouts are configured in the base client:
- **Connection Timeout**: 30 seconds
- **Read Timeout**: 60 seconds
- **Operation Monitoring**: 5 minutes default

## JSON Serialization

### Jackson Configuration
- Uses Jackson ObjectMapper from common-client
- Custom deserializers for specific types:
  - `StrictBooleanDeserializer` - Strict boolean parsing
  - `ReservationProcessStatusDeserializer` - Status enum handling

### Date/Time Handling
- LocalDate serialized as ISO-8601 strings (YYYY-MM-DD)
- LocalDateTime with timezone information
- Money amounts with precision preservation

## Error Handling

### Exception Hierarchy
```java
ReservationErrorException
├── HTTP status code
├── Error response details
└── Original cause (if applicable)
```

### Error Response Format
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {
    "field": "fieldName",
    "code": "VALIDATION_ERROR"
  }
}
```

## Monitoring & Logging

### SLF4J Integration
- All logging uses SLF4J API
- Consuming applications choose implementation (Logback, Log4j, etc.)
- Structured logging for operation tracking

### Key Log Events
- Client initialization
- HTTP request/response details
- Operation status changes
- Error conditions and exceptions
- Performance metrics

### Metrics and Observability
- Operation duration tracking
- Success/failure rates
- Batch processing statistics
- HTTP response code distribution

## Performance Considerations

### Connection Pooling
- Leverages common-client connection pooling
- Reuse client instances for optimal performance
- Configure pool sizes based on usage patterns

### Batch Processing
- Optimal batch size: 50-100 operations
- Automatic chunking for large batches
- Parallel processing where possible

### Memory Management
- Immutable objects reduce memory leaks
- Efficient JSON streaming for large responses
- Garbage collection friendly design

## Security

### API Key Management
- API keys passed as method parameters
- No storage of credentials in client library
- Secure transmission over HTTPS only

### Data Protection
- Payment information tokenized
- PII handling follows GDPR guidelines
- Audit trails for compliance

### Transport Security
- All communication over HTTPS/TLS 1.2+
- Certificate validation enforced
- No fallback to insecure protocols
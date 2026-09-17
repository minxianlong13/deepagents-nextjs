# Technical Details

## Technology Stack

### Core Framework
- **Framework**: Dropwizard 4.0.x
- **Language**: Java 25
- **Build Tool**: Maven 3.6+
- **Architecture**: JAX-RS REST microservice

### Dependencies

#### Core Dropwizard Stack
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-dropwizard</artifactId>
</dependency>
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-json-logging</artifactId>
</dependency>
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-http2</artifactId>
</dependency>
```

#### Cvent Platform Libraries
```xml
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>pangaea</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>common-tracing</artifactId>
</dependency>
<dependency>
    <groupId>com.cvent</groupId>
    <artifactId>dropwizard-observability</artifactId>
</dependency>
```

#### Passkey-Specific Dependencies
```xml
<dependency>
    <groupId>com.cvent.passkey</groupId>
    <artifactId>passkey-core-mapper-api</artifactId>
    <version>1.15.3</version>
</dependency>
<dependency>
    <groupId>com.cvent.passkeyinbound</groupId>
    <artifactId>passkey-inbound-model</artifactId>
    <version>0.6.12</version>
</dependency>
```

#### Authentication & Security
```xml
<dependency>
    <groupId>com.auth0</groupId>
    <artifactId>java-jwt</artifactId>
    <version>4.5.0</version>
</dependency>
```

#### Code Generation
```xml
<dependency>
    <groupId>org.immutables</groupId>
    <artifactId>value</artifactId>
    <scope>provided</scope>
</dependency>
```

#### Testing Framework
```xml
<dependency>
    <groupId>io.dropwizard</groupId>
    <artifactId>dropwizard-testing</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>io.karatelabs</groupId>
    <artifactId>karate-junit5</artifactId>
    <scope>test</scope>
</dependency>
```

## Configuration Management

### Configuration Structure
The service uses Dropwizard's YAML-based configuration system with environment-specific overrides.

#### Main Configuration Class
```java
public class PasskeyVendorMockServiceConfiguration extends Configuration {
    @JsonProperty
    private String environmentName;
    
    @JsonProperty
    private Map<String, EnvironmentConfig> environmentConfig;
    
    @JsonProperty
    private AsyncTransferConfiguration asyncTransfer;
}
```

#### Environment Configuration
```yaml
environmentName: 'dev'
environmentConfig:
  dev:
    defaultEnvironmentConfiguration: true
  template:
    template: true
```

#### Async Transfer Configuration
```yaml
asyncTransfer:
  integrationApi:
    endpoint: "http://localhost:7005/"
  agilysysUser:
    userName: "passkey-integrations.service-test.common-user"
    password: "passkey-integrations.service-test.common-password"
  amadeusUser:
    userName: "passkey-integrations.service-test.common-user"
    password: "passkey-integrations.service-test.common-password"
```

### Environment-Specific Properties
Configuration files support multiple environments:
- `dev.yaml` - Local development
- `alpha.properties` - Alpha environment
- `ts50.properties` - Test environment
- `it50.properties` - Integration testing
- `sg50.properties` - Staging environment
- `pr50.properties` - Production environment

### Configuration Loading
```java
@Override
public void initialize(Bootstrap<PasskeyVendorMockServiceConfiguration> bootstrap) {
    bootstrap.setConfigurationSourceProvider(
        new SubstitutingSourceProvider(
            bootstrap.getConfigurationSourceProvider(),
            new EnvironmentVariableSubstitutor(false)
        )
    );
}
```

## Database Schema

### No Persistent Database
The service operates entirely in-memory for testing purposes:
- **Callback Storage**: ConcurrentHashMap for thread-safe operations
- **Token Cache**: In-memory token storage with expiration
- **Request State**: Temporary state for retry scenarios

### In-Memory Data Structures
```java
// Callback message storage
private final Map<String, Map<String, String>> callbackStorage = 
    new ConcurrentHashMap<>();

// Token storage with expiration
private final Map<String, TokenInfo> tokenCache = 
    new ConcurrentHashMap<>();

// Retry attempt tracking
private final Map<String, Integer> retryAttempts = 
    new ConcurrentHashMap<>();
```

## Monitoring & Logging

### Dropwizard Metrics
Built-in metrics collection for:
- Request/response times
- Error rates
- Throughput metrics
- JVM metrics

### Health Checks
```java
@Override
public void run(PasskeyVendorMockServiceConfiguration configuration,
                Environment environment) {
    environment.healthChecks().register("basic", new BasicHealthCheck());
}
```

### Logging Configuration
```yaml
logging:
  level: INFO
  loggers:
    'org.glassfish.jersey.logging.LoggingFeature': DEBUG
    'com.cvent': DEBUG
  appenders:
    - type: 'console'
    - type: 'file'
      currentLogFilename: 'logs/application.log'
      archivedLogFilenamePattern: 'logs/application.%d{yyyy-MM-dd}.log.gz'
```

### Structured Logging
JSON-formatted logs for better parsing and analysis:
```java
@Override
public void run(PasskeyVendorMockServiceConfiguration configuration,
                Environment environment) {
    environment.getObjectMapper().registerModule(new JavaTimeModule());
    environment.jersey().register(new LoggingFeature());
}
```

### Datadog Integration
APM and logging integration:
- **Service Name**: `passkey-vendor-mock-service`
- **Environment Tags**: Automatic environment detection
- **Custom Metrics**: Business-specific metrics
- **Trace Correlation**: Request tracing across services

## Build Configuration

### Maven Configuration
```xml
<properties>
    <java.version>25</java.version>
    <revision>1.17.3-SNAPSHOT</revision>
    <passkey-core-mapper.version>1.15.3</passkey-core-mapper.version>
    <passkey-inbound.version>0.6.12</passkey-inbound.version>
</properties>
```

### Build Profiles
```xml
<profiles>
    <profile>
        <id>default</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <skipITs>true</skipITs>
            <skipLoadTests>true</skipLoadTests>
        </properties>
    </profile>
    <profile>
        <id>release</id>
        <!-- Shade plugin configuration for fat JAR -->
    </profile>
    <profile>
        <id>coverage</id>
        <!-- JaCoCo configuration -->
    </profile>
</profiles>
```

### Shade Plugin Configuration
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-shade-plugin</artifactId>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <goal>shade</goal>
            </goals>
            <configuration>
                <createDependencyReducedPom>false</createDependencyReducedPom>
                <transformers>
                    <transformer implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer"/>
                    <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                        <manifestEntries>
                            <Main-Class>com.cvent.passkeyvendormock.PasskeyVendorMockServiceApplication</Main-Class>
                        </manifestEntries>
                    </transformer>
                </transformers>
            </configuration>
        </execution>
    </executions>
</plugin>
```

## Security Implementation

### Authentication Simulation
```java
@POST
@Path("/oauth/token")
@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
@Produces(MediaType.APPLICATION_JSON)
public Response generateToken(@FormParam("grant_type") String grantType,
                             @FormParam("client_id") String clientId,
                             @FormParam("client_secret") String clientSecret) {
    // Mock OAuth2 token generation
    String token = JWT.create()
        .withIssuer("passkey-vendor-mock")
        .withSubject(clientId)
        .withExpiresAt(Date.from(Instant.now().plusSeconds(3600)))
        .sign(Algorithm.HMAC256("mock-secret"));
    
    return Response.ok(new TokenResponse(token, "Bearer", 3600)).build();
}
```

### Input Validation
```java
@POST
@Consumes(MediaType.APPLICATION_XML)
@Produces(MediaType.APPLICATION_XML)
public Response processReservation(@Valid String xmlPayload) {
    // XML validation and processing
    try {
        Document doc = DocumentBuilderFactory.newInstance()
            .newDocumentBuilder()
            .parse(new ByteArrayInputStream(xmlPayload.getBytes()));
        // Process document
    } catch (Exception e) {
        return Response.status(400)
            .entity(createErrorResponse("Invalid XML format"))
            .build();
    }
}
```

### CORS Configuration
```java
@Override
public void run(PasskeyVendorMockServiceConfiguration configuration,
                Environment environment) {
    FilterRegistration.Dynamic cors = environment.servlets()
        .addFilter("CORS", CrossOriginFilter.class);
    cors.addMappingForUrlPatterns(EnumSet.allOf(DispatcherType.class), true, "/*");
    cors.setInitParameter("allowedOrigins", "*");
    cors.setInitParameter("allowedHeaders", "*");
    cors.setInitParameter("allowedMethods", "GET,PUT,POST,DELETE,OPTIONS");
}
```

## Performance Considerations

### Memory Management
- **Heap Size**: Configured per environment (typically 512MB-1GB)
- **GC Settings**: G1GC for low-latency requirements
- **Memory Monitoring**: JVM metrics exposed via Dropwizard

### Concurrency
```java
// Thread-safe collections for concurrent access
private final ConcurrentHashMap<String, Object> cache = new ConcurrentHashMap<>();

// Async processing with thread pools
private final ExecutorService asyncExecutor = 
    Executors.newFixedThreadPool(10);
```

### Response Caching
```java
// Template caching for response generation
private final LoadingCache<String, Template> templateCache = 
    CacheBuilder.newBuilder()
        .maximumSize(100)
        .expireAfterWrite(1, TimeUnit.HOURS)
        .build(new TemplateLoader());
```

## Error Handling

### Exception Mapping
```java
@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Exception> {
    @Override
    public Response toResponse(Exception exception) {
        if (exception instanceof ValidationException) {
            return Response.status(400)
                .entity(new ErrorResponse("VALIDATION_ERROR", exception.getMessage()))
                .build();
        }
        // Handle other exceptions
        return Response.status(500)
            .entity(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"))
            .build();
    }
}
```

### Custom Exceptions
```java
public class VendorSystemException extends RuntimeException {
    private final String vendorSystem;
    private final int statusCode;
    
    public VendorSystemException(String vendorSystem, int statusCode, String message) {
        super(message);
        this.vendorSystem = vendorSystem;
        this.statusCode = statusCode;
    }
}
```

## Testing Framework

### Unit Testing
```java
@ExtendWith(DropwizardExtensionsSupport.class)
class PasskeyVendorMockResourceTest {
    private static final DropwizardAppExtension<PasskeyVendorMockServiceConfiguration> APP = 
        new DropwizardAppExtension<>(
            PasskeyVendorMockServiceApplication.class,
            ResourceHelpers.resourceFilePath("test-config.yaml")
        );
    
    @Test
    void testSuccessfulReservation() {
        Response response = APP.client().target("http://localhost:" + APP.getLocalPort())
            .path("/v1/sync/marriott")
            .request()
            .post(Entity.xml("<reservation><guest><firstName>RESPONSE success</firstName></guest></reservation>"));
        
        assertThat(response.getStatus()).isEqualTo(200);
    }
}
```

### Integration Testing with Karate
```gherkin
Feature: Vendor Mock API Testing

Background:
  * url 'http://localhost:7000'

Scenario: Successful reservation transfer
  Given path '/v1/sync/marriott'
  And request '<reservation><guest><firstName>RESPONSE success</firstName></guest></reservation>'
  And header Content-Type = 'application/xml'
  When method post
  Then status 200
  And match response contains 'Success'
```

### Load Testing
```java
@Test
@Tag("load")
void loadTest() {
    // Concurrent request simulation
    ExecutorService executor = Executors.newFixedThreadPool(50);
    List<Future<Response>> futures = new ArrayList<>();
    
    for (int i = 0; i < 1000; i++) {
        futures.add(executor.submit(() -> 
            makeReservationRequest("RESPONSE success")));
    }
    
    // Verify all requests complete successfully
    futures.forEach(future -> {
        try {
            Response response = future.get(30, TimeUnit.SECONDS);
            assertThat(response.getStatus()).isEqualTo(200);
        } catch (Exception e) {
            fail("Request failed: " + e.getMessage());
        }
    });
}
```

## Code Quality

### JaCoCo Coverage
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <configuration>
        <excludes>
            <exclude>com/cvent/passkeyvendormock/PasskeyVendorMockServiceApplication.class</exclude>
        </excludes>
    </configuration>
</plugin>
```

### Static Analysis
- **Checkmarx**: Security scanning on master branch
- **SonarQube**: Code quality analysis
- **SpotBugs**: Bug detection
- **PMD**: Code analysis

### Code Style
- **Google Java Style**: Enforced via Checkstyle
- **EditorConfig**: Consistent formatting across IDEs
- **Immutables**: Immutable object generation

## Deployment Artifacts

### JAR Packaging
```bash
# Fat JAR with all dependencies
passkey-vendor-mock-service-1.17.3-SNAPSHOT.jar

# Configuration archive
passkey-vendor-mock-service-1.17.3-SNAPSHOT-configs.tar.gz
```

### Docker Image
```dockerfile
FROM docker.cvent.net/cvent-jre:11.0.4.11
ENV SERVICE "passkey-vendor-mock-service"
WORKDIR /usr/src
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*.jar" ./
COPY --from=builder "/usr/src/app/${SERVICE}/target/${SERVICE}-*-configs" ./
CMD ["java", "-jar", "passkey-vendor-mock-service-1.0.0-SNAPSHOT.jar", "server", "configs/dev.yaml"]
```

### Environment Variables
```bash
# JVM Configuration
JAVA_OPTS="-Xmx1g -XX:+UseG1GC"

# Application Configuration
SERVICE_PORT=7000
ADMIN_PORT=7001
LOG_LEVEL=INFO

# Datadog Configuration
DD_SERVICE=passkey-vendor-mock-service
DD_ENV=${ENVIRONMENT}
DD_VERSION=${BUILD_NUMBER}
```
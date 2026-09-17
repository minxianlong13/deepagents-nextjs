# Development Guide

## Prerequisites

### Required Software
- **Java 11**: OpenJDK 11 or Oracle JDK 11
- **Maven 3.6+**: Build tool and dependency management
- **Git**: Version control
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code with Java extensions

### Development Tools
- **Docker**: For running integration tests (optional)
- **Postman**: For API testing
- **SonarLint**: Code quality analysis in IDE

### Version Management
The project uses `.tool-versions` file for asdf version manager:
```
java openjdk-11.0.2
maven 3.8.6
```

## Local Setup

### Clone Repository
```bash
git clone git@github.com:cvent-internal/passkey-reservation-orch-client.git
cd passkey-reservation-orch-client
```

### Build Project
```bash
# Clean build with tests
mvn clean install

# Build with code coverage
mvn clean install -Pcoverage

# Skip tests for faster build
mvn clean install -DskipTests
```

### IDE Setup

#### IntelliJ IDEA
1. Import project as Maven project
2. Set Project SDK to Java 11
3. Enable annotation processing for Immutables
4. Install SonarLint plugin for code quality

#### Eclipse
1. Import as Existing Maven Project
2. Configure Java Build Path to use Java 11
3. Enable annotation processing in project properties

## Running Tests

### Unit Tests
```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=ReservationClientTest

# Run tests with coverage
mvn test jacoco:report
```

### Test Coverage
```bash
# Generate coverage report
mvn clean test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Integration Tests
```bash
# Run integration tests (if available)
mvn verify -Pintegration-tests
```

## Code Structure

### Package Organization
```
src/main/java/com/cvent/passkey/reservationorchestratorclient/
├── client/                           # HTTP client utilities
├── model/                           # Domain models and DTOs
│   ├── applyguarantee/             # Guarantee type models
│   ├── batch/                      # Batch operation models
│   ├── commerce/                   # Commerce and payment models
│   └── groupbooking/               # Group booking models
├── ApplyGuaranteeTypeClient.java   # Guarantee operations client
├── BaseClient.java                 # Common HTTP functionality
├── BatchReservationClient.java     # Batch operations client
├── CommerceClient.java             # Commerce operations client
├── GroupBookingClient.java         # Group booking operations client
└── ReservationClient.java          # Single reservation operations client
```

### Test Structure
```
src/test/java/com/cvent/passkey/reservationorchestratorclient/
├── client/                         # Client unit tests
├── model/                          # Model unit tests
└── integration/                    # Integration tests
```

## Coding Standards

### Java Style Guide
- Follow Google Java Style Guide
- Use 4 spaces for indentation
- Maximum line length: 120 characters
- Use meaningful variable and method names

### Code Formatting
```xml
<!-- Maven Checkstyle Plugin Configuration -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <configuration>
        <configLocation>checkstyle.xml</configLocation>
    </configuration>
</plugin>
```

### Documentation Standards
- All public methods must have JavaDoc
- Include parameter descriptions and return values
- Document exceptions that may be thrown
- Provide usage examples for complex APIs

### Example JavaDoc
```java
/**
 * Creates a new reservation asynchronously.
 * 
 * @param authHeader Authorization header containing API key
 * @param reservation The reservation details to create
 * @return ReservationOperation for monitoring the creation process
 * @throws ReservationErrorException if the request is invalid or fails
 * @throws IllegalArgumentException if required parameters are null
 */
public ReservationOperation create(String authHeader, Reservation reservation) {
    // Implementation
}
```

## Common Development Tasks

### Adding a New Client Method

1. **Define the method signature** in the appropriate client class:
```java
public OperationResult newOperation(String authHeader, RequestModel request) {
    // Implementation
}
```

2. **Create request/response models** in the model package:
```java
@Value.Immutable
@JsonSerialize(as = ImmutableNewRequest.class)
@JsonDeserialize(as = ImmutableNewRequest.class)
public interface NewRequest {
    String getParameter1();
    Optional<String> getParameter2();
}
```

3. **Implement the method** using BaseClient:
```java
public OperationResult newOperation(String authHeader, RequestModel request) {
    return baseClient.post("/new-endpoint", authHeader, request, OperationResult.class);
}
```

4. **Write unit tests**:
```java
@Test
void testNewOperation() {
    // Arrange
    NewRequest request = ImmutableNewRequest.builder()
        .parameter1("value1")
        .build();
    
    // Act
    OperationResult result = client.newOperation("API_KEY test", request);
    
    // Assert
    assertThat(result).isNotNull();
}
```

### Adding a New Domain Model

1. **Create the interface** with Immutables annotations:
```java
@Value.Immutable
@JsonSerialize(as = ImmutableNewModel.class)
@JsonDeserialize(as = ImmutableNewModel.class)
public interface NewModel {
    String getId();
    String getName();
    Optional<String> getDescription();
    
    // Builder method for convenience
    static ImmutableNewModel.Builder builder() {
        return ImmutableNewModel.builder();
    }
}
```

2. **Add validation** if needed:
```java
@Value.Check
default void check() {
    Preconditions.checkArgument(!getName().isEmpty(), "Name cannot be empty");
}
```

3. **Write model tests**:
```java
@Test
void testNewModelBuilder() {
    NewModel model = NewModel.builder()
        .id("123")
        .name("Test Name")
        .build();
    
    assertThat(model.getId()).isEqualTo("123");
    assertThat(model.getName()).isEqualTo("Test Name");
}
```

### Debugging Tips

#### Enable Debug Logging
Add to your test resources `logback-test.xml`:
```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.cvent.passkey.reservationorchestratorclient" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

#### Mock External Dependencies
```java
@ExtendWith(MockitoExtension.class)
class ReservationClientTest {
    
    @Mock
    private BaseClient baseClient;
    
    @InjectMocks
    private ReservationClient reservationClient;
    
    @Test
    void testCreateReservation() {
        // Mock setup
        when(baseClient.post(any(), any(), any(), any()))
            .thenReturn(mockResponse);
        
        // Test execution
        ReservationOperation result = reservationClient.create("auth", reservation);
        
        // Verification
        verify(baseClient).post("/reservations", "auth", reservation, ReservationResponse.class);
    }
}
```

## Contributing Guidelines

### Branch Strategy
- **main**: Production-ready code
- **feature/**: New features (`feature/add-group-booking`)
- **bugfix/**: Bug fixes (`bugfix/fix-timeout-handling`)
- **hotfix/**: Critical production fixes

### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Ensure all tests pass and coverage requirements met
4. Submit pull request with clear description
5. Address code review feedback
6. Merge after approval

### Commit Message Format
```
type(scope): brief description

Longer description if needed

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Code Review Checklist
- [ ] All tests pass
- [ ] Code coverage maintained
- [ ] Documentation updated
- [ ] No SonarQube violations
- [ ] API backward compatibility maintained
- [ ] Error handling implemented
- [ ] Logging added for debugging

## Release Process

### Preparing a Release
1. Update version in `pom.xml`
2. Update `CHANGELOG.md` with release notes
3. Create release branch: `release/1.11.20`
4. Final testing and validation
5. Merge to main and tag release

### Hotfix Process
1. Create hotfix branch from main: `hotfix/1.11.21`
2. Implement critical fix
3. Test thoroughly
4. Update version and changelog
5. Merge to main and create tag
6. Deploy immediately

## Additional Resources

## Quick Start


### Single Reservation Example

```java
String authHeader = "API_KEY xxx";
ReservationClient client = new ReservationClient("https://housing-api-alpha.passkey.com/bookings/");
ReservationOperation create = client.create(authHeader, reservation);

// Monitor operation until complete (or timeout)
ReservationProcessResult result = create.monitor();
if (result.getStatus() == Reservation.ProcessStatus.SUCCESS) {
    Reservation reservation = result.getReservation();
    // use reservation
}
```

### Batch Reservation Example

```java
String authHeader = "API_KEY xxx";
BatchReservationClient client = new BatchReservationClient("https://housing-api-alpha.passkey.com/bookings/");
BatchReservationClient.Batch batch = client.createBatch(authHeader);

// Add operations to batch
batch.create(newReservation, UUID.randomUUID().toString());
batch.modify(modifiedReservation, UUID.randomUUID().toString());
batch.cancel(cancelReservation, UUID.randomUUID().toString());

// Submit and monitor
batch.submit();
BatchStatus status = batch.monitor();
```

## Service Ownership


| Role      | Team          | Slack Channel            |
|-----------|---------------|--------------------------| 
| Primary   | Steakholders  | `#passkey-steak-holders` |
| Secondary | Cherrypickers | `#passkey-cherrypickers` |

## Useful Links


- [Jenkins CI/CD](https://ci-jenkins.core.cvent.org/job/passkey-cdk/job/passkey-reservation-orch-client/)
- [SonarQube Analysis](https://sonar.core.cvent.org/dashboard?id=com.cvent.passkey%3Apasskey-reservation-orch-client)
- [GitHub Repository](https://github.com/cvent-internal/passkey-reservation-orch-client)

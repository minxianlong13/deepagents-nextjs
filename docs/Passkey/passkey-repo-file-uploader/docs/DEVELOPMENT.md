# Development Guide

## Prerequisites

### Required Software

- **Node.js**: Version 18.x or higher
- **Java**: OpenJDK 17 or higher
- **Maven**: Version 3.8 or higher
- **Docker**: Latest stable version
- **pnpm**: Version 8.x or higher
- **Git**: Latest version

### Development Tools

- **IDE**: IntelliJ IDEA (recommended) or VS Code
- **Database Client**: pgAdmin, DBeaver, or similar
- **API Testing**: Postman, Insomnia, or curl
- **Container Management**: Docker Desktop

### Version Management

```bash
# Install asdf for version management
git clone https://github.com/asdf-vm/asdf.git ~/.asdf

# Add to shell profile
echo '. ~/.asdf/asdf.sh' >> ~/.bashrc
echo '. ~/.asdf/completions/asdf.bash' >> ~/.bashrc

# Install plugins
asdf plugin add nodejs
asdf plugin add java
asdf plugin add maven

# Install versions (from .tool-versions file)
asdf install
```

## Local Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/cvent-internal/passkey-file-uploader.git
cd passkey-file-uploader

# Install dependencies
pnpm install

# Verify setup
pnpm --version
java --version
mvn --version
```

### 2. Environment Configuration

#### Create Local Environment File

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your local settings
vim .env.local
```

#### Environment Variables (.env.local)

```bash
# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/passkey_file_uploader_dev
DATABASE_USERNAME=dev_user
DATABASE_PASSWORD=dev_password

# LocalStack Configuration
LOCALSTACK_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=us-east-1

# S3 Configuration
S3_BUCKET_NAME=passkey-file-uploader-local
S3_ENDPOINT=http://localhost:4566

# OAuth Configuration (Development)
OAUTH_ISSUER_URI=https://oauth-dev.cvent.org
OAUTH_CLIENT_ID=passkey-file-uploader-dev
OAUTH_CLIENT_SECRET=dev-secret

# Application Configuration
SERVER_PORT=8080
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
FILE_MAX_SIZE=104857600
MALWARE_SCANNER_ENABLED=false

# Logging
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_COM_CVENT=DEBUG
```

### 3. Infrastructure Setup

#### Start LocalStack (AWS Services)

```bash
# Start LocalStack infrastructure
pnpm --prefix packages/passkey-file-uploader-sb/infra dev:start:infra

# Verify LocalStack is running
curl http://localhost:4566/health

# Create S3 bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://passkey-file-uploader-local
```

#### Start PostgreSQL Database

```bash
# Using Docker
docker run --name passkey-file-uploader-db \
  -e POSTGRES_DB=passkey_file_uploader_dev \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  -d postgres:14

# Verify database connection
psql -h localhost -U dev_user -d passkey_file_uploader_dev -c "SELECT version();"
```

### 4. Database Migration

```bash
# Run database migrations
cd packages/passkey-file-uploader-sb/service
mvn flyway:migrate

# Verify tables created
psql -h localhost -U dev_user -d passkey_file_uploader_dev -c "\dt"
```

## Running Services

### Backend Service (Spring Boot)

#### Using Maven

```bash
cd packages/passkey-file-uploader-sb/service

# Run with development profile
mvn spring-boot:run -Dspring-boot.run.profiles=development

# Or with specific JVM options
mvn spring-boot:run \
  -Dspring-boot.run.jvmArguments="-Xmx1g -Dspring.profiles.active=development"
```

#### Using IntelliJ IDEA

1. Open the project in IntelliJ IDEA
2. Navigate to `packages/passkey-file-uploader-sb/service/src/main/java/com/cvent/passkeyfileuploader/PasskeyFileUploaderApplication.java`
3. Right-click and select "Run PasskeyFileUploaderApplication"
4. Configure run configuration with environment variables

#### Using Docker

```bash
# Build Docker image
cd packages/passkey-file-uploader-sb/service
docker build -t passkey-file-uploader-sb:dev .

# Run container
docker run -p 8080:8080 \
  --env-file .env.local \
  passkey-file-uploader-sb:dev
```

### Frontend Application (Next.js)

#### Development Server

```bash
cd packages/passkey-file-uploader

# Start development server
pnpm dev

# Or with specific port
pnpm dev --port 3001
```

#### Production Build (Local Testing)

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Full Stack Development

#### Using pnpm Workspaces

```bash
# Start all services concurrently
pnpm dev:all

# Start only backend
pnpm dev:backend

# Start only frontend
pnpm dev:frontend
```

#### Using Docker Compose

```bash
# Start all services with dependencies
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

## Running Tests

### Unit Tests

#### Backend Tests

```bash
cd packages/passkey-file-uploader-sb/service

# Run all unit tests
mvn test

# Run specific test class
mvn test -Dtest=FileUploadServiceTest

# Run with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

#### Frontend Tests

```bash
cd packages/passkey-file-uploader

# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Integration Tests

#### Backend Integration Tests

```bash
cd packages/passkey-file-uploader-sb/it

# Run integration tests
pnpm test:it

# Run with TestContainers
mvn verify -Prun-it

# Run specific integration test
mvn test -Dtest=PasskeyFileUploaderClientTestIT
```

#### End-to-End Tests

```bash
cd packages/passkey-file-uploader

# Install Playwright browsers
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run E2E tests in headed mode
pnpm test:e2e --headed

# Run specific test file
pnpm exec playwright test upload.spec.ts
```

### Test Configuration

#### Backend Test Properties

```yaml
# src/test/resources/application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
  
app:
  file:
    storage:
      s3:
        bucket: test-bucket
        endpoint: http://localhost:4566
    processing:
      malware-scanner:
        enabled: false
```

#### Frontend Test Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
  ],
};
```

## Code Structure

### Backend Package Organization

```
packages/passkey-file-uploader-sb/service/src/main/java/
├── com/cvent/passkeyfileuploader/
│   ├── controllers/           # REST API endpoints
│   │   └── FileUploadController.java
│   ├── service/              # Business logic layer
│   │   ├── FileUploadService.java
│   │   └── MalwareScanningService.java
│   ├── dataaccess/           # Data access layer
│   │   ├── UploadRecordMapper.java
│   │   └── entities/
│   ├── config/               # Configuration classes
│   │   ├── SecurityConfig.java
│   │   └── S3Config.java
│   ├── util/                 # Utility classes
│   │   └── LogSanitizer.java
│   └── PasskeyFileUploaderApplication.java
```

### Frontend Directory Structure

```
packages/passkey-file-uploader/
├── app/                      # Next.js app directory
│   ├── (dashboard)/         # Route groups
│   ├── api/                 # API routes
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── src/
│   ├── components/          # Reusable components
│   │   ├── FileUpload/
│   │   ├── FileList/
│   │   └── common/
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API service layer
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── e2e/                     # End-to-end tests
```

## Coding Standards

### Java Code Style

#### Formatting Rules

```java
// Use 4 spaces for indentation
public class FileUploadService {
    
    // Constants in UPPER_SNAKE_CASE
    private static final int MAX_FILE_SIZE = 100 * 1024 * 1024;
    
    // Fields with descriptive names
    private final S3Client s3Client;
    private final UploadRecordMapper uploadRecordMapper;
    
    // Constructor injection preferred
    public FileUploadService(S3Client s3Client, 
                           UploadRecordMapper uploadRecordMapper) {
        this.s3Client = s3Client;
        this.uploadRecordMapper = uploadRecordMapper;
    }
    
    // Method names should be descriptive verbs
    public UploadMetadata uploadFile(MultipartFile file, FileMetadata metadata) {
        // Implementation
    }
}
```

#### Documentation Standards

```java
/**
 * Service for handling file upload operations.
 * 
 * <p>This service provides functionality for:
 * <ul>
 *   <li>Uploading files to S3 storage</li>
 *   <li>Managing file metadata</li>
 *   <li>Coordinating malware scanning</li>
 * </ul>
 * 
 * @author Steakholders Team
 * @since 1.0.0
 */
@Service
public class FileUploadService {
    
    /**
     * Uploads a file with associated metadata.
     * 
     * @param file the multipart file to upload
     * @param metadata the file metadata containing application context
     * @return upload metadata with generated ID and status
     * @throws FileTooLargeException if file exceeds size limit
     * @throws MalwareDetectedException if file contains malware
     */
    public UploadMetadata uploadFile(MultipartFile file, FileMetadata metadata) {
        // Implementation
    }
}
```

### TypeScript Code Style

#### Formatting Rules

```typescript
// Use 2 spaces for indentation
export interface FileUploadProps {
  maxFileSize: number;
  allowedTypes: string[];
  onUploadComplete: (metadata: UploadMetadata) => void;
  onUploadError: (error: Error) => void;
}

// Use PascalCase for components
export const FileUploadComponent: React.FC<FileUploadProps> = ({
  maxFileSize,
  allowedTypes,
  onUploadComplete,
  onUploadError,
}) => {
  // Use camelCase for variables and functions
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const handleFileUpload = useCallback(async (file: File) => {
    // Implementation
  }, [onUploadComplete, onUploadError]);
  
  return (
    <div className="file-upload-container">
      {/* JSX content */}
    </div>
  );
};
```

#### Type Definitions

```typescript
// Define interfaces for all data structures
export interface UploadMetadata {
  id: string;
  originalName: string;
  contentType: string;
  fileSize: number;
  status: UploadStatus;
  application?: string;
  type?: string;
}

// Use enums for constants
export enum UploadStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  ERROR = 'ERROR',
}

// Use generic types where appropriate
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

### Code Quality Tools

#### ESLint Configuration

```json
{
  "extends": ["@cvent/eslint-config"],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

#### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### Checkstyle (Java)

```xml
<module name="Checker">
  <module name="TreeWalker">
    <module name="Indentation">
      <property name="basicOffset" value="4"/>
    </module>
    <module name="LineLength">
      <property name="max" value="120"/>
    </module>
    <module name="MethodName"/>
    <module name="PackageName"/>
    <module name="TypeName"/>
  </module>
</module>
```

## Common Tasks

### Adding a New API Endpoint

#### 1. Define the Model (if needed)

```java
// packages/passkey-file-uploader-sb/model/src/main/java/com/cvent/passkeyfileuploader/model/
@Value.Immutable
@JsonSerialize
@JsonDeserialize(as = ImmutableNewModel.class)
@CventApiStyleV2
public interface NewModel {
    String getId();
    String getName();
}
```

#### 2. Add Service Method

```java
// packages/passkey-file-uploader-sb/service/src/main/java/com/cvent/passkeyfileuploader/service/
@Service
public class FileUploadService {
    
    public NewModel createNewResource(CreateRequest request) {
        // Validate input
        validateRequest(request);
        
        // Business logic
        NewModel result = processRequest(request);
        
        // Persist changes
        saveResult(result);
        
        return result;
    }
}
```

#### 3. Add Controller Endpoint

```java
// packages/passkey-file-uploader-sb/service/src/main/java/com/cvent/passkeyfileuploader/controllers/
@RestController
@RequestMapping("/passkey-file-uploader/v1")
public class FileUploadController {
    
    @PostMapping("/new-resource")
    @CventAuthorization(scopes = {"FILE_UPLOAD"})
    public ResponseEntity<NewModel> createNewResource(
            @RequestBody @Valid CreateRequest request) {
        
        LOG.info("Creating new resource: {}", sanitize(request.getName()));
        NewModel result = uploadService.createNewResource(request);
        return ResponseEntity.ok(result);
    }
}
```

#### 4. Add Tests

```java
// Unit test
@ExtendWith(MockitoExtension.class)
class FileUploadServiceTest {
    
    @Test
    void shouldCreateNewResource() {
        // Given
        CreateRequest request = ImmutableCreateRequest.builder()
            .name("test-resource")
            .build();
        
        // When
        NewModel result = service.createNewResource(request);
        
        // Then
        assertThat(result.getName()).isEqualTo("test-resource");
    }
}

// Integration test
@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class FileUploadControllerIT {
    
    @Test
    void shouldCreateNewResourceViaAPI() throws Exception {
        mockMvc.perform(post("/passkey-file-uploader/v1/new-resource")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("test-resource"));
    }
}
```

### Adding a New Frontend Component

#### 1. Create Component File

```typescript
// packages/passkey-file-uploader/src/components/NewComponent/NewComponent.tsx
import React from 'react';
import { Button } from '@cvent/carina';

interface NewComponentProps {
  title: string;
  onAction: () => void;
}

export const NewComponent: React.FC<NewComponentProps> = ({
  title,
  onAction,
}) => {
  return (
    <div className="new-component">
      <h2>{title}</h2>
      <Button onClick={onAction}>
        Perform Action
      </Button>
    </div>
  );
};
```

#### 2. Add Component Tests

```typescript
// packages/passkey-file-uploader/src/components/NewComponent/NewComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NewComponent } from './NewComponent';

describe('NewComponent', () => {
  it('should render title', () => {
    render(
      <NewComponent 
        title="Test Title" 
        onAction={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
  
  it('should call onAction when button clicked', () => {
    const mockOnAction = jest.fn();
    
    render(
      <NewComponent 
        title="Test Title" 
        onAction={mockOnAction} 
      />
    );
    
    fireEvent.click(screen.getByText('Perform Action'));
    expect(mockOnAction).toHaveBeenCalled();
  });
});
```

#### 3. Export Component

```typescript
// packages/passkey-file-uploader/src/components/NewComponent/index.ts
export { NewComponent } from './NewComponent';
export type { NewComponentProps } from './NewComponent';
```

### Database Schema Changes

#### 1. Create Migration File

```sql
-- packages/passkey-file-uploader-sb/service/src/main/resources/db/migration/V5__Add_new_table.sql
CREATE TABLE new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_new_table_name ON new_table(name);
```

#### 2. Update Entity Classes

```java
// packages/passkey-file-uploader-sb/service/src/main/java/com/cvent/passkeyfileuploader/dataaccess/entities/
@Entity
@Table(name = "new_table")
public class NewTableEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "description")
    private String description;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    // Getters and setters
}
```

#### 3. Run Migration

```bash
cd packages/passkey-file-uploader-sb/service

# Run migration
mvn flyway:migrate

# Verify migration
mvn flyway:info
```

## Troubleshooting

### Common Issues

#### LocalStack Connection Issues

```bash
# Check LocalStack status
curl http://localhost:4566/health

# Restart LocalStack
docker restart localstack_main

# Check LocalStack logs
docker logs localstack_main
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
docker ps | grep postgres

# Connect to database directly
psql -h localhost -U dev_user -d passkey_file_uploader_dev

# Check database logs
docker logs passkey-file-uploader-db
```

#### Build Issues

```bash
# Clean and rebuild backend
cd packages/passkey-file-uploader-sb/service
mvn clean install

# Clean and rebuild frontend
cd packages/passkey-file-uploader
rm -rf node_modules .next
pnpm install
pnpm build
```

### Debugging

#### Backend Debugging

```bash
# Run with debug mode
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"

# Connect debugger to port 5005 in IntelliJ
```

#### Frontend Debugging

```bash
# Run with debug mode
NODE_OPTIONS='--inspect' pnpm dev

# Open Chrome DevTools
# Navigate to chrome://inspect
```

### Performance Profiling

#### Backend Profiling

```bash
# Run with JProfiler
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-javaagent:/path/to/jprofiler/bin/agent.jar=port=8849"

# Run with async-profiler
java -jar async-profiler.jar -e cpu -d 30 -f profile.html <pid>
```

#### Frontend Profiling

```bash
# Build with bundle analyzer
ANALYZE=true pnpm build

# Run Lighthouse audit
pnpm exec lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

## Support Channels

### Team Communication

- **Slack Channel**: `#passkey-steakholders` - Primary team communication
- **API Discussions**: `#passkey-api` - API-related discussions and support
- **Alerts**: `#passkey-steakholders-alerts` - Automated alerts and notifications

### Documentation

- **Backstage**: [Service Catalog](https://backstage.core.cvent.org/catalog/default/component/passkey-file-uploader)
- **API Docs**: [Swagger UI](https://passkey-file-uploader-sb.dev.cvent.org/swagger-ui.html)
- **Confluence**: [Team Wiki](https://cvent.atlassian.net/wiki/spaces/PASSKEY)

### Getting Help

1. **Check Documentation**: Review this guide and API documentation
2. **Search Slack History**: Look for similar issues in team channels
3. **Ask Team Members**: Reach out in `#passkey-steakholders`
4. **Create Issue**: File a GitHub issue for bugs or feature requests
5. **Escalate**: Contact team lead for urgent issues

## Additional Resources

## Quick Start


### Prerequisites
- Node.js 18+
- Java 17+
- Maven 3.8+
- Docker
- LocalStack (for local development)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-file-uploader.git
   cd passkey-file-uploader
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start LocalStack infrastructure**:
   ```bash
   pnpm --prefix packages/passkey-file-uploader-sb/infra dev:start:infra
   ```

4. **Run the backend service**:
   ```bash
   cd packages/passkey-file-uploader-sb/service
   pnpm dev
   ```

5. **Run the frontend application**:
   ```bash
   cd packages/passkey-file-uploader
   pnpm dev
   ```

### Running Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:it

# End-to-end tests
pnpm test:e2e
```

## Support


- **Team**: Steakholders
- **Slack Channels**: 
  - `#passkey-api` - General API discussions
  - `#passkey-steakholders-alerts` - Team alerts and notifications
- **Backstage**: [Service Catalog](https://backstage.core.cvent.org/catalog/default/component/passkey-file-uploader)
- **Jenkins**: [CI/CD Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(none)/job/passkey-file-uploader)

# Development Guide

## Prerequisites

### Required Software

- **Java 17**: OpenJDK or Oracle JDK
- **Node.js 18+**: For TypeScript/Next.js development
- **pnpm 8+**: Package manager for Node.js dependencies
- **Maven 3.8+**: Java build tool
- **Docker**: For containerization and local services
- **Git**: Version control
- **ASDF** (recommended): Version manager for multiple runtimes

### Development Tools

- **IntelliJ IDEA**: Recommended IDE for Java development
- **VS Code**: Recommended for TypeScript/frontend development
- **WildFly 26.1.3**: Application server for local development
- **Oracle Database**: Local or containerized instance

### ASDF Setup (Recommended)

```bash
# Install ASDF
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.13.1

# Add to shell profile
echo '. ~/.asdf/asdf.sh' >> ~/.bashrc
echo '. ~/.asdf/completions/asdf.bash' >> ~/.bashrc

# Install plugins
asdf plugin add java
asdf plugin add nodejs
asdf plugin add maven

# Install versions (from .tool-versions file)
asdf install
```

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/cvent-internal/passkey-rlm.git
cd passkey-rlm
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Verify Java and Maven installation
java --version
mvn --version
```

### 3. WildFly Setup

Run the setup script to download and configure WildFly:

```bash
scripts/setup.sh
```

This script will:
- Download WildFly 26.1.3.Final
- Extract to `wildfly/` directory
- Configure management user (admin/admin)
- Set up development configuration
- Install Oracle JDBC driver

### 4. Database Setup

#### Option A: Local Oracle Database

```bash
# Using Docker
docker run -d \
  --name oracle-rlm \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=password \
  -e ORACLE_DATABASE=ORCL \
  container-registry.oracle.com/database/express:21.3.0-xe

# Wait for database to start
docker logs -f oracle-rlm
```

#### Option B: Connect to Shared Development Database

Update `wildfly/standalone/configuration/passkey-standalone-full-dev.xml`:

```xml
<datasource jndi-name="java:jboss/datasources/RLMDataSource" pool-name="RLMDataSource">
    <connection-url>jdbc:oracle:thin:@dev-shared-db:1521:ORCL</connection-url>
    <driver>oracle</driver>
    <security>
        <user-name>rlm_dev</user-name>
        <password>dev_password</password>
    </security>
</datasource>
```

### 5. Network Configuration

#### Port Forwarding (macOS)

Create port forwarding rules to use standard HTTP/HTTPS ports:

```bash
# Create pfctl rules file
sudo tee /etc/pf.anchors/wildfly << EOF
rdr pass inet proto tcp from any to any port 80 -> 127.0.0.1 port 8080
rdr pass on lo0 inet proto tcp from any to any port 80 -> 127.0.0.1 port 8080
rdr pass inet proto tcp from any to any port 443 -> 127.0.0.1 port 8443
rdr pass on lo0 inet proto tcp from any to any port 443 -> 127.0.0.1 port 8443
EOF

# Apply rules
sudo pfctl -evf /etc/pf.anchors/wildfly
```

#### Hosts File

Add entry to `/etc/hosts`:

```bash
echo "127.0.0.1 dev-rlm.passkey.com" | sudo tee -a /etc/hosts
```

### 6. SSL Certificate

Accept the self-signed certificate in Chrome by typing `thisisunsafe` when the security warning appears.

## Running the Application

### 1. Start WildFly

#### Command Line
```bash
cd wildfly
./bin/standalone.sh -c passkey-standalone-full-dev.xml
```

#### IntelliJ IDEA Setup

1. **Add JBoss Server Configuration**:
   - Run → Edit Configurations → Add New → JBoss Server → Local
   - Point to your `wildfly/` directory

2. **Server Configuration**:
   - **JRE**: Java 17
   - **Startup Script**: Add `-c passkey-standalone-full-dev.xml` to VM options
   - **Debug Script**: Add `-c passkey-standalone-full-dev.xml` to VM options

3. **Logs Configuration** (optional):
   - Add `wildfly/standalone/log/server.log` to console logs

### 2. Build and Deploy

```bash
# Build the application
scripts/deploy.sh
```

This script will:
- Build all Maven modules
- Package the EAR file
- Deploy to WildFly
- Build the Next.js frontend

### 3. Access the Application

- **Main Application**: https://dev-rlm.passkey.com
- **Development Login**: https://dev-rlm.passkey.com/devLogin.jsp
- **WildFly Admin Console**: http://localhost:9990 (admin/admin)

## Development Workflow

### Frontend Development

#### Next.js Development Server

```bash
# Navigate to web module
cd packages/app/web

# Start development server
pnpm dev
```

The Next.js dev server will run on port 3000 with hot reloading enabled.

#### Building Frontend Assets

```bash
# Build for production
pnpm build

# Build and watch for changes
pnpm build:watch
```

### Backend Development

#### Hot Deployment

WildFly supports hot deployment for most changes:

```bash
# Redeploy after Java changes
mvn clean package -pl packages/app/ear -am
cp packages/app/ear/target/rlm-all.ear wildfly/standalone/deployments/
```

#### EJB Development

```java
@Stateless
@LocalBean
public class RoomListProcessingService {
    
    @Inject
    private Logger logger;
    
    @Inject
    private EntityManager em;
    
    public ProcessingResult processRoomList(String uploadId) {
        logger.info("Processing room list: {}", uploadId);
        // Implementation
    }
}
```

#### REST Endpoint Development

```java
@Path("/api/v1/uploads")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UploadResource {
    
    @Inject
    private RoomListProcessingService processingService;
    
    @POST
    @Path("/{uploadId}/process")
    public Response processUpload(@PathParam("uploadId") String uploadId) {
        ProcessingResult result = processingService.processRoomList(uploadId);
        return Response.ok(result).build();
    }
}
```

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm test

# Run Java tests only
mvn test

# Run TypeScript tests only
pnpm test:frontend

# Run tests with coverage
pnpm test:coverage
```

### Integration Tests

```bash
# Run integration tests against local environment
pnpm test:integration

# Run specific test suite
pnpm test:integration --testNamePattern="File Upload"
```

### End-to-End Tests

```bash
# Start application first
scripts/deploy.sh

# Run E2E tests
pnpm test:e2e

# Run E2E tests in headed mode
pnpm test:e2e:headed
```

## Code Structure

### Java Package Organization

```
com.lanyon.group.rlm/
├── core/
│   ├── domain/          # Domain entities
│   ├── dto/             # Data transfer objects
│   ├── exception/       # Custom exceptions
│   └── util/            # Utility classes
├── ejb/
│   ├── service/         # Business services
│   ├── repository/      # Data access layer
│   └── integration/     # External service clients
└── web/
    ├── resource/        # JAX-RS endpoints
    ├── servlet/         # Servlets for file upload
    └── filter/          # Security and logging filters
```

### TypeScript Project Structure

```
packages/app/web/src/main/webapp/
├── components/          # Reusable React components
├── pages/              # Next.js pages
├── hooks/              # Custom React hooks
├── services/           # API client services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # CSS modules and global styles
```

## Coding Standards

### Java Conventions

- **Formatting**: Use IntelliJ default Java formatting
- **Naming**: PascalCase for classes, camelCase for methods/variables
- **Documentation**: JavaDoc for public APIs
- **Logging**: Use SLF4J with structured logging

```java
@Stateless
public class FileProcessingService {
    
    private static final Logger logger = LoggerFactory.getLogger(FileProcessingService.class);
    
    /**
     * Processes an uploaded file and creates reservations.
     *
     * @param uploadId the unique upload identifier
     * @return processing result with success/error counts
     * @throws ProcessingException if processing fails
     */
    public ProcessingResult processFile(String uploadId) throws ProcessingException {
        logger.info("Starting file processing for upload: {}", uploadId);
        
        try {
            // Implementation
            logger.info("File processing completed successfully for upload: {}", uploadId);
            return result;
        } catch (Exception e) {
            logger.error("File processing failed for upload: {}", uploadId, e);
            throw new ProcessingException("Processing failed", e);
        }
    }
}
```

### TypeScript Conventions

- **Formatting**: Use Prettier with project configuration
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Types**: Explicit typing, avoid `any`
- **Components**: Functional components with hooks

```typescript
interface UploadStatusProps {
  uploadId: string;
  onStatusChange?: (status: UploadStatus) => void;
}

export const UploadStatus: React.FC<UploadStatusProps> = ({ 
  uploadId, 
  onStatusChange 
}) => {
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await uploadService.getStatus(uploadId);
        setStatus(response.data);
        onStatusChange?.(response.data);
      } catch (error) {
        console.error('Failed to fetch upload status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, [uploadId, onStatusChange]);
  
  if (loading) return <LoadingSpinner />;
  if (!status) return <ErrorMessage message="Failed to load status" />;
  
  return (
    <div className={styles.statusContainer}>
      <StatusIndicator status={status.status} />
      <ProgressBar 
        current={status.processedRows} 
        total={status.totalRows} 
      />
    </div>
  );
};
```

## Common Development Tasks

### Adding a New REST Endpoint

1. **Create the resource class**:
```java
@Path("/api/v1/events")
@Produces(MediaType.APPLICATION_JSON)
public class EventResource {
    
    @GET
    @Path("/{eventId}")
    public Response getEvent(@PathParam("eventId") String eventId) {
        // Implementation
    }
}
```

2. **Register in web.xml** (if needed):
```xml
<servlet>
    <servlet-name>JAX-RS</servlet-name>
    <servlet-class>org.glassfish.jersey.servlet.ServletContainer</servlet-class>
    <init-param>
        <param-name>jersey.config.server.provider.packages</param-name>
        <param-value>com.lanyon.group.rlm.web.resource</param-value>
    </init-param>
</servlet>
```

3. **Add TypeScript client**:
```typescript
export class EventService {
  async getEvent(eventId: string): Promise<Event> {
    const response = await fetch(`/api/v1/events/${eventId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch event');
    }
    return response.json();
  }
}
```

### Adding a New Database Entity

1. **Create JPA entity**:
```java
@Entity
@Table(name = "room_types")
public class RoomType {
    
    @Id
    @Column(name = "room_type_code")
    private String code;
    
    @Column(name = "room_type_name")
    private String name;
    
    @Column(name = "max_occupancy")
    private Integer maxOccupancy;
    
    // Constructors, getters, setters
}
```

2. **Create repository**:
```java
@Stateless
public class RoomTypeRepository {
    
    @PersistenceContext
    private EntityManager em;
    
    public List<RoomType> findByEventId(String eventId) {
        return em.createQuery(
            "SELECT rt FROM RoomType rt WHERE rt.eventId = :eventId", 
            RoomType.class)
            .setParameter("eventId", eventId)
            .getResultList();
    }
}
```

3. **Add database migration**:
```sql
-- V1.5__Add_room_types_table.sql
CREATE TABLE room_types (
    room_type_code VARCHAR2(20) PRIMARY KEY,
    room_type_name VARCHAR2(100) NOT NULL,
    max_occupancy NUMBER(2) NOT NULL,
    event_id VARCHAR2(50) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_room_types_event_id ON room_types(event_id);
```

### Adding Frontend Components

1. **Create component**:
```typescript
// components/RoomTypeSelector.tsx
interface RoomTypeSelectorProps {
  eventId: string;
  selectedRoomType?: string;
  onRoomTypeChange: (roomType: string) => void;
}

export const RoomTypeSelector: React.FC<RoomTypeSelectorProps> = ({
  eventId,
  selectedRoomType,
  onRoomTypeChange
}) => {
  // Implementation
};
```

2. **Add to page**:
```typescript
// pages/upload.tsx
import { RoomTypeSelector } from '../components/RoomTypeSelector';

export default function UploadPage() {
  return (
    <div>
      <RoomTypeSelector 
        eventId="12345"
        onRoomTypeChange={handleRoomTypeChange}
      />
    </div>
  );
}
```

## Debugging

### Java Debugging

1. **IntelliJ Remote Debugging**:
   - Add remote JVM debug configuration
   - Host: localhost, Port: 8787
   - Start WildFly with debug options

2. **Log Configuration**:
```xml
<!-- log4j2.xml -->
<Logger name="com.lanyon.group.rlm" level="DEBUG"/>
<Logger name="org.hibernate.SQL" level="DEBUG"/>
```

### Frontend Debugging

1. **Browser DevTools**: Use React Developer Tools extension
2. **VS Code Debugging**: Configure launch.json for Next.js debugging
3. **Network Debugging**: Monitor API calls in browser Network tab

### Common Issues

#### WildFly Deployment Issues
```bash
# Check deployment status
ls -la wildfly/standalone/deployments/

# View server logs
tail -f wildfly/standalone/log/server.log

# Redeploy application
touch wildfly/standalone/deployments/rlm-all.ear.dodeploy
```

#### Database Connection Issues
```bash
# Test database connectivity
sqlplus rlm_dev/password@localhost:1521/ORCL

# Check WildFly datasource
curl http://localhost:9990/management --user admin:admin \
  -d '{"operation":"test-connection-in-pool","address":["subsystem","datasources","data-source","RLMDataSource"]}'
```

#### Frontend Build Issues
```bash
# Clear Next.js cache
rm -rf packages/app/web/.next

# Clear node_modules and reinstall
rm -rf node_modules packages/*/node_modules
pnpm install

# Check for TypeScript errors
pnpm type-check
```

## Additional Resources

## Technology Stack


- **Backend**: Java 17, WildFly 26.1.3, Jakarta EE 8
- **Frontend**: TypeScript, Next.js 12, React 18
- **Build Tools**: Maven (Java), pnpm (TypeScript), Nx (monorepo)
- **Database**: Oracle Database
- **Infrastructure**: AWS, Docker containers
- **Monitoring**: Datadog integration

## Quick Start


### Prerequisites
- Java 17
- Node.js 18+
- pnpm
- Docker
- WildFly 26.1.3

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cvent-internal/passkey-rlm.git
   cd passkey-rlm
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Setup WildFly**:
   ```bash
   scripts/setup.sh
   ```

4. **Configure port forwarding** (macOS):
   ```bash
   sudo pfctl -evf scripts/wildfly.pfanchors
   ```

5. **Add hosts entry**:
   ```bash
   echo "127.0.0.1 dev-rlm.passkey.com" | sudo tee -a /etc/hosts
   ```

6. **Deploy the application**:
   ```bash
   scripts/deploy.sh
   ```

7. **Access the application**:
   - Main app: https://dev-rlm.passkey.com
   - Dev login: https://dev-rlm.passkey.com/devLogin.jsp

## Support


- **Team**: Steakholders
- **Jenkins**: [CI Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PAS)/job/passkey-rlm)
- **Monitoring**: [Datadog Dashboard](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-rlm)
- **Wiki**: [Passkey Machine Inventory](https://wiki.cvent.com/display/RD/Passkey+Machine+Inventory)

# Development Guide

## Prerequisites

### Required Software

- **Java 17**: OpenJDK or Oracle JDK
- **Node.js 16+**: For frontend development
- **pnpm 8.x**: Package manager for Node.js dependencies
- **Maven 3.8+**: Java build tool
- **Docker**: For containerization and local services
- **ASDF**: Version manager for multiple runtime versions
- **Git**: Version control

### Development Tools

- **IntelliJ IDEA**: Recommended IDE for Java development
- **VS Code**: Alternative IDE with good TypeScript support
- **WildFly**: Application server for local development
- **PostgreSQL**: Database for local development
- **Redis**: Caching layer (optional for local development)

### ASDF Setup

Install and configure ASDF for version management:

```bash
# Install ASDF
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.11.3

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
git clone https://github.com/cvent-internal/passkey-sbd.git
cd passkey-sbd
```

### 2. Initial Setup Script

Run the setup script to configure WildFly and development environment:

```bash
./scripts/setup.sh
```

This script will:
- Download and configure WildFly
- Set up development datasources
- Configure management user (admin/admin)
- Install necessary WildFly modules

### 3. Database Setup

#### Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run -d \
  --name passkey-sbd-db \
  -e POSTGRES_DB=passkey_sbd \
  -e POSTGRES_USER=sbd_user \
  -e POSTGRES_PASSWORD=sbd_password \
  -p 5432:5432 \
  postgres:13

# Run database migrations
cd packages/app
mvn flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/passkey_sbd
```

#### Manual PostgreSQL Installation

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database and user
createdb passkey_sbd
psql -c "CREATE USER sbd_user WITH PASSWORD 'sbd_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE passkey_sbd TO sbd_user;"
```

### 4. Environment Configuration

#### Host File Configuration

Add the following to `/etc/hosts`:

```
127.0.0.1    localhost dev-rlm.passkey.com
```

#### Port Forwarding (macOS)

Create port forwarding rules for standard HTTP/HTTPS ports:

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

**Note**: These rules need to be reapplied after system restart.

### 5. Install Dependencies

#### Java Dependencies

```bash
cd packages/app
mvn clean install -DskipTests
```

#### Node.js Dependencies

```bash
# Install all workspace dependencies
pnpm install --frozen-lockfile
```

## Running the Application

### Development Mode

#### 1. Start WildFly Server

```bash
# Start WildFly with development configuration
./wildfly/bin/standalone.sh -c passkey-standalone-full-dev.xml
```

#### 2. Deploy Application

```bash
# Build and deploy the application
./scripts/deploy.sh
```

#### 3. Start Frontend Development Server (Optional)

For frontend-only development with hot reloading:

```bash
cd packages/app
pnpm dev
```

### IntelliJ IDEA Setup

#### 1. Import Project

- Open IntelliJ IDEA
- Select "Open" and choose the `passkey-sbd` directory
- Import as Maven project

#### 2. Configure JBoss/WildFly Server

1. Go to **Run/Debug Configurations**
2. Add new **JBoss Server** → **Local**
3. Configure server settings:
   - **JRE**: Java 17
   - **Server Domain**: Standalone
   - **Startup Script**: Add `-c passkey-standalone-full-dev.xml` to VM options
   - **Debug Script**: Add `-c passkey-standalone-full-dev.xml` to VM options

#### 3. Configure Deployment

1. In server configuration, go to **Deployment** tab
2. Add **Artifact** → `passkey-sbd:ear exploded`
3. Set **Application context**: `/dashboard`

#### 4. Run Configuration

- **Before launch**: Build artifacts
- **VM options**: `-Xmx2g -XX:MaxMetaspaceSize=512m`
- **Environment variables**: Set development-specific variables

## Running Tests

### Java Tests

```bash
# Run all Java tests
cd packages/app
mvn test

# Run specific test class
mvn test -Dtest=SubBlockServiceTest

# Run tests with coverage
mvn test jacoco:report
```

### Frontend Tests

```bash
# Run all frontend tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test SubBlockComponent.test.tsx
```

### Integration Tests

```bash
# Run integration tests
pnpm ci:test

# Run specific integration test suite
nx run app:ci:test --testNamePattern="SubBlock API"
```

### End-to-End Tests

```bash
# Start application and run E2E tests
pnpm e2e

# Run E2E tests against specific environment
pnpm e2e --baseUrl=https://dev-rlm.passkey.com/dashboard
```

## Code Structure

### Java Package Organization

```
packages/app/ejb/src/main/java/
├── com/cvent/passkey/sbd/
│   ├── api/                    # REST API endpoints
│   │   ├── resources/          # JAX-RS resource classes
│   │   ├── dto/               # Data transfer objects
│   │   └── validators/        # Input validation
│   ├── business/              # Business logic layer
│   │   ├── services/          # Business services
│   │   ├── processors/        # Business processors
│   │   └── rules/            # Business rules
│   ├── data/                  # Data access layer
│   │   ├── entities/          # JPA entities
│   │   ├── repositories/      # Data repositories
│   │   └── dao/              # Data access objects
│   ├── integration/           # External service integration
│   │   ├── clients/           # Service clients
│   │   ├── adapters/          # Integration adapters
│   │   └── mappers/          # Data mappers
│   ├── config/               # Configuration classes
│   ├── security/             # Security components
│   ├── utils/                # Utility classes
│   └── exceptions/           # Custom exceptions
```

### TypeScript Project Structure

```
packages/app/src/
├── components/               # React components
│   ├── common/              # Shared components
│   ├── subblocks/           # Sub-block specific components
│   ├── hotels/              # Hotel management components
│   └── reports/             # Reporting components
├── pages/                   # Next.js pages
│   ├── api/                 # API routes
│   ├── dashboard/           # Dashboard pages
│   └── admin/               # Admin pages
├── hooks/                   # Custom React hooks
├── services/                # API service layer
├── utils/                   # Utility functions
├── types/                   # TypeScript type definitions
├── styles/                  # CSS and styling
├── graphql/                 # GraphQL queries and mutations
│   ├── queries/
│   ├── mutations/
│   └── fragments/
└── __tests__/               # Test files
```

## Coding Standards

### Java Coding Standards

#### Code Style

- Follow Google Java Style Guide
- Use 4 spaces for indentation
- Maximum line length: 120 characters
- Use meaningful variable and method names

#### Annotations

```java
// Service classes
@Stateless
@LocalBean
public class SubBlockService {
    
    @Inject
    private SubBlockRepository repository;
    
    @Timed(name = "subblock.create")
    @Counted(name = "subblock.create.count")
    public SubBlock createSubBlock(SubBlockRequest request) {
        // Implementation
    }
}

// REST endpoints
@Path("/api/v1/subblocks")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SubBlockResource {
    
    @GET
    @Path("/{id}")
    public Response getSubBlock(@PathParam("id") String id) {
        // Implementation
    }
}
```

#### Error Handling

```java
// Custom exceptions
public class SubBlockNotFoundException extends BusinessException {
    public SubBlockNotFoundException(String subBlockId) {
        super("Sub-block not found: " + subBlockId);
    }
}

// Exception handling in services
public SubBlock getSubBlock(String id) {
    return repository.findById(id)
        .orElseThrow(() -> new SubBlockNotFoundException(id));
}
```

### TypeScript Coding Standards

#### Code Style

- Use ESLint with Cvent configuration
- Use Prettier for code formatting
- Prefer functional components with hooks
- Use TypeScript strict mode

#### Component Structure

```typescript
// Component definition
interface SubBlockCardProps {
  subBlock: SubBlock;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SubBlockCard: React.FC<SubBlockCardProps> = ({
  subBlock,
  onEdit,
  onDelete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleEdit = useCallback(() => {
    onEdit(subBlock.id);
  }, [subBlock.id, onEdit]);
  
  return (
    <div className="sub-block-card">
      {/* Component JSX */}
    </div>
  );
};
```

#### API Service Pattern

```typescript
// API service
export class SubBlockService {
  private client: ApolloClient<any>;
  
  constructor(client: ApolloClient<any>) {
    this.client = client;
  }
  
  async getSubBlocks(filters?: SubBlockFilters): Promise<SubBlock[]> {
    const { data } = await this.client.query({
      query: GET_SUB_BLOCKS,
      variables: { filters }
    });
    
    return data.subBlocks;
  }
  
  async createSubBlock(input: CreateSubBlockInput): Promise<SubBlock> {
    const { data } = await this.client.mutate({
      mutation: CREATE_SUB_BLOCK,
      variables: { input }
    });
    
    return data.createSubBlock;
  }
}
```

## Common Development Tasks

### Adding a New REST Endpoint

#### 1. Create DTO Classes

```java
// Request DTO
public class CreateSubBlockRequest {
    @NotNull
    @Size(min = 1, max = 255)
    private String name;
    
    @NotNull
    private String hotelId;
    
    @Min(1)
    private Integer roomCount;
    
    // Getters and setters
}

// Response DTO
public class SubBlockResponse {
    private String id;
    private String name;
    private String status;
    private LocalDateTime createdAt;
    
    // Getters and setters
}
```

#### 2. Implement Business Service

```java
@Stateless
public class SubBlockService {
    
    @Inject
    private SubBlockRepository repository;
    
    public SubBlock createSubBlock(CreateSubBlockRequest request) {
        // Validation
        validateSubBlockRequest(request);
        
        // Business logic
        SubBlock subBlock = new SubBlock();
        subBlock.setName(request.getName());
        subBlock.setHotelId(request.getHotelId());
        subBlock.setRoomCount(request.getRoomCount());
        subBlock.setStatus(SubBlockStatus.PENDING);
        
        // Save
        return repository.save(subBlock);
    }
}
```

#### 3. Create REST Resource

```java
@Path("/api/v1/subblocks")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SubBlockResource {
    
    @Inject
    private SubBlockService service;
    
    @POST
    @Valid
    public Response createSubBlock(@Valid CreateSubBlockRequest request) {
        try {
            SubBlock subBlock = service.createSubBlock(request);
            SubBlockResponse response = mapToResponse(subBlock);
            
            return Response
                .status(Response.Status.CREATED)
                .entity(response)
                .build();
                
        } catch (ValidationException e) {
            return Response
                .status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse(e.getMessage()))
                .build();
        }
    }
}
```

### Adding a New React Component

#### 1. Create Component File

```typescript
// components/subblocks/SubBlockForm.tsx
interface SubBlockFormProps {
  initialData?: Partial<SubBlock>;
  onSubmit: (data: CreateSubBlockInput) => Promise<void>;
  onCancel: () => void;
}

export const SubBlockForm: React.FC<SubBlockFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateSubBlockInput>({
    name: initialData?.name || '',
    hotelId: initialData?.hotelId || '',
    roomCount: initialData?.roomCount || 0,
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || ''
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

#### 2. Add Component Tests

```typescript
// __tests__/components/SubBlockForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubBlockForm } from '../components/subblocks/SubBlockForm';

describe('SubBlockForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders form fields correctly', () => {
    render(
      <SubBlockForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hotel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/room count/i)).toBeInTheDocument();
  });
  
  it('calls onSubmit with form data', async () => {
    render(
      <SubBlockForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );
    
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Sub-Block' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Sub-Block'
        })
      );
    });
  });
});
```

### Database Migrations

#### 1. Create Migration File

```sql
-- db/migration/V1.1__Add_sub_block_notes.sql
ALTER TABLE sub_blocks 
ADD COLUMN notes TEXT;

CREATE INDEX idx_sub_blocks_notes 
ON sub_blocks USING gin(to_tsvector('english', notes));
```

#### 2. Run Migration

```bash
cd packages/app
mvn flyway:migrate
```

### Adding GraphQL Operations

#### 1. Define GraphQL Schema

```graphql
# schema/subblock.graphql
type SubBlock {
  id: ID!
  name: String!
  hotelId: String!
  roomCount: Int!
  availableRooms: Int!
  status: SubBlockStatus!
  createdAt: DateTime!
}

input CreateSubBlockInput {
  name: String!
  hotelId: String!
  roomCount: Int!
  startDate: Date!
  endDate: Date!
}

extend type Query {
  subBlocks(filters: SubBlockFilters): [SubBlock!]!
  subBlock(id: ID!): SubBlock
}

extend type Mutation {
  createSubBlock(input: CreateSubBlockInput!): SubBlock!
}
```

#### 2. Generate TypeScript Types

```bash
pnpm graphql:codegen
```

#### 3. Use in Components

```typescript
import { useQuery, useMutation } from '@apollo/client';
import { GET_SUB_BLOCKS, CREATE_SUB_BLOCK } from '../graphql/queries';

export const SubBlockList: React.FC = () => {
  const { data, loading, error } = useQuery(GET_SUB_BLOCKS);
  const [createSubBlock] = useMutation(CREATE_SUB_BLOCK);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data.subBlocks.map(subBlock => (
        <SubBlockCard key={subBlock.id} subBlock={subBlock} />
      ))}
    </div>
  );
};
```

## Debugging

### Java Debugging

#### IntelliJ IDEA Debug Configuration

1. Set breakpoints in Java code
2. Start WildFly in debug mode from IntelliJ
3. Deploy application
4. Debug requests will pause at breakpoints

#### Remote Debugging

```bash
# Start WildFly with debug options
./wildfly/bin/standalone.sh \
  -c passkey-standalone-full-dev.xml \
  --debug 8787
```

### Frontend Debugging

#### Browser DevTools

- Use React Developer Tools extension
- Set breakpoints in browser Sources tab
- Use console.log for debugging

#### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/app/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/packages/app",
      "runtimeArgs": ["--inspect"],
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    }
  ]
}
```

### Database Debugging

#### Query Logging

Enable SQL logging in WildFly:

```xml
<!-- standalone-full-dev.xml -->
<logger category="org.hibernate.SQL">
    <level name="DEBUG"/>
</logger>
<logger category="org.hibernate.type.descriptor.sql.BasicBinder">
    <level name="TRACE"/>
</logger>
```

#### Database Console

```bash
# Connect to local database
psql -h localhost -U sbd_user -d passkey_sbd

# Common debugging queries
SELECT * FROM sub_blocks WHERE status = 'ACTIVE';
SELECT COUNT(*) FROM reservations WHERE sub_block_id = 'sb-123';
```

## Additional Resources

## Quick Start


### Prerequisites
- Java 17
- Node.js 16+
- WildFly Application Server
- ASDF for version management

### Local Development Setup

1. **Initial Setup**:
   ```bash
   scripts/setup.sh
   ```

2. **Port Forwarding** (macOS):
   ```bash
   sudo pfctl -evf scripts/wildfly.pfanchors
   ```

3. **Host Configuration**:
   Add to `/etc/hosts`:
   ```
   127.0.0.1    localhost dev-rlm.passkey.com
   ```

4. **Deploy Application**:
   ```bash
   scripts/deploy.sh
   ```

5. **Access Dashboard**:
   Navigate to: https://dev-rlm.passkey.com/dashboard

## Links


- [Jenkins Pipeline](https://ci-jenkins.core.cvent.org/job/cvent-internal%20(PAS)/job/passkey-sbd/)
- [Admin Portal](https://admin.core.cvent.org/serviceid/81f7ec0d-c69c-47aa-886e-053f7791ed10)
- [Datadog Monitoring](https://cvent.datadoghq.com/services?env=pr50&selectedService=passkey-subblock-dashboard)
- [Wiki Documentation](https://wiki.cvent.com/display/RD/Passkey+Machine+Inventory)

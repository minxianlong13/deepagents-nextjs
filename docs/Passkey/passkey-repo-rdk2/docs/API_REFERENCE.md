# API Reference

## Base URL
`http://localhost:3000` (local) / `https://{env}-manage.passkey.com` (deployed)

## GraphQL API

### Endpoint
`POST /api/graphql`

**Authentication**: Bearer token via `cvent-auth` cookie (obtained from auth-service)

### Schema Structure
```
src/graphql/
├── schema/         # GraphQL type definitions and resolvers
│   ├── types.ts    # Generated TypeScript types (via codegen)
│   └── *.ts        # Schema definition files
├── operations/     # Client-side queries and mutations
│   └── operations.ts  # Generated typed document nodes
├── fragments/      # Reusable GraphQL fragments
├── cache/          # Apollo cache policies
└── internal-enums/ # Internal enum mappings (EventSortBy, EventRequestSortBy)
```

### Key Query Domains
Based on data sources and resolvers:

| Domain | Operations | Backend Service |
|---|---|---|
| Events | List, get, create, update, search, sort | passkey-event, passkey-create-event |
| Event Hotels | List hotels for event, associate/disassociate | passkey-hotel |
| Hotels | Get hotel profile, search, images | passkey-hotel |
| Reservations | Search participants, get reservation | passkey-reservation |
| Sub-Block Groups | CRUD operations, room night management | passkey-subblock-group-data |
| Notifications | List, get, update templates | passkey-notifications |
| Inventory | Room inventory queries | passkey-inventory |
| Permissions | Check user permissions | passkey-permission |
| Users | User management, session info | passkey-user-service |
| Planners | Planner portal data | passkey-planners |
| Ledger | Financial ledger operations | passkey-ledger-service |
| Reports | Report generation and retrieval | passkey-reporting |
| Room Categories | Room type data | passkey-room-type-data |
| Feature Flags | LaunchDarkly flag evaluation | LaunchDarkly |
| Smart Room Assistant | AI-powered room suggestions | passkey-smart-room-assistant |
| SmartCamp Config | SmartCamp configuration data | passkey-smartcamp-cfg-data |
| Housing Library | Housing library management | passkey-housing-library |
| Autoblock | Autoblock data and provisioning | passkey-autoblock-data |
| Business Text | Customizable business labels | passkey-business-text |
| Registration Links | Reg link management | passkey-reglink |
| Transfer Logs | Transfer log queries | passkey-transfer-log-service |

### Code Generation
GraphQL types are auto-generated via `codegen.yml`:
- Schema source: `src/graphql/schema/!(types).{ts,js,graphql}`
- Documents: `src/**/*.{ts,tsx,graphql}`
- Output: `src/graphql/schema/types.ts` (server types) and `src/graphql/operations/operations.ts` (client operations)

Run codegen: `pnpm codegen` (from packages/app)

## Next.js API Routes
Located in `src/pages/api/`:
- `POST /api/graphql` — Main GraphQL endpoint (Apollo Server)

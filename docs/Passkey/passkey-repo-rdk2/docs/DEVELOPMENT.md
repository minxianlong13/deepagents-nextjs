# Development Guide

## Prerequisites
- Node.js (managed via asdf — run `asdf install`)
- pnpm (enforced via `preinstall` script)
- Redis (`brew install redis`)
- Docker (for container builds)

## Local Setup
```bash
# 1. Install tools
asdf install

# 2. Start Redis
redis-server

# 3. Install dependencies (from packages/app)
cd packages/app
pnpm install

# 4. Build
pnpm build

# 5. Start dev server
pnpm dev          # http://localhost:3000
pnpm dev:debug    # Debug mode
```

### Optional: Run against local Resdesk
1. Create `packages/app/.env.hogan.local` with:
   ```
   LOGIN_URL=passkey-resdesk-dev.core.cvent.org
   DEV_LOGIN=false
   ```
2. Add to `/etc/hosts`: `127.0.0.1 localhost passkey-resdesk2-dev.core.cvent.org`
3. Start Resdesk (disable session cookie security in `web.xml`)
4. Run `pnpm dev:local` and access `http://passkey-resdesk2-dev.core.cvent.org:3000/login`

## Running Tests
```bash
# Unit tests (from packages/app)
pnpm test
pnpm test -- -u          # Update snapshots
pnpm jest test -u         # Update + remove obsolete snapshots

# Integration tests
cd packages/it
pnpm test:it              # Against local server (start pnpm dev first)

# Integration tests against other environments
# Edit jest.config.js: set envOverride to Envs.TS50 or Envs.ALPHA
pnpm test:it
```

## Code Structure
```
packages/app/src/
├── pages/              # Next.js routes (each file = a route)
│   ├── index.tsx       # Home page (event list)
│   ├── login.tsx       # Login page
│   ├── logout.tsx      # Logout
│   ├── reports.tsx     # Reports page
│   ├── navigateToReportArticle.tsx
│   ├── event/          # Event detail pages
│   ├── manage/         # Management pages
│   ├── request-queue/  # Request queue pages
│   └── reservations/   # Reservation pages
├── components/         # React components
│   ├── homepage/       # Home page components
│   ├── event-hotel/    # Event hotel components
│   ├── eventOverview/  # Event overview
│   ├── hotel/          # Hotel components
│   ├── subBlockGroup/  # Sub-block group components
│   ├── roomCategories/ # Room category components
│   ├── notifications/  # Notification components
│   ├── block-requests/ # Block request components
│   ├── request-queue/  # Request queue components
│   ├── guaranteeRules/ # Guarantee rules
│   ├── templateEditor/ # Template editor
│   ├── sideNav/        # Side navigation
│   ├── topNavMenu/     # Top navigation menu
│   ├── navigation/     # Navigation components
│   ├── common/         # Shared components
│   ├── userSession/    # User session management
│   └── unsavedChangesConfirmation/
├── graphql/            # GraphQL layer
├── resolvers/          # Server-side GraphQL resolvers
├── data-sources/       # REST API clients (~35 files)
└── hooks/              # Custom React hooks
```

## GraphQL Codegen
```bash
cd packages/app
pnpm codegen
```
Generates `src/graphql/schema/types.ts` and `src/graphql/operations/operations.ts` from schema files.

## Helpful Commands
| Command | Description |
|---|---|
| `pnpm build` | Build docker image |
| `pnpm clean` | Clear output directories |
| `pnpm clean:deep` | Clear outputs + node_modules |
| `pnpm dev` | Run locally |
| `pnpm test` | Run tests |
| `pnpm -w changeset` | Generate changeset file |
| `pnpm nx graph` | View dependency graph |
| `pnpm nx -- run-docker -e dev` | Run docker image |

## Coding Standards
- ESLint with Airbnb config + Cvent ESLint config
- Prettier with `@cvent/prettier-config`
- TypeScript strict mode
- Protected pages must use `getAuthPropsOrRedirect` in `getServerSideProps`

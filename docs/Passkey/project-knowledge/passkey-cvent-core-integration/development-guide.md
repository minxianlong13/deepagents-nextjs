---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: development-guide
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [development, setup, local, env-vars, conventions, how-to]
---

# Development Guide

Path convention: `src/...` is relative to `packages/housing/app/`.

## Prerequisites

**Verified** (`mise.toml`, root `package.json`): Node 22.19.0, pnpm (mise pins 10.32.1;
`packageManager` says 10.8.0), access to Cvent's internal npm registry for `@cvent/*` packages
(Inferred: the packages are private, Confidence: High). `preinstall` enforces pnpm
(`npx only-allow pnpm`).

## Local setup

1. `pnpm install` at the root.
2. Create `packages/housing/app/.env.local` from `.example.env.local`, and refer to
   `.env.template` for the full list of variable names. Ask the team for values; **never commit
   them**.
3. Set `DEV_LOGIN=true` to enable the dev login page (`src/app/login/page.tsx`,
   `src/middleware.ts:121`).
4. `pnpm --filter @cvent/housing dev` (runs `nx dev | pino-pretty`), open
   `http://localhost:3000/login`, sign in, then go to `/events/housing?evtstub=<Cvent event UUID>`
   (root `README.md`, "Local Development").
5. For the `housing.app.dev.cvent.com` host (required because `cvent.com` sends HSTS), follow
   `packages/housing/app/README.md`: mkcert, `/etc/hosts`, `./scripts/setup-local-https.sh`, then
   `pnpm dev:https`.

Without `evtstub`, dev mode redirects to `/error` (production redirects to the planner event
selection page).

### Environment variable names

From `packages/housing/app/.env.template` and `.example.env.local` (names only):

| Group | Variables |
|---|---|
| Auth / platform | `AUTH_SERVICE`, `LOGIN_URL`, `DEV_LOGIN`, `API_KEY`, `CORE_PLANNER_BASE_URL` |
| Passkey services | `PASSKEY_AUTHENTICATION_SERVICE_URL`, `PASSKEY_EVENT_SERVICE_URL`, `PASSKEY_REPORTING_SERVICE_URL`, `PASSKEY_HOTEL_SERVICE_URL`, `PASSKEY_INTEGRATION_SERVICE_URL`, `PASSKEY_INVENTORY_SERVICE_URL`, `PASSKEY_EVENT_HOUSING_SERVICE_URL`, `PASSKEY_ROOM_TYPE_DATA_SERVICE_URL`, `PASSKEY_MANAGE_PRODUCT_ID` |
| Cvent core services | `CVENT_EVENT_API_URL`, `CVENT_USER_API_URL`, `CVENT_EVENT_DATA_SERVICE_URL`, `IMS_SERVICE_URL`, `IMS_ENVIRONMENT` (defaults to `T2`), `MY_CVENT_SERVICE_URL` |
| Planner navigation | `GLOBAL_NAV_SERVICE_URL`, `PLATFORM_NAV_SERVICE_URL`, `PRODUCT_NAV_SERVICE_URL`, `PLANNER_NAVIGATION_NEXT_GA_DATE`, `EVENT_NAVIGATION_URL`, `PLANNER_RECENT_ITEMS_URL`, `PLANNER_EVENTS_UI_URL` |
| Analytics / logging | `CVENT_ANALYTICS_SERVICE`, `DATA_PLATFORM_WRITE_KEY`, `DATA_PLATFORM_URL`, `LOG_LEVEL`, `BUSINESS_UNIT`, `PRODUCT`, `PLATFORM`, `COMPONENT` |
| Maps / flags | `GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_MAP_ID`, `LAUNCHDARKLY_PROJECT_SDK_KEY`, `LAUNCHDARKLY_SHARED_SDK_KEY` |

## Commands

| Command | Where | Does |
|---|---|---|
| `pnpm dev` / `dev:https` | app | Dev server (HTTP / HTTPS) |
| `pnpm dev:prod` | app | `nx build && pnpm start` |
| `pnpm build`, `test`, `lint`, `fix` | app | Nx targets |
| `pnpm test`, `lint`, `verify` | root | `nx affected` across packages |
| `pnpm changeset` | root | Add a Changesets entry for a release |
| `tsc --noEmit` | app | Confirm module aliases resolve (repo rule) |

## Conventions for adding code

Condensed from `CLAUDE.md` (authoritative) and the `viewmodel-contract` /
`passkey-bff-shared-contracts` skills. See [architecture.md](architecture.md) for the reasons.

### Adding an upstream call

1. Add or extend the schema in `src/types/upstream/<service>.ts`, keeping the file's service
   header current. No `.transform()`, no invented fields.
2. Add a fetcher in `src/data/<service>/`: start with `import 'server-only'`, use the service's
   `JsonClient` from `@lib/upstream-client`, `encodeURIComponent()` path segments (but not
   `URLSearchParams` values), `.parse()` the response, and translate errors with
   `toServiceError` (pass `{ alsoClamp: [StatusCodes.NOT_FOUND] }` for search/collection
   endpoints whose contract has no 404; `src/lib/upstream-client.ts:80`).
3. Pick the token with `requireIdentity(fields, { accessToken })`: `'server'` for Passkey
   services, `'cookie'` for core-event / User API / my-cvent, `'decoratedServer'` only for
   event-data. Use the raw `API_KEY` only for IMS, passkey-authentication, passkey-reporting.
4. Add valid and invalid fixture tests.

### Adding a read the client fetches

Add a `GET` route under `src/app/api/`: check `isLoggedIn` → `safeParse` params → guard
(`checkLinkedPasskeyEventAccess(evtstub, eventId)` for linked-event data) → data module →
`handleRouteError`. If only the page needs it, read it in the RSC section instead and add no route.

### Adding a mutation

Add a server action to `src/app/events/housing/actions.ts`: session → `safeParse` every
argument (schemas in `@lib/`, since a `'use server'` file may only export async functions) →
guards (`checkCoreEventAccess`, plus `checkPasskeyEventAccess` for writes) → data module →
`revalidatePath` on success → return `ActionResult`, mapping errors with `toActionError`.

### UI

Load the `carina` skill and follow `housing-ui-guidelines` before UI work (`CLAUDE.md`, "UI
work"). Components take whole ViewModels, use `import type` for Zod types, and own formatting.
Sections split into `server/` (starts reads, passes promises) and `client/`.

## Workflow

- Issues are tracked with **bd (beads)** (`bd ready`, `bd show`, `bd update --claim`, `bd close`).
- Large tickets may ship as stacked PRs (`stacked-pull-requests` skill).
- Branches follow `feature/GROUP-<ticket>` (Inferred from the current branch, Confidence: Low).

Related: [testing-guide.md](testing-guide.md) · [code-navigation.md](code-navigation.md)

---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: adr
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [adr, server-actions, routes, mutations]
---

# ADR-0004: Server actions for mutations, GET routes for client reads

- **Status:** Accepted (`CLAUDE.md`, "Server action boundaries")
- **Date:** Not recorded

## Decision
- Mutations driven by this app's UI are server actions in `src/app/events/housing/actions.ts`,
  never `POST`/`PUT`/`DELETE` routes.
- An action is a boundary like a route: session check, Zod `safeParse` of every argument, guards,
  data module, `revalidatePath` only on success.
- Expected failures are **returned** as `ActionResult` (`src/lib/action-utils.ts:14-18`), not
  thrown, because Next.js strips thrown error messages in production.
- Reads that decide what the page renders happen in the RSC page; reads the client fetches on
  demand (search, pagination, filter refetch) are `GET` API routes.

## Consequences
- `'use server'` modules may only export async functions, so argument schemas live in `@lib/`
  (`src/lib/event-link-params.ts`).
- Routes and actions share `resolveErrorOutcome`, so a failure surfaces the same way on both.

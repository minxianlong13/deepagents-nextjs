---
project_id: passkey-cvent-core-integration
project_name: Passkey Cvent Core Integration (Housing)
document_type: testing-guide
version: "1.0"
generated_at: 2026-11-02
source_repository: passkey-cvent-core-integration
tags: [testing, jest, playwright, integration-tests, coverage, fixtures]
---

# Testing Guide

Path convention: `src/...` is relative to `packages/housing/app/`.

## Test suites

| Suite | Location | Runner | What it covers | Status |
|---|---|---|---|---|
| Unit / component | `src/**/__tests__/*.test.ts(x)` (167 files) | Jest 30, jsdom | Schemas, data modules, guards, routes, actions, hooks, components | Active |
| Integration (IT) | `packages/housing/it/src/ok.test.ts` | Jest | `GET ${BASE_URL}/api/ok` returns 200 against a deployed app | Active (1 test) |
| End-to-end | `packages/housing/e2e/src/UnlinkedLandingPage.spec.ts` | Playwright | Unlinked landing page after cookie login | **Skipped** (`test.skip`) — Verified |

## Unit tests (Jest)

**Config** — the `jest` block in `packages/housing/app/package.json` (Verified):

- Preset `@cvent/jest-config`, `testEnvironment: jsdom`, setup `jest.setup.ts`.
- Module aliases mirror `tsconfig`: `@analytics`, `@components`, `@navigation`, `@pages`, `@app`,
  `@data`, `@lib`, `@utils`, `@hooks`, `@logging`, `@server`, `@config`.
- `@vis.gl/react-google-maps` is mapped to `src/app/__mocks__/react-google-maps.mock.tsx`.
- `collectCoverage: true` with global thresholds **branches 70, lines 80, statements 90,
  functions 90**. Excluded: `src/analytics`, `src/config`, `src/instrumentation.ts`.

**Where the tests are** (largest folders): `src/lib/__tests__` (18), `src/server/data/__tests__`
(10), `RoomBlockData` (10), `BookingPace` (10), `src/components/__tests__` (9). Shared page
fixtures: `src/app/events/housing/__fixtures__/`.

**Run:**

```bash
pnpm --filter @cvent/housing test        # or: cd packages/housing/app && pnpm test (nx test)
pnpm test                                 # root: nx affected --target=test
```

### What the repo expects tests to cover

From `CLAUDE.md`, "Testing expectations" (Verified as stated rules; adherence not audited
file-by-file):

- Valid **and** invalid upstream fixtures for each Zod schema.
- All-or-nothing composition for multi-call ViewModels.
- Route boundaries: unauthenticated → 401, invalid query → 400, `ServiceError` → 502, unknown → 500.
- Pagination with zero and non-zero totals.
- Numeric upstream ids mapped to string ViewModel ids.
- Component formatting and fallbacks.
- UI tests select by `data-cvent-id` (configured `testIdAttribute`), never `data-testid`, and render
  inside `ThemeProvider` from `@components/ThemeProvider`.

### Patterns used

- **Route tests** (`src/app/api/**/__tests__/route.test.ts`) mock `getAuthContext`, the guard, and
  the data module, and assert status codes.
- **Data-module tests** mock `src/data/<service>` fetchers and assert composition and error
  propagation.
- **Fetcher tests** mock the `JsonClient` and assert URL, headers, cache options and the
  `toServiceError` clamping.

(Patterns Inferred from file names and a sample of files, Confidence: Medium.)

## Coverage report

`packages/housing/app/.coverage/coverage-summary.json` exists locally, dated 2026-10-05, and shows
about 2.7% coverage. That is a stale or partial run and **does not** reflect the suite; run the
tests to get real numbers (Verified file; interpretation Inferred, Confidence: High).

## Integration tests

`packages/housing/it/` runs in the deployment pipeline with `API_KEY` injected (runtime
`commonProps.integrationTests`, `packages/housing/app/bin/shared/commonProps.ts`). `BASE_URL` is
the deployed endpoint. Only the health check exists.

## End-to-end tests (Playwright)

- Config `packages/housing/e2e/playwright.config.ts`: `baseURL` = `BASE_URL` or
  `http://localhost:3000`; in Octopus, `ENDPOINT` becomes `BASE_URL`. `testIdAttribute:
  'data-cvent-id'`. Projects: chromium, firefox, webkit, iPhone 14, Pixel 7. CI retries once.
- Reporters include `@cvent/playwright-qeportal-reporter` (app `housing-e2e`, team
  `cherry-pickers`).
- `helpers/login.ts` logs in via cookie.
- The one spec is `test.skip`, so the e2e stage currently asserts nothing (Verified).

## Gaps

- No e2e coverage of link, unlink, insights or magic link.
- IT covers only `/api/ok`.
- See [known-issues-roadmap.md](known-issues-roadmap.md).

Related: [development-guide.md](development-guide.md)

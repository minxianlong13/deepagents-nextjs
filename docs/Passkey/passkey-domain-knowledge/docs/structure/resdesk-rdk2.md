# Resdesk ↔ RDK2 Relationship

## Product Context: Passkey Manage

The product known as **Passkey Manage** to customers and product teams is the central management application of the Passkey platform. It is where events are created and managed, hotels and organizations are configured, inventory is set up, reservations are viewed, and email campaigns are managed. Most other Passkey applications' configuration and behavior is driven by settings in Passkey Manage.

See `passkey-manage.md` for full details on what Passkey Manage does and doesn't do.

## Two Apps, One Product

Passkey Manage is implemented as **two applications running simultaneously**:
- **passkey-resdesk** (aka "Resdesk", "RD4"): The legacy Java/WildFly JSP application. The original monolithic frontend.
- **passkey-rdk2** (aka "Resdesk2", "RDK2"): The modern Next.js/React replacement, built on Cvent's CDF framework. Acts as a BFF (Backend-for-Frontend) with a GraphQL API layer.

## Current State: Coexistence

RDK2 is **not** a complete replacement yet. Both applications run simultaneously:

- **RDK2 owns**: The home/event list page, event overview, hotel management, sub-block group management, room categories, notifications, reports, request queue, reservations search, and other modernized pages.
- **Resdesk still owns**: Pages that have not yet been migrated to RDK2. Users navigate between the two apps during a single session.

## How They Share Sessions

RDK2 depends on Resdesk for login/session establishment:

1. In deployed environments, `LOGIN_URL` points to `passkey-resdesk.endpoint` — users authenticate through Resdesk first
2. Session is shared via cookies: `cvent-auth` (Cvent auth token) and `RD4_ID_*` (Resdesk session cookie)
3. Both apps read the same cookies to maintain a unified session
4. RDK2 validates the auth token server-side on every page load via `getAuthPropsOrRedirect`

## Local Development

For local dev, RDK2 can run independently with `DEV_LOGIN=true` (bypasses Resdesk login). To test the full integrated flow locally, developers must run both Resdesk and RDK2 and configure cookie sharing via `/etc/hosts` aliases.

## Navigation Between Apps

Users may be redirected between Resdesk and RDK2 during a session depending on which app owns the page they're navigating to. The top navigation is shared via `@cvent/planner-navigation` to maintain a consistent experience.

## Migration Direction

The long-term goal is for RDK2 to fully replace Resdesk. New UI features are built in RDK2, not Resdesk. Legacy pages are migrated incrementally.

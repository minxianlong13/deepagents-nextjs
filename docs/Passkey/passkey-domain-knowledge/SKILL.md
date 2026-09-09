---
name: "passkey-domain-knowledge"
description: "Cross-cutting Passkey platform domain knowledge. Use when answering questions about Passkey concepts, terminology, platform architecture, service relationships, or how Passkey systems fit together. Not tied to a single repo."
---

# Passkey Domain Knowledge

Use this skill when you need to understand Passkey as a platform — its domain concepts, how services relate to each other, and structural knowledge that spans multiple repositories.

## Knowledge Categories

### 1. Platform Structure (`docs/structure/`)
How Passkey is built — service relationships, architectural decisions, migration states, and system boundaries.

| Document | Covers | Load when... |
|---|---|---|
| `docs/structure/passkey-manage.md` | What Passkey Manage is, what it does/doesn't do, who uses it | Asked about Passkey Manage, the main application, or what the central management tool is |
| `docs/structure/resdesk-rdk2.md` | Resdesk ↔ RDK2 coexistence, shared auth, migration state | Asked about Resdesk, RDK2, legacy vs modern UI, or how the two apps work together |
| `docs/structure/service-map.md` | High-level map of all Passkey services and how they connect | Asked about which services exist, what calls what, or overall architecture |

### 2. Domain Concepts (`docs/concepts/`)
What things mean in Passkey — business terms and domain models, often different from their everyday meaning.

| Document | Covers | Load when... |
|---|---|---|
| `docs/concepts/glossary.md` | Quick-reference glossary of all key Passkey terms | Need a definition or are unsure what a Passkey term means |
| `docs/concepts/participants.md` | Participants, Organizations, Users, Authentication, SSO | Asked about participants, organizations, users, auth, SSO, or multi-tenancy |
| `docs/concepts/events.md` | Events, Attendee Groups, WebInfo, Guarantee Plans, Ecommerce Policies | Asked about events, attendee groups, access codes, guarantee plans, or event lifecycle |
| `docs/concepts/reservations.md` | Reservations, Booking, Waitlist, Group Bookings, Queue-It | Asked about reservations, booking flow, waitlist, or where reservations are made |
| `docs/concepts/inventory.md` | Room Blocks, Inventory Pools, Rate Management, Tax Structures | Asked about room blocks, inventory, rates, availability, or tax structures |
| `docs/concepts/planners.md` | Planner types, access levels, SBG associations, discovery process | Asked about planners, planner access, SBG-level vs event-level, or planner discovery |

## How to Use

1. Check the tables above to find the right document
2. Load it with `fs_read` when you need the detail
3. If a question spans multiple documents, load the most relevant one first

## Adding New Knowledge

- **New structural knowledge**: Add a file to `docs/structure/` and add a row to the Structure table above
- **New domain concepts**: Add terms to `docs/concepts/glossary.md`, or create a new file in `docs/concepts/` for deep-dives and add a row to the Concepts table
- Keep each file small (under ~4KB) for context efficiency

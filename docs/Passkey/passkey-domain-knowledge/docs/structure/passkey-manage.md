# Passkey Manage

## What is Passkey Manage?

**Passkey Manage** is the name product and customers use for the central management application of the Passkey platform. It is where events are created and managed — the hub that drives the configuration and behavior of most other Passkey applications.

Passkey Manage is made up of **two applications running simultaneously**:
- **passkey-resdesk** (legacy Java/WildFly JSP) — the original monolithic UI
- **passkey-rdk2** (modern Next.js/React BFF) — the incremental replacement

See `resdesk-rdk2.md` for the technical details of how these two apps coexist.

## What Passkey Manage Does

Passkey Manage is the primary application for:
- **Event management**: Creating, configuring, and managing housing events
- **Hotel management**: Managing hotel profiles, properties, and event-hotel associations
- **Organization management**: Managing organizations and sister property relationships
- **Inventory management**: Configuring room blocks, rates, and availability
- **Reservation management**: Viewing and managing reservations (but NOT making them — that happens in booking apps)
- **Email campaigns**: Managing email campaign configuration (Manage can send test emails, but other apps handle bulk sending)
- **Planner management**: Setting up planners and their access levels
- **Configuration**: Setting up guarantee plans, ecommerce policies, tax structures, consent agreements, and other settings that control behavior across the platform

## What Passkey Manage Does NOT Do

- **Make reservations**: Reservations are made through passkey-book, passkey-book-mono, call center, planner portal, or vendor integrations
- **Send bulk emails**: Other services handle actual email delivery
- **Guest-facing booking**: That's the booking apps (passkey-book, passkey-book-mono)

## Why It Matters

Many of the other Passkey applications' configuration and behavior — on events, hotels, inventory, and other areas — is set up in Passkey Manage. Understanding Manage is essential to understanding how the rest of the platform works.

## Who Uses It

- **Cvent staff**: Internal operations managing events and hotels
- **Hotel operators**: Managing their properties and room blocks
- **Event organizers**: (via planner portal features) Managing their event housing

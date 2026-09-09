# Passkey Glossary

Quick-reference for Passkey domain terms. Many have specific meanings that differ from everyday usage.

> For deep-dives on complex topics, see dedicated files in `docs/concepts/` (listed in SKILL.md).

## Core Entities

**Event**: A housing event (conference, convention, trade show) that requires hotel room blocks. Not a calendar event — it's the top-level organizing entity in Passkey.

**Hotel**: A physical hotel property registered in Passkey. Contains profile info, images, venue certifications, and room types. Hotels exist independently of events and can be associated with many events.

**Event Hotel**: The association between a Hotel and an Event. Contains event-specific configuration like room blocks, rates, and date ranges for that hotel within that event.

**Organization**: A participant entity that owns hotels or organizes events. Can have sister property relationships for hotel chain management.

**Participant**: The base entity for any organization or entity in Passkey. NOT a person attending an event. Types: Event Organizer, Hotel, Sister Property Org, Vendor/Sponsor, Passkey itself.

**Sister Property**: A hotel belonging to the same parent organization. Enables centralized management across a hotel chain.

## Events & Configuration

**Attendee Group Type**: A category of attendees within an event (VIP, general, staff, speakers). Each has a unique access code for booking URLs.

**Sub-Block Group (SBG)**: A subdivision used for planner access control. Multiple attendee groups can share the same SBG ID. Also known as Planner Groups.

**Access Code**: A 20-character globally unique code for direct booking links. Uses safe character set (no homoglyphs). Salted hash for URL security.

**WebInfo**: Hotel-specific event configuration — visibility, ranking, dates, distance from venue, HQ flag, closed flags, marketing message.

**Guarantee Plan**: Payment and guarantee requirements for reservations. Types: Guest Credit Card, Guest Other Payment, Master Guarantee (rooming list/master billing).

**Ecommerce Policy**: Rules for deposits, cancellations, and processing fees. Linked to guarantee plan revisions.

**Consent Agreement**: Legal agreement attendees must accept during booking (privacy, T&Cs, data usage).

**Template Event**: A reusable event configuration. Not shown in standard searches. Can be cloned to create new events.

## Room Management

**Room Block**: An allocation of hotel rooms reserved for an event at negotiated rates for specific date ranges. The fundamental unit of inventory.

**Room Night**: A single room for a single night — the atomic unit of hotel inventory.

**Room Category**: A classification of room types (Standard King, Deluxe Double) with associated attributes and rates.

**Autoblock**: Automated room block provisioning based on predefined rules.

**Inventory Pool**: One of six allocation categories: Block, Hotel Pool, Room Pool, Overbook, Waitlist, Primary Pool.

**Primary Pool**: Hotel's base inventory allocation.

**Release to Free Sell (R2FS)**: Automatic release of unused block inventory back to the hotel.

**Shoulder Nights**: Nights before/after the main event dates.

**Contracted Dates**: Hotel contract date range — may differ from booking availability dates.

## Reservations

**Reservation**: A hotel room booking made by an attendee for an event. Linked to a block (hotel + event + group type + room type).

**Confirmation Number**: Unique identifier for a reservation, shown to the guest.

**Master Acknowledgment Number (Master Ack)**: Links multiple reservations in a group booking.

**Waitlist**: Queue for reservations when inventory is exhausted. FIFO processing.

**Queue-It**: Virtual waiting room service for high-demand event launches. Separate from waitlist.

**Split Folio**: Multiple payment methods for a single reservation.

**Room Block Transfer (RBX)**: Integration with hotel PMS systems for two-way reservation sync.

## People & Roles

**User**: An account providing access to Passkey. Types: Planner, Hotel User, Admin User, API User.

**Planner**: An event organizer who manages housing. Two levels: Event-Level (full access) and SBG-Level (restricted to assigned groups).

**Notification Contact**: Hotel staff designated to receive reservation notifications (new bookings, cancellations, modifications).

## Financial

**Ledger**: Financial tracking of room block commitments, deposits, and transactions.

**Merchant Account**: Payment processing configuration. Events can have a default merchant account.

**PBB (Passkey Billing Bridge)**: Payment gateway integration.

**CVV2**: Card security code — collection configurable per merchant account.

## Communication

**Business Text**: Customizable labels and text strings used throughout the UI. Supports multi-language via message keys and locale codes.

**Notification Template**: Email/communication templates for planners, hotels, or attendees.

## Platform Terms

**Passkey Manage**: The central management application (Resdesk + RDK2). Where events are created and configured.

**CDF**: Cvent Development Framework — standard framework for TypeScript/Next.js services at Cvent.

**Resdesk / RD4**: The legacy Java/WildFly Manage UI.

**RDK2 / Resdesk2**: The modern Next.js Manage UI replacement.

**RegLink**: Registration link integration with Cvent registration.

**SmartCamp**: Configuration for campus-style multi-venue events.

**Housing Library**: Reusable library of hotel and housing configurations.

**Vendor System**: External hotel PMS integrated with Passkey for reservation sync.

## Technical Terms

**Fetched Fields**: Performance optimization — selective data retrieval to reduce response size.

**PKUSERID / PKTIMESTAMP / PKACTIONID**: Audit fields on database records. PKUSERID is who last modified the record, NOT a data relationship.

**ARI (Availability, Rate, Inventory)**: Hotel system integration flag.

**Inventory Lock**: Concurrent access control preventing modification conflicts.

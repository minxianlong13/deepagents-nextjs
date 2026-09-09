# Room Blocks & Inventory

## Room Blocks

A **Room Block** is an allocation of hotel rooms reserved for an event at negotiated rates for specific date ranges. It is the fundamental unit of inventory in Passkey.

Each block links: **Event** + **Hotel** + **Attendee Group Type** + **Room Type**

**Key attributes:**
- Start and end dates (within event dates)
- Room rates (base, 2nd/3rd/4th/5th+ person occupancy rates)
- Block size (number of rooms)
- Cancellation and tax policies
- Closed flags (can be closed independently)
- Waitlist enabled flag

Multiple blocks can exist for the same event-hotel combination (different room types or attendee groups).

## Inventory Pool System

Passkey tracks inventory across **six pools** with priority allocation:

1. **Block Inventory** — Rooms allocated to a specific block (`INVENTORY.totalnumber`)
2. **Hotel Pool** — Shared across blocks at a hotel (`INVENTORY.numberreservedhotelpool`)
3. **Room Pool** — Shared across room types (`INVENTORY.numberreservedroompool`)
4. **Overbook Pool** — Beyond allocated inventory (`INVENTORY.numberreservedoverbook`)
5. **Waitlist Pool** — When all pools exhausted (`INVENTORY.waitlistedpool`)
6. **Primary Pool** — Hotel's base inventory (`HOTELROOMTYPEINVENTORY.primarypool`)

**How it works:**
- Booking decrements inventory from the appropriate pool
- Cancellation increments inventory back to the appropriate pool
- Closed flag overrides inventory (prevents bookings regardless of availability)
- Inventory locks prevent concurrent modification conflicts

## Inventory Controls

- **Sell-Only-From-Primary**: Restricts sales to primary inventory pool only
- **Sell-Highest-Rate**: Prioritize highest rate rooms when multiple options exist
- **Release to Free Sell (R2FS)**: Automatically releases unused block inventory back to the hotel
- **Pull From Higher Pool**: Allow booking from higher-tier pools when lower ones are exhausted
- **Closed Status**: Prevents bookings regardless of available inventory
- **Hide Rate**: Suppress rate display on booking site
- **Min Length of Stay (MNS)**: Minimum nights required for a booking

## Inventory Tracking

Inventory is tracked at three levels:
- **Daily per block**: `PADLOCK.INVENTORY` — the most granular level
- **Per event-hotel-room**: `EVENTPROFILE.ROOMTYPEINVENTORY`
- **Hotel base**: `EVENTPROFILE.HOTELROOMTYPEINVENTORY`

**Contracted dates** may differ from availability dates — the hotel contract might cover a wider date range than what's open for booking.

## Hotel Tax Structures

Taxes are configured at two levels:
1. **Hotel-Level**: Default taxes applied across all events for a hotel
2. **Event-Level**: Override hotel taxes for a specific event-hotel combination

Event-level taxes take precedence. Each tax structure can contain multiple individual taxes/fees, each with:
- Amount (percentage or flat fee)
- Calculation basis (room rate, subtotal, etc.)
- Collection schedule (per night, per stay, etc.)
- Rate inclusion type (included in displayed rate, excluded, or optional)

## Children Settings

Hotels configure policies for children:
- Whether children affect room rate
- Whether to ask for/require child name and age
- Age ranges defining "child" vs "adult"
- Whether children count toward occupancy

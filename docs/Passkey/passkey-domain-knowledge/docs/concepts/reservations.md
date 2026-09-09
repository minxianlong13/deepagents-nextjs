# Reservations

## What is a Reservation?

A **Reservation** is an individual room booking made by an attendee for an event. It links a guest to a specific block (hotel + event + attendee group + room type) for specific dates.

**Key attributes:**
- Confirmation number (unique identifier shown to guest)
- Master acknowledgment number (links group bookings)
- Guest information, check-in/check-out dates, room type, rate
- Guarantee/payment information
- Special requests
- Status

## Reservation Status

- **Active/Confirmed**: Valid booking
- **Modified**: Changed after initial booking
- **Cancelled**: Cancelled (subject to cancellation policy)
- **Waitlisted**: Pending inventory availability
- **No-show**: Guest didn't arrive

## Where Reservations Are Made

Reservations are NOT made in Passkey Manage (Resdesk/RDK2). They are made through:
- **passkey-book** (legacy) / **passkey-book-mono** (modern): Guest-facing booking websites
- **Call center**: Phone bookings via passkey-call-center
- **Planner portal**: Planners can submit room lists
- **Vendor integrations**: Two-way sync with hotel PMS systems

Passkey Manage is used to *view and manage* reservations, not create them.

## Booking Rules

- Reservations only accepted between open and cutoff dates
- Must select a valid block (hotel + group type)
- Must comply with guarantee plan requirements
- Check-in date must be within block date range
- Modifications may require new guarantee
- Cancellations subject to ecommerce cancellation policy

## Group Bookings

Multiple reservations can be linked via a **master acknowledgment number**. This groups related bookings (e.g., a company booking rooms for multiple employees).

## Waitlist

When inventory is exhausted, reservations can be **waitlisted** (if enabled for the event):
- FIFO processing when rooms become available
- Auto-fulfill option available
- Email notifications configurable
- Separate from Queue-It (virtual waiting room for high-traffic launches)

## Queue-It Integration

For high-demand event launches, **Queue-It** provides a virtual waiting room:
- Rate limiting (max redirects per minute)
- Custom layout/branding
- Safety net mode option
- Prevents system overload during popular event openings

## Special Requests

Guest preferences captured during booking:
- Accessibility needs (wheelchair, hearing, visual)
- Room preferences (smoking, floor level)
- Bed type preferences
- Early check-in / late checkout

Special request codes are configured per hotel or organization.

## Reservation Processing

The **passkey-reservation-saga** service orchestrates multi-step reservation workflows using AWS Step Functions. The **passkey-reservation-orch-client** is a Java client for this orchestrator.

## Merchant Accounts

Payment processing configuration for events:
- Events can have a default merchant account
- CVV2 collection and billing address verification configurable
- Authorize-before-reservation option
- PBB (Passkey Billing Bridge) integration for payment gateway

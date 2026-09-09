# Events

## What is an Event?

An **Event** in Passkey is a housing event — a conference, convention, trade show, or any gathering that requires hotel room blocks. It is the top-level organizing entity. Not a calendar event.

**Event types:**
- **Standard**: Regular group bookings at one or more hotels
- **City-Wide**: Large events spanning multiple hotels across a city
- **Template**: Reusable event configurations (not shown in standard searches)
- **Multi-Property**: Events with multiple hotel properties

## Event Lifecycle

Events progress through states:
1. **Pre-Open**: Created but reservations not yet available
2. **Open**: Actively accepting reservations
3. **Near Cutoff**: Approaching cutoff date
4. **Closed**: Past cutoff date, no new reservations
5. **Cancelled**: Event cancelled

**Critical dates** (must be logically consistent):
- **Open Reservation Date**: When reservations can begin
- **Cutoff Date**: Last day to make reservations
- **Shutoff Date**: System stops accepting reservations
- **Start/End Date**: When the event itself runs
- **Web Open/Close Dates**: Web booking availability window
- **Call Center Open/Close Dates**: Phone booking window

## Attendee Group Types (Sub-Blocks)

Events are subdivided into **Attendee Group Types** — categories of attendees (VIP, general, staff, speakers). Each group type:
- Has a unique name within the event
- Has a unique **access code** (20-char, globally unique, used in booking URLs)
- Can have its own cutoff date (overriding the event default)
- Can have its own guarantee plan
- Has a maximum room allocation
- Has a **rollup flag** determining if counts aggregate to parent totals

Multiple attendee groups can share the same **Sub-Block Group (SBG) ID** — this is how planner access is scoped (see `planners.md`).

## WebInfo

**WebInfo** is the hotel-specific configuration for an event. Each hotel-event combination has one WebInfo record controlling:
- Hotel visibility and display ranking on the booking site
- Hotel-specific dates (can differ from event dates)
- Distance from venue
- HQ hotel flag (typically displayed first)
- Closed flags (prevent new bookings)
- Marketing message

## Guarantee Plans

**Guarantee Plans** define payment and guarantee requirements for reservations. Every event must have a default plan; attendee groups can override it.

**Payment types within a plan:**
1. **Guest Credit Card**: Card required at booking, optional CVV validation
2. **Guest Other Payment**: Alternative methods with due dates and custom text
3. **Master Guarantee (No Guarantee)**: Rooming list or master billing

Plans have **revisions** for historical tracking. Each revision links to **ecommerce policies**.

## Ecommerce Policies

Rules governing deposits, cancellations, and processing fees:
- **Deposit policies**: Amount/percentage, when due, tax inclusion
- **Cancellation policies**: Date-sensitive rules, fees by date range, refund rules
- **Processing policies**: Fee amount/percentage, when charged

Policies are linked to guarantee plan revisions and can vary by payment type.

## Consent Agreements

Legal agreements attendees must accept during booking (privacy policies, T&Cs, data usage, marketing consent). Multiple agreements per event; required ones must be accepted.

## Event Cloning

Template events can be cloned to create new events with the same configuration. Useful for annual recurring events or multi-city series.

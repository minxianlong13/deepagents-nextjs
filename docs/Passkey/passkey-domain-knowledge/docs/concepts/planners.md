# Planners

## What is a Planner?

A **Planner** is a user who organizes and manages event housing within Passkey. Planners access event management tools, dashboards, and reporting through the planner portal.

Planners are identified by `emailUserId` (unique identifier). Email addresses must be unique across all planners and are stored in lowercase.

## Planner Types

### Event-Level Planners
Full access to all aspects of an event — all hotels, all attendee groups, all sub-block groups.

### SBG-Level Planners (Sub-Block Group)
Restricted access to only specific sub-block groups they're assigned to. They can manage reservations for their assigned attendee groups across all hotels, but cannot see other groups.

**Key distinction:** Planners are NOT tied to specific hotels. They're tied to events or sub-block groups. An event-level planner manages reservations at ALL hotels in the event.

## Access Permissions

Each planner-event association defines:
- **Room List Access**: ALLOW_REQUEST_UPDATES (100), ALLOW_DIRECT_UPDATES (101)
- **Dashboard Access**: READ_ONLY (0), FULL (1)

## Planner-Event Associations

- Links planners to specific events with per-event permissions
- Each planner can be associated with multiple events
- Each event can have multiple planners
- Associations can be created, updated, or deleted independently

## Planner-Sub-Block Group Associations

- Links SBG-level planners to specific sub-block groups
- Multiple attendee groups can share the same SBG ID — same planners manage all of them
- Validated to ensure groups belong to the event
- Multiple groups can be assigned to one planner

## Business Rules

- Email addresses must be unique across all planners
- Creating a planner with an existing email updates the existing record
- Deleting a planner cascades to all associations (events, groups)
- Event-level planners cannot have sub-block group associations
- SBG-level planners must have at least one sub-block group association

## Planner Discovery (Important for API consumers)

Event-level and SBG-level planners are stored separately. To get the complete list of planners for an event:

1. **Get attendee groups with SBG IDs** — to find which sub-block groups exist
2. **Get event-level planners** — returns only event-level planners
3. **Search by each SBG ID** — returns SBG-level planners for each group
4. **Get permissions per planner** — dashboard and room list access settings

A single "get event planners" call will NOT return SBG-level planners.

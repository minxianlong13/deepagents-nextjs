# Passkey Room Block Bridge Page - User Flow

## Flow Overview

### 1. Open Modal & Fetch Suggestions

**User opens Bridge Page Modal**

Fetch suggested room blocks from Passkey account using:

- Passkey event status = `pre-open` OR `open`
- Date overlap: Cvent event start–end ↔ Passkey event start–end
- Any word in Cvent event name matches Passkey event name

**Outcomes:**

| Result               | Next Step                                                                        |
| -------------------- | -------------------------------------------------------------------------------- |
| Suggestions found    | Display list → proceed to [Room Block Selection](#3-room-block-selection)        |
| No suggestions found | Show _"No room block suggestions from your Passkey account"_ → proceed to Search |

---

### 2. Search Fallback

If no suggestions, user can search by:

- Passkey Event Name
- Passkey Event ID

Scope: citywide events in `pre-open` or `open` status only.

| Result           | Next Step                                                                 |
| ---------------- | ------------------------------------------------------------------------- |
| Results found    | Display list → proceed to [Room Block Selection](#3-room-block-selection) |
| No results found | Show _"No events found matching your search criteria"_                    |

---

### 3. Room Block Selection

User selects a room block. Two integration options are presented:

> ☑ **Enable Passkey Integration w/ Cvent Registration** ← _selected by default_

---

### 4A. Toggle ON — Enable Passkey Integration w/ Cvent Reg

#### Step 1: Reglink Check

Is Reglink enabled as a Registration Provider in Passkey API Settings for the org-owned event?

- **Yes** → proceed to Step 2
- **No** → auto-enable Reglink via Passkey API → proceed to Step 2

---

#### Step 2: Account-Level Travel Check

Is Travel enabled for this Cvent account?

- **Yes** → proceed to Step 3
- **No** →
  > ❌ **Validation Error:** _"Travel isn't enabled for your account. Cannot enable Passkey Integration with Cvent Reg."_
  >
  > User can still save the room block without reg integration.

---

#### Step 3: Event-Level Registration Check

Is Registration Solution enabled on the event?

- **Yes** → proceed to Step 4
- **No** →
  > ❌ **Validation Error:** _"Registration hasn't been added to your Event. Cannot enable Passkey Integration with Cvent Reg."_
  >
  > User can still save the room block without reg integration.

---

#### Step 4: Travel Module State Check (Event Level)

| Travel State    | Hotel State                                                  | Action                                                                                                                                                          |
| --------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ❌ Not selected | —                                                            | Auto-enable Travel, enable Hotel, set Two-Way Passkey integration, auto-connect Passkey URL under Passkey Setup _(no manual Hotel Accommodations nav required)_ |
| ✅ Enabled      | ❌ Disabled                                                  | Enable Hotel = Yes, set Two-Way Passkey integration, auto-connect Passkey URL under Passkey Setup _(no manual Hotel Accommodations nav required)_               |
| ✅ Enabled      | ✅ Enabled = Official Hotel site OR Cvent hotel request form | ❌ **Validation Error:** _"Cannot save room block with reg connection. Save without reg connection only."_                                                      |
| ✅ Enabled      | ✅ Enabled = Two-Way Passkey                                 | 🚫 User should not reach this state — linkage already existed or user was routed into the **Change Room Block** workflow                                        |

---

### 4B. Toggle OFF — No Reg Integration

| Travel State | Hotel State                                                  | Behavior                                                                 |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| ✅ Enabled   | ❌ Disabled                                                  | Remains disabled                                                         |
| ✅ Enabled   | ✅ Enabled = Official Hotel site OR Cvent hotel request form | Leave hotel settings as-is, separate from the Passkey Room Block linkage |

> Room block is saved without reg integration in all Toggle OFF cases.

---

### 5. Room Block Successfully Linked

#### 5A. Bridge Page — Reg Integrated with Travel

**Room Block Info:**

- Room Block Name
- Passkey Dates
- Event Type (Citywide)
- Location

**Room Block Detailed Insights:**

- Data considered unprivileged in this scenario

**Available Actions:**

| Action               | Behavior                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Manage Passkey       | Navigate to Passkey (see _Navigating out of the Neighborhood Page Into Passkey_ workflow) |
| View Booking Website | Opens Passkey URL in a new window                                                         |
| Planner Portal       | Navigate and authenticate into Planner Portal _(edge case)_                               |
| Travel Settings      | Navigate to Travel settings page                                                          |

---

#### 5B. Bridge Page — Reg NOT Integrated with Travel

- No indication that event reg and room block are integrated
- If Travel is enabled, user can toggle travel settings from this page

---

## Validation Error Summary

| Validation                             | Trigger Condition                                       | User Can Still Save Room Block? |
| -------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| Travel not enabled (account level)     | Account does not have Travel feature enabled            | ✅ Yes, without reg integration |
| Registration not enabled (event level) | Event has no Registration Solution added                | ✅ Yes, without reg integration |
| Hotel set to incompatible option       | Hotel = Official Hotel site or Cvent hotel request form | ✅ Yes, without reg integration |

---

## Key Design Decisions

| Rule                                                       | Detail                                                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Default toggle state**                                   | "Enable Passkey Integration w/ Cvent Reg" is checked **by default** when a room block is selected                                          |
| **Auto-connect Passkey URL**                               | Passkey URL is auto-connected under Hotel Accommodations → Passkey Setup during save — user should **not** need to navigate there manually |
| **Reglink auto-enable**                                    | Reglink is silently enabled via Passkey API before saving if not already configured                                                        |
| **Immutable Two-Way state**                                | If Two-Way Passkey integration was already active, user is routed to the **Change Room Block** workflow and never reaches this modal       |
| **Validation errors are non-blocking for room block save** | All 3 validation errors block reg integration only — the room block itself can always be saved                                             |

---

## Reference Materials

| Resource                    | Link                                                                                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High Level Technical Design | [Neighborhoods - Passkey Room Block Bridge Page - HLD](https://wiki.cvent.com/spaces/PASKY/pages/1191973962/Neighborhoods+-+Passkey+Room+Block+Bridge+Page+-+High+Level+Technical+Design) |
| Feature Design Doc          | [Neighborhoods - Passkey Room Block Bridge Page](https://wiki.cvent.com/spaces/PASKY/pages/1106609325/Neighborhoods+-+Passkey+Room+Block+Bridge+Page)                                     |
| Jira Ticket                 | [GROUP-130374](https://jira.cvent.com/browse/GROUP-130374)                                                                                                                                |

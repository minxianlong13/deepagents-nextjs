# Participants, Organizations & Users

## Participants

A **Participant** is the base entity for any organization or entity in Passkey. It is NOT a person attending an event — it's a system-level entity representing a company or organization.

**Participant types:**
- **Event Organizers**: Organizations hosting events requiring hotel accommodations
- **Hotels**: Properties providing rooms for events
- **Sister Property Organizations**: Hotel chains or management companies
- **Vendors/Sponsors**: Third-party entities associated with events
- **Passkey**: The platform itself is a participant

Every participant has:
- Unique `participantId`
- Object type (`organizerTypeId`) classifying what kind of participant it is
- Contact information (address, phone, email)
- Customer flags (bitwise configuration)
- Read/write/delete permission levels

**Key rules:**
- All data in Passkey is scoped to participants (multi-tenancy)
- Participants can own multiple events
- Hotels are participants with specific object types
- Sister property relationships enable multi-property management (hotel chains)
- Test participant flag isolates test data from production

## Organizations

An **Organization** is a participant that owns hotels or organizes events. Organizations can have **sister property** relationships — hotels belonging to the same parent organization, enabling centralized management across a hotel chain.

## Users

A **User** is an account that provides access to the Passkey system. Users are distinct from participants — a user *belongs to* a participant.

**User types:**
- **Planners**: Event organizers with management access (see `planners.md`)
- **Hotel Users**: Hotel staff managing properties
- **Admin Users**: System administrators
- **API Users**: Programmatic access accounts

**Key attributes:**
- `userId` (unique identifier)
- `username` (20 chars max, case-insensitive)
- `participantId` (which organization they belong to)
- `userTypeId`, `userFlags` (bit 0 = admin), `userStatus`
- `invalidLoginCount` for failed login tracking
- `disabled` flag for account status

## Authentication

Passkey has its own authentication system (separate from Cvent-wide auth):

**Methods:**
- Username/password (8-25 char passwords, stored encrypted)
- JWT token-based access
- SSO via Okta/Universal Login (platform user associations)

**SSO integration:**
- Platform user associations link Okta users to Passkey users
- One platform user can map to multiple Passkey accounts
- SSO configured at participant level
- Identity providers managed centrally via passkey-admin
- Magic links for Universal Login authentication

**Sessions:**
- Active sessions tracked in database
- Session IDs encrypted
- Sessions extended on activity, invalidated on logout
- Multiple concurrent sessions allowed per user
- Resdesk and RDK2 share sessions via cookies (`cvent-auth`, `RD4_ID_*`)

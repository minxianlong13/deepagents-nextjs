# User, Role, and Module Access Refinement Plan

## Objective

Add user accounts and role-based module access so each project user can only view and use the modules allowed by their role.

## Scope

- User identity and account status
- Project membership
- Roles assigned within a project
- Module-level permissions
- Navigation and API access control
- Basic administration workflow

## Recommended authorization model

Use project-scoped roles rather than global roles. A user may have a different role in each project.

### Initial roles

- **Owner**: full access, project settings, user and role management
- **Admin**: manage users, roles, and enabled modules; cannot transfer ownership
- **Member**: use modules granted to the role; cannot manage access
- **Viewer**: read-only access to permitted module results

### Initial modules

- Ticket Analysis
- Resume Tailor
- Search
- Local RAG
- RAG Configuration

Represent permissions as capabilities, for example:

- `module.ticketAnalysis.use`
- `module.ticketAnalysis.view`
- `module.ragConfig.manage`
- `project.members.manage`

This keeps the authorization layer extensible when new modules are added.

## Phased implementation plan

### Phase 1: Define the authorization contract

Target: agree on the permission model before changing application behavior.

- Define users, projects, memberships, roles, modules, and permissions.
- Decide whether a user can belong to multiple projects.
- Define the default role for a new member.
- Document which role can manage each module.
- Define behavior for disabled, removed, or unknown users.

Deliverable: permission matrix and data model decision record.

### Phase 2: Add identity and project membership

Target: identify the current user and establish project membership.

- Select the authentication provider and session strategy.
- Add user records with stable provider identifiers.
- Add project membership records.
- Add owner and invitation flows.
- Add account and membership status checks.

Deliverable: authenticated users can be associated with a project.

### Phase 3: Add roles and permissions

Target: resolve a user’s effective permissions reliably.

- Add role definitions and project-scoped role assignments.
- Add module permission definitions.
- Implement one authorization service used by both UI and API code.
- Define deny-by-default behavior.
- Add audit events for role and permission changes.

Deliverable: a server-side permission check can answer whether a user may perform an action.

### Phase 4: Protect the navigation and pages

Target: users only see modules available to them.

- Filter sidebar and mobile navigation by permission.
- Protect direct page visits with server-side checks.
- Show a clear access-denied state for unauthorized users.
- Keep module names and permission checks in one shared configuration.

Deliverable: unauthorized modules are hidden and direct access is rejected.

### Phase 5: Protect APIs and module actions

Target: permissions cannot be bypassed through API requests.

- Check authentication and project membership in every protected route.
- Check the required capability before each module action.
- Validate project and resource ownership at the server boundary.
- Return consistent `401` and `403` responses.
- Add tests for cross-project and cross-role access.

Deliverable: API access follows the same rules as the UI.

### Phase 6: Build administration controls

Target: owners and admins can manage access without database changes.

- Add a project members page.
- Invite, remove, suspend, and reactivate members.
- Assign roles and show effective permissions.
- Enable or disable modules per project.
- Prevent administrators from removing the last owner.

Deliverable: project access can be managed from the application.

### Phase 7: Audit, test, and rollout

Target: make access control observable and safe to release.

- Add audit logs for invitations, role changes, removals, and module changes.
- Add unit tests for permission resolution.
- Add integration tests for protected pages and APIs.
- Add a seed owner for local development.
- Roll out behind a feature flag if existing users need migration.

Deliverable: documented, tested, and observable authorization behavior.

## Permission matrix starter

| Capability | Owner | Admin | Member | Viewer |
| --- | --- | --- | --- | --- |
| Use enabled modules | Yes | Yes | Yes | No |
| View module results | Yes | Yes | Yes | Yes |
| Manage project members | Yes | Yes | No | No |
| Manage roles | Yes | Yes | No | No |
| Enable or disable modules | Yes | Yes | No | No |
| Manage RAG configuration | Yes | Yes | Optional | No |
| Transfer ownership | Yes | No | No | No |

The `Optional` member permission should be decided per project or role configuration rather than hardcoded into the role name.

## Design rules

- Enforce authorization on the server; UI visibility is only a convenience.
- Deny by default when no permission is found.
- Scope every permission check to a project.
- Use capabilities for checks instead of checking role names throughout the code.
- Keep module metadata and required capabilities centralized.
- Treat audit logs as append-only records.
- Do not expose whether another project’s resources exist.

## Definition of done

- Users can authenticate and belong to a project.
- Each project has an owner and controlled memberships.
- Roles resolve to explicit module capabilities.
- Navigation, pages, APIs, and module actions enforce the same permissions.
- Unauthorized access returns a consistent response.
- Role and module changes are audited.
- Permission behavior is covered by automated tests.

---
'@object-ui/auth': patch
'@object-ui/app-shell': patch
---

After a reload, the console no longer keeps the previous organization's id once the server says the session has no active organization (objectui#12698). better-auth clears a session's active organization before it refuses a `set-active` to an organization the user is not a member of. On the next boot `AuthProvider` asked the server, heard "none", and left the old id in `ActiveOrganizationStorage`, so `X-Tenant-ID` and the metadata seed cache kept naming that organization. `refreshOrganizations` now clears the stored id whenever the server answers with no active organization, including when the single-membership repair (ADR-0081) is refused. When the repair succeeds, the server is re-stamped and the stored id follows the server's answer, as before. Nothing is added to or removed from the package entry.

The console header (`WorkspaceSwitcher`, `CurrentOrganizationIndicator`) now names only the organization the server reports as active, and shows no organization at all when there is none, instead of falling back to the first membership.

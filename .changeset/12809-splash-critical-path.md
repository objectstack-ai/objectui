---
'@object-ui/auth': minor
'@object-ui/app-shell': minor
---

The console splash no longer waits for requests the first screen does not need (objectui#12809).

- **The organization chain runs in parallel.** When the `get-session` answer carries the organization plugin's `activeOrganizationId`, `AuthProvider` names the active organization from that id and the `organization/list` answer, and asks for the member row (`get-active-member`) at the same time as the list. It no longer asks for `get-full-organization` on boot: nothing the console reads uses the members or invitations that answer adds. An id the list does not carry names no organization, and the stored id is cleared, as before. A session answer without the key (a sign-in response, or a server without the organization plugin) takes the old path. Switching organization, the single-membership repair, sign-in and sign-out are unchanged.
- **`AuthClientSession.activeOrganizationId`** is a new optional member: the id better-auth's organization plugin puts on the session, or `null` when the session holds none.
- **The console waits only for the metadata the current route reads.** `AppContent` used to hold the splash until the object, dashboard, report and page lists had all loaded, on every route. It now waits for the lists the current route reads (an object page waits for objects; a dashboard for dashboards and objects). After the first screen, opening a route whose lists have not loaded shows a skeleton where the page will be, inside the console, instead of an empty list or a "not found". A route a host adds through `extraRoutes` still waits for all four lists.

---
'@object-ui/auth': minor
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

A new workspace now takes its creator's browser timezone when it is created, so its first administrator is no longer asked for a zone the browser already knows (objectui#11908).

`createOrganization` accepts an optional `timezone`, an IANA zone such as `Asia/Shanghai`, on both `AuthClient` and the `useAuth()` context. The client sends it as the `timezone` query parameter of `POST /organization/create`; the request body stays `{ name, slug }` (plus `logo` when given). When the zone is absent or empty, no parameter is sent and the server keeps its default zone. A server that does not read the parameter ignores it.

The console's create-workspace dialog and the first-run setup page's create branch both pass the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`. A browser that reports no zone sends none. Existing workspaces are unchanged, and the one-time timezone prompt still asks about a workspace whose zone is still the default.

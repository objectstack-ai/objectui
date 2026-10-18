---
'@object-ui/app-shell': patch
'@object-ui/plugin-chatbot': patch
'@object-ui/console': patch
---

Opening the console no longer starts nine reads the page does not show in the same moment as the page's own reads (objectui#12980, part 3).

- **The bell.** The inbox and the pending-approvals count are read once the boot splash is gone and a frame has painted. Until they land the badge draws nothing, as it does while any read is in flight, and never a `0`. The Activity tab's feed, which the badge does not use, is read when the bell is about to open: a pointer over it, focus, or a click. Until then it does not ask whether `sys_activity` exists either, which inside an app is its own `meta/object/sys_activity` read.
- **The header's dashboard, page and report lists.** The header reads each only on the route type that names one, for the phone bar's title. Any other route reads none of them.
- **The navigation sync.** It reads the page and dashboard lists after the first paint. It still waits for both to load before it compares them.
- **The agent catalog.** `useAgents` sends `GET /api/v1/ai/agents` after the first frame has painted, not while the page mounts. The AI entry points stay hidden until the catalog answers, as before.
- **The user's language row.** The `sys_user` read that applies the signed-in user's language runs after the first paint. It stays a separate read because `GET /auth/me/localization` does not say whether its `locale` came from the user's column or from a fallback.
- **The console's locale list and the timezone prompt's settings read.** Both wait for the first paint. The locale list asks for the session at the moment it sends, so a sign-out while it waits sends nothing.

Nothing is added to a package entry: no export, prop or type member.

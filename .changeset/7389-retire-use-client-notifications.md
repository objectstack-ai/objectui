---
'@object-ui/react': minor
---

**BREAKING: `useClientNotifications` is removed from `@object-ui/react`**

What left: the `useClientNotifications` hook and its two types,
`UseClientNotificationsOptions` and `UseClientNotificationsResult`. Code that
imports any of the three from `@object-ui/react` no longer compiles.

Migration: use the shell's shared inbox feed. `@object-ui/app-shell` reads the
ADR-0030 inbox rows (`sys_inbox_message`, with read-state in
`sys_notification_receipt`) through one shared feed, and each of its inbox
surfaces reads that feed: the header bell in `AppHeader`, and a
`global:notifications` node placed on a page. Mount one of those instead of
polling `client.notifications.*` yourself. The "Server-side notifications"
section of the notifications guide describes both.

Why: the hook ran a poller of its own (a `setInterval` over
`client.notifications.list`) and copied the rows into `NotificationProvider`,
beside the shell's feed rather than through it. Mounted next to the console
shell, it would have read the same rows on a second schedule and kept a second
copy of their read-state: the duplicate-scheduler shape that objectui#4197,
objectui#4225 and objectui#4316 removed. It had no consumers. Before the
removal, a census found no call site in this repository (objectui `e6203d756`)
beyond its own file, the package barrel, the notifications guide and CHANGELOG
entries. It also found none in the sibling `objectstack` (`338feda6`) and
`hotcrm` (`087b7c5`) repositories. Importers outside those repositories are
NOT MEASURED. Under the ruling on objectui#7389, a published capability with
zero consumers retires immediately, with no deprecation window.

Unchanged: `NotificationProvider`, `useNotifications` and the rest of the
notification system in `@object-ui/react`.

Marked `minor`, not `major`, per the version-alignment convention in
AGENTS.md; the break is real and is stated here.

---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): the record-grained write verdict is memoised PER PRINCIPAL
(objectui#10107).

`useRecordEditable` — the record-level gate behind the detail header's Edit / Delete
CTAs, the drawer's, and (imported from here) the console record page's — asks the
explain engine `POST /api/v1/security/explain` for the row verdict and memoises the
answer so revisiting a record is free. The memo was keyed
`object:recordId:operation`, with nothing about WHO the verdict was computed for, and
it lives at module scope, so it outlives every unmount for the life of the tab.

Signing out does not end that life. This repo already records that no sign-out call
site reloads the page — that is exactly why `AuthProvider.signOut` purges the per-tab
storage caches by hand (objectui#5198) — and this map was not among what it purged. So
the next principal to sign in in the same tab was answered from the previous
principal's verdicts, and answered SYNCHRONOUSLY as the hook's initial state, so no
probe was sent and no later answer could correct it.

Both fail directions were reachable, and both are now pinned:

- a `false` computed for someone else hid Edit from a user who holds a record-level
  `edit` share, for the rest of the tab's life, while `PATCH` on that record
  succeeded — the report this card carries;
- a `true` computed for a privileged principal offered Edit to one holding no grant,
  the UI inviting a write the server refuses. That direction is the worse one.

The key now carries the acting principal (`usePermissions().userId`, the identity
`/me/permissions` already publishes — the verdict itself still comes from the explain
engine alone, so this adds no second source of permission truth), and the map is
dropped whenever that principal changes, so no entry can span a sign-out. A key change
with no cached answer also resets to the hook's fail-open default instead of leaving
the previous key's verdict on screen across the round trip — the same posture the hook
states for every other uncertainty (ADR-0124 D1: the server enforces, the client is
courtesy).

Unchanged: the fail-open contract on an unknown answer, the request shape, the probe's
authenticated channel, and the memo itself within one principal.

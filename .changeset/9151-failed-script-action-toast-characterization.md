---
---

Characterize the console's failed-script-action toast chain end to end (objectui#9151).

Test only; no package is released by this change. The new pin drives a real
`ActionRunner` through the real `createConsoleServerActionHandler` and asserts
what the toast sink is handed for a refused `POST /api/v1/actions/...` — the
question three separate readers answered from code rather than from a run.
It also closes the preimage of "no toast at all" to exactly two shapes: an
authored `toast: { showOnError: false }`, and a handler returning
`{ success: false }` with no `error`.

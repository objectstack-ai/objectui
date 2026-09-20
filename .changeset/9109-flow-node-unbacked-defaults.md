---
'@object-ui/app-shell': patch
---

Stop the flow node inspector declaring defaults the installed spec applies none of
(objectui#9109, triage's direction B).

`FlowConfigField.defaultValue` is documented in its own doc comment as **the spec
default for this key**, and it is acted on as one at three sites: `controllerAdmits`
resolves an unset `showWhen` controller through it, a `boolean` control seeds its
checked state from it, and a `select` control states it on the trigger as a
placeholder. Four declarations had no counterpart on the installed
`@objectstack/spec` at all, which makes them false by that definition:

- `http_request.config.method` declared `GET` — the spec key is optional with no
  `.default()`;
- `screen.config.mode` declared `create` — same shape;
- `wait.waitEventConfig.eventType` declared `timer` — the spec marks the key
  **REQUIRED**;
- `boundary_event.boundaryConfig.eventType` declared `error` — **REQUIRED** as well.

All four declarations are removed. The controls, their option rosters and their commit
paths are untouched — a declaration was deleted, not an editor.

**What changes is DISPLAY only, measured before and after rather than argued.** A
declared default is shown, never written (objectui#6263), so the submit side cannot
observe one: rendering each affected node patches the draft zero times and leaves it
unchanged byte for byte, in both tree states. On screen:

- the four select triggers now draw the "nothing is selected" mark instead of stating
  `GET` / `Create` / `Timer` / `Error` as a placeholder;
- on a **fresh** `wait` node, `Duration` is no longer revealed off an unset `eventType`,
  and on a fresh `boundary_event` node neither is `Error code`. Both were being revealed
  by a controller resolved through a value the runtime never applies — on keys the spec
  *requires*, so the form was telling the author that leaving the key alone was a
  working configuration. They now wait for the author to pick the value the contract
  demands.

Config an author already stored is unaffected: objectui#6499's stored-value re-show rule
keeps a stored `timerDuration` / `errorCode` on screen regardless of its controller, and
that is pinned alongside the removals.

The two `eventType` keys being REQUIRED does **not** leave them without a value — they
never had one from the declaration, since nothing wrote it. Giving those keys a real
runtime default would mean adding `.default()`s to a published contract, which changes
what omitting the key means; that is a maintainer's decision and a `packages/spec`
change, and is deliberately not made here.

`flow-node-config.spec-reconciliation.test.ts`'s unbacked register is now empty, and its
re-measurement was rewritten to walk the scope table rather than the register's own rows
— written the old way, an emptied register contributes no case, runs nothing and still
reports green.

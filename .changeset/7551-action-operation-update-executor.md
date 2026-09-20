---
'@object-ui/types': minor
'@object-ui/core': minor
'@object-ui/components': minor
'@object-ui/app-shell': minor
---

Execute the declarative row-level `operation: 'update'` action (objectui#7551, the
objectui half of objectstack#14092; consumes `@objectstack/spec` 17.3.0's
`ActionSchema.operation` / `patch`).

An action authored as `operation: 'update'` with a `patch` of static field values now
runs. Before this change the two keys parsed, published, and read as honoured while no
runner branch consulted them: the action reached the platform action route with its
field values never merged into the request, so the route was asked to write nothing and
answered success for having done so.

**`operation` is read before `type`, and that order is the feature.** The spec
materializes `type: 'script'` on an update action and refuses every other explicit
spelling, so `ActionType` gained no member — which is exactly why `ActionRunner`'s
dispatch table, a `Record<RunnableActionType, …>`, still compiles unchanged across the
spec bump. The cost of that design is paid at dispatch: by the time `type` is consulted
an update action is indistinguishable from any other script action. `ActionRunner`
therefore branches on `operation` first, ahead of both the registered-handler lookup and
the built-in table.

**The write is performed by the platform action route, never client-side.** The runner
composes `{ recordId, params }` and hands it to the registered `script` dispatch, which
POSTs `/api/v1/actions/{object}/{action}` — the write runs as the caller, so the
permission floor, the object's hooks and its validations all fire as for a user edit. A
consumer with no such dispatch registered gets a loud refusal naming the remedy rather
than a client-side `dataSource.update()`, and rather than the silent fall-through to
`executeActionSchema` that reports on an action which never ran. A route refusal — a
4xx/5xx, or the HTTP-200-with-`success:false` business rejection — surfaces with its own
code and message instead of a green success toast.

`patch` is merged **under** the collected `params`, per the spec's own wording, so a
declared fixed value can be overridden by an input the user actually answered. With
`undoable: true` the Undo affordance captures the prior values of exactly the fields the
action wrote — a param-collected field included, since restoring only some of an edit
while reporting a full undo is worse than offering none.

The four declared action renderer surfaces (`action:button`, `action:icon`,
`action:group`, `action:menu`) forward both keys; `check:action-forward-parity` is what
enumerates them and what fails if one is missed. `element:button` is excluded by its
inline `InlineActionSchema` contract, and the spread-based hosts carry the keys through
by construction. The Studio action inspector authors the pair on a second axis beside
`type`, mirroring the spec's refusal set: switching into an update action clears the
keys it refuses, the type control pins to `script`, and `list_toolbar` placement is not
offered (that bar's home for the same intent is a list view's `bulkActionDefs`).

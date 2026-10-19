---
'@object-ui/core': patch
'@object-ui/components': patch
'@object-ui/app-shell': patch
---

The Undo of an `operation: 'update'` action covers the `patch` of the declared action its `name` names, and no action renderer forwards a page action row's own `patch` (objectui#13022, following `@objectstack/spec` 18 retiring that row key, objectstack#24442).

A page action row (`action:button`, `action:icon`, an `action:group` / `action:menu` member) with `operation: 'update'` runs the declared action its `name` names. The platform action route resolves that declaration by name and writes its `patch` under the collected params. The row's own `patch` reached no request since objectui#12941, and the runner read it only for the Undo snapshot, so the snapshot covered the wrong fields. A row with no `patch` of its own snapshotted the collected params alone, not the fields the route wrote.

- **Undo restores the fields the route writes.** `ActionRunner` reads the `patch` of the declaration the action's `name` names from the `objectActions` its host publishes beside `objectName`, plus the collected params. A declaration with no `patch` keeps the params-only snapshot. A written field the row does not carry still offers no Undo.
- **The console publishes the declarations.** `useConsoleActionRuntime` and the record page publish the object's `actions` as `objectActions` in the runner context, beside `objectFields`.
- **A host that publishes none** is unchanged for an action it dispatches whole (a grid row, a declared-actions bar, a related-list row): the runner reads that def's own `patch`, which is the declaration's.
- **`action:button`, `action:icon`, `action:group` and `action:menu` no longer forward `patch`.** The request body is unchanged: it carries the collected params alone, as since objectui#12941.

The `patch` input `action:button` and `action:icon` publish is unchanged here. It follows the spec pin.

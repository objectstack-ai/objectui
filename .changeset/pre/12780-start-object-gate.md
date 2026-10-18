---
'@object-ui/app-shell': patch
---

The flow designer's start node offers each field on exactly the triggers the engine reads it for (objectui#12780).

Clause-②: no

- **Object is a record-change field.** The engine reads a start node's `config.objectName` for a record-change trigger only. The start node used to offer Object for a Schedule or Webhook / API trigger too, and the New automation dialog asked for an object for both and wrote it, although neither trigger reads it. It is now offered for the record triggers only. A time-relative sweep's object stays the Sweep object field (`config.timeRelative.object`), which the sweep requires. A stored Object on a schedule start node, such as the one app-todo's `task_reminder` stores, is still shown, with the "Kept, not in effect" banner. Opening the node writes nothing, and a save keeps the key as stored.
- **Entry condition is never flagged as not in effect.** The engine evaluates a start node's `condition` at the start of every run, a manual run of a flow with no trigger included. The field is now shown on every start node, and a stored condition under a Manual trigger, or with no trigger, no longer carries the banner.
- Object's help now reads "Object whose record changes start this flow."

Nothing on the package entry changes: no export, prop or type.

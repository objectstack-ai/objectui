---
'@object-ui/components': patch
---

fix(components): an `action:menu` trigger stays disabled while its action runs, and a disabled `action:group` disables its buttons (objectui#11182)

On a schema-rendered page, an `action:menu` whose action was still running showed its
spinner but its trigger could still be pressed, so a second run could start (a duplicate
record, a duplicate send). `SchemaRenderer` hands every component a `disabled` key, even
when its value is `undefined`, and the menu spread that key over its own in-flight
verdict. A menu mounted straight from the registry, which is how `action:bar` mounts its
overflow menu, was not affected.

`action:group` lost the host's `disabled` verdict the same way. In inline mode it landed
on the wrapping `div`, where it disables nothing. In dropdown mode it was dropped. A
disabled group therefore left every member button (inline) or its trigger (dropdown)
pressable.

Both renderers now read the host's `disabled` by name, as `action:button` and
`action:icon` already did (objectui#9131). The menu trigger is disabled while the host
says so or while an action is in flight. It re-enables when the action settles. A
disabled group disables every inline member and its dropdown trigger. An idle menu, and
a group that no host disables, behave as before.

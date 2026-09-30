---
'@object-ui/console': patch
---

fix(console): a `FormPage` field whose `widget` names nothing registered renders its `type`, not a text box

The spec's `FieldSchema.widget` declares that the override names a registered
field component and "Degrades to the `type` renderer when unregistered".
`FormPage` took an authored `widget` whenever one was present and handed it to
`resolveFormWidgetType`, which answers a spelling nothing registers with the
`text` widget. So a `select` field carrying a `widget` that no widget is
registered under (on the object field or on the form view) rendered a
free-text input, and the user could type a value the picklist never offered.

The `widget` leg now asks the same shared resolver whether the spelling names
anything, and falls through to the arity and `type` legs when it does not.
The select renders its select. A registered widget still wins over the type, a retired spelling
still reaches its tombstone, and an alias the resolver knows keeps resolving
as before. No list of widgets was added: the answer is the resolver's own.

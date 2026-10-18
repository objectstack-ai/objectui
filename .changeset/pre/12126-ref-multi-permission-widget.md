---
'@object-ui/app-shell': minor
---

A Studio form field that declares the `ref-multi:permission` widget now renders a picker of the declared permission sets instead of the JSON editor fallback (objectui#12126).

The position form's "Permission sets" row is moving from a free-text tag box to this widget
(objectstack#22794, ADR-0131 D4: a reference to a declared item is by machine name). The metadata
forms had no renderer for `ref-multi:permission`, so that row would have become a raw JSON box with a
"falling back to JSON" note. The new widget lists the permission sets the position names, each with a
remove button, and offers an "Add permission set" picker of the declared sets not yet picked; a pick
adds the set's name. The stored value stays a list of names. A stored name the permission-set
registry does not declare stays in the list and is marked "(not found)". While the list is loading
the add box is disabled; if it fails to load the field shows the load-failure notice beside a text
box that still adds a typed name. A form whose host supplies no permission-set list takes typed names.

The metadata editor loads the permission-set list only for a form that declares the widget, so no
other editor sends the extra request.

`SchemaForm`'s `widgetContext` prop gains one optional member, `permissionSets`, the list the new
widget reads. It is additive: a host that passes no `permissionSets` renders exactly as before, except
that a `ref-multi:permission` field now takes typed names instead of showing the JSON fallback.

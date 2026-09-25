---
'@object-ui/plugin-list': minor
---

fix(plugin-list): a map list view requests the fields its markers are drawn from

`ListView` builds its `$select` projection from the authored columns plus each
view kind's per-row bindings. Kanban, calendar, gallery, timeline and gantt each
had an arm there; the map had none, and the candidate keys named none of its
bindings. A map view whose columns omit the location field therefore asked for
`id` plus those columns, and on a backend that honours `$select` every row
arrived without coordinates: a map with no markers, and no error.

The request shape changes: a map view now also requests the fields `ObjectMap`
reads off each row — `locationField`, or the `latitudeField` + `longitudeField`
pair, plus `titleField` and `descriptionField`. They are read through the same
resolver the map render branch and the view switcher already use (the spec's
view-level `map` block merged per key over the `options.map` bag), so a bag value
the view-level block shadows is not requested. A binding that names a lookup is
also expanded, as the map's own fetch already does.

Every one of these fields passes the same checks as the other view bindings: a
field the current user may not read is never requested, and a name the object
does not declare is never sent.

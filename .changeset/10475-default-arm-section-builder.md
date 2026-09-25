---
'@object-ui/plugin-form': patch
---

fix(plugin-form): the default `object-form` layout draws a section's members in the order the section lists them, and applies each section entry's overrides

With explicit `sections` and no `formType`, `ObjectForm` resolved each
section's members with a name filter over the form's field list. The members
came out in the order of that list (top-level `fields`, or the object's own
field order), not in the order the section wrote them, and a section entry
written as a spec `FormFieldSchema` object (`{ field: 'note', label: …,
required: true }`) kept only its `visibleOn`, `colSpan` and `span`. Every other
override was dropped without a warning. An authored `required: true` was
therefore not enforced, and `label`, `readonly`, `hidden`, `helpText`,
`placeholder`, `options`, `min` / `max`, `widget` and `visibleWhen` did nothing.
The `drawer`, `modal`, `tabbed`, `wizard` and `split` layouts already honoured
all of them, so the same `sections` block laid out differently depending on
`formType`.

The default layout now builds sections the way the other five do. Members
render in the section's order, and every entry override applies: `required`
refuses an empty submit, and `visibleWhen` hides the member until the record
satisfies it. Two things stay as they were. First, a section member that the
top-level `fields` does not list is still dropped, with its console warning,
because the two keys intersect. Second, the form's own field definition
remains the starting point for an override, so an override does not lift a
managed object's field lock, and field-level security still hides or locks
each member. The same fix reaches `object-master-detail-form`, whose parent
form renders through this layout.

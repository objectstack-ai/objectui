---
'@object-ui/plugin-form': patch
---

The record dialog now draws a `form.sections[].group` section (objectui#11542).

A form view section can declare its members by pointing `group` at one of the
object's `fieldGroups` (the reference form of objectstack#13855). `ObjectForm`
resolved that form, but `ModalForm` did not, and the console's More actions ›
Edit / New dialog and action-opened modals mount `ModalForm` directly with the
form view's sections as authored. A `{ group }` section therefore reached the
dialog with no fields and was dropped: a tabbed form view showed no tab for the
group, a stacked one showed no header, and the fields only that group carries
could not be edited in the dialog.

`ModalForm` now resolves its sections through `resolveSectionGroupReferences`,
the same resolver `ObjectForm` uses, against the object schema it already
loads. The group's section is drawn with the group's label and members in both
content layouts, its members pass the same field-level security gate as
enumerated fields, and an unknown group renders nothing and is reported once,
as it is on `ObjectForm`. A section list that uses no `group` reaches the
dialog unchanged.

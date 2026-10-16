---
'@object-ui/components': patch
'@object-ui/plugin-form': patch
---

fix(components): fields that belong to no field group no longer render under the last group's heading (objectui#11777)

On an object where some fields join a declared `fieldGroups` entry and the rest join none, the create and edit forms drew the ungrouped fields straight on under the last group's heading, in the same grid and even in the same row as that group's last field, so they read as its members. The Studio form designer shows those fields apart, in their own trailing area.

The form renderer now ends a section's field grid where the section's heading stops claiming fields. The fields after it start a block of their own below a rule, with no heading and no placeholder title. Ungrouped fields keep their place after the groups, and a section without a heading that follows a titled one is set apart the same way. Every stacked form layout gets this: the default form, `formType: 'modal'` and `formType: 'drawer'`, with sections derived from `fieldGroups` or listed explicitly. A form with no groups, a form whose every field is in a group, collapse and a group's `visibleWhen` render as before.

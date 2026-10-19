---
'@object-ui/plugin-form': patch
---

A master-detail edit form now applies its line rules to the header record however late that record loads (objectui#13062).

A line column's `readonlyWhen` / `requiredWhen` rule that reads `parent.*` was evaluated against a copy of the header form read from the page at mount and 120, 360 and 800 ms after it. When the header record loaded later than that, `parent` stayed empty. A stored paid invoice then opened with its `readonlyWhen: parent.status == 'paid'` line cells editable until the user changed a header field.

The line grids now take the header's own record when the header's read returns, and the user's header edits apply over it as they are made. A status change still locks or unlocks the cells at once. The timers are gone. A create form starts from its prefilled values (`initialValues` / `initialData`).

Nothing is added to the package entry: no export, prop or type member.

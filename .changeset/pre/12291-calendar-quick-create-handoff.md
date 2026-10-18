---
'@object-ui/plugin-calendar': minor
'@object-ui/app-shell': minor
---

Calendar quick-create no longer offers a dialog that cannot succeed. On an object with a required field it cannot fill, an empty-day click opens the full create form with the clicked day already set (objectui#12291).

The quick-create dialog asks for a title only. Its write fills the date fields and, for the other required fields, a declared default, a select's first option, `false` for a boolean or `0` for a number. A required field outside that set, such as the required `project` lookup on the stock `showcase_task`, was left empty, and the create was refused with 400 "Project is required" while the dialog offered no Project input.

- **`@object-ui/plugin-calendar`.** Before the dialog is offered, the calendar checks the object's required fields against what its write can fill. The check and the write read one statement of that set. A required field the server fills on insert (declared `readonly` or `system`, or an `autonumber`) does not count. Where every required field can be filled, the dialog is unchanged. Where one cannot, the empty-day click, or a range drag in the week and day grids, calls the declared `onEdit` prop with a new record (no `id`) that carries the date values the dialog would have written. The host then opens its full create form with them. `ListView` already passes its `onEdit` down to the calendar, and in the console that is the handler that opens the record form. With no `onEdit`, the gesture offers nothing on such an object. A caller-supplied `onDateClick` still takes precedence, and the `calendarQuickCreate` permission row still gates both paths. The dialog gets no lookup picker, and no lookup value is guessed.
- **`@object-ui/app-shell`.** The console's record-form handler already treated a record with no id as a new one. It now opens the create form pre-filled with the values such a record carries. The record-form overlay gets them as its initial values, carried in the state of the history entry that opens it, so Back and a refresh keep them. A page-mode object (`editMode: 'page'`) gets them as the query-string prefill its create page already reads. `onEdit(null)` (the list's New) and a record with an id behave as before.

No export, prop or type member is added, and no language-pack key or URL parameter. `ObjectCalendarComponentProps.onEdit` was already declared and forwarded; the calendar did not call it until now.

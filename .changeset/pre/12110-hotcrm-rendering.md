---
'@object-ui/plugin-grid': patch
'@object-ui/components': patch
'@object-ui/fields': patch
'@object-ui/plugin-form': patch
'@object-ui/plugin-detail': patch
'@object-ui/plugin-gantt': patch
'@object-ui/console': patch
---

Console rendering fixes from the HotCRM browser pass (objectui#12110):

- **Grid:** a view column's authored `label` is the header. It used to lose to the field's translated label whenever the app bundle translated the field.
- **Form:** a field `widget` that names no registered component falls back to the field type's renderer, as the spec's `widget` description says. A `rating` field declaring `widget: 'star_rating'` now draws the star widget instead of a text box. A built-in control name (`input`, `textarea`, …) and the native password and email inputs still render as before.
- **Cells:** a `rating` value draws stars out of the field's `max` (5 by default) in list, detail and related-list cells, instead of a bare number.
- **Reference rail:** a related row is named by its object's declared `nameField`, and the rail refetches in place when the record, a related object or everything is invalidated. A record action with `refreshAfter: true` therefore refreshes the rail too.
- **Gantt:** the task list, the tooltip and the drag previews show a date's year when it is not the current year.
- **Approvals drawer:** a `position:` approver shows the position's label, from the console's position registry, instead of a truncated id. The headline figure prefers the object's declared `currency` field and never shows a zero from a field matched only by its name.
- **Public form:** a form with no title of its own is headed by its object's label, not the object's API name.

---
'@object-ui/app-shell': patch
---

A refused view save is now said to the user, and the Create View dialog no longer closes as if the view were saved (objectui#11578).

Both doors that persist a new view, "Save as view" on the object data page and Create View on
the object page (the view tab bar's add button, and the view-config panel's create mode), caught
a failed save with a `console.error` and nothing else, while the dialog had already closed. A
permission refusal, a name collision or a spec refusal therefore looked exactly like a saved view.

- Each door now raises the refusal through the console's error toast: a "Failed to save" lead
  with the save door's own message, which lists the field-anchored issues of a validation
  refusal one per line and otherwise shows the refusal's text.
- The Create View dialog waits for the save. It closes once the view is saved; when the save is
  refused it stays open with the user's label, name and picks intact, and Create is enabled
  again. Create is disabled while the save is in flight, so a second press cannot save twice.

A successful save navigates to the new draft in preview mode, as before.

---
'@object-ui/app-shell': patch
---

fix(app-shell): a record page's delete asks through the console's own confirm dialog (objectui#11001)

On a record page, More actions then Delete asked through the browser's native
`window.confirm` box, while the list view's delete (and every other destructive
action in the console) asks through the in-app confirm dialog. The native box
cannot be themed, and headless automation dismisses it, so the button read as
dead in tests.

`RecordDetailView`'s header Delete now awaits the page's own confirm handler,
the one it already hands the action runner, which opens `ActionConfirmDialog`
with the same question as before (`detail.deleteConfirmation`) and the dialog's
default title and buttons, as on the list view. Confirm runs the existing delete
unchanged; Cancel leaves the record and the page as they are. No pack key is
added.

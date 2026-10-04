---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

A refused save, pin, reorder, view setting, report save, publish or discard in the console is now said to the user, and the view-config panel no longer reports a refused save as saved (objectui#11583).

objectui#11578 made the two Create View doors say a refused save. The console's other metadata
writes on the object page, the report page and the draft bar still caught a refusal with a
console line and nothing else, so a permission refusal or a spec refusal looked like a saved
change:

- the view-config panel's Save on an existing view;
- pinning or unpinning a view, and reordering views in "Manage views";
- a toolbar setting on a list view (density, sort, columns, hidden fields), when the server
  refuses it (the console's own permission check already said its refusal, and still does);
- the report editor's Save;
- Publish and Discard draft on the draft bar of those two editors.

Each now raises the refusal through the console's error toast, with the save door's own
message: the field-anchored issues of a validation refusal, one per line, or the refusal's text.
The draft bar's toasts lead with "Publish failed" or "Discard failed", two new strings in all
ten language packs; the others lead with "Failed to save". Set as default, which already raised
an untranslated "Failed to set default view" with no reason, now does the same.

The report editor waits for its save. It closes once the report is saved; a refused save leaves
it open with the edit in place, so Save can be pressed again (it used to close at once, and
reopening it showed the stored report). Save is disabled, and the editor read-only, while the
save is in flight.

The view-config panel waits for the save before it reports the edit as saved. A refused save
leaves the panel dirty, so Save stays enabled for a retry, and the "unpublished changes"
indicator is not raised for a draft that was never written. Save is disabled while the save is
in flight. `ViewConfigPanel`'s `onSave` accepts any return, as it did when it was typed `void`:
the panel awaits it, and `false` (returned, or resolved by a promise) or a rejection means the
save was refused; anything else, nothing included, is read as saved.

---
'@object-ui/components': patch
---

`data-table`: an inline edit made while a row save or Save All is in flight is no longer dropped when the save settles (objectui#12322).

Cell editing stays open during a save; only the save and cancel buttons wait for it. A save used to settle by rebuilding the pending edits from the copy it read when it was pressed, so anything staged during the round trip disappeared, unsent and with no signal: an edit on another row, an edit on another column of the row being saved, or a new value for the cell being saved.

- A save now settles against the pending edits as they stand when it returns, and removes only what it sent: for each record it sent, each cell whose pending value is still the very value it sent. Everything staged during the save stays pending and drawn, and a later Save All sends it.
- A cell re-edited during its own save keeps the new value pending, including a value equal to the one the row loaded with: the save writes the old edit, so the loaded value is a change again once it lands.
- A per-row `{ failed }` outcome keeps the failed rows pending and flagged, as before. A rejected Save All flags the rows it sent, and not a row staged while it ran.
- When a save settles, it closes only the editor that was open when it was pressed. An editor opened during the save stays open with what was typed.

The `onRowSave` and `onBatchSave` callbacks and the `{ failed }` outcome keep their shapes.

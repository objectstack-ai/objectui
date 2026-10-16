---
'@object-ui/app-shell': patch
---

Studio's field inspector closes when you leave the view that opened it, and a read-only package reads as read-only (objectui#11781).

- **The field inspector belongs to its view.** In the Data pillar, opening a field's *Field properties* from Records or Form and then switching to another view (Records, Form, or Advanced → Validations, Hooks, Actions, API or Settings) closes the inspector, the same as its Close button. Re-selecting the view you are on keeps it open. Escape closes it as well, unless something inside it (an open menu, select, dialog or autocomplete) already answered that Escape, or the key was pressed outside the Data pillar.
- **Read-only wording.** On a read-only package the Form view's layout caption says it is a read-only layout instead of "Draft layout", the form designer's hint says the package is read-only and that a click shows a field's properties instead of "Drag to reorder…", and each field card's accessible name drops "drag to reorder", its grab cursor and its drag handle. The Access pillar's banner says the package is read-only, in a muted chip, instead of the amber "saved as draft"; its tooltip says the permission sets can be viewed but not changed. Writable packages are unchanged.
- **Read-only look in the validation editor.** On a read-only package the Validations editor's inputs, selects and JSON boxes wear the same disabled look as the field inspector's inputs, instead of the editable white fill and dark text.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).

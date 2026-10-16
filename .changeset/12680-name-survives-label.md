---
'@object-ui/app-shell': patch
---

In the metadata designer's create mode, a Name the author typed is no longer replaced when the Label is typed afterwards (objectui#12680). This holds for the object, report and dataset designers.

Two things wrote the name from the label while a new item was being authored, and each one lost a typed name:

- **The page's label → name rule** (the registry's `createDerive`, which object and report declare). It stops once the author edits the target field, but only the generic form told it about such edits. A Name typed in the designer's home panel was never reported, so the next Label keystroke replaced it with the label's slug. In a namespaced package that dropped the namespace prefix, and the publish gate then refused the object with `NAMESPACE_PREFIX`. A name written in the Source tab next to a label was re-derived the same way: `"name": "repairs_qa_invalid_probe"` was sent as `qa_invalid_probe`. The object's label → plural label rule replaced a typed Plural label in the same way. Edits made in the home panel and in the Source tab now count as the author's edits, so a field the author changed there is no longer re-derived.
- **The home panel's own Label handler.** It recorded "the author edited the name" in component state, and switching Properties → Source → Properties remounts the panel, which cleared that state. The panel now reads the fact from the draft: the name follows the label only while it is empty or still equals what the current label derives.

With no Name typed, the Label still fills it in as before. An existing item's name never follows its label. Nothing is added to or changed on the package entry: no export, prop or type.

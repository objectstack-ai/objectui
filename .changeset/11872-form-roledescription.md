---
'@object-ui/app-shell': patch
---

Studio's form designer announces a field card's role in the author's language (objectui#11872).

A screen reader read every field card in the Form tab's designer as "sortable", in English whatever the console language: dnd-kit writes that word into `aria-roledescription` when it is given no role of its own. Each card now announces "draggable field", or its zh translation, after the card's label.

A card in a read-only package cannot be dragged, so it now announces no custom role, and a screen reader reads it as a plain button. Its blank `aria-roledescription` is one the accessibility tree does not expose.

Dragging, selecting and what is saved are unchanged. Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables.

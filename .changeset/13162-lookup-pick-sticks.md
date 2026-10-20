---
'@object-ui/fields': patch
---

A lookup's quick-picker takes the choice after a search, and a single-select lookup's trigger shows the picked record (objectui#13162).

- **Enter after a search sets the value.** The quick-picker had no active row until an arrow key moved to one, and the row an arrow key chose was dropped when the debounced search answer replaced the list. Typing a term and pressing Enter therefore set nothing, which a required field then refused ("Manager is required"). Once the rows on screen answer the typed term, the first one is now the active row (announced through `aria-activedescendant`), and Enter takes it. While the answer is still pending, no row is made active, so Enter cannot take a row the typed term did not ask for. A click on a row is unchanged: it always set the value.
- **The trigger shows the picked record.** A full-size single-select lookup drew its value as a chip above a trigger that went on reading "Select…", so a field holding a value read as one still asking for it. The trigger now reads the record's label (the whole label on hover when it is cut short), as the compact grid-cell editor already did, and a search-first (people) field also draws the avatar the chip used to draw. The chip's clear control moves beside the trigger, with the same accessible name ("Remove …") and the same rule: a disabled field offers none. A multi-select lookup keeps its chips and its "N selected" trigger. The placeholder now reads muted in both sizes, so an empty field and a filled one look different.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The query kernel the pickers share (`useRecordQuery`, which the package entry does not export) now reports the search term its records answer, which is how the quick-picker tells the two states apart.

---
'@object-ui/plugin-form': patch
---

A master-detail form no longer takes input into its lines, or sends a second batch, while its save is in flight. A slow save can no longer write the same records twice, or leave the lines it created without their ids (objectui#10631).

**Clause-②: no.** No exported symbol, type or prop changes. The line-item grids are given the `disabled` prop they already had.

**Before.**

- Save re-armed 1.5 s after it was clicked, whatever the batch was doing. With a batch slower than that, a second click sent a second batch built from the same baseline. In edit mode the lines that save created were created twice; in create mode the whole document, parent and lines, was.
- The lines stayed editable during the save. A line the save creates takes the id the batch returns for it only while it is still the row object the batch was built from, and a grid with a sort field (a child field named `position`, `sort_order`, `sequence`, `line_no`, `line_number` or `sort`) replaces every row object on any change. One keystroke in such a grid during the save left every line the save created without its id, and the next save deleted and re-created all of them.
- A save started by submitting the header form without the Save button (an implicit submission, when the header has a single text input) left Save and the lines enabled, and a second such submit sent a second batch.

**What changed, in observable terms.**

- Save stays disabled and reads "Saving…" until the batch succeeds or fails. A failed batch re-enables it, and the refusal is shown as before. The 1.5 s release is kept for a submit that never reaches the batch, such as a header that fails validation, so Save is never left stuck.
- While a save is in flight every line-item grid is disabled: no cell takes input, and there is no empty trailing row, add, duplicate, remove or reorder. An open row editor ("expand to full form") is disabled too, "Apply" included. Both take input again once the save has settled.
- A header-form submit that arrives while a batch is in flight is refused and sends nothing. The host's `onError` hears of it, and the save that is running keeps Save disabled until its own outcome.
- The header fields stay editable during the save. In edit mode an edit made there is kept and sent by the next save; in create mode the header still clears for the next entry once the create lands.
- The `record:line_items` panel's grid is disabled while its own save is in flight. That panel reloads its rows once the save lands, so a line edited in the meantime used to be overwritten by the reload, with the panel reading clean.

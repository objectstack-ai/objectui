---
'@object-ui/app-shell': minor
'@object-ui/plugin-list': patch
---

Studio Data pillar layout (objectui#12450, epic objectui#12446).

- **Seven flat tabs.** Records, Form, Validations, Hooks, Actions, API and Settings sit in one underline tab row when the content column is 1000px or wider. Below that, the last five fold back into "Advanced ▾", whose trigger keeps its own name whichever panel is open. A container query on the content column decides the fold, so it also responds when the field inspector opens beside the column.
- **Object header buttons.** The object header gains an Object settings button, which opens the Settings panel, and a More button. Add field moves from the header row into the More menu. It is also still in the grid's "+" column header and in the form designer.
- **Records toolbar and grid.** The Records tab drops the framed card and the body padding around the list, so the toolbar, grid and footer run flush with the column. Its toolbar is the list's wide form: Hide fields, Filter, Group and Sort as labelled buttons, then Refresh, Search and Add record. There is no density control.
- **List search button name.** The list toolbar's icon-only Search button now has an `aria-label`, like Refresh. When a keyword is active, its accessible name is "Search: KEYWORD" instead of the bare keyword.

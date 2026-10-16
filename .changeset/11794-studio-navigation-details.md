---
'@object-ui/app-shell': patch
---

Studio navigation details (objectui#11794):

- **The Data pillar's *Advanced* trigger keeps its own name.** With one of its panels open it used to rename itself to that panel ("Validations"), which hid the word that says sibling panels sit behind it. It now always reads *Advanced*, takes the active pill while one of its panels is open, and the menu marks the open panel as the checked item (the items are radio items now, so assistive technology reads which one is open).
- **The Automations rail can be searched.** A search box above the flow list matches a flow's label or its machine name, case-insensitively, and a search that matches nothing says so. A flow's name wraps instead of being cut to a stub.
- **Create app opens the Interfaces pillar**, where the new app lives, instead of leaving its author on the pillar the button was pressed from. The create writes exactly what it wrote before; only where the author lands changes. Leaving a pillar that holds an unsent edit asks first, as a pillar link does.

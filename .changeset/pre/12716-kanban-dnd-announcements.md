---
'@object-ui/plugin-kanban': patch
'@object-ui/i18n': patch
---

The kanban board's drag-and-drop tells a screen reader the card's title and the column's label, in the console's language, instead of the record id and the option value (objectui#12716).

The board's `DndContext` passed no `accessibility` announcements, so dnd-kit read its default English sentences, which name the dragged card and its target by their ids: "Draggable item gZguOoFVfxm_pSPG was moved over droppable area 4iDmJaZr0O0St1fb". The board now hands it announcements built from what is on screen, after the form designer's (objectui#11802):

- **Pick-up:** "Picked up Content backlog in To Do."
- **Over a card:** "Moving Content backlog over SEO migration plan in In Progress." **Over a column's empty area:** "Moving Content backlog over Done." **Over nothing:** "Moving Content backlog. It is not over a column."
- **Drop:** "Moved Content backlog to In Progress." when the board moves the card to another column, and "Dropped Content backlog. It stays in To Do." when the drop moves nothing (its own column, itself, or nothing).
- **Cancel:** "Cancelled moving Content backlog. It stays in To Do."

Each id is resolved the way the board's drop resolves it, so the column a sentence names is the column a drop there lands in. A card or column with a blank title, or one the board no longer holds, is named "an untitled card" or "an unnamed column", never by its id.

`@object-ui/i18n` gains nine keys under `kanban.dnd` in all ten language packs (`start`, `overCard`, `overColumn`, `overNone`, `moved`, `dropped`, `cancelled`, `untitledCard`, `unnamedColumn`). Each sentence is one key with the names interpolated, so a language orders them as it needs. A board with no translation provider reads the same English sentences.

Nothing else on the board changes: drag behaviour, sensors, collision detection, the screen-reader instructions and the existing strings are as they were. Nothing is added to `@object-ui/plugin-kanban`'s entry: no export, prop or type.

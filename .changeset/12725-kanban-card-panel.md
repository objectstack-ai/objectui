---
'@object-ui/app-shell': minor
'@object-ui/plugin-kanban': patch
---

In Studio's Interfaces pillar, a click on a card of a kanban view's board selects the board's card, and a 看板卡片 (Kanban card) section in the view's properties edits it (objectui#12725, target 2: clicking a canvas element switches the right slot to 属性 for that element).

- **Select, not open.** On an `object` leaf whose list view renders as a kanban board, a click on a card inside the Studio canvas switches the slot to 属性 with the 看板卡片 section, outlines the clicked card, and the status line reads 「已选中：看板卡片 · Esc 取消选中」. There the click does not open the record, and a press on a card does not start a drag. Enter, or Space, on a focused card selects it in the same way (a card opens on those keys elsewhere). A button or link drawn inside a card keeps its click. Esc, or a click on empty canvas, clears the selection; the slot keeps the view's properties.
- **The 看板卡片 section** shows only on a kanban view and writes keys the spec declares, each control its own key: the card fields (`kanban.columns`, ordered), the title (`kanban.titleField`; 记录名称 removes the key and the card shows the record's display name), click to open (`navigation.mode`, over the spec's navigation modes; 默认 removes the key) and the group-by field (`kanban.groupByField`). The spec requires the group-by field and the card fields on a kanban block, so on a view with no block the title and the card fields wait until a group-by field is picked. There is no colour control.
- **The board outside Studio is unchanged:** a click opens the record and a drag moves the card. Each card now carries `data-kanban-card` with its record id, which the Studio canvas reads to tell which card was clicked; markup only, no prop or export changes. A canvas registered over the default (`registerStudioCanvasPreview`) gets no card selection.

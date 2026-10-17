---
'@object-ui/app-shell': minor
---

In Studio's Interfaces pillar, a click on a column header in an `object` leaf's canvas selects that column in the view's properties (objectui#12725, target 2: clicking a canvas element switches the right slot to 属性 for that element).

- **Select, not sort.** Inside the Studio canvas, a click on the header of a column the view lists selects that column's row in the Properties panel's column list, switches the slot to 属性 (the copilot folds to its strip at the slot's foot), outlines the header, and the status line reads 「已选中：COLUMN · Esc 取消选中」. The click does not sort there. A header the view does not list has no row to select and keeps the runtime's click, which sorts. The records grid outside Studio is unchanged.
- **Back to the view.** Esc, or a click on empty canvas, clears the column selection; the slot keeps showing the view's properties. A column picked in the panel's list is the one outlined on the canvas.
- **Scope.** The channel is a Studio-internal context beside `StudioCanvasPreviewProps`, which is unchanged. The default `object` canvas reads it; a canvas registered over the default (`registerStudioCanvasPreview`) gets nothing and keeps the view-level properties. Dashboards and pages behave as before. A kanban card's properties are not part of this change.

Clause-②: no. No published prop, export, spec key or language-pack key changes; the status line reuses the existing 「已选中」 copy.

---
'@object-ui/plugin-designer': minor
---

The page and report designers, and all three canvases, draw the members their node declarations always carried and they never read. Every designer registration's `inputs` now lists the members its component reads (objectui#11434).

**BREAKING (rendering)** — a report field element draws its `dataBinding` and no longer reads `properties.field`. The designer writes `dataBinding` itself now: a new field element is born bound to `field_name`, and the property panel's **Data binding** entry edits it on every element type. Migration: move a saved element's `properties.field` to its `dataBinding`. `@object-ui/types` refuses the old key by name in the same release.

**All three canvases.** `canvas.backgroundColor` is drawn on the page, data-model and process canvases. The colour is published as a CSS custom property and painted by a static utility (the styling rule's author-declared-colour carve-out), so a theme can still override it.

**Page designer.**

- A component's `children` are drawn inside it, positioned within it, and indented under it in the component tree. Selecting, editing, moving, copying and deleting all reach nested components.
- A `locked` component cannot be dragged or deleted on the canvas, and shows a lock. No delete path removes it: its own delete button is withheld, and Delete / Backspace and the toolbar's **Delete selected** delete only the unlocked rest of a selection. A parent that holds a locked component anywhere inside it is kept too, because deleting it would take the locked one with it.
- A component with `visible: false` is drawn faded, with a dashed edge and a hidden marker, so it can still be found.
- `zIndex` orders overlapping components.
- The property panel offers **Visible**, **Locked** and **Z-index**.
- The palette draws each category's `icon` and each item's `icon` (any Lucide name; an item without one keeps the generic "add" glyph), and an item's `preview` as a thumbnail.

**Report designer.**

- An element draws its `format`: weight, style, alignment, colours, font, border and padding on its content, and `numberFormat` / `dateFormat` beside its binding. Every value goes through a CSS custom property and a static utility.
- A section draws its `groupField` in its label (`by FIELD`), and a page-break rule across its top when `pageBreakBefore` is set.
- The page draws its four `margins` as a dashed guide.

**Registration inputs.**

- `page-designer` adds `palette` and `propertyEditor`.
- `data-model-designer` adds `canvas` and `showRelationshipLabels`.
- `process-designer` adds `version`, `lanes` and `canvas`.
- `report-designer` adds `pageSize` and `orientation` (enumerated), and `margins`.
- Every designer row that was typed `code` is now declared by its value's kind: `page-designer` `canvas` (object) and `components`, `data-model-designer` `entities` / `relationships`, `process-designer` `nodes` / `edges`, `report-designer` `sections`, `object-manager` `objects` and `field-designer` `fields` (each an array). A `code` row is judged as a string, so a legal value drew `type-mismatch` ("expected a string"); none does now.

Each was a member the component already read. The html-tier page compiler, which builds its manifest from every known registration, warned it off as an `unknown-prop`. Each added row declares the kind its value has (`array`, `object`, `enum` or `string`), so a legal value draws no `type-mismatch` either. `object-manager` and `field-designer` already listed theirs.

---
'@object-ui/app-shell': minor
---

Studio has one right slot that shows either the open item's properties or the AI copilot, never both (objectui#12725, items 1, 2, 6 and the canvas half of item 3).

- **One slot, two halves.** The slot is 300 px wide below 1280 px and 360 px from 1280 px up. A segmented header 属性 | AI 副驾 switches the two, and so does `⌘.` / `Ctrl+.`. The top bar's right-most icon shows or hides the slot. The slot opens on the copilot. Its shown state is remembered per tab under the key the Studio dock used, so the console dock's own state is untouched. Under `md` the slot overlays the page and starts closed.
- **Switching by intent.** On the Interfaces pillar, selecting a canvas element (a dashboard widget or a page block, through the designer's `onSelectionChange`) or a nav entry in nav editing switches the slot to that element's properties. Esc, or a click on empty canvas, returns to the item's own properties. While the properties show, the copilot folds to a 40 px strip at the slot's foot that leads back to the conversation, and marks a plan that awaits approval.
- **No canvas tabs.** The Interfaces canvas loses its 画布 / 源码 / 属性 tabs (the folded center tabs and a source page's Source / Properties tabs). One status line sits above the canvas and says what it shows; beside the slot it also says what a click does. The item's ⋯ menu opens its definition (a source page's code editor, any other item's document as JSON) and copies its JSON. A newly created page opens on its definition.
- **Pillar names from 1024 px.** The Data, Automations, Interfaces and Access names show from `lg` (they showed from `xl`), with icons and tooltips below.
- **The copilot keeps working.** Its conversation, agent, scope and requests are unchanged; only its host moved. The Data, Automations and Access pillars keep their own asides, and the slot shows the copilot alone beside them. An injected `aiSlot` keeps the classic layout. The folded layout's helpers (`centerTab.ts`, `useIsWideViewport`) and the Studio dock's width key are retired.

Clause-②: no. `StudioDesignSurface` keeps its props and its package export; no spec key, export or language-pack key changes. The new copy is in the metadata-admin designer table.

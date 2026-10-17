---
'@object-ui/app-shell': minor
---

Studio's Data and Automations pillars show their properties in the one right slot, as the Interfaces pillar does (objectui#12725, item 3: properties follow the selection in every pillar).

- **Data.** Selecting a field or a form section, on the Records grid or the Form tab, switches the slot to 属性 and shows the field inspector there. It no longer appears as an aside beside the canvas. The pillar has no properties of its own with nothing selected, so it holds the slot only while a selection stands. Esc, a click on empty canvas or the inspector's ✕ drops the selection and hands the slot back to the copilot. With no copilot served, the slot appears for the selection and hides again after it.
- **Automations.** The flow's Configuration lives in the slot: its empty sentence while nothing is selected, and the node's or edge's configuration on a selection, which switches the slot to 属性. Esc, or a press on the canvas background, returns to the flow's Configuration. In the slot the Configuration takes no width from the pillar's row, so a narrow row no longer opens it as a drawer. The drawer stays where the pillar keeps its aside: the package-less scope and an injected `aiSlot`.
- **Unchanged.** While 属性 shows, the copilot folds to its strip at the slot's foot. A slot hidden from the top bar stays hidden on a selection and opens on its properties when shown. The Access pillar has no properties panel and claims nothing.

Clause-②: no. `DataPillar` and `AutomationsPillar` keep their exported signatures; no spec key, export or language-pack key changes, and no new copy.

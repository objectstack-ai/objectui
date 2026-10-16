---
'@object-ui/app-shell': patch
---

Studio on a smaller or resized window (objectui#11795). Studio stays a desktop tool; three things change below desktop width:

- **The flow canvas re-fits when its width changes.** A window resize, the Studio chat dock opening or closing, or a side panel toggled beside the canvas now frames the diagram again: centred, and zoomed out only as far as the whole flow needs, never past 100%. A flow opened at a narrow width and then widened used to keep the narrow framing, with its Start and End cards clipped at the left edge. Adding, dragging or editing a node still leaves the viewport where it is, and so does a change in the canvas's height alone, such as a notice appearing above it.
- **On a narrow Automations row the Configuration panel opens as a drawer.** When the pillar's row has no room for the 288px Configuration panel beside one flow column, the panel no longer reserves that width. Selecting a node opens its configuration in a drawer over the canvas, and closing the drawer clears the selection. The row is measured on its own, so the Studio chat dock beside it counts. Wider rows keep the panel as before.
- **On a phone, one line under the Studio header says that Studio is built for a desktop screen.**

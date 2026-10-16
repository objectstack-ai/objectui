---
'@object-ui/app-shell': patch
---

Studio's form designer can be arranged from the keyboard (objectui#11871). Picking a field card up with Space or Enter, moving it with the arrow keys and dropping it with Space or Enter now moves the field: within its group, and into another group. The draft records the move, and the live region names the place the field lands, the same as for a pointer drop. Before, every keyboard drop missed its target: the field stayed where it was, the draft was unchanged, and the live region said the field was dropped outside the groups.

The cause was the drag context's collision detection, `pointerWithin`, which answers no drop target when there are no pointer coordinates, and a keyboard drag has none. The designer now uses `pointerWithin` for a pointer drag, unchanged, and `closestCorners` for a keyboard drag.

Nothing is added to the package entry: no export, prop or type member changes.

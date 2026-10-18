---
'@object-ui/app-shell': patch
---

Studio's form designer can be arranged from the keyboard on a canvas of any width (objectui#11898). With a field card picked up, each arrow key now moves it one place in the form's reading order: ArrowDown and ArrowRight one place later, ArrowUp and ArrowLeft one place earlier, from the end of one group into the next and into an empty group, whatever the number of columns. The drop commits the place the live region last announced.

Before, on a form wider than one column, the arrow keys skipped an empty group, so a keyboard author could not put a field into a new group; a full-row field such as a textarea did not move up, or moved to the end of its group; and the first ArrowUp from a group's first field could do nothing. A keyboard drop could also commit one place past the one announced, after the field had been carried into another group.

The cause was the keyboard sensor's coordinate getter, dnd-kit's `sortableKeyboardCoordinates`, which picks each step's target by distance on screen, and the keyboard branch of the drag's collision detection, `closestCorners` (objectui#11871), which then judged the drop target by the same distance. The designer now steps through its own layout, and a keyboard drag is over the drop target that layout names for the place it reached. A pointer drag is unchanged.

Nothing is added to the package entry: no export, prop or type member changes.

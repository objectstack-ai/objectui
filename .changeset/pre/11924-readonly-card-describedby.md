---
'@object-ui/app-shell': patch
---

A read-only package's form designer no longer tells a screen reader how to drag a field card (objectui#11924).

In the Form tab of a read-only package, a field card cannot be dragged, but it still pointed `aria-describedby` at the canvas's drag instructions, so a screen reader read "To pick up a field, press Space or Enter. …" (or the zh translation) for a card that does not move. A read-only card now carries no description; a writable card keeps the instructions.

Selecting a field, the card's name and its place in the tab order are unchanged. Nothing is added to the package entry: no export, prop, type member or language-pack key.

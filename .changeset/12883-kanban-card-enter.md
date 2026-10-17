---
'@object-ui/plugin-kanban': patch
---

A focused kanban card opens on Enter and on Space (objectui#12883). Every card was already a keyboard tab stop, but its only activation was the pointer click, so a keyboard user could reach a card and could not open its record from the board.

- Enter, and Space on its release, call the same `onCardClick` a pointer click calls, handing it the key event. Its readers take `target` (the popover anchor) and `metaKey` / `ctrlKey` (open in a new tab) from it, which a key event carries; a key event has no `button`, so it never reads as a middle click.
- The card is now a `button` inside a `listitem`, the shape for an activatable item in a list. The list item keeps its name, and the card's description (objectui#12837) stays on the focusable button.
- A key pressed on an element inside a card, such as a link a field renders, does not open the card.
- Keyboard drag is unchanged: the board still builds no keyboard sensor.

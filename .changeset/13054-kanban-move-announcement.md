---
'@object-ui/plugin-kanban': patch
---

A kanban card move is announced to screen readers when its write answers, not when the card is dropped (objectui#13054).

Before this change, dropping a card on another column made the drag live region say "Moved CARD to COLUMN." at once, before the server had answered. A move the server refused, such as a task status transition its state machine rejects, was announced as done. A sighted user saw the refusal toast and the card snapping back.

Now a drop on another column says nothing at the drop. The board has its own visually hidden, assertive status region, and it announces the outcome once the write settles:

- **Accepted:** "Moved CARD to COLUMN."
- **Refused:** the same sentence the error toast shows.
- **Waiting for required fields:** nothing. The dialog speaks for that move.

A board with no write of its own (local data) still announces the move immediately. A drop in the card's own column and a cancelled drag say what they said before.

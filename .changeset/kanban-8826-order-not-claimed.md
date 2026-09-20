---
'@object-ui/plugin-kanban': patch
---

fix(plugin-kanban): the board stops showing a card order it persists nowhere

Dragging a card **within its own column** used to reorder the board on the spot.
Nothing recorded that order — the same-column branch notified no one, the mover
returns early when the source and target columns are equal, and the write body
carries the grouped field and no positional key — so the next data round-trip
(a refetch, a poll, any reflow from the host) silently put the card back. The
user performed an action, watched it succeed, and then watched it disappear with
no error, no toast and no rollback animation.

A card dropped inside its own column now returns to its position. On a
cross-column move the column change still happens and is still persisted; the
landing **position** is no longer claimed — the card lands where the data order
puts it rather than in the slot it was released over, on both data ownerships.

Order persistence is not a capability of this board: there is no declared
ordering slot in `@objectstack/spec` for one to be written to. Ruled on
objectui#8826.

---
'@object-ui/plugin-form': patch
---

fix(plugin-form): the line-items panel commits only the answer to its current load, and a save only to the parent it was issued for (objectui#10712)

The `record:line_items` panel (`LineItemsPanel`) loads its rows again whenever
the parent record or a load input changes. When a load was superseded by a
newer one while it was in flight (the host moved the panel to another parent,
say), its answer still landed. Landing last, it replaced the current parent's
lines (since objectui#10740 the rows it brought were refused as another
parent's, so the current lines were gone either way); landing first, it ended
the loading state and drew the grid while the current load was still pending.
Now a superseded load commits nothing: not the rows, not the end of the loading
state.

The panel's save reloaded the rows through the `load` it captured when Save was
clicked. A save that landed after the panel had moved to another parent
re-read the old parent, its lines were then committed into the new parent's
panel (and, since objectui#10740, refused there behind the placeholder), and
its failure was written over the new parent's panel. Now a save reloads only
while the parent it saved is still on screen, reading the panel's current
inputs (sort, limit, filter) rather than the ones captured at the click, and a
save whose parent has left the screen neither re-reads nor reports. No prop,
export or schema key changes.

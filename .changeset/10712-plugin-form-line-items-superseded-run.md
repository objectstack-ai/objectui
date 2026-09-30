---
'@object-ui/plugin-form': patch
---

fix(plugin-form): the line-items panel commits only the answer to its current load, a save only to the parent it was issued for, and holds a same-parent reload while it has unsaved edits (objectui#10712)

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
save whose parent has left the screen neither re-reads nor reports.

A change to a load input other than the parent (sort, limit or filter) re-read
the rows while the author had unsaved lines, and the read's commit discarded
those lines with no signal. Now, as the default record form already does for
its own background re-read, the panel holds such a change while it has unsaved
edits for the current parent: no read is issued, the edited lines stay drawn
and saveable, and the next read that runs (the post-save reload, a parent move,
or the commit of a same-parent read that was in flight) carries the change.
While a change is held, the grid shows the rows under the previous sort, filter
or limit until the panel saves, with no signal. A change while the panel is
clean, a parent move, and a change of adapter or child object still read as
before. No prop, export or schema key changes.

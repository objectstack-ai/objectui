---
'@object-ui/app-shell': patch
---

fix(app-shell): the Studio dataset-filter inspector stores a `between` range as the
spec's `$between`, with both bounds required (objectui#10062)

Executes ruling batch #146 item 5 letter A (objectstack#18012): the `between` arm of the
dataset-filter bridge maps once a both-bounds completeness rule exists, and one does. Until
now a `Between` row in a dataset's or a measure's filter was dropped on every commit —
inertly since objectui#9372, but dropped — so a date range could be drawn in the inspector
and never saved.

- **Both bounds typed** ⇒ stored as `{ field: { $between: [lo, hi] } }`, the spec's own
  token and shape. It reopens as `Between` with both bounds on screen and writes back
  unchanged.
- **A bound missing** ⇒ not emitted. Whether the row is finished is the builder's own
  `isFilterValueComplete` (objectui#5025), not a local check: `0` is a real bound, `''` is
  not. As the only row it commits nothing and the stored filter stays; beside other rows,
  only those rows are stored.
- **A stored `$between` this bridge would not have written** — a blank or missing bound, a
  scalar, a list of the wrong length — is not opened as an editable row. It still goes to
  the Source tab, as it did while `$between` was unmapped, so an edit to another row cannot
  silently remove it.

The completeness check for every other operator now calls the same function; for scalar
and list operators its answer is the one the removed inline check gave.

Forward note for anyone pinning stored filters: a dataset filter written by this version
may carry `$between`, which an older app-shell reads as non-representable and sends to the
Source tab.

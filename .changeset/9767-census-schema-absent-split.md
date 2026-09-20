---
---

Internal tooling only, no published package moves (objectui#9767).

The changeset polarity census (`scripts/changeset-polarity-census.mjs`) used to
report two opposite facts under one verdict heading: a symbol its member index
has no face for because the symbol is at the instrument's own reach boundary,
and a symbol that is not anywhere at all. Only the second can be a candidate,
and a reader of the merged line could not tell which row was which.

That bucket is now split into two named lines, on whether the symbol resolves in
one of the roots the indexed tree reaches past -- the declared dependencies of
the package that owns the indexed tree, and this repo outside that tree. Each
resolved row reports WHERE it resolved. The split carries its own per-root
controls, so a root that cannot be read voids the run instead of quietly moving
live symbols onto the second line, and a run given no resolution index reports
the split as unmeasured rather than as an empty second line.

The instrument's header gains this as a further named precision source, and
`scripts/__tests__/changeset-polarity-census.test.ts` pins the substance: a
symbol reachable in a resolution root lands on one line, a symbol reachable in
none lands on the other.

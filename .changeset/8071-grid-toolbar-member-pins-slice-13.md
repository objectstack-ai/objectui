---
---

Pin the MEMBERS of `object-grid`'s four toolbar keys — `batchActions`,
`pagination`, `searchableFields` and `selection` — at what `ObjectGrid` actually
reads, and delete their member-pin exemptions in the same change
(objectui#8071, slice 13). Each of the four is the canonical half of a
canonical-vs-deprecated pair resolved in the one fold that assembles the
`data-table` props, so the precedence, the presence rules and the empty-array
arms are pinned rather than restated: `pagination`'s presence overrules
`showPagination: false` while `selection`'s presence alone does nothing,
`pageSizeOptions` replaces the built-in rows-per-page list instead of extending
it, an empty `searchableFields` turns search off, and an empty `batchActions`
still wins over a populated `bulkActions`. Test and ledger only; no package is
released by this change.

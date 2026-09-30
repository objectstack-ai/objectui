---
'@object-ui/core': minor
'@object-ui/react': minor
---

The non-grid row ceiling's mechanism moves to `@object-ui/core`, its probe row
lives in one query helper, and its footnote takes the result and nothing else
(objectui#7508, maintainer ruling A′ — follow-up to objectui#7210).

**`@object-ui/core` — new exports**, beside the `extractRecords` they wrap:

- `NON_GRID_ROW_CEILING` (moved from `@object-ui/react`, value unchanged);
- `applyNonGridRowCeiling` and the type `NonGridCeilingResult` (moved from
  `@object-ui/react`, behaviour unchanged);
- `nonGridRowCeilingQuery()` (new) — returns `{ $top }`, the ceiling plus ONE
  probe row. It is the only place that `+ 1` is written; spread it into the
  `find()` query.

**`@object-ui/react`**:

- still exports `NON_GRID_ROW_CEILING`, `applyNonGridRowCeiling` and the type
  `NonGridCeilingResult`, now re-exported from `@object-ui/core` — the same
  bindings, so no import of these three changes;
- **removed**: `NON_GRID_ROW_CEILING_TOP`. Replace `$top: NON_GRID_ROW_CEILING_TOP`
  with `...nonGridRowCeilingQuery()` from `@object-ui/core`. This supersedes the
  export list in objectui#7210's entry, which names it;
- **breaking prop change**: `NonGridRowCeilingNote` takes `result`
  (a `NonGridCeilingResult`) and no other prop. `drawn`, `total`, `truncated`
  and `className` are gone, with no deprecated path. Pass the object
  `applyNonGridRowCeiling` returned: the note prints `result.rows.length` and
  `result.total`, so a footnote whose numbers disagree with the rows drawn can
  no longer be written. It now carries `shrink-0` itself, which the gantt used
  to pass in through `className`.

`ObjectCalendar`, `ObjectGantt`, `ObjectMap` and `ObjectTree` take the helpers
from `@object-ui/core` and hand the note their result; what they fetch, draw and
print is unchanged.

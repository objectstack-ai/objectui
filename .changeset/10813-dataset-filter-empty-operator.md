---
'@object-ui/app-shell': minor
---

The Studio dataset filter builder writes "Is empty" / "Is not empty" as the spec's `{ FIELD: { $empty: true } }` / `{ FIELD: { $empty: false } }` instead of `$exists` (objectui#10813).

`dataset.filter` and `measure.filter` stored the pair as `{ FIELD: { $exists: false } }` / `{ FIELD: { $exists: true } }`. `$exists` is the spec's has-a-value test (`!= null`), so a text value of `''` or a multi-value `[]` was never "empty" there, while the same operator in the sharing-rule widget and in a saved view meant something else. `@objectstack/spec` 17.6.0 admits `$empty` (objectstack#20446), whose meaning is the column's DECLARED row of the spec's per-type table (ruling B on objectstack#20311): null or `''` on a text-like column, null or `[]` on a multi-value one, null alone on every other type. The analytics service answers it from the field's declared type and `multiple` on its SQL and ObjectQL strategies. The spec's own face table declares one face that refuses it: the `driver-memory` analytics (cube) face, the lowest-priority fallback strategy (`MemoryAnalyticsService`), refuses a newly authored "Is empty" / "Is not empty" filter with `INVALID_FILTER` / 400, where it answered `$exists`. The bridge keeps no copy of the table.

The `@objectstack/spec` dependency floor rises from `^17.5.0` to `^17.6.0`, because this package now writes `$empty`, which `@objectstack/spec` 17.5.0 declares staged and refuses.

The read half reads `$empty` back as the pair, with a boolean flag only.

**What moves for a stored filter.** A stored `$exists` no longer opens as "Is empty" / "Is not empty": it opens in the Source tab, with its bytes untouched, and keeps matching what it matched before. Opening it as the pair would let an edit to ANOTHER row rewrite it to `$empty` and move `''` / `[]` across the line, which the read-half invariant (objectui#10257) forbids, and this inspector offers no `exists` row. To move such a filter to the new meaning, remove the row and add "Is empty" again. Readable stores (this repository, objectstack, hotcrm and cloud) hold no `dataset.filter` with `$exists`.

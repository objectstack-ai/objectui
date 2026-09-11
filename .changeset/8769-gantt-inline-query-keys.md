---
'@object-ui/plugin-gantt': minor
---

Honour `filter`, `sort` and the platform row ceiling on a gantt's inline
(`provider: 'value'`) data (objectui#8769).

**The defect was fail-open.** `ObjectGantt`'s `reload` short-circuited the
inline provider — it set the authored rows and returned BEFORE the adapter
query, which is the one site that lowers `schema.filter` to `$filter`,
`schema.sort` to `$orderby` and the objectui#7210 ceiling to `$top`. So an
inline gantt that declared a `filter` drew **every** authored row, with no
diagnostic. The key that was dropped is the key that NARROWS, which is why this
matters: the chart answered a wider question than the author asked. ⛔ Nothing
was exposed that was not already in the authored schema — this is a
correctness defect, not a data-access one.

Measured two-sided before the repair: the same five rows and the same
`status = open` filter drew 3 rows through a fetching data source and 5 rows
inline, with the same matcher on both sides.

**What changed.** The inline branch is gone; `provider: 'value'` now goes
through `resolveDataSource`'s `ValueDataSource` like every other provider,
which already implements `$filter` / `$orderby` / `$skip` / `$top` / `$select`
over its own array. No filter combinator was written for this change.

**Behaviour you may notice.**

- An authored `filter` / `sort` now narrows and orders inline rows. Both
  spellings reach it: `data: { provider: 'value', items }` and `staticData`.
- The row ceiling now applies to inline rows: past 2,000 drawn rows the chart
  draws 2,000 and shows the footnote naming both numbers, as it already did for
  fetched rows. It is applied to the **filtered** set, so a large inline array
  that a `filter` cuts below the ceiling draws every matching row and stays
  quiet. Rows a host passes down through the `data` React prop are still never
  capped — those are not ours to cap.
- Inline rows now reach the chart as the adapter's own deep copy rather than as
  the authored array's object identities. `ViewData.items` is serializable
  metadata, so every value the contract admits survives that copy unchanged;
  code comparing a row handed to `onTaskClick` against the authored array with
  `===` would need `id` equality instead.
- An inline gantt's own write-backs (drag, dependency edit, inline edit,
  delete) now survive the reload that follows them, because the reload reads
  the adapter that took the write instead of re-reading the authored array over
  the top of it.
- A filter comparand that `@object-ui/core`'s `convertFiltersToAST` refuses does
  **not** throw at render on this path: the inline matcher is local and never
  reaches that converter. The row is excluded and the reason is logged once.

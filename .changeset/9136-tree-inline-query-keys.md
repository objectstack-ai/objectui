---
'@object-ui/plugin-tree': minor
---

Honour `filter` and the platform row ceiling on a tree's inline
(`provider: 'value'`) data (objectui#9136) — the fourth surface of the
objectui#8769 repair, after objectui#9061 ported it to `ObjectCalendar` and
`ObjectMap`.

**The defect was fail-open.** `ObjectTree`'s record effect set the authored rows
and returned on the inline provider without reaching the query in its `object`
arm, which is the one site in the file that lowers `schema.filter` to `$filter`
and the objectui#7210 ceiling to `$top`. So an inline tree that declared a
`filter` drew **every** authored row, with no diagnostic. The key that was
dropped is the key that NARROWS: the view answered a wider question than the
author asked. Nothing was exposed that was not already in the authored schema —
this is a correctness defect, not a data-access one.

**What changed.** The inline provider resolves a `ValueDataSource` over its own
rows and issues the same query the `object` arm issues (`$filter`, `$top`), then
goes through the same `applyNonGridRowCeiling`. Two keys, not the siblings'
three: `ObjectTree` reads `sort` on no provider, so nothing about ordering moves.
No dependency array moves, and the `object` provider is untouched.

**Behaviour you may notice.** This is a behaviour change on inline trees, and
it is declared `minor`, as objectui#9061 declared the same change on the
calendar and map:

- An authored `filter` now narrows inline rows, on both inline spellings —
  `data: { provider: 'value', items }` and `staticData`.
- The row ceiling now applies to inline rows: past `NON_GRID_ROW_CEILING`
  (`@object-ui/react`) rows the tree draws that many and shows the footnote
  naming both numbers, as it already did for fetched rows. The tree is the view
  that ceiling's value was measured on. It is applied to the **filtered** set,
  so a large inline array that a `filter` cuts below the ceiling draws every
  matching row and stays quiet.
- Rows a host passes down through the `data` React prop, or as a bare array
  under `schema.data`, are unchanged: that passthrough sits above the inline
  branch and is still never filtered or capped here.
- Inline rows now reach the tree as the adapter's own deep copy
  (`structuredClone`, objectui#9175) rather than as the authored array's object
  identities. A row handed to `onRowClick` is that copy, so code comparing it
  against the authored array with `===` needs `id` equality instead. A record
  graph carrying a back-reference still renders; a function-valued key in an
  inline row now fails loudly with the tree's error panel instead of rendering.

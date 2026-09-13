---
'@object-ui/plugin-calendar': minor
'@object-ui/plugin-map': minor
---

Honour `filter`, `sort` and the platform row ceiling on a calendar's and a map's
inline (`provider: 'value'`) data (objectui#9061) — the port of objectui#8769's
repair off `ObjectGantt`.

**The defect was fail-open.** Both renderers' fetch effect short-circuited the
inline provider: it set the authored rows and returned BEFORE the adapter query,
which is the one site in each file that lowers `schema.filter` to `$filter`,
`schema.sort` to `$orderby` and the objectui#7210 ceiling to `$top`. So an
inline calendar or map that declared a `filter` drew **every** authored row, with
no diagnostic. The key that was dropped is the key that NARROWS, which is why
this matters: the view answered a wider question than the author asked. Nothing
was exposed that was not already in the authored schema — this is a correctness
defect, not a data-access one.

**What changed.** Each renderer resolves a `ValueDataSource` for the inline
provider and issues the same query the `object` arm issues. The `api` arm is
untouched, and no dependency array moves. `ValueDataSource` already implements
`$filter` / `$orderby` / `$skip` / `$top` / `$select` over its own array, so no
filter combinator was written for this change.

**Behaviour you may notice.**

- An authored `filter` / `sort` now narrows and orders inline rows. Every
  spelling reaches it: `data: { provider: 'value', items }` and `staticData` on
  both renderers, plus the map's bare-array `data` shorthand.
- The row ceiling now applies to inline rows: past 2,000 drawn rows the view
  draws 2,000 and shows the footnote naming both numbers, as it already did for
  fetched rows. It is applied to the **filtered** set, so a large inline array
  that a `filter` cuts below the ceiling draws every matching row and stays
  quiet. Rows a host passes down through the `data` React prop are still never
  capped — those are not ours to cap.
- Inline rows now reach the view as the adapter's own deep copy rather than as
  the authored array's object identities. Code comparing a row handed to
  `onEventClick` / `onMarkerClick` against the authored array with `===` needs
  `id` equality instead.
- That copy is a JSON round-trip, so inline rows must be JSON-serializable.
  A record graph carrying a back-reference, or a `BigInt` id, now renders an
  error panel instead of the view. `ObjectGantt` has refused the same input
  since before objectui#8769; `ObjectMap` did not, and pinned that it need not
  (objectui#6018). ⚠️ That pin is left RED and untouched in this change — see
  the pull request body.

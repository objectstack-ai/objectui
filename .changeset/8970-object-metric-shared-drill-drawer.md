---
'@object-ui/plugin-dashboard': minor
---

Route `object-metric`'s drill-down through the shared `DrillDownDrawer` (objectui#8970).

`ObjectMetricWidget` built its own drill panel inline — a Radix `Dialog` when
`drillDown.target` was the literal `dialog`, a `Sheet` otherwise, with a record-list
body it constructed itself. That copy read `enabled`, `target`'s two in-place arms,
`title` and `report`, and had no read site for the rest of the `DrillDownConfig` the
designer inspector offers. Three members were therefore accepted from the author and
discarded on this block alone, while acting on every other block that shares the same
config — no diagnostic, no rejection, and the identical tile on a `dataset` widget in a
metric presentation worked.

**Now delivered on `object-metric`:**

- **`target: 'navigate'`** — opens the object's full list page through the host's drill
  navigation, scoped by the metric's own filter. Previously it fell into the panel
  branch and drew the side sheet *unconditionally*. That mattered beyond the missing
  feature: `DrillDownConfig.target` documents this arm as falling back to `'drawer'`
  "when none is available", so the old behaviour read as the documented one while being
  a different one. The fallback is now genuinely conditional.
- **`columns`** — column whitelist for the drilled record list.
- **`maxRows`** — page size of the drilled record list.

**Two deliberate behaviour changes that come with the shared component:**

- The drilled record list no longer shows a search box. The inline panel never chose
  this; it inherited the record table's default while the shared drawer opts out, so a
  metric drill is now the same self-contained peek as a pivot, chart or dataset drill.
- The drill sheet's widest breakpoint narrows by one step, from `lg:max-w-5xl` to the
  shared drawer's `lg:max-w-4xl`. The centred `dialog` arm is unchanged.

The list's default page size is **unchanged at 25** — the value the inline panel
hard-coded is kept as this block's fallback, so a config that never authored `maxRows`
drills exactly as before rather than dropping to the record table's default of 10.

**Unchanged, and left to objectui#8970's own open question:** `drillDown.filter` and
`drillDown.mode` still have no read site on this block. The drilled list stays scoped by
the metric's resolved filter, which is what the block's registration promises ("the same
filter narrows the drill-down list, so the number and the records behind it always
agree"); a metric also has no click event for `${event.*}` to interpolate against. The
shared drawer honours neither member either, so routing through it does not settle them.

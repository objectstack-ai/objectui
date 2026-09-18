---
'@object-ui/fields': patch
---

Stop a declared percent `scale` outside the engine's fraction-width domain from
crashing the render, on both percent faces (objectui#9808).

`@objectstack/spec` accepts `scale` as any non-negative integer, so `scale: 101`
is a declaration the platform takes — and it threw `RangeError` out of
`PercentField` (the readonly face and the spinner `step`) and out of
`PercentCellRenderer` (through `formatPercent`), which for a React render takes
out the subtree with no signal to the author.

Both faces now take one ruling: a width outside the domain both formatting APIs
define for themselves is clamped into it and reported on the console, naming the
declared width, the width rendered and the card. The bounds are the formatters'
own — `Number.prototype.toFixed` and `Intl.NumberFormat`'s
`maximumFractionDigits` share them on the integers — not a policy this renderer
invented, which is why a refusal was declined: the declaration is
spec-compliant today, and the declaration-side upper bound is filed where it
lives, in `@objectstack/spec`.

A width the engines already accept is untouched, including at the inclusive
ceiling and including the coercions the engines perform for themselves, and
nothing here changes which member a face reads or what an absent `scale` means.

The ruling sits behind `formatPercent`, so this also widens what that published
function ACCEPTS: widths that threw now return a string, and every caller of
that door — the percent cell, the metric widget, the record-field and detail
summaries, the Gantt tooltip, the grid footer and the column summary — moves
from crash to clamp-and-report. Same ruling, wider reach than the two percent
faces. No new symbol is published: the shared rule lives in a module the package
barrel imports and does not re-export, the shape `address-format` and
`file-affordance` already use here.

SUNSET, recorded because this repair's justification has an expiry date. The
clamp is defensible only while `@objectstack/spec` leaves `scale` unbounded: a
renderer may not refuse a declaration the contract accepts. objectstack#18972
bounds it upstream. On the day this repository takes a spec that refuses an
out-of-range `scale` at authoring, this clamp becomes exactly the lenient
renderer-side fallback AGENTS.md #0.1 bans, and the correct move is to delete
it rather than keep a second de-facto contract beside the enforced one.

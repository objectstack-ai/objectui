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
`maximumFractionDigits` share them — not a policy this renderer invented, which
is why a refusal was declined: the declaration is spec-compliant today, and the
declaration-side upper bound is filed where it lives, in `@objectstack/spec`.

An in-range declaration is untouched, including at the inclusive ceiling, and
nothing here changes which member a face reads or what an absent `scale` means.

`renderablePercentScale` and `PERCENT_SCALE_CEILING` are exported from
`@object-ui/fields` so both faces share one spelling of the domain.

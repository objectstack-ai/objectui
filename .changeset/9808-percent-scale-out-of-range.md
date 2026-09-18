---
'@object-ui/fields': patch
---

Stop a declared percent `scale` above the engine's fraction-width ceiling from
crashing the render, on both percent faces (objectui#9808).

The `@objectstack/spec` this repository installs accepts `scale` as any
non-negative integer, so `scale: 101` is a declaration the platform takes — and
it threw `RangeError` out of `PercentField` (the readonly face and the spinner
`step`) and out of `PercentCellRenderer` (through `formatPercent`), which for a
React render takes out the subtree with no signal to the author.

Both faces now take one ruling: a width the installed spec ACCEPTS and the
engine REFUSES is clamped to the ceiling and reported on the console, naming the
declared width, the width rendered and the card. The ceiling is the formatters'
own — `Number.prototype.toFixed` and `Intl.NumberFormat`'s
`maximumFractionDigits` share it on the integers — not a policy this renderer
invented, which is why a refusal was declined: refusing a declaration the
contract accepts would be a renderer inventing a stricter contract than the one
it is built against.

The ruling reaches exactly that set and nothing else. A negative, non-finite or
non-integer `scale` is a declaration the installed spec already REFUSES, so it
keeps the behaviour it had before this change rather than being rescued here:
making off-spec metadata render is the renderer-side default AGENTS.md #0.1
lists by name, and the place to repair such a declaration is the producer that
wrote it. A width the engines already accept is likewise untouched, including at
the inclusive ceiling.

Nothing here changes which member a face reads or what an absent `scale` means.

The ruling sits behind `formatPercent`, so this also widens what that published
function ACCEPTS for the clamped set: widths that threw now return a string, and
every caller of that door — the percent cell, the metric widget, the
record-field and detail summaries, the Gantt tooltip, the grid footer and the
column summary — moves from crash to clamp-and-report. Same ruling, wider reach
than the two percent faces. No new symbol is published: the shared rule lives in
a module the package barrel imports and does not re-export, the shape
`address-format` and `file-affordance` already use here.

SUNSET, recorded because this repair's justification has an expiry date, and
pinned because a recorded sunset that nothing re-derives is how an expired
premise goes on reading like a live one. The clamp is defensible only while the
spec this repository INSTALLS leaves `scale` unbounded. The trigger is therefore
a spec release this repository takes — not the upstream card landing, which has
already happened (objectstack#18972, landed as objectstack#19083) and changed
nothing here, because the bound is merged and unreleased at the installed
17.4.0. On the day a bump brings it in, the clamp becomes exactly the lenient
renderer-side fallback #0.1 bans, and the module is to be deleted rather than
kept beside the enforced contract. The percent pin file asks the installed
`FieldSchema` that question on every run and fails with those instructions.

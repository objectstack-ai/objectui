---
'@object-ui/fields': minor
---

Store a typed percent by shifting the decimal, not by dividing a float by 100
(objectui#9810, maintainer ruling batch #161 item 3, letter B).

The percent edit widget converted a typed percentage-point value to its stored
fraction with `n / 100`. That division is not representable in binary floating
point, so the quotient carried residue nobody typed — `66.67` reached the write
path as `0.6667000000000001`, `99.99` as `0.9998999999999999`.

The ruling settles which quantity `scale` names on a `percent` field: the
DISPLAYED percentage-point decimals, with storage DERIVED — a fraction-stored
percent (`percentScaleOf` = `fraction`) allows `scale + 2` decimal places in the
stored fraction. The platform enforces that allowance by REJECTION, never
rounding, so every residue value above is a write this widget's own `step`
attribute offers and the write path then refuses.

**What changes for a consumer.** For a fraction-stored percent field, the value
handed to `onChange` is now the double nearest the decimal the author typed: a
display value carrying `d` decimal places stores `d + 2` places and no more.
Values the old division already got exactly right are byte-identical. The
`whole` convention (a field declaring `max > 1`) is untouched — there the typed
number is the stored number.

**Not a rounding.** An author who types finer than the declared width still
stores every digit they typed and is still refused upstream; a widget-side
rounding would convert the platform's refusal into silent data alteration.

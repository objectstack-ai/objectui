---
'@object-ui/plugin-form': patch
---

`ObjectForm`'s numeric `step` now follows `scale` (decimal places), not `precision`
(total digit count) — objectui#9574.

`@objectstack/spec` declares the two members apart: `precision` is "Total digits
(non-negative integer)", `scale` is "Decimal places (non-negative integer)". The
auto-generated form field derived its step from `precision`, so a `decimal(10, 0)`
field — ten total digits, ZERO decimal places — was handed `step` `1e-10` instead of
`1`, and a `decimal(10, 2)` got `1e-10` instead of `0.01`. `NumberField` states the
same rule verbatim one layer down and already moved; this is the producer one layer up
catching up with it.

Two further consequences of the same expression:

- **`scale: 0` is honoured.** The test is `typeof field.scale === 'number'`, not
  truthiness — a declared zero means "steps by 1", and the spec's own example of a
  `scale: 0` field is an ordinal integer.
- **An undeclared `scale` now resolves to `step="any"`, not to no attribute at all.**
  An absent `step` is HTML's default of 1, which marks every decimal `:invalid` and
  blocks the submit — a granularity the author never declared. This matches
  `NumberField`'s tail for the same case.

**Where the change is observable.** The registered `field:*` widgets do not read this
key: their metadata carrier is the raw object-schema field, their DOM whitelist does
not forward `step`, and each derives its own — measured by deleting the assignment
outright and re-rendering, which left every `<input>` on that route byte-identical. The
key IS read on the renderer's unregistered-widget fallback, where a field whose declared
`widget` names a component the app never registered has its leftover props spread onto
the `<input>`; there the producer's step is the granularity the browser enforces. Both
routes are pinned side by side in `objectFormNumericStep-9574.test.tsx`.

`percent` is covered by the same expression it was always covered by, and moves from
`10^-precision` to `10^-scale`. What `scale` means for a percent field that stores a
0–1 fraction — stored decimals, which is what the record validator enforces, or
displayed percentage points, which is the landed display convention — is open at
objectui#9810 and is not decided here.

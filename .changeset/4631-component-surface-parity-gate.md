---
---

Add `pnpm check:component-surface-parity` — a **report-only** checker that prints, per
registered component type, where the four declared surfaces disagree: the spec's
`ComponentPropsMap`, the keys the renderer actually reads, the TS schema interface in
`packages/types`, and the registry `inputs` / `defaultProps` of the `register()` meta
(objectui#4631).

The rule it mechanises is the ruling's, not the script's: the TS interface key set is the
union of the spec key set and the renderer-read key set, `inputs` is a subset of that union
(so an omission is legal), and a `defaultProps` row that is a designer seed rather than a
default claim has to carry a registered reason.

It exits `0` with findings — the ruling's own sequencing is report-only first, blocking once
the census reads zero — and it repairs nothing it finds. Tooling only: no published package
source, manifest or contract moves, so no package is released by this change.

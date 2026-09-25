---
'@object-ui/types': minor
---

`ChartSchema` (and its TS twin) declares `xAxis` and `yAxis` as `@objectstack/spec`'s axis config
object — `ChartAxisSchema`, referenced by the Zod mirror and typed by the spec's `ChartAxis` on the
TS side — instead of letting both ride `BaseSchema`'s passthrough unchecked (objectui#7690, ruling
5809510046, branch 2 — declare).

- `xAxis` is the spec axis object `{ field, title, format, min, max, stepSize, showGridLines,
  position, logarithmic }` (strict, `field` required), or the bare column name that still folds onto
  `xAxisKey` at parse (objectui#7113, unchanged).
- `yAxis` is the spec's **list** of those objects; the first entry is the primary axis, a second
  entry declares the right-hand axis.
- The spec's `.default()`s are not written into the parse output: an omitted `showGridLines` or
  `logarithmic` stays omitted.
- A refused `xAxis` object reports the spec's own issue for it (including the alias hint, e.g.
  `Did you mean grid → showGridLines?`) instead of a bare `Invalid input`.

⚠️ Shipped as `minor`, not `patch`: documents that validated before now **refuse**, and each of them
draws a chart today — a narrowing away from something that renders, the transition objectui#6896,
objectui#7113 and objectui#7546 graded `minor` in this same file.

- An axis object with a malformed value (`min: 'zero'`, `position: 'middle'`), an undeclared key
  (`grid`, `logScale`) or no `field`: the renderer ignores what it cannot read and draws the rest.
- A `yAxis` written as a single object or a bare column name: the renderer's normalizer DOES honour
  both, as a tolerance. Neither is a member of the spec's list and no producer found by the per-key
  liveness read writes either, so declaring them would fossilise that tolerance into a second
  contract (AGENTS.md #0.1) — the reading objectui#7546 applied to the renderer-internal
  `variant: 'current'`. The normalizer is unchanged.

No renderer changed.

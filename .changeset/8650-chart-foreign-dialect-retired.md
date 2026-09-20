---
'@object-ui/plugin-charts': minor
---

Retire the "Tremor/simple format" adapter in `ChartRenderer` — the `index`,
`category` and `value` reads (objectui#8650, triage ruling `5619609278` on
AGENTS.md #0.1: route to the producer, ⛔ not a declaration).

**Breaking, deliberately, for three keys — and NOT for the fourth.** The card
filed four undeclared reads as one group. A cast-aware read census plus a
TypeScript-checker declaredness reading measured them apart, and they do not
share one verdict:

- `index` / `category` (they aliased the category axis) and `value` (it became
  a single series) are **retired**. They are declared on no published face —
  not `ChartSchema`, not its zod mirror, not `ChartRendererProps.schema` — are
  advertised by no registry `inputs`, and are taught by no doc, guide or skill.
  A structural producer census over `packages/`, `apps/`, `examples/`,
  `content/docs/` and the skills corpus (5695 files, 74 chart nodes) found
  **zero** nodes writing `category` or `value` and **one** writing `index` —
  this repo's own test for the adapter. The zero is read against controls that
  fire in the same population (`xAxisKey` 41 nodes, `series` 44, `chartType`
  40, `data` 52) and a nonsense key that returns 0.
- `categories` is **not retired and is unaffected**. It is a declared member of
  the published `ChartSchema` and of its zod mirror, is documented in the
  schema reference as an alternative series list, and was ruled live by
  objectui#6896. `normalizeChartSchema` — the single translation point
  (objectui#2880 S1) — already consumed it, so `ChartRenderer`'s own branch was
  a second, un-normalized read that no well-formed chart could reach. Removing
  it changes nothing for a well-formed chart and removes two wrong answers for
  a malformed one: `categories: 'revenue'` reached `.map` on a string and threw
  during render, and a `categories` whose entries the normalizer rejects
  produced a `[{ dataKey: '' }]` series.

**Migration.** Write the canonical spellings, which every producer in the
measured corpora already writes: `xAxisKey` (or the spec's `xAxis: { field }`)
for the category axis, and `series` (or `categories`) for the plotted columns.
A chart that still writes `index` / `category` binds no category axis, so
`AdvancedChartImpl` falls back to its default category key, `name`. What that
degrades to depends on the rows, and only one half of it is a refusal: rows
carrying no `name` column hit its existing on-screen `missing-category-key`
refusal, while rows that DO carry one plot silently against `name` instead of
the column the author named — a wrong picture rather than a refusal. One that
still writes `value` plots nothing.

Also deletes six `(schema as any)` casts that the published declarations had
already made unnecessary — `colors`, `categoryColors` and `categoryOrder` on
`ChartRenderer`, and `colors`, `compareTo` and `series` on `ObjectChart` (the
objectui#8327 bucket-(b) class: declared, then read through a needless cast).
No behaviour changes with them; `ObjectChart.tsx` now has no `(schema as any)`
read left at all.

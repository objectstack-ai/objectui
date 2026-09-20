---
"@object-ui/types": minor
"@object-ui/plugin-charts": minor
---

feat(types,plugin-charts): anchor `ObjectChart`'s props to `ObjectChartSchema` and declare the four keys its producers write

`ObjectChart` was published as `(props: any)`, so `ObjectChartSchema` anchored
nothing: every `schema={{ … }}` literal handed to the component was type-checked
against nothing at all. Four keys its producers write and its renderer reads —
`xAxisKey`, `series`, `aggregate`, `filter` — were declared on neither published
copy of the shape, and rode `BaseSchema`'s index signature / `.passthrough()`
unvalidated. That is the mechanism that let objectui#7891's undeclared `config`
rung survive from the day it was written.

Maintainer ruling 2026-09-09 (option A), applying objectui#6576's gallery
treatment to the chart:

- `ObjectChartProps.schema` is `ObjectChartSchema`; the published `.d.ts` no
  longer says `props: any`. `ObjectChartProps` is exported.
- The four keys are declared on BOTH copies, with value types taken from their
  READ sites (`ChartRendererProps` for `xAxisKey` / `series`, `ObjectChart.tsx`
  for `filter`) rather than copied from any producer's literal — except where
  `@objectstack/spec` already owns the shape, which is `aggregate`: that one is
  declared BY REFERENCE as `ChartAggregate` / `ChartAggregateSchema`, so the
  authoring door here and at the react-page publish gate are one shape and
  cannot drift into two dialects.
- `colors` converges: the zod mirror has declared it since objectui#3913 and the
  TS interface did not, a drift no ratchet could see because a mirror-only key
  is in neither of the parity guard's two difference ledgers.

Two of the four are AUTHORABLE (`aggregate`, `filter` — the spec names this
component's own props as their carrier and parses `aggregate` at the react-page
publish gate) and two are INTERNAL, relay-composed (`xAxisKey`, `series` — every
producer computes them and the spec's author-facing vocabulary refuses the
internal spellings by name). The internal pair is declared anyway, because it was
already passing through unvalidated: declaring buys the value check without
minting authorable vocabulary, and each description says which it is.

`filter` keeps BOTH arms (a `FilterArray` or the ObjectQL `$filter` object), and
narrowing to one is a decision LOCAL TO THIS NODE rather than a fleet-wide one:
the six sibling `object-*` widgets that declare `filter` are already array-only,
so there is no cross-widget convention to renegotiate. What blocks the narrowing
is this component's own drill-down spread, which mis-composes the array arm into
index keys; that is named as the successor on the member's docblock.

BEHAVIOUR, from what the anchor made visible: `ObjectChart` resolved the
group-by column twice and only one site normalised the structured
`groupBy: { field, dateGranularity }` node. The other used the raw union as a row
index, a field name and a drill-filter key, so a date-bucketed chart lost its
option-colour resolution, its label→raw reverse map and its drill filter to a
lookup on the node's stringification. Both sites now share one normalisation, and
the behaviour is pinned at runtime by
`plugin-charts/src/__tests__/ObjectChart.structuredGroupBy-7946.test.tsx` (drill
filter keyed by the projected column, alias and field arms, and the label→raw
recovery) — a compile-time pin cannot see a wrong runtime value flowing from a
correctly-typed read.

The drill drawer's heading fallback now resolves `schema.title` through
`pickLocalized` (`@object-ui/i18n`) instead of using it as a bare string. The
spec types that slot as `I18nLabel` — a plain string or an inline locale map —
and the map arm used to reach the heading as an object.

## Migration — what a TS consumer of `<ObjectChart schema={…}>` must change

The headline is that a wrong VALUE TYPE is now a compile error, but three
NARROWINGS bite first, and they are what the eight edited test files in this
change had to absorb:

- **`type: 'object-chart'` is now required on the literal.** A minimal
  `schema={{ objectName: 'account', chartType: 'bar' }}` no longer compiles.
- **`chartType` must be the declared union.** A literal written inline is fine;
  one hoisted into a non-`const` object widens to `string` and is refused. Use
  `as const` (or annotate the holder as `ObjectChartSchema`).
- **`series` entries must be `dataKey`-shaped.** The renderer's internal arm is
  `{ dataKey, … }`; the spec's author-facing `{ name, … }` arm is a different
  shape, translated by `normalizeChartSchema` one layer down.

And, from the by-reference `aggregate`:

- **`aggregate.function` and `aggregate.groupBy` are REQUIRED**, `aggregate.field`
  stays optional (only `count` counts rows rather than a column), the structured
  `groupBy` node must name its `field`, and unknown members are REFUSED by name
  rather than dropped. `aggregate: {}` and `{ field: 'amount' }` used to compile
  and no longer do. This is `ChartAggregateSchema`'s accept set, which the publish
  gate has always enforced on authored `<ObjectChart aggregate={…}>` literals —
  so a document that compiles today is one the platform already accepted.

The RENDERER still accepts more than this and still draws its named refusal
screen for an aggregate that declares no category axis (objectui#8168): untyped
producers forward `aggregate` as `any`, so out-of-contract documents keep
arriving at runtime. Narrowing the declaration is about what an author may
WRITE, not about what the renderer will tolerate.

⚠️ Anchoring does not buy rejection of a MISSPELLED key on the node itself:
`BaseSchema` carries `[key: string]: any` (objectui#5155), the same ceiling
objectui#6576 accepted. `aggregate` is the exception, and only because the spec's
own object is strict.

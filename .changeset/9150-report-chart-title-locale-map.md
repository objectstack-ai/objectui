---
'@object-ui/plugin-report': minor
---

A dataset-bound report whose `chart.title` is an inline locale map now draws its heading
instead of drawing none (objectui#9150).

`@objectstack/spec` types `ReportChartSchema.title` as `I18nLabel` — a plain string OR an
inline locale map — so `{ "chart": { "type": "bar", "title": { "en": "Pricing", "zh-CN": "定价" } } }`
is authored surface the contract accepts. `DatasetReportChart` paints the report chart's
heading itself, as its own `h3`, and read the value back through
`typeof chart.title === 'string'`. The map arm failed that test, the local `title` became
`undefined`, and the `{title ? … : null}` guard skipped the element entirely: the report
drew **no heading at all**, in every language, with no diagnostic.

Note the shape, because it is the same one objectui#9038 described and not the sibling
objectui#8943: the value was not resolved badly, it was not resolved at all. There was no
heading to compare against a locale, so no locale-comparison check could see it, and an
author who wrote spec-legal metadata saw a chart that looked as though it had simply been
given no title.

The read site now resolves through `pickLocalized`, this repo's one resolver for the
union — the form already used a few lines above in the same file for an authored
`series[].label`, against the same `useObjectTranslation().language`. Both branches that
paint the heading (the series chart and the single-value metric) read one binding, so one
change covers both, and both are pinned.

Why this is `minor` and not `patch`. Every publishable package here sits in one `fixed`
group, so `major` is unavailable by policy and this repo ships behaviour-visible changes
as `minor`. This one is behaviour-visible on a **published** package: stored documents
that render nothing today start rendering an `h3`, and an author who worked around the
absence by authoring a separate heading of their own will now see two. That is a change
to what the renderer paints for metadata it already accepted, not an internal repair. The
direct sibling objectui#9038 — same union, same defect shape, same round — shipped
`minor` for exactly this, and one release should not classify the two differently.

What did **not** change:

- A plain-string `title` renders byte-identically, in every language. It is the lit
  control in the new pins, and if it had moved the repair would have overshot.
- The chart component is still handed **no** `title`. This renderer drops it from the
  lowered chrome on purpose, so the chart cannot draw a second heading inside its own
  frame; that pin is kept and extended to the map arm.
- The resolution policy is not re-decided here. `pickLocalized`'s documented chain (exact
  tag, base language, region-qualified sibling, `default`, `en`, first entry) is what a
  map with no limb for the active language falls back along, so it draws another limb
  rather than vanishing — `default` outranks `en`, pinned, so the fallback is demonstrably
  the resolver's chain and not an ad-hoc "else English". Only a map carrying no usable
  string at all resolves to a miss, and that still draws no heading rather than an empty
  one.

The neighbouring read sites objectui#9038 ledgered by name are unchanged, and that ledger
is updated to record this one as resolved. The remaining entry — a series `label` and an
axis `title` still taking `labelText`'s first-string-wins pick (objectui#4020) — stays
open on purpose.

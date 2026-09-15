---
'@object-ui/console': minor
'@object-ui/cli': minor
'@object-ui/types': minor
---

Retire `line-chart`, `area-chart` and `advanced-chart` — three chart component keys the
console registered as lazy stubs that `@object-ui/plugin-charts` never fulfilled
(objectui#8760).

**The defect, and why it outlived the checks.** `apps/console` registered ten chart
variants as `registerLazy` stubs pointing at `@object-ui/plugin-charts`. That package
registers eight keys; three of the ten were not among them. An unfulfilled stub does not
fail — it succeeds at being useless, in both of the places that decide whether a defect
is ever seen:

- **At render.** `SchemaRenderer`'s lazy branch re-checks `hasLazy(type)` on every pass
  and returns the `Loading <type>…` placeholder. `Registry.register()` deletes a lazy
  entry only for keys the loaded module actually registers, so for an unfulfilled key the
  entry SURVIVES the load and every later pass takes the same branch. Measured on
  `b775500af` through the real chain: `{ "type": "line-chart" }` painted
  `role="status"` / `data-lazy-loading="line-chart"` / `Loading line-chart…`,
  permanently. **Not** the `OBJUI-001` panel the card expected — no alert, no error, no
  console warning. A skeleton that never resolves reads to a user as a slow network.
- **At authoring.** A stub is enough to put a key into `getKnownTypes()`, so
  `check:doc-types` and the CLI's generated `KNOWN_SCHEMA_TYPES` snapshot both blessed
  all three. `content/docs/plugins/plugin-dashboard.mdx` taught `"type": "line-chart"`
  inside a `card` body, and every gate was green on it.

So the failure was strictly worse than an unknown key: an unknown key is refused loudly at
authoring time, while these passed every check, were taught by the documentation, and
failed only at render in front of a user.

**Why removal rather than implementation.** Both repairs were available and they are not
equivalent. Fulfilment would mint three new pieces of authorable surface: `line-chart` and
`area-chart` duplicate, under a second spelling, families the plugin already draws as
`{ "type": "chart", "chartType": "line" | "area" }`, and `advanced-chart` was never a
family at all — it named `AdvancedChartImpl`, an internal module. Measured demand for all
three is zero: a sweep of both repositories for authored nodes of these types returns
exactly one hit, the doc snippet corrected here, against lit controls in the same
commands (`"type": "bar-chart"` 5, `"type": "chart"` 12, `object-chart` 1 in the sibling
repo). No example app, fixture, seed document or deployment authors any of them. Under
声明即强制, a declaration with no delivery and no demand comes off rather than growing an
implementation to match it.

**Breaking, for anyone who authored a retired key.** A document with
`{ "type": "line-chart" }` used to resolve in the registry and then draw nothing; it is
now refused by name — `objectui check` reports `Unknown schema type "line-chart"`, and
`SchemaRenderer` paints the `OBJUI-001` panel instead of an endless skeleton. That is a
louder failure for the same broken document, not a new one: no document that previously
DREW is affected. Migrate to `{ "type": "chart", "chartType": "line" | "area" }`, which
`CHART_TYPE_KEYWORD_FAMILIES` resolves. Scored `minor`, not `major`, per
AGENTS.md §版本号策略.

**What moved.** The stub lists in `apps/console/src/register-plugins.ts` and
`apps/console/src/preview-gallery.tsx` (both loops, because the doc gate's key universe is
their union — retiring one alone would have changed nothing observable); the dashboard doc
snippet plus a note on how chart families are actually spelled; the regenerated
`KNOWN_SCHEMA_TYPES` snapshot (six entries, three bare and three namespaced); and the
`line-chart` leg of `node-slot-registered-arms-8499.test.ts`, whose premise this
retirement changed and which reads the stub list rather than the file so the ⛔ comment
left behind cannot satisfy it.

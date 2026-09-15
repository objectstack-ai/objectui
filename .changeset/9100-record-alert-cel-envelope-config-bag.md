---
'@object-ui/react': minor
'@object-ui/plugin-detail': minor
---

Keep the `{ dialect: 'cel', source }` predicate envelope intact through a node's
config bag, so a CEL visibility gate authored the canonical way reaches the CEL
engine instead of the legacy JS one (objectui#9100).

**The defect.** `SchemaRenderer`'s per-value `properties` / `props` evaluation loops
handed every bag value to `ExpressionEvaluator.evaluate`, whose first action is to
unwrap any `{ source: string }` object down to its bare `source` — the unwrap that
makes a `template` envelope interpolate. Applied to a `cel` predicate it was
destructive: the envelope is the only thing that routes `evaluateCondition` to the
canonical `@objectstack/formula` engine, and those loops run before the hoist, so
both consumers — `SchemaRenderer`'s own visibility chain and the renderer's
`toPredicateInput` → `useCondition` call one layer down — received a bare string and
took the legacy JS path, where a CEL stdlib call such as `has()` is not a function.

Both polarities then failed silently, in opposite directions. On the four SHOW legs
(`visibleWhen` / `visible` / `visibleOn` / `visibility`) the fail-soft `true` is
negated, so **a gate authored to hide something rendered it on every row** — measured
in a real browser, where a duplicate-lead banner showed on 6 of 6 records whose field
was `null`. On the two HIDE legs (`hidden` / `hiddenOn`) the same `true` is returned
un-negated, so **the node vanished entirely**. Neither is distinguishable on screen
from a predicate that said so on purpose.

**Behaviour change, deliberately.** A `cel`-envelope predicate on any of those six
keys, authored inside `properties` or `props`, now actually decides. Metadata that
was relying — knowingly or not — on such a gate never biting will start seeing nodes
hidden (SHOW legs) or shown (HIDE legs) as authored. Nothing else moves: a `template`
or dialect-less envelope keeps the legacy `${…}` behaviour byte-for-byte, a
non-predicate bag key keeps the flattening it has always had, and node-level
predicate keys were never affected (they do not pass through these loops, which is
why objectui#7530's pin stayed green throughout).

**`record:alert` declaration.** Its `visible` input was registered as a bare
`'string'` while `@objectstack/spec` 17.4.0 declares
`boolean | string | { dialect, source }` for the same key and the renderer resolves
all three. It is now declared `['boolean', 'string', 'object']`, in the same change
that made the envelope arm actually reachable.

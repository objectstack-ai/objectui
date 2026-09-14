---
'@object-ui/app-shell': minor
---

The drill "escape hatch" can spell an empty bucket: the `filter[...]` URL dialect grows an
is-null operator on both sides plus a chip for it (objectui#9159).

`buildDatasetDrillFilter`'s output has three consumers. Two lower it through
`convertFiltersToAST`, where objectui#9085's `{ field: { $null: true } }` becomes
`[field, 'is_null', true]` and the empty bucket selects its own rows. The third is this
one — `OpenInListButton` and `drillDown.target: navigate`, which reach the host's
`openRecordList` and serialize the drill filter into `filter[...]` search params for the
ADR-0055 bare data surface. That dialect had equality plus four range bounds and nothing
else, so the condition simply vanished: `{ stage: 'won', owner: { $null: true } }` and
`{ stage: 'won', owner: null }` produced the byte-identical `filter[stage]=won`, and an
empty-bucket-only drill produced an empty query string. The surviving condition was the
NON-empty one, so drilling into the empty bucket and escalating to the full list page
returned a **superset** — silently, with filter chips showing only the conditions that
survived, so the page looked correctly scoped.

`drillUrlFilters` now carries the operator on both halves of its one module, as
`NULL_FILTER`:

- **write** — `{ $null: true }` becomes `filter[<field>][null]=true`, emitted beside any
  range bound on the same object because `convertFiltersToAST` emits both conditions for
  that input;
- **read** — that param becomes `[field, 'is_null', true]`, the same triple the other two
  consumers already produce;
- **chip** — the grouper renders `is null` for it, where it previously fell to the
  `= <value>` default and displayed a bare `true`.

The value is a FLAG, not a comparand. `filter[<field>][null]=false` is **not** a second
operator: this dialect cannot write "is not null", so the read side drops that param the
way it drops an unknown suffix rather than inventing an operator with no producer — and
equality-to-empty-string remains no condition at all, since a param whose value is empty
was already skipped. `{ $null: false }` is dropped on the write side for the same reason,
degrading to a superset exactly as any other unspellable operator does.

The range maps are deliberately untouched: `is_null` is already a canonical
`ViewFilterRule` word, and `ObjectDataPage` inverts `URL_FILTER_OPS` to bridge a triple's
operator to the spec's *alias* spelling. An entry there would have sent it through that
bridge as the alias `null`, which the rule schema refuses — a "Save as view" that silently
loses the condition. `ObjectDataPage.saveAsViewFilterFold.test.ts` pins the fold for the
new operator, and `drillEmptyBucketNavHost-9085.test.ts` — which recorded this boundary as
open — is updated to record it closed.

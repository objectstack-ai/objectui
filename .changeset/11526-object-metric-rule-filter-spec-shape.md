---
'@object-ui/plugin-dashboard': patch
---

fix(plugin-dashboard): an `object-metric` with a structured `groupBy` and a rule-list `filter` draws its number

An authored node such as

```ts
{
  type: 'object-metric',
  properties: {
    objectName: 'opportunity',
    aggregate: { field: 'amount', function: 'sum', groupBy: { field: 'close_date', dateGranularity: 'month' } },
    filter: [{ field: 'stage', operator: 'equals', value: 'won' }],
  },
}
```

passes both authoring faces (`safeValidateSchema`, which `objectui validate` runs, and
`StrictAnyComponentSchema`), and on `ObjectStackAdapter` it drew the adapter's refusal
("the spec-shape branch received a `where` array that is not a filter") instead of its number
(objectui#11526).

A structured `groupBy` sends the tile down the spec-shape aggregate query (objectui#8613), and
`ObjectMetricWidget` passed the bag's `filter`, a `ViewFilterRule[]`, into that query's `where`
as written. The adapter posts that `where` verbatim and refuses a rule list there with
`UnloweredAggregateWhereError` (objectui#6825), so the query was never sent. The same rule list
with a string `groupBy` drew its number, because the legacy aggregate bag carries it as
`filter` and the adapter lowers that key itself.

The tile now lowers the rule list before it builds the spec-shape query: `toFilterNode` from
`@object-ui/core` turns it into filter AST, and `parseFilterAST` from `@objectstack/spec/data`
turns that into the `FilterCondition` that `QuerySchema.where` declares. These are the same two
stages the adapter applies to the rule list on the legacy bag, where its own translator is
private to `@object-ui/data-objectstack`. An array that is neither a rule list nor filter AST is
passed on unparsed, so the adapter still refuses it rather than receiving no filter and
aggregating every row.

What does not move:

- a string or absent `groupBy`: the legacy bag still carries the rule list as `filter`, and the
  adapter lowers it as before;
- a flat record filter (`{ stage: 'won' }`): it is already a `FilterCondition` and still travels
  verbatim as `where`;
- the drill-down drawer: it still receives the tile's resolved filter, unchanged;
- `UnloweredAggregateWhereError`: the adapter still refuses an unlowered rule list from any
  caller that skips the lowering.

One posted body changes without changing its answer: an empty rule list on the spec-shape query
now sends no `where`. It used to send `where: []`, which the platform engine reads as no filter.

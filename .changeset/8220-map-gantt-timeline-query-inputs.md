---
'@object-ui/plugin-map': minor
'@object-ui/plugin-gantt': minor
'@object-ui/plugin-timeline': minor
---

Declare the `filter` and `sort` inputs on the `object-map`, `object-gantt`,
`object-timeline` and `view:timeline` registrations (objectui#8220) — the html
tier stops reporting `unknown-prop` on two keys the spec declares and all three
renderers read.

objectui#7712's and objectui#8171's defect, three blocks over. `ObjectMap`,
`ObjectGantt` and `ObjectTimeline` each lower the authored keys onto their own
query — `$filter` (the authored `filter`, its context tokens resolved first) and
`$orderby: convertSortToQueryParams(schema.sort)` — but none of the four
registrations publishing those renderers listed either key in `inputs`, and
`sdui-parser`'s `validateTree` reports `unknown-prop` for every key no `inputs`
entry claims. An author writing the spelling that works was told it was unknown.

Unlike the kanban and calendar cases, these three blocks had no spec row when the
defect was filed, so declaring the keys then would have published an authoring
surface no contract backed. That order is now met on the installed package:
`@objectstack/spec` 17.5.0 maps `object-map`, `object-gantt` and `object-timeline`
in `ComponentPropsMap`, each row declaring `filter` as the `ViewFilterRule` array
and `sort` as the `SortItem` array. ADR-0049 enforce-or-remove therefore resolves
toward **declare**: both keys have live readers on both ends.

Both keys are declared `type: 'array'`. For `filter` that is the rule-array arm
`[{ field, operator, value }, ...]` and nothing else: the spec refuses the
MongoDB-style record form at all three doors, and with the key declared as an
array the html tier now refuses it too, as a `type-mismatch`, instead of passing
it as an unknown key. `sort` takes `[{ field, order }]`.

`view:timeline` declares the same pair as `object-timeline`: it is the same
renderer under a second tag, the `view:calendar` precedent. The map's and the
gantt's bare `view:` twins are already retired (objectui#10393, objectui#8008),
so four registrations carry the declaration, not six.

Pinned per plugin in `__tests__/queryKeysDeclared-8220.test.tsx`: the real
validator over a manifest built from the live registry, with an undeclared-key
control; the installed spec row's verdict on the same values; and a mount through
`SchemaRenderer` showing the rule array reach `$filter` and the sort items reach
`$orderby` on every tag.

Not changed here: the console's `registry-inputs-spec-parity` ledger. It does not
load these three plugins yet and books the blocks as unjudged, owed to
objectui#11168, so this change moves none of its rows.

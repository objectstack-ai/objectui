---
'@object-ui/core': patch
'@object-ui/types': patch
---

fix(core): `normalizeListViewSchema`'s density fold tests an own key, not `in` (objectui#10868)

The fold turned a legacy `densityMode` into `rowHeight` when the value was `in`
`DENSITY_MODE_TO_ROW_HEIGHT`, and `in` walks the prototype chain. So
`densityMode: 'toString'` came back with `rowHeight` set to
`Object.prototype.toString`, a function, and the key was dropped. The fold now
uses the same own-key test that `rowHeightToDensityMode` uses in the read
direction. An inherited key such as `'toString'` or `'constructor'` is now
treated like any other unrecognized density, such as `'cozy'`: nothing is
folded, `rowHeight` stays unset, and `densityMode` is kept. The three densities
`compact`, `comfortable` and `spacious` fold exactly as before.

Such a value reaches the fold only on a render path that does not validate.
`@object-ui/types`' zod schemas already refuse it: the `list-view` node declares
`densityMode` as a three-value enum, and a named view refuses `densityMode` by
name.

docs(types): `NamedListView`'s docblock no longer says the type is used in
`ObjectViewSchema.listViews`. Since objectui#7928 that member has been the
protocol's `ObjectListViewSchema`, by reference. The docblock now says what the
type is: exported, and the type of no member of the contract. The type itself is
unchanged.

---
'@object-ui/core': patch
---

`normalize-list-view`'s two view-kind tables now derive their partition from the undrawable table's own keys instead of a hard-coded list of kinds, so one spelling is total against both the `@objectstack/spec` this repository resolves today and one built from objectstack `main`.

`UNDRAWABLE_VIEW_KINDS` was annotated `Record<Exclude<ViewType, ListViewVisualization>, string | null>`, and `ListViewVisualization` subtracted the literal `'list' | 'detail' | 'page'`. An annotated object literal is exact in BOTH directions, so when objectstack retired the list-view kind `page` from the spec (objectstack#17063, ADR-0049 enforce-or-remove) the table's `page:` row became an excess property against the narrower union — a TS2353 whose only repair under that annotation is DELETING the row, which this repository cannot do while it resolves a published spec that still accepts `type: 'page'` views.

The table now carries `satisfies Record<string, string | null>` — the value constraint without the exactness — and the undrawable union is `Extract<ViewType, keyof typeof UNDRAWABLE_VIEW_KINDS>`, so a row for a kind the spec has retired goes inert at type level while staying live at runtime, which is what an author who can still write a `page` view against the resolved spec needs. `ListViewVisualization` subtracts that derived union instead of a literal list; its members are unchanged under either spec, and so is every runtime answer this module gives.

The guarantee the tables carry is unchanged and still mechanical, it just lands in one place instead of two: a kind the spec ADDS is classed by neither table, so it stays inside `ListViewVisualization`, and the total `Record<ListViewVisualization, true>` on `LIST_VIEW_KINDS` fails the build until the new kind is classed as drawable there or explained in the undrawable table. A MISSPELLED key in the undrawable table fails the same way, because the kind it was meant to class is not extracted either.

Compiled both ways rather than argued. With the published pin `@objectstack/spec@17.4.0` installed, `turbo run type-check --filter=@object-ui/core` exits 0 before and after this change. With a spec built from objectstack `main` injected in its place, the same command reported the TS2353 in `normalize-list-view.ts` before and does not report it after; the diagnostics that remain on that leg come from other files, are reproduced against the pristine source, and are not this change's.

`normalize-list-view.undrawableBothLegs-9880.test.ts` pins all of it over a SIMULATED vocabulary, because any single run installs only one spec: the retirement direction, the addition direction, and the old spelling's TS2353 kept as a firing control.

---
'@object-ui/plugin-dashboard': minor
'@object-ui/types': minor
---

Retire the widget `dataProvider` key, which was declared and written but read by
nothing (objectui#7353, ADR-0049 remove arm).

Both dashboard surfaces turned a `provider: 'object'` widget into a node for the
table / pivot widgets and wrote the whole provider config onto it as
`dataProvider`, beside `objectName`. The widgets read `objectName`; no renderer
read `dataProvider`. It was a second spelling of the same information, kept alive
only by its declarations.

**What changed.**

- `DashboardRenderer` (the `object-data-table` node) and `DashboardGridLayout`
  (the `data-table` and `pivot` nodes) no longer write `dataProvider`. They still
  write `objectName`, and the object-backed table widget still fetches through it.
- `@object-ui/types`: `ObjectDataTableSchema` no longer declares `dataProvider`, on
  the TS interface or on its zod mirror (`@object-ui/types/zod`).
- `@object-ui/plugin-dashboard`: `ObjectPivotTableProps['schema']` (the prop type of
  the exported `ObjectPivotTable`) no longer declares `dataProvider`.

**Breaking-change notes (declared `minor` per the repo's version policy).** Both
removals narrow a published declaration. Because `BaseSchema` keeps its
`[key: string]: any` index signature, TypeScript code that still sets
`dataProvider` on these nodes keeps compiling. The key is no longer typed, though,
so code that read `schema.dataProvider.provider` through the declared shape now
sees `any`.

**Validation, measured.** No named refusal was added. `ObjectDataTableSchema`
extends the `.passthrough()` `BaseSchema`, so an authored `dataProvider` is now an
unknown key: kept on the parsed value and not checked. A well-formed value parsed
green before this change and still does. A malformed one (for example
`provider: 42`) used to be refused at `dataProvider.provider` and now passes.
Authored `dataProvider` therefore does **not** start failing validation; the one
verdict that moves is that a malformed value is no longer rejected.

**DOM.** Measured with a real render of all three producer paths before the
removal: the key never reached a DOM attribute (no `dataprovider` /
`data-provider` attribute, no React unknown-prop warning), so this change ends no
objectui#4357-class leak.

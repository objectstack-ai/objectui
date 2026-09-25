---
'@object-ui/plugin-dashboard': minor
'@object-ui/types': minor
---

Retire the widget `dataProvider` key. It was declared and written, but nothing
read it (objectui#7353, ADR-0049 remove arm).

Both dashboard surfaces build a node for the table and pivot widgets from a
`provider: 'object'` widget. They copied the whole provider config onto that node
as `dataProvider`, next to `objectName`. The widgets read only `objectName`, so
`dataProvider` repeated the same information in a second place that no code used.

**`@object-ui/plugin-dashboard` — BREAKING (declared `minor` per the repo's
version policy).** Compared with the released 17.6.0:

- `DashboardRenderer` no longer writes `dataProvider` on the `object-data-table`
  node, and `DashboardGridLayout` no longer writes it on any node it builds for a
  `provider: 'object'` widget. Since objectui#10528 the grid builds that same
  self-fetching `object-data-table` node for such a table widget, and shows the
  retired-widget placeholder for such a pivot widget. The `object-data-table`
  node still writes `objectName` on both surfaces, and the object-backed table
  widget fetches through it.
- In 17.6.0, the `schema` prop types of `ObjectPivotTable` and `ObjectDataTable`
  both declare `dataProvider?: { provider: string; object?: string }`. Both now
  declare it as a retirement tombstone (`dataProvider?: never`). TypeScript code
  that sets `dataProvider` on these props no longer compiles.
- To migrate, delete `dataProvider` and set `objectName` to the object the widget
  should load. `ObjectPivotTable`'s node has no zod schema, so for that widget
  the type check is the only place the key is refused.

**`@object-ui/types`.** Released 17.6.0 declares neither `ObjectDataTableSchema`
nor `dataProvider`, so this part changes no released declaration and no released
validator's verdict. `ObjectDataTableSchema` itself is new after 17.6.0
(objectui#6576). With this change it ships with `dataProvider` retired on both
faces:

- the TS interface declares `dataProvider?: never`;
- the zod mirror (`ObjectDataTableSchema` in `@object-ui/types/zod`) refuses the
  key by name, with a message that says to write `objectName`.

The refusal applies to any value, well-formed or malformed. Other undeclared keys
are still accepted, as they are on every `BaseSchema` node.

**Why a tombstone rather than a plain deletion.** Both of these types extend
`BaseSchema`. Its TypeScript index signature and its `.passthrough()` zod schema
accept any key that is not declared. A deleted member would therefore still
compile and still parse, and it would still do nothing. The tombstone turns that
silent no-op into a named refusal that points at `objectName`. It reads nothing,
so no reader was added.

**DOM.** All three producer paths were rendered for real before the change. The
key never reached a DOM attribute: there was no `dataprovider` or
`data-provider` attribute and no React unknown-prop warning. So this change does
not close any objectui#4357-class leak.

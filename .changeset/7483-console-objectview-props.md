---
'@object-ui/app-shell': minor
---

**Narrowing — `ObjectView`'s props are the declared `ConsoleObjectViewProps`, not `any`.**

`ObjectView`, the route-level object surface this package exports, took a bare
`any` for its props. That erased the prop names as well as their types: a
misspelled prop compiled clean and was silently dropped, and a mount that left
out `objects` compiled and then threw on first render at `objects.find(...)`.

Its props are now the exported `ConsoleObjectViewProps`:

- `dataSource: DataSource` — the published `@object-ui/types` contract, required;
- `objects: any[]` — required;
- `onEdit: (record: Record<string, unknown>) => void` — required;
- `externalRefreshKey?: number`.

**What this means for a consumer.** Nothing observable changes at runtime; the
one runtime byte is an optional call behind an existing guard. At the type
level, `onEdit` and `objects` are now required (a mount without them is a
compile error, TS2739), a misspelled prop is a compile error (TS2322), and
`dataSource` must be a `DataSource`. A mount that passes the four props with
values of the declared types compiles as before. An `onEdit` handler whose
parameter is a narrower record type (for example an interface with required
fields) is now refused under `strictFunctionTypes` and must accept
`Record<string, unknown>`, and `externalRefreshKey` must be a number. The name
is `ConsoleObjectViewProps`
because `@object-ui/plugin-view` already exports `ObjectViewProps` for its
schema-driven view, a different shape.

Marked `minor`, not `major`: this repo's fixed release group is pinned to the
`@objectstack` major, so a narrowing is declared in the narrative rather than in
the bump.

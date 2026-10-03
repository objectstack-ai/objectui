---
'@object-ui/plugin-grid': minor
'@object-ui/plugin-list': patch
'@object-ui/types': minor
---

An `object-grid` publishes `description` and `emptyState` now that `@objectstack/spec` 17.6.0
declares them on its `object-grid` row, and `emptyState.title` / `.message` take an inline
locale map on both the grid and the list view (objectui#11227).

**`@object-ui/plugin-grid` (feature and fix).**

- `description` and `emptyState` are in the grid's declared inputs, so the designer panel, the
  component manifest and the generated `sdui-intrinsics.d.ts` offer them, and the SDUI parser
  no longer reports an authored `emptyState` as `unknown-prop`. `description` declares both
  arms of the `I18nLabel` union, so a locale map on it is not a `type-mismatch`.
- `emptyState.title` and `emptyState.message` are resolved against the display locale, as
  `label` and `description` are. Before, a locale map on either reached the empty-state
  component as an object, and the grid failed to render. A map with no usable entry keeps
  that member's default: the table's "No results found" heading, and no message line.
- `keyboardNavigation`, the row's third 17.6.0 key, is not published. The spec marks it
  `[EXPERIMENTAL — not enforced]`, and nothing in the grid reads it yet.

**`@object-ui/plugin-list` (fix).** A list view's authored `emptyState.title` and
`emptyState.message` are resolved against the display locale. Before, a locale map on either
was treated as absent, and the empty state drew the default copy in every locale. A plain
string is drawn as before.

**`@object-ui/types` (breaking for a reader of the text members, hence `minor`).**

- `ObjectGridSchema.emptyState` is the spec's `EmptyState`, and the Zod twin takes the spec's
  `EmptyStateSchema` by reference. `title` and `message` are `string | I18nLabel`, `icon` stays
  a string, and an unknown member is still refused by name. A locale map on `title` or
  `message` now parses, and a value that is neither a string nor a map is refused at that
  member.
- `NamedListView.emptyState` is `ListViewSchema['emptyState']`, the same spec type.
- TypeScript code that reads `emptyState.title` or `.message` as a `string` no longer
  type-checks. Resolve the value first, for example with `resolveI18nLabel` from
  `@objectstack/spec/ui`.

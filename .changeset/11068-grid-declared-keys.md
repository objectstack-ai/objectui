---
'@object-ui/plugin-grid': minor
'@object-ui/types': minor
---

An `object-grid` now honours `description` and `emptyState`, and four keys it declared but
never read are retired (objectui#11068).

**What was wrong.** `ObjectGridSchema` declared eight keys the grid never read. An author who
wrote `description`, `emptyState`, `name`, `placeholder`, `rowSpecActions` or `bulkSpecActions`
on an `object-grid` got no type error, no validator refusal and no effect. The reference
example in `schema-reference.md` taught `description` and `showFilters` as if they worked. It
now authors only keys the grid reads.

**`@object-ui/plugin-grid` (feature).**

- `description` draws one line of help text above the grid, in the muted style `list-view`
  uses for a view's description. A per-locale map resolves against the display locale, as
  `label` does. A map with no usable entry draws nothing.
- `emptyState: { title?, message?, icon? }` draws in place of an empty table, through the same
  empty-state component and icon resolver `list-view` uses. A member you leave out keeps the
  grid's default: the shared empty-state glyph, the table's "No results found" heading, and no
  message. It is not drawn when a term typed into the grid's own server-side search box emptied
  it: the table and its search box stay, so the term can be cleared. A grid without the key
  draws the table's own empty row, as before.

**`@object-ui/types` (breaking for a writer of a retired key, hence `minor`).**

- `rowSpecActions` and `bulkSpecActions` are retired. They were second spellings of
  `rowActions` and `bulkActions`, which the grid reads. Rename the key.
- `name` and `placeholder` are retired on `object-grid`. A grid is not a form field or an
  input, and the grid never read either key. Write `id` for the node's identity, `label` for
  its caption, and `emptyState: { message }` for the text shown when it has no rows.
- Each retired key is `?: never` on the interface and a named refusal on the Zod twin, so
  TypeScript code that writes one fails to compile, and a document that carries one fails
  validation with a message that names the key and its replacement.
- The Zod twin now also validates `emptyState`: three optional strings, with an unknown member
  refused by name.

**Unchanged.** An `object-view`'s `table` slot still withholds `description` and `emptyState`.
Write them on the `object-grid` node itself. `keyboardNavigation` is still declared and still
not read.

**Correction, 2026-10-03 (objectui#11227).** The Zod twin's `emptyState` is no longer three
optional strings. It is the spec's `EmptyStateSchema` by reference, which `@objectstack/spec`
17.6.0 declares on its `object-grid` row: `title` and `message` are `string | I18nLabel` (a
plain string or an inline locale map, which the grid resolves against the display locale), and
an unknown member is still refused by name (`.changeset/11227-object-grid-17-6-keys.md`).

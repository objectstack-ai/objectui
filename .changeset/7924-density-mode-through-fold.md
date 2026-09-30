---
'@object-ui/types': minor
'@object-ui/plugin-view': minor
---

**BREAKING** — `NamedListView.densityMode` is retired on the TypeScript authoring face
(objectui#7924, director-seat ruling **A′**). It is now a `?: never` tombstone: a
TypeScript author who writes it gets a compile error at that key, and its docblock names
top-level `rowHeight` as the key to write instead. The protocol names row density
`rowHeight`; `densityMode` was objectui's legacy spelling of it. ⚠️ Not
`userActions.rowHeight`, which is the boolean toggle for the toolbar's density control.

```ts
// before
const dense: NamedListView = { label: 'Dense', densityMode: 'compact' };
// after
const dense: NamedListView = { label: 'Dense', rowHeight: 'compact' };
```

This supersedes the earlier objectui#7924 entry in this release that listed `densityMode`
as retained because it was read. Its only reader outside the runtime fold was the relay
that carried it by name, and both relays now read the density through the fold.

**Both relays of a named view read the density through `normalizeListViewSchema`.** The
`renderListView` composition in `@object-ui/plugin-view`'s `ObjectView` and the Console
object page (`@object-ui/app-shell`) each hand the active view to the fold and relay its
`rowHeight`; neither names `densityMode` any more. A stored view carrying
`densityMode: 'compact'` renders the same density as before. ⚠️ A third-party host that
passes `renderListView` and read `schema.densityMode` off its argument now receives the
same density as `schema.rowHeight` (mapped through `DENSITY_MODE_TO_ROW_HEIGHT`) and no
`densityMode` key.

`allowExport` stays declared on `NamedListView`; its docblock now names both relays that
carry it. The `@object-ui/react` `useDensityMode` JSDoc example reads and persists
`rowHeight` (through `rowHeightToDensityMode` / `DENSITY_MODE_TO_ROW_HEIGHT`) instead of
`densityMode`; that is a documentation fix with no behaviour change.

⚠️ **Dated note, 2026-09-30 — `allowExport` has since been retired too — objectui#11013.**
Later in this same release both relays stopped reading `allowExport` off a view, and
`NamedListView.allowExport` became a `?: never` tombstone. So "`allowExport` stays
declared" above no longer holds. `.changeset/11013-view-row-declared-spellings.md`
states what ships; the text above is kept as the reading of this change.

**ADR-0087 disposition:** `densityMode` is a **D2** conversion. Stored documents are
accepted and converted at load by the existing runtime fold (`normalizeListViewSchema`
maps it onto `rowHeight`), and the TypeScript face refuses the old spelling at authoring
time.

---
'@object-ui/components': minor
---

Defer lucide's dynamic-import map off the eager path, and publish the icon-name
catalogue it carried (objectui#9204).

lucide derives `iconNames` as `Object.keys(dynamicIconImports)`, so importing the
names imports the 2,025-entry dynamic-import map with them. Four modules imported
it statically and the map rode the console's first payload.

- **New export `LUCIDE_ICON_NAMES`** — lucide's dynamic icon vocabulary as data,
  generated from the installed lucide and re-derived from it by a test. The
  metadata designer's icon picker reads it instead of `lucide-react/dynamic.mjs`.
- `getLazyIcon` / `LazyIcon` / `isLucideIconName` behave exactly as before: the
  same normalisation, the same catalogue, the same `Database` fallback. What
  changed is when the map arrives — on the first icon that renders, rather than
  with the first payload — so an icon shows its fallback glyph for one extra
  frame, the same frame `DynamicIcon` already showed while fetching its own
  per-icon chunk.

⚠️ This does NOT reduce the eager bundle on its own, and the measurement is in
the PR: the map costs 8,253 B gzipped of the eager `ui-components` chunk, the
catalogue costs 9,176 B in the same chunk, and the net is +923 B. The map's keys
ARE the names, so deferring the map cannot bank its bytes while
`isLucideIconName` stays a synchronous exact-membership predicate over the
DYNAMIC vocabulary.

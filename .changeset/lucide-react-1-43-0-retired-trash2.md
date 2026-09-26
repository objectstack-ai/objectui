---
'@object-ui/app-shell': patch
'@object-ui/cli': patch
'@object-ui/components': patch
'@object-ui/console': patch
'@object-ui/fields': patch
'@object-ui/layout': patch
'@object-ui/plugin-ai': patch
'@object-ui/plugin-calendar': patch
'@object-ui/plugin-charts': patch
'@object-ui/plugin-chatbot': patch
'@object-ui/plugin-dashboard': patch
'@object-ui/plugin-designer': patch
'@object-ui/plugin-detail': patch
'@object-ui/plugin-form': patch
'@object-ui/plugin-gantt': patch
'@object-ui/plugin-grid': patch
'@object-ui/plugin-kanban': patch
'@object-ui/plugin-list': patch
'@object-ui/plugin-report': patch
'@object-ui/plugin-tree': patch
'@object-ui/plugin-view': patch
'@object-ui/runner': patch
'@object-ui/types': patch
---

Move `lucide-react` from `^1.31.0` to `^1.43.0` in every package that declares it, and
repair what the jump breaks, so icons resolved from a STRING keep drawing a glyph.

Measured once against the installed 1.43.0 artifact when this change was made; nothing in
the repository re-derives these readings. Across the jump lucide removes no runtime export,
no public type name and no `lucide-react/dynamic.mjs` name, and every name this repository
imports from `lucide-react` resolves. Exactly one key leaves the runtime `icons` record:
`Trash2`, retired in favour of `trash`.

What a user sees change:

- Icons the lazy icon seam draws (`resolveIcon`, objectui#9251) get their path data again.
  lucide 1.43.0 icon modules export their path data inside `__iconData` and no longer
  export `__iconNode`; the seam now reads both. Reading only `__iconNode` against 1.43.0
  leaves every such glyph an empty box, with nothing thrown or logged.
- `DetailView`'s delete action and three schema-catalog examples spell their icon
  `trash`, not `trash-2`, so they keep resolving. The glyph is unchanged: 1.43.0's `trash`
  path data is byte-identical to the `trash-2` path data of 1.31.0 and 1.35.0. Anything
  that already authored `trash` now draws that same artwork, because lucide moved it under
  the `trash` name; a few other glyphs were also redrawn upstream.
- Icons imported as COMPONENTS carry lucide 1.43.0's own classes: one class per declared
  alias (a spinner renders `class="lucide lucide-loader-circle lucide-loader-2 ..."`), and
  no longer the class lucide used to derive from the PascalCase key where that differs
  (`ArrowDown01` no longer carries `lucide-arrow-down01`). The canonical
  `lucide-<icon name>` class is still there, so a `.lucide-loader-circle` selector still
  matches.
- Icons resolved from a STRING through the seam keep the classes they had: `lucide`, the
  canonical `lucide-<icon name>` class and the key-derived class. They do not carry
  lucide's per-alias classes. That is a maintainer ruling (objectui#8941, option C): the
  alias list lives only inside each lazily loaded icon module, and it was not moved into
  the eager name list. A selector that targets an alias class matches a component-imported
  icon and not a string-resolved one. This also dates the example in the objectui#9251
  entry: `trash-2` no longer resolves as a string, so no seam-drawn glyph carries
  `lucide-trash2 lucide-trash-2`; a digit-bearing name that still resolves, such as
  `arrow-down-0-1`, carries `lucide-arrow-down01 lucide-arrow-down-0-1`.

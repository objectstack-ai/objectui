---
'@object-ui/components': minor
'@object-ui/plugin-grid': minor
'@object-ui/types': minor
---

An `object-grid` honours `keyboardNavigation`: arrow-key cell navigation on the WAI-ARIA grid
pattern (objectui#11068). `@objectstack/spec` 17.6.0 declares the key on its `object-grid` row
(objectstack#20694), and the grid now reads it.

**`@object-ui/plugin-grid` (feature).**

- With the key on, the grid's data cells take one place in the Tab order instead of one each:
  Tab reaches them once, on the cell that last held focus (the first cell to begin with), and
  the next Tab moves past them. The arrow keys move focus one cell, Home / End go to the first /
  last cell of the row, and Ctrl+Home / Ctrl+End to the first / last cell of the page. On an
  editable grid, Enter still opens the focused cell, and an edit ended with Enter or Escape
  hands focus back to its cell. A widget a cell renders (the record link, a row's action menu,
  a selection checkbox) keeps its own Tab stop.
- The default is on when the grid renders editable: the authored `editable` and the viewer's
  permission to update the object, the value inline editing itself obeys. A read-only grid
  keeps every cell its own Tab stop unless `keyboardNavigation: true` is written, and
  `keyboardNavigation: false` turns it off on an editable grid. **An editable grid changes
  without an edit to its document:** its cells become one Tab stop, and the arrow keys move
  between them.
- `keyboardNavigation` is in the grid's declared inputs, so the designer panel, the component
  manifest and the generated `sdui-intrinsics.d.ts` offer it, and the SDUI parser no longer
  reports it as `unknown-prop`. This supersedes the line in objectui#11227's entry that says
  the key is not published and nothing reads it.

**`@object-ui/components` (feature).** `data-table` takes a `keyboardNavigation` flag that does
the above: the table is exposed to assistive technology as a `grid`, its data cells are one
roving Tab stop, and the keys move it. Off, which stays the default, the table is unchanged:
every data cell is its own Tab stop and the table carries no grid role. `ObjectGrid` sets the
flag in code; it is not an authoring key on a `data-table` node.

**`@object-ui/types` (feature).** `DataTableSchema` declares `keyboardNavigation?: boolean`, the
flag above, set in code by a host as `editable` is. `ObjectGridSchema.keyboardNavigation`'s
documentation describes the behaviour and the default. An `object-view`'s `table` slot still
refuses `keyboardNavigation`; its message now says the grid honours the key on an
`object-grid` node and the view does not hand it on.

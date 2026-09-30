---
'@object-ui/app-shell': patch
---

fix(app-shell): an interface page's source view now hides and orders its columns

An ADR-0047 interface list page (`InterfaceListPage`) builds its list schema
from the view its `interfaceConfig.sourceView` names, and carried that view's
`columns`, `filter`, `sort` (and its other keys) but not its `hiddenFields` or
`fieldOrder`. A
source view that authored either still showed every column of its `columns`, in
`columns` order: accepted, served, then dropped at the page. Both keys now reach
`ListView` beside the view's `columns`, which composes them as it always has —
`columns` projects, `hiddenFields` subtracts, `fieldOrder` sorts what survives,
and a surviving column it does not list sorts last (objectstack#15184).

The two keys travel with the view's column list, as one unit:

- A page that defines its own `columns` uses that list as it stands, and neither
  view key applies. The page config has no spelling of either key, and its own
  `columns` are not inherited from any view. This also keeps a design-mode column
  drag in place: the drag saves the order it shows as the page's `columns`, and a
  view `fieldOrder` would otherwise sort it back.
- A view whose `columns` is empty declares no projection, so the page derives
  the object's default columns and neither key applies.

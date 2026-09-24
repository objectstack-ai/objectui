---
'@object-ui/plugin-grid': minor
---

`object-grid`'s `rowActions` now NARROWS the row kebab's generic Edit / Delete inside the `operations` ceiling — the second half of the ruling whose first half ("`operations` is the ceiling") shipped with objectui#9819.

The gate in `resolveRowCrudAffordances` is now `operations.<op> AND (rowActions names it OR rowActions is absent) AND the callback is wired AND the object allows it`. `ObjectGrid` passes a new `rowActionsDeclared` signal (whether the view declared a `rowActions` array at all), because "`rowActions` absent" and "`rowActions` declared without this name" used to arrive at the gate as the same `false`.

BEHAVIOUR CHANGE, and the direction is NARROWING:

- A view that declares a `rowActions` list without `'edit'` (or `'delete'`) rendered the generic Edit (or Delete) entry before and hides it now — whether or not the view declares an `operations` block. This includes a list that names only custom actions (`rowActions: ['approve']` keeps its Approve entry and loses the generic pair) and an empty list (`rowActions: []`). To keep a generic entry, name it: `rowActions: ['approve', 'edit', 'delete']`.
- As with objectui#9819, a page that wrote `operations.<op>: false` together with a `rowActions` entry for it hides that button.
- Views that declare no `rowActions` at all are unaffected: the generic entries keep their default, still bounded by `operations` and the wired `onEdit` / `onDelete`.

Maintainer ruling of 2026-09-18, ruling batch #162 item 1, letter A, on objectui#9819; landed by objectui#10083.

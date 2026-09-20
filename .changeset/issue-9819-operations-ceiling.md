---
'@object-ui/plugin-grid': minor
---

`object-grid`'s `operations` block is now the CEILING over `rowActions`, instead of one half of a union with it.

The row kebab's edit and delete gates in `resolveRowCrudAffordances` read `(operations.update OR rowActions names 'edit') AND onEdit`, so `operations: { update: false }` could not close what `rowActions: ['edit']` opened. A block named `operations` failed to turn an operation off, and the author had nothing to observe but a button they believed was gone: no error, no warning, no degraded state. The delete gate carried the same `||`, so `operations: { delete: false }` failed identically. Both gates are now intersections, like every other layer around them.

BEHAVIOUR CHANGE, and the direction is NARROWING. A view that declares `operations.update: false` (or `operations.delete: false`) together with a `rowActions` entry for that same operation rendered the row's Edit (or Delete) entry before and hides it now. A present `operations` block already REPLACED the wired-callback default rather than merging under it, so a member the block does not name is withheld too: `operations: { delete: true }` plus `rowActions: ['edit']` no longer offers Edit. Views that declare no `operations` block at all are unaffected — the wired-callback default still opens both entries, and `rowActions` still routes its two canonical names to the grid's own `onEdit` / `onDelete`.

Maintainer ruling of 2026-09-18, ruling batch #162 item 1, letter A, on objectui#9819. `rowActions`' other ruled power — narrowing INSIDE the ceiling, so naming only `edit` would withhold an allowed Delete — is NOT part of this change; the section headed "`operations` is the ceiling" in `packages/plugin-grid/src/rowCrudAffordances.ts` records what blocks it.

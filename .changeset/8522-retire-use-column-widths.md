---
'@object-ui/plugin-kanban': minor
---

**BREAKING (scored `minor` per this repo's version-alignment convention)** —
`useColumnWidths` is removed from `@object-ui/plugin-kanban`, together with its
`UseColumnWidthsOptions` and `UseColumnWidthsReturn` types (objectui#8522,
maintainer ruling: remove).

The hook kept per-column widths in `localStorage`, and no kanban board read
them: a board sizes its lanes from its own width (`columnInlineStyle` in
`KanbanImpl`, derived on every render), and no kanban component accepts a
per-lane width. The published 17.6.0 entry exports the hook and both types, so
an import of it compiled and ran while changing nothing on screen.

## Migration

- `import { useColumnWidths } from '@object-ui/plugin-kanban'`, and the type
  imports `UseColumnWidthsOptions` / `UseColumnWidthsReturn`, no longer resolve.
  Delete the import and the call. Nothing replaces the hook, and removing the
  call changes no rendered width, because no board ever consumed what it
  returned.
- The `localStorage` key `objectui:kanban-column-widths` (and its per-board form,
  that key followed by `:` and the `storageKey` you passed) is no longer written
  or read by any package. Values already stored in a browser are inert; remove
  them if you want the storage back.
- `ColumnWidthConfig` stays exported from `@object-ui/types` and from this
  package. This change does not retire it.
- The batch #70 `kanban` arm entry in this same release names a
  `useColumnWidths` hook option as the channel for column widths. That channel
  is gone with this change, and no other channel replaces it.

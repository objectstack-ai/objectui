---
'@object-ui/components': minor
'@object-ui/plugin-detail': minor
'@object-ui/plugin-grid': minor
'@object-ui/plugin-tree': minor
'@object-ui/plugin-gantt': minor
'@object-ui/plugin-kanban': minor
'@object-ui/plugin-calendar': minor
---

One record-overlay shell: all five list-type renderers honour all four overlay
`navigation.mode` values (objectui#9299, director seat decision batch #128 item
1, 2026-09-13).

`ObjectGantt`, `ObjectKanban` and `ObjectCalendar` rendered one drawer for every
authored mode — `modal`, `split` and `popover` silently WERE the drawer, with no
diagnostic. `RecordDetailDrawer`'s payload is extracted into the new
`RecordDetailPanel` (shell-free by construction) and mounted through the shared
`NavigationOverlay`, which is what `ObjectGrid` and `ObjectTree` already used.

User-visible on published surfaces:

- **`modal` / `split` / `popover` now do what they say** on the gantt, the
  kanban and the calendar.
- **`split` renders.** Each renderer passes its own view as `mainContent`, so
  the board / calendar / chart / tree / grid sits beside the record panel.
  Authored `split` used to render NOTHING on `ObjectTree` — and, measured while
  fixing this, on `ObjectGrid` too.
- **`popover` is anchored to the element the user clicked** — row, node, bar,
  card, event — instead of degrading to a centred dialog. It was honoured on no
  surface before.
- **Drawer chrome converges** on the shared shell's header (breadcrumb title,
  close, optional expand) for the three renderers that brought their own.
- **Drawer widths carry over, they are not reset.** The two drag-resize
  implementations become one: a width persisted under the retired
  `objectui.drawerWidth.OBJECT` is read once, written forward to
  `ov:drawer-width:OBJECT` and removed. One key per object across every view
  type. The default width is unchanged at every viewport (objectui#6584); an
  authored width below `min(60vw, 880px)` now widens to it, which is the shell's
  long-standing policy on grid and tree.
- **Richer record body on grid and tree** — typed widgets, declared labels,
  honoured `hidden` — wherever the object declares its fields. With nothing
  declared those two renderers keep their own value-inference reading, which is
  what preserves the locale-aware date fallback (objectui#4541), the localized
  empty placeholder (objectui#8491) and the `format` hint (objectui#8920); the
  overlay shell is the shared one on that path too.

New published API: `RecordDetailPanel`, `buildRecordDetailFields`,
`RECORD_OVERLAY_DEFAULT_WIDTH` (`@object-ui/plugin-detail`);
`useOverlayAnchor`, `recordOverlayWidthStorageKey`,
`legacyRecordDrawerWidthKey` and the `popoverAnchorRef` / `legacyStorageKey`
props on `NavigationOverlay` (`@object-ui/components`). `RecordDetailDrawer`
keeps its props and is now a thin wrapper over the shared shell. ⛔ No spec
change.

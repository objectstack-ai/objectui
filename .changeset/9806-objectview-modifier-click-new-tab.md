---
'@object-ui/plugin-view': minor
---

`ObjectView` opens a Cmd/Ctrl/middle-clicked row in a new browser tab (objectui#9806).

Before this change, a Cmd-click, Ctrl-click or middle-click on an `ObjectView` row did
exactly what a plain click did. The row-click hook has a modifier branch, but it returns
early on any `onRowClick` it is given, and `ObjectView` always gives it one: its own
`handleRowClick`. That branch never ran for this component.

**What changed.** When no host `onRowClick` is supplied, `ObjectView` now reads the
modifier payload itself and opens the record as a full page in a new browser tab. This
matches what a bare `ObjectGrid` already does. The tab opens at the URL that
`navigation.mode: 'new_window'` already uses, so the component has one new-tab URL.

**What did not change.**

- If a host supplies `onRowClick`, the host gets the click and its modifier payload and
  makes the whole decision, as before. The hook's early return is unchanged.
- An inert row stays inert. A modifier click does nothing under `navigation.mode: 'none'`
  or `preventNavigation`, and it does nothing under `operations.read: false` when no
  navigation config is set. A modifier changes where a record opens. It never changes
  whether the record opens.
- `schema.onNavigate` is never called with `'new_window'`. Its declared second parameter is
  still `'view' | 'edit'`.

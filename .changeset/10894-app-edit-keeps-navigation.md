---
'@object-ui/plugin-designer': patch
---

fix(plugin-designer): editing an app keeps its stored navigation (objectui#10894)

**Clause-②: no** — an edit stops destroying stored navigation. No declared type, accepted key or published surface moves.

The console's "edit app" page (`EditAppPage`) loads the stored app into `AppCreationWizard`. Leaving the wizard's Objects step replaced the draft's `navigation` with one generated object entry per selected object, and every edit passes through that step. So any edit, even a title change, saved a stored `[object, separator, group, url]` tree as `[object]`. It dropped every separator, group (with its children) and `url` / `dashboard` / `page` / `report` / `component` / `action` entry, and each object entry's own label, icon and order, with no warning.

- **Leaving the Objects step no longer replaces the navigation.** An empty navigation (the create path) is still filled with one object entry per selected object. A non-empty one is merged:
  - a newly selected object gets an object entry, appended at the end;
  - the object entries of a deselected object are dropped, at the top level or inside a group. The group keeps its place and its other children, even when that leaves it with none;
  - every other entry is kept as stored, in its position. That includes each object entry's label, icon and order, and an object entry for an object the Objects step does not list.
- **`EditAppPage` counts an object as selected when the stored navigation has an object entry for it at the top level or inside a group, at any depth.** It counted only top-level entries, so a grouped object showed as unselected.
- The same merge applies on the create path once the author has shaped the navigation. Going back to the Objects step and forward again keeps the added separators, groups and links, and the order.

Pinned in `packages/plugin-designer/src/__tests__/EditAppPage.keepsNavigation-10894.test.tsx`.

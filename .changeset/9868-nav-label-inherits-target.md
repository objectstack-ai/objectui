---
'@object-ui/types': minor
'@object-ui/layout': minor
'@object-ui/app-shell': patch
---

feat(types,layout,app-shell): a navigation entry with no `label` shows its target's current label, resolved at render time (objectui#9868)

`@objectstack/spec` 17.5.0 made a navigation entry's `label` optional on every
entry arm of its `NavigationItemSchema` (the separator still carries none), with
a declared semantic (the cloud#2021 letter-A ruling): absent ⇒ the entry
shows the CURRENT label of what it opens — the view's label when it names a
labelled view, else the object's / dashboard's label; present ⇒ rendered
verbatim. Nothing is stored for the absent case, so a renamed target shows its
new name on the next render.

- `@object-ui/types` (widening): `NavigationEntryItem.label` is optional, and
  `NavigationItemSchema` accepts a label-less entry of every type the spec does,
  filling nothing in at parse time. `id` is still required. An EMPTY label is
  still refused — `''` is a present label that would render empty text — and the
  message says to omit the key instead. `menuItemToNavigationItem` no longer
  turns a missing legacy label into `''`.
- `@object-ui/layout` (additive public surface): `resolveNavItemLabel`
  resolves an absent label through a new `resolveTargetLabel` resolver
  (`NavigationRenderer` prop, types
  `NavLabelTarget` / `NavTargetLabelResolver`), walking view → object /
  dashboard, and falls back to the target's machine name (`viewName`,
  `objectName`, `dashboardName`, `pageName`, `reportName`, `url`,
  `componentRef`, the action name; a group shows its `id`). An authored label is
  never replaced by the target's label, including one spelled like the machine
  name. Action entries, the search filter and `AppSchemaRenderer`'s mobile tab
  bar read the label through the same function, so an unlabelled entry no longer
  throws there.
- `@object-ui/app-shell`: the sidebar, the `nav:menu` block, the ⌘K command
  palette and the full-page search all name a nav entry through
  `resolveNavItemLabel` with one hook over the metadata cache the shell already
  holds (object schema, merged list views, dashboards) — no request per nav
  entry. Read raw, a label-less entry drew a blank palette row searched as
  `undefined`, and the search page listed it by its machine name.
  Navigation sync stops writing `label: pageName` / `label: dashboardName` for an
  unnamed page or dashboard; an author label is still written, and stored labels
  are kept.

---
'@object-ui/types': minor
'@object-ui/layout': patch
'@object-ui/app-shell': patch
---

feat(types,layout,app-shell): a navigation entry with no `label` shows its target's current label, resolved at render time (objectui#9868)

`@objectstack/spec` 17.5.0 made `NavigationItemSchema.label` optional on every
navigation entry, with a declared semantic (the cloud#2021 letter-A ruling):
absent ⇒ the entry shows the CURRENT label of what it opens — the view's label
when it names a labelled view, else the object's / dashboard's label; present ⇒
rendered verbatim. Nothing is stored for the absent case, so a renamed target
shows its new name on the next render.

- `@object-ui/types` (widening): `NavigationEntryItem.label` is optional, and
  `NavigationItemSchema` accepts a label-less entry of every type the spec does,
  filling nothing in at parse time. `id` is still required. An EMPTY label is
  still refused — `''` is a present label that would render empty text — and the
  message says to omit the key instead. `menuItemToNavigationItem` no longer
  turns a missing legacy label into `''`.
- `@object-ui/layout`: `resolveNavItemLabel` resolves an absent label through a
  new `resolveTargetLabel` resolver (`NavigationRenderer` prop, types
  `NavLabelTarget` / `NavTargetLabelResolver`), walking view → object /
  dashboard, and falls back to the target's machine name (`viewName`,
  `objectName`, `dashboardName`, `pageName`, `reportName`, `url`,
  `componentRef`, the action name; a group shows its `id`). An authored label is
  never replaced by the target's label, including one spelled like the machine
  name. Action entries, the search filter and `AppSchemaRenderer`'s mobile tab
  bar read the label through the same function, so an unlabelled entry no longer
  throws there.
- `@object-ui/app-shell`: the sidebar and the `nav:menu` block both resolve
  targets through one hook over the metadata cache the shell already holds
  (object schema, merged list views, dashboards) — no request per nav entry.
  Navigation sync stops writing `label: pageName` / `label: dashboardName` for an
  unnamed page or dashboard; an author label is still written, and stored labels
  are kept.

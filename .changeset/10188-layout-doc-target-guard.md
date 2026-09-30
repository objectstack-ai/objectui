---
'@object-ui/layout': minor
---

feat(layout): a host can hide a `doc` navigation entry the member may not read (objectui#10188)

`NavigationRenderer`, `AppSchemaRenderer` and `hasVisibleNavigationItems` take an optional
`checkDocTarget` — a `DocTargetChecker`, asked `{ book, doc }` for each `type: 'doc'` entry.
An entry it answers `false` for is not drawn, is not collected into Favorites, and does not
make its area count as visible: it joins the one guard statement the other item guards
already share. Without it, `doc` entries draw as before.

It is defence in depth. The server is the enforcer (ADR-0046 §6.7): its app read already
leaves out a `doc` entry the member may not read. This layer holds no audience rules, so the
host answers from the member's own doc / book reads. `DocNavTarget` and `DocTargetChecker` are
exported. `CapabilityChecker` is unchanged: it asks whether the runtime has a target, and this
checker asks whether the member may read it.

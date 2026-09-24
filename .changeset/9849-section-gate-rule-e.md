---
'@object-ui/plugin-form': minor
---

`object-form`: one rule for section divider rows on every layout, and a section's own
settings apply whether or not it has a heading (objectui#9849 step two, director ruling
letter E).

Before this change, the default, modal and drawer layouts gave four different answers for a
section with no `label`. Some drew no row, some drew a row carrying only the blurb, and some
drew a full row. Whether the section's `visibleWhen` predicate and its `collapsed` /
`collapsible` pair were honoured depended on which of those answers the layout gave.
There is now one rule:

- A section's `visibleWhen` predicate gates its fields on every layout, heading or not. A
  section with a `description` and no `label` on the default layout used to show its fields
  even when its predicate was false. That group is now hidden, like a titled one.
- The divider row is drawn when the section has a `label` or a `description`. With a
  `description` alone it is the blurb-only row (no heading, just the blurb). The drawer's
  explicit `sections` path used to push a row for every section; it follows the same rule now.
- The collapse control sits on that row. A blurb-only row can now collapse its section: on the
  default layout, `collapsed: true` on a section with a `description` and no `label` used to be
  ignored. It now starts closed, and clicking the blurb opens it.
- A section that declares `collapsible` or `collapsed` but has neither a `label` nor a
  `description` has no row to hold the control. It renders open, and a console warning says
  so: "collapsible section has no heading or description to carry its control". Its fields
  are never hidden without a control.
- The modal layout now honours `collapsible` / `collapsed`, both for explicit `sections`
  (`ModalFormSectionConfig` gains the two members) and for sections derived from the
  object's `fieldGroups`. Before, it ignored both and always drew every field. The `tabbed`
  modal content layout draws tabs, which do not collapse, so it is unchanged.

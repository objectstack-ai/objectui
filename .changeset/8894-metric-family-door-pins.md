---
---

Tests only, no package released (objectui#8894, ruling D). A metric-family dashboard widget
declares exactly one measure since `@objectstack/spec` 17.5.0, and objectui's authoring doors
already refuse a second one because `DashboardWidgetSchema` re-attaches the spec's own check. This
change pins that refusal on each objectui face that judges a dashboard widget: the widget mirror
itself, the published `safeValidateSchema` door (which the CLI's `validate` command prints), and
the metadata-admin editor's live validation on both its create and edit doors. The family is read
off the spec's own rule at run time, by putting every spec chart type through the spec's
`DashboardWidgetSchema` with two measures, so it follows the spec rather than a list kept here.


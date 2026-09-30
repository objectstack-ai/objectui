---
'@object-ui/app-shell': patch
---

fix(app-shell): the report and dashboard-widget pickers show a dataset member's label and the dataset's description

The report inspector and the dashboard-widget inspector now show the text a
dataset declares for its author, beside the machine names. Each measure and
dimension option shows the member's `label`, and each dataset option shows the
dataset's `description`. Before, every measure and dimension option showed the
bare name, and no picker showed a description.

The form is the same in both inspectors: the author's label, then the machine
name. The add-member lists show the label with the name in a code chip beside
it (`Revenue · sum` beside `revenue`). The report's chart-axis selects write
`Revenue (revenue) · sum`, the form the dataset picker already used. The
dashboard's filter-field picker shows the name, then the label. A measure keeps
its ` · aggregate` hint where it showed before. A dataset option adds its
description after ` — ` in the report's select, and as the muted hint in the
dashboard's searchable picker. Where the dataset declares no label or
description, each option reads as it did before.

The label, the description and the dataset label are `I18nLabel`. They resolve
through the spec's `resolveI18nLabel` in the designer's language, so an inline
per-locale map shows its entry for that language. Before, a map-valued dataset
label showed the machine name instead. A language switch re-reads the text
without refetching the catalog. The text is display only. What a pick stores
(`report.values`, `rows`, `columns`, `chart` axes, `dataset`, and the widget's
`dimensions`, `values` and `dataset`) is still the machine name.

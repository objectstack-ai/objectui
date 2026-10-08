---
'@object-ui/app-shell': patch
---

Studio keeps a new dashboard widget as an unsaved edit until a dataset and a measure are picked, instead of showing a red error right after *Add widget* (objectui#11910).

- **Interfaces page, a dashboard in Design mode.** *Add widget* → *Metric* (or any other type the picker offers) no longer sends the widget before it is bound, so it no longer draws a 422 and a red "Changes not saved" strip. The widget stays on the canvas, unsaved. A neutral line names what it needs ("Not saved yet: Dataset on the widget “New metric (kpi)” needs a value."), with "Show me" when that widget's inspector is not the one open. The widget inspector says "Required" under the Dataset picker, then under the measures once a dataset is picked. Picking a measure saves the dashboard as usual.
- **Publish.** While a dashboard holds such a widget, Publish refuses and names the widget, instead of publishing the last saved drafts without it.

Studio decides "not yet bound" with the widget rules from `@objectstack/spec`: a widget is held only when the spec refuses it for nothing but a missing dataset, dimensions or measures. A widget the spec or the server refuses for anything else, such as a dataset name that is wrong or two measures on a metric, is sent, and its refusal shows the red strip as before. Nothing is added to the package entry: no export, prop, type member or language-pack key. The new string is a row in the metadata-admin designer's own string tables (en and zh).

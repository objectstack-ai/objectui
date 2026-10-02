---
'@object-ui/plugin-designer': minor
---

**BREAKING (TypeScript props)** — `DataModelDesignerProps.autoLayout` and `ReportDesignerProps.previewMode` are removed, and the `data-model-designer` registration no longer publishes `autoLayout` as an input (objectui#11434).

Neither prop was ever read: `DataModelDesigner` arranges entities only when the toolbar's Auto Layout button is pressed, and `ReportDesigner` has no preview mode. `@object-ui/types` retires the matching node members in the same release, so the component face, the registration and both node faces now agree.

**Migration.**

- `<DataModelDesigner autoLayout />`: drop the prop; use the toolbar's Auto Layout button. The package README's example no longer passes it.
- `<ReportDesigner previewMode />`: drop the prop; for a chrome-free, non-editable layout pass `readOnly`, `showToolbar={false}` and `showPropertyPanel={false}`.

The Field Designer's defaults map also drops the labels `appDesigner.fieldDesigner.validationRules` and `appDesigner.fieldDesigner.addRule`, which named an editor that was never built (see the `@object-ui/i18n` note of this release). Nothing renders differently.

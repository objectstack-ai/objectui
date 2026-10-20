---
'@object-ui/app-shell': patch
---

Studio's create dialogs now bind each field label to its input (objectui#13128). The display-name and identifier labels in the shared create dialog had no `htmlFor`, and the inputs had no `id`, so a screen reader announced two unlabeled edit fields and `getByLabelText` found nothing. Each label now names its input, with ids unique per mount. This fixes all five Studio create dialogs that share the component: Create app, the Interfaces create dialog (report, page or dashboard), New object, New automation and New permission set. Nothing changes visually, and no copy, export or prop changes.

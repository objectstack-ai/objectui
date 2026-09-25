---
---

Docs-only: the `DashboardComponentSchema` section of `content/docs/api/schema-reference.md` stops teaching `colSpan`, `rowSpan` and `body` as widget keys, which the strict `DashboardWidgetSchema` refuses by name (objectui#8290). The example, the `widgets` row and the prose under the table now use `layout: { x, y, w, h }` for a widget's grid box and `type` + `options` (or `component`) for its content, and the `widgets` type column names both arms of the slot. No published behaviour changes.

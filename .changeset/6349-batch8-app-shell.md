---
'@object-ui/app-shell': patch
---

The props of the console's page header are declared as `ConsolePageHeaderProps` instead of `PageHeaderComponentProps` (objectui#6349, batch 8). `@object-ui/layout` publishes `PageHeaderComponentProps` for the props of its own `PageHeader`, the renderer of the authored `page:header` node, which is a different component. This package's entry does not export the console header, so no import changes and the props are the same.

No runtime behaviour changes.

---
'@object-ui/plugin-grid': patch
'@object-ui/plugin-detail': patch
---

A declared action `icon` is now drawn beside the label on the row's inline primary button, the row "⋮" menu item and the record-header quick action (`record:quick_actions`). The name resolves through the shared icon seam (`resolveIcon` from `@object-ui/components`); an unknown name draws the label alone, and an action with no `icon` renders exactly as before.

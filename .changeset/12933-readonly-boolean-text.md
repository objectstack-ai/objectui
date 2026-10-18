---
'@object-ui/plugin-detail': patch
---

`record:details` draws a boolean the viewer cannot edit as the locale's word for its value (`common.yes` / `common.no`) instead of a disabled checkbox that read as a setting refusing the click (objectui#12933). An editable boolean keeps its checkbox, and a value that is not a boolean still draws the shared "No value" affordance.

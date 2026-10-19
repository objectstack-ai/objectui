---
'@object-ui/plugin-detail': patch
---

`record:quick_actions` no longer shows its authoring placeholder ("record:quick_actions — no actions configured") to a viewer whose named actions are all withheld. A block that names actions but resolves to none (every action withheld by `requiredPermissions`, hidden by `visible`, at another location, or with no record to run against) now draws nothing, as the record header and the row menu do. A block that names no action keeps the placeholder on a design / preview surface (`PreviewModeProvider`) only and draws nothing in a runtime view. A refused action array still names the refusal on the surface.

---
'@object-ui/app-shell': patch
---

Home's "Activity feed" card now shows the record activity panel's permission sentence ("You don't have permission to view activity…") when the server refuses its `sys_activity` read, instead of "An unexpected error occurred." The shared activity feed classifies the rejection with `isRefusedFeedRead`, the verdict the record panel already reads; every other failure keeps the generic error (objectui#12843).

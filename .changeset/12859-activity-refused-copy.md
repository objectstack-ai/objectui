---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

A refused activity read now shows one neutral sentence, "You don't have permission to view activity.", on Home's activity card and in the header bell's Activity tab. Home used to say "…activity on this record", where there is no record, and the bell showed "An unexpected error occurred.". The new key `layout.activityFeed.accessDenied` is in all ten language packs. The record activity panel keeps its own sentence. Any other failure still shows the generic error.

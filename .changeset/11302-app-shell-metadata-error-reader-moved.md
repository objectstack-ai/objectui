---
'@object-ui/app-shell': patch
---

The Studio surfaces import `formatMetadataError` from `@object-ui/data-objectstack`, where the reader now lives (objectui#11302). What they show is unchanged; the publish-failure formatter stays in app-shell and writes each issue with the same `formatMetadataIssue` line.

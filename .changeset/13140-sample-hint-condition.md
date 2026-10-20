---
'@object-ui/app-shell': patch
---

The draft preview bar promises sample data on publish only when publishing will load some (objectui#13140).

The bar's hint "Sample data appears once you publish" showed whenever any change was pending. Publishing loads rows only for a pending `seed` draft, so a pending change in a package with no sample data, whose records were already on screen, was told that example records would load. The hint now shows only while a `seed` draft is among the pending drafts the bar's Publish button publishes. Otherwise the band shows the Publish button alone, and so does a pending count that failed to load.

The copy is unchanged, so no locale moves. Nothing is added to the package entry: no export, prop or type member changes.

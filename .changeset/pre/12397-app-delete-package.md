---
'@object-ui/console': patch
---

Setup › Apps: deleting an app names the package whose row it removes (objectui#12397, the consumer half of objectstack#23293).

Since `@objectstack/rest` 18.0.0-next.1, a delete that names no package of an app two packages hold is refused `409 RESOURCE_CONFLICT`: nothing is deleted, and `?package=` is named as the remedy. The page already names the owning package on every save. Delete now sends it too, through `@objectstack/client`'s `meta.deleteItem` `packageId` option, read from the app's served `_packageId`. A package-less app, including one served with the `sys_metadata` sentinel, sends no package, and a refusal is still shown in the server's own words.

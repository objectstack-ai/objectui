---
'@object-ui/app-shell': patch
---

The pending-changes sheet no longer lists the package stamp as one of the author's own changes (objectui#12594). Expanding a new object draft showed `_packageId` under "Also changed:" beside the keys the author set. The drill-in now leaves out the protection keys every served item carries (`_packageId`, `_packageVersion`, `_provenance` and the `_lock` family), read from `@objectstack/spec`'s `MetadataProtectionFields`. The same applies to an update: a draft that differs from its published version only in those keys reads as "No differences detected". The registry and the package loader set these keys, and the metadata API refuses a save that would change a lock, so none of them is an edit the author can publish. Every other key still lists, an underscore key the spec declares outside that set included (an app's `_unpublished`). Nothing served or saved changes.

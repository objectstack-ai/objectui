---
'@object-ui/app-shell': patch
'@object-ui/data-objectstack': minor
---

Studio's first draft save after opening an item no longer replaces a draft that was saved elsewhere in the meantime (objectui#11773).

Until now an editor's draft saves were pinned only from its second save on: the `/meta` draft read served no version, so two editors who each opened an item and saved it once overwrote each other's draft in silence. The `@objectstack/*` 18 draft read serves the version, and each editor's load now pins its first save to what it read:

- an item with a pending draft is saved with `If-Match` and that draft's version;
- an item with no pending draft is saved with `If-None-Match: *`, so a draft another editor created in the meantime is refused, not overwritten.

The editors read the draft at the package their saves write to (`?package=`), since a read's version describes the row a save to the same address compares against. This covers the metadata editor, the permission matrix's package door, the Studio pillars (objects, flows, interfaces and app navigation), the list-view panel and the hooks panel.

A create sends `If-None-Match: *`, so creating an item under a name that already holds a draft is refused instead of writing the new skeleton over it.

In the conflict dialog, **Overwrite** now re-sends the draft pinned to the version the refusal names (`currentVersion`), so a save that lands while the dialog is open is refused and asked about again rather than overwritten. A server whose refusal names no `currentVersion` is overwritten unpinned, as before.

`@object-ui/data-objectstack`: `MetadataClientSaveOptions` gains `ifNoneMatch?: '*'`, sent as `If-None-Match: *`. It never travels with `ifMatch`: `MetadataClient.save` throws before sending a request that sets both. The `ifMatch` docblock now names the token's real sources (the item read's `version`, a save receipt's `version`, a conflict's `currentVersion`) instead of "the `checksum` returned by the last read".

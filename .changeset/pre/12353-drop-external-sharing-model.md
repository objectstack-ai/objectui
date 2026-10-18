---
'@object-ui/app-shell': minor
---

**Studio no longer offers `externalSharingModel`** (objectui#12353). `@objectstack/spec` retires the key on the v18 line (objectstack#23268, ruling A): it has no runtime reader, and an author who sets it is refused with "delete the key".

- The object Settings tab drops the external sharing dial and its "external wider than internal" (ADR-0090 D11) warning.
- The package OWD overview drops its External column, the D11 row check that blocked Save, and the banner that came with it. A `controlled_by_parent` row's master link now sits under the row's sharing-model dial.
- The permission-set matrix drops the `Ext` badge beside each object's OWD badge.
- No Studio control reads, renders or writes `externalSharingModel` any more. A save still sends the object document it read as it was stored, so an object that already stores the key keeps it until the author deletes it. `sharingModel` and `publicSharing` are unchanged.

Nothing a published export names is removed: the comparison helper that went with the dial (`isExternalWider` in `views/studio-design/owd-sharing.ts`) was module-internal, as were the i18n keys that labelled the dial, the column and the badge.

Shipped as `minor` per this repository's version policy: it removes a Studio control.

---
'@object-ui/app-shell': patch
---

`MetadataTypeStatus` and `UserDataAdapter` are no longer declared a second time in this package (objectui#6349, batch 9). `MetadataTypeStatus` is re-exported from `@object-ui/react`, which declares the same four statuses (`'idle' | 'loading' | 'ready' | 'error'`) for `MetadataContextValue.getTypeStatus`. `UserDataAdapter` is re-exported from `@object-ui/data-objectstack`, whose `createObjectStackUserStateAdapter` builds exactly the adapter `UserStateAdaptersProvider` injects. Both declarations had the same members as this package's copies, so each name now has one authority.

This package's entry still exports both names, with the same shapes, so no import changes.

No runtime behaviour changes.

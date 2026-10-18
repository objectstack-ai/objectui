---
'@object-ui/app-shell': patch
---

The permission set editor's provenance badge decides from `packageId` and the package artifact only (objectui#12753). Spec 18 retired the authored `managedBy` on a permission set (objectstack#23891), so no served or saved body carries it. The badge used to read it for a third answer, "Platform", and as one input to "Package". No served datum names a platform set: the layered read serves `_packageId` and `_provenance` (`package` or `org`), so a set the platform ships through a package reads "Package", like any other packaged set.

- The badge now has two answers. "Package" means a package ships the set: it is opened under the package door's `packageId`, or its code layer is a package artifact. "Custom" means it was authored in this environment.
- The routed page's badge and the Studio Access pillar's kind chip read one derivation, so they cannot disagree.
- A draft that still carries a stray `managedBy` (an old stored row) no longer moves the answer. `managedBy: 'platform'` used to read "Platform", and `managedBy: 'package'` used to read "Package" for a set no package ships. Both now read "Custom".

Clause-②: no

The metadata-admin string table loses `perm.badge.platform` (en and zh), the "Platform" label only that badge read. The table is module-local: it is not exported from the package entry, so no consumer can address the key. The local `PermissionSetDraft` type loses its `managedBy` member; that type is not exported from the package entry either. No export, prop or exported type member changes.

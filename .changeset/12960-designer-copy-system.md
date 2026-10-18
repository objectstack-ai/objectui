---
'@object-ui/app-shell': patch
---

The metadata designer's copy no longer names the running system by the cloud noun "environment" (objectui#12960, the same rule objectui#12956 applied to the locale packs). Where a string meant the system the user is in, it now says "this system" (zh 「本系统」):

- The Packages page subtitle, the "no permission to manage packages" refusal and the confirmation for moving loose metadata into a package.
- The permission set editor's lock hint, the "Clone to customize" hint and guidance, and the save-refused message: the copy is "an ordinary permission set authored in this system".
- zh only: the provenance badge for a set no package ships reads 「自定义」, matching the English "Custom", instead of 「本环境自定义」.

"Environment-scope" and "environment overlay" stay where they name the overlay layer (the metadata-type registry's `allowEnvironmentOverlay`) and not the system.

Clause-②: no

Copy only: no string key is added, removed or renamed, the `{name}` placeholder is unchanged, and no export, prop or exported type changes.

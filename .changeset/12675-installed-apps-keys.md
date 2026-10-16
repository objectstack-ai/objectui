---
'@object-ui/i18n': minor
---

Seven `marketplace.*` keys are removed from all ten language packs: `installedTitle`, `installedSubtitle`, `installedEmpty`, `installedAt`, `installedBy`, `installedPackageId` and `cachedAs` (objectui#12675). Only the Installed Apps list read them. That list's body is retired: Setup → Packages is the one list of what is installed, and its rows do not show an install date, an installer or the cached-manifest path. A host that read one of these keys gets the key back instead of a sentence.

Fix for a host that still reads one of them: carry the sentence in the host's own bundle, or drop the read.

Clause-②: yes (narrowing)

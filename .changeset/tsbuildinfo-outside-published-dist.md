---
---

Internal only — no package release.

Every composite project now pins `tsBuildInfoFile` to its own package root, so the
incremental build record is never derived into `dist`. Nothing under any package's
`files` list changes, and no published source or publish-contract field moves:
the diff is 30 `tsconfig.json` files, two `clean` scripts and one pin test
(objectui#9189).

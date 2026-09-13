---
---

Internal only — `scripts/check-doc-snippet-types.mjs` and its test. The emitted-code
census now reads the `package.json` a generator itself emits, so a template is judged
against the manifest its READER installs rather than against this repository's root
manifest (objectui#8397). No published package changes.

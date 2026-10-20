---
'@object-ui/app-shell': patch
---

Studio's Data rail points at its own "+" when a package has no objects (objectui#13127). The rail's empty sentence read "No objects yet — create one below to start", but the rail draws nothing below it: in a writable package, the rail's only create control is the "+" in its heading row, above the sentence. It now reads "No objects yet — click “+” above to create one" (zh: "还没有对象 — 点上方的「+」新建"), the wording the Automations and Access rails use for their own empty sentences.

In the published source, only the value of the existing `engine.studio.data.noObjects` key changes, in the metadata-admin designer's own string table (en and zh). No key is added or removed, and nothing on the package entry changes. When the sentence renders is unchanged: a read-only package's rail draws no "+" and still shows it, as it showed the old one.

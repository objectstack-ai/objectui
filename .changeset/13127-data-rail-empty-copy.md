---
'@object-ui/app-shell': patch
---

Studio's Data rail no longer sends the author "below" for a create control that is not there (objectui#13127). In a package with no objects, the rail's empty sentence read "No objects yet — create one below to start", while the rail's only create control is the "+" in its heading row, above the sentence. It now reads "No objects yet — click “+” above to create one" (zh: "还没有对象 — 点上方的「+」新建"), the same wording the Automations and Access rails use for their empty sentences.

Only the value of the existing `engine.studio.data.noObjects` key changes, in the metadata-admin designer's own string table (en and zh). No key is added or removed, and nothing on the package entry changes.

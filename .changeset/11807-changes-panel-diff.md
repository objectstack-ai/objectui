---
'@object-ui/app-shell': patch
---

Studio's publish review and publish confirmation say what changes (objectui#11807).

- **Changes panel, per-item diff.** Expanding a pending draft now lists the top-level keys it adds (`+`), changes (`~`) and removes (`−`), the way it already listed the object's fields, instead of one "Also changed:" list that mixed all three.
- **Changes panel, a draft that changes nothing.** Once an entry's drill-in finds the draft equal to its published version (after the framework's read decorations are stripped, as before), the row drops its *Update* badge and shows an "equal" glyph whose accessible name is the drill-in's "No differences detected" sentence. The mark is learned on expand, where both bodies are already read: deciding it for every row when the sheet opens would cost two reads per draft. The draft is still published with the rest, so the panel's counts are unchanged.
- **Studio's Publish, the success toast.** It names how many items went live, read from the batch's own `published[]` ("Published 2 items in this package (one atomic release)"); the package-less scope names its flow drafts the same way. A runtime that answers without `published[]` gets the previous sentence, which names no number.
- **Studio's Publish, nothing to publish.** The batch's `nothing_to_publish` answer, and a package-less publish that finds no pending draft, now say "No drafts pending publish". The first used to raise "Action failed"; the second used to raise the success toast.
- **Studio's Publish, a refused batch.** The error toast names each refused item with the server's reason again, as `formatPublishFailures` was written to. Since the publish moved onto `MetadataClient` (objectui#10039), the batch's own `success: false` was read before `failed[]`, and every refusal read "Action failed".

**Clause-②: no.** No export, prop, `@object-ui/types` member or `packages/i18n` key is added or removed. The new toast strings live in the Studio string table (`engine.studio.publishedAllCount`, `engine.studio.publishedAllFlows` and their singular rows); `engine.studio.org.published`, which no call site reads any more, is removed.

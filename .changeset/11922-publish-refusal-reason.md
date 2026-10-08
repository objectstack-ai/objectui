---
'@object-ui/app-shell': patch
---

A refused package publish names each refused item with the server's reason, on the package sheet and on Home's *Publish all* and the draft-preview bar (objectui#11922).

`POST /packages/:id/publish-drafts` answers a refusal (`outcome: 'refused'`) on a 200, with the batch's own `success: false` and every item that did not publish, with its reason, in `failed[]`. Both doors read `success` first and stopped there: the package sheet showed "Action failed", and Home's *Publish all* and the draft-preview bar toasted "Publish failed: publish-drafts did not publish this package". Both now read `failed[]` first, as Studio's publish does (objectui#11807).

- **The package sheet.** A rolled-back batch (ADR-0067 D2) keeps its "Nothing was published — the batch rolled back" row and names the causal item with its reason. The drafts rolled back with it are not listed as causes. A refusal with no rolled-back item (the runtime's pre-flight checks) keeps its "Published N; M failed" row and now names every refused item with its reason after it.
- **Home's *Publish all* and the draft-preview bar.** The "Publish failed" toast names the refused items with their reasons, leaving out the rolled-back ones, in place of "publish-drafts did not publish this package".

A published batch, and a batch that carries an envelope `error` with an empty `failed[]`, read as before. Nothing is added to the package entry: no export, prop, type member or language-pack key.

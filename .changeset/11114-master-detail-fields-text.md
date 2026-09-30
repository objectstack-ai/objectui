---
'@object-ui/plugin-form': patch
---

The `object-master-detail-form` registration's `fields` description no longer calls that key "the submitted set" (objectui#11114).

The sentence told an author, or an AI authoring metadata, that the parent field pool bounds what Save writes. It does not, and it was never meant to: `fields` bounds what the parent form DRAWS and edits, and on a create the parent leg of the atomic batch is the drawn fields plus any parent value seeded through `initialValues` (or its alternate spelling `initialData`), drawn or not. The description now says exactly that, and adds that a seed for an undeclared, server-owned, computed or read-only field is still stripped, as on any save.

Text only. The description is a declared input of a public-tier block, so it reaches the published `sdui.manifest.json`; no input, type, default or accepted value moves, and no runtime behaviour changes. The parent leg is deliberately not filtered to `fields`: that would silently drop author-seeded values, which is how a hidden parent key reaches a record.

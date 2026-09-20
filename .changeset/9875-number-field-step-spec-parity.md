---
---

objectui#9875 — measurement only, no published surface moves.

`step` on the object FIELD surface was measured against the installed
`@objectstack/spec` at both doors this repo uses (the `ObjectSchema` parse
`saveMetaItem` performs on a type `object` item, and the served document's
`stripReadDecorations`): it is **preserved**, because the protocol declares it
as a flat member of `FieldSchema`. The card's premise — that the field surface
declares it nowhere — was false; the declaration it read as "the slider node" is
a member of the field surface itself.

Landed: a pin that fixes that answer in both directions, plus a docblock at
`NumberFieldMetadata.step` recording it. No type gained or lost a member, no zod
surface moved, no runtime changed — hence the empty frontmatter.

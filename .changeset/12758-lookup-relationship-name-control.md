---
'@object-ui/app-shell': patch
---

The object designer no longer offers a "Relationship name" box on lookup, master-detail and tree fields (objectui#12758).

The box wrote `relationshipName`, a key the spec's `FieldSchema` does not declare under any spelling. Typing into it put the field in the spec banner ("Unrecognized key(s) on this field: `relationshipName`"), and every autosave of the object was refused with `422 INVALID_METADATA`, including the saves of later, unrelated edits. The spec has no inverse-collection key on a child's lookup field, so the box is removed rather than pointed at another key. The spec's `relatedList` and `relatedListTitle` keys are a different concept: they decide how the child collection is shown on the parent's detail page, and they do not name it.

Nothing else on the lookup inspector changes. Two strings leave the metadata-admin designer's own tables (en and zh): `designer.field.relationshipName` and `designer.field.relationshipNameHint`. No export, prop or type member changes.

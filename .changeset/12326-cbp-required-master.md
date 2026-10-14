---
'@object-ui/app-shell': patch
---

Studio keeps a `controlled_by_parent` object savable on `@objectstack/spec` 18 (objectui#12326, the objectui half of objectstack#23100).

Since spec 18 (ADR-0055 §1), a `controlled_by_parent` object gets its master from exactly one `master_detail` field declared `required: true`. The metadata save door refuses any other shape. Studio wrote a master that omitted `required`, so the save was refused. The package OWD overview also named the first `master_detail` by field order as the master, which is not how the runtime picks one.

- **Choosing `controlled_by_parent` sets the master required.** In the object's Settings tab and in the package OWD overview, choosing the model writes `required: true` on the object's `master_detail` field in the same edit. With two or more `master_detail` fields, Studio does not choose one for you. It makes each of them required and shows the spec's refusal, which tells you to keep `master_detail` on one master and change the others to `lookup`. With no `master_detail` field, the Settings tab shows the spec's refusal too.
- **The Required box is locked.** On a `controlled_by_parent` object, a `master_detail` field's Required box is checked and locked, with a one-line reason. A stored master that is not yet required can still be ticked. Changing a field's type to `master_detail` makes it required.
- **A new master-detail field starts required** on every object. Outside `controlled_by_parent` you can still clear it there.
- **The overview names the master the runtime uses.** That is the one required `master_detail` field. With none, or two or more, the row says the object has no master. Before this change it named the first `master_detail` field, even one that was not required.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).

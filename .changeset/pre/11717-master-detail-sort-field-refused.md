---
'@object-ui/plugin-form': patch
---

`@objectstack/spec` 17.7.0 retires `sortField` on an `object-master-detail-form` `details` entry (objectstack-ai/objectstack#21589), so `objectui validate` now refuses an entry that writes it, at that member, with the spec's retired-key message (objectui#11717). The form never read it: the line-position field is derived from the child object (objectui#11070). The `details` registration description and the `MasterDetailDetailConfig` docblock now say so. The type is unchanged: it already left the key off.

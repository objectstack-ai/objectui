---
'@object-ui/fields': patch
---

A row action's `defaultFromRow` param backed by a relation is seeded with the related record's id again, not the whole record (objectui#13271).

Related lists read their rows with the relations they show expanded, so a `lookup`, `master_detail`, `user` or `tree` value arrives as the related record. The param seed copied that record verbatim, and the action sent it where the endpoint expects the id. Setup → Teams → Remove from Team answered 400 "User is not a member of the organization" for every member.

The seed now uses the row's stored form, by the same field-type rule the predicate and Undo paths use: a field the row's object declares relational becomes its id, and a `multiple` one becomes the array of ids. Every other field, including a `json` value that has an `id` key, is seeded exactly as before. The dialog still shows the related record's name. Nothing is added to the package entry.

---
'@object-ui/react': minor
'@object-ui/fields': patch
'@object-ui/plugin-grid': patch
'@object-ui/plugin-detail': patch
'@object-ui/app-shell': patch
---

Referenced records are read through one shared, batched store: a page of reference cells costs one read per referenced object, not one request per row.

A lookup cell holding a bare id (a reference the server did not expand) used to read its record with its own `findOne`, so a list with an unexpanded reference column sent one `GET /data/<object>/<id>` per row — 25 per page on an organization's member list, on every page. Six other surfaces resolved references with their own private caches and batches.

`@object-ui/react` now exports the one reader, `useReferenceRecords` / `useReferenceRecordSets` / `fetchReferenceRecords` (and `useReferenceObjectDef` / `fetchReferenceObjectDef` for the referenced object's definition). Every key asked in the same tick is merged into one `find` with an `$in` filter per `(object, keyField)`, answers are cached per data source, and a write reported through `notifyDataChanged` re-reads the stale keys in place. Its consumers:

- `@object-ui/fields`: the lookup cell reads through it, and now names EVERY entry of a multi-value lookup (it resolved only the first). The user cell resolves a bare person id instead of drawing it unresolved, and draws "Restricted record" for one the read leaves out. `LookupField`'s chip hydration joins the same batch — a single id included, which no longer uses `findOne`.
- `@object-ui/plugin-grid`: the pointer-pair cell drops its private store.
- `@object-ui/plugin-detail`: the related list's label map (option labels, user values, client-side sort) reads the same answers the cells read, so it costs no request of its own.
- `@object-ui/app-shell`: the recipient label directory's record kinds and the approver directory's label and person reads go through it.

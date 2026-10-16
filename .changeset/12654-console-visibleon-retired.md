---
'@object-ui/console': minor
---

The console's form page (`FormPage`, the `/forms/:name` and public `/f/:slug` routes) reads a form view field's and section's visibility predicate from `visibleWhen` only (objectui#12654). `@objectstack/spec` 18 retires both `visibleOn` keys as `retiredKey` tombstones naming `visibleWhen` (objectstack#23543 F4).

What a raw schema loses: a form view handed to this page without passing through the spec's parse, whose field or section carries only `visibleOn`, no longer hides that field or section; write `visibleWhen`. What is unaffected: form views served by an ObjectStack runtime, which already arrive with `visibleWhen` (the spec's parse fold through the 18 pre-releases, and spec 18's stored-row rehydration).

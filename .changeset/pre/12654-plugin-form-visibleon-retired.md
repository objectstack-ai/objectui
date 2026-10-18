---
'@object-ui/plugin-form': minor
---

A form view field's `visibleOn` is no longer read when sections are normalized (`normalizeSectionField`, used by `ObjectForm`, `ModalForm` and the record form page) (objectui#12654). `@objectstack/spec` 18 retires the form view field's `visibleOn` as a `retiredKey` tombstone naming `visibleWhen` (objectstack#23543 F4), so the field's `visibleWhen` is the one view-level predicate carried onto the runtime field.

What a raw schema loses: a form view section entry `{ field: 'x', visibleOn: 'PREDICATE' }` that did not pass through the spec's parse no longer hides the field; write `visibleWhen`. A runtime `FormField` (an inline field object with its own `name`) keeps its `visibleOn` slot: that is the runtime field's view-level gate, a different key, and it is unchanged.

What is unaffected: form views served by an ObjectStack runtime. They already arrive with `visibleWhen`: the spec's parse folds the old key through the 18 pre-releases, and spec 18's stored-row rehydration rewrites a row stored with it.

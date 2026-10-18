---
'@object-ui/app-shell': patch
---

**The console's New and Edit dialog on a field-heavy object opens bounded on desktop** (objectui#12521). For an object with twelve or more authorable fields, `@objectstack/spec`'s `deriveRecordFlowSurface` answers a full-screen modal for a create, edit or child task, and the console opened that dialog at 95% of the viewport. The console now gives that answer the bounded shape the spec is moving to (objectstack-ai/objectstack#23734), so `ModalForm`'s own default sizes the dialog: `xl` or `lg`, never `full`.

This is an interim with a pinned exit: the bound is one function in the console's record-dialog host, and a test fails, naming its deletion, once objectui installs a spec that derives the bound itself. On a phone the dialog is the full-screen sheet it was. No type, prop or export changes.

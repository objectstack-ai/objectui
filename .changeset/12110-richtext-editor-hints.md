---
'@object-ui/fields': patch
---

A rich-text field no longer draws hint lines above its editor (objectui#12110, ruled B). The `markdown`, `html` and `richtext` editors used to show "Format: markdown" (or "Format: html") and "Rich text editor (basic)" above the textarea, on every form. An anonymous visitor on a public form read them as editor chrome. Both lines are gone everywhere: on public forms, on internal forms, and in the fullscreen dialog. The field's own `placeholder` and help text are unchanged and remain the place for authored guidance.

Nothing is added to or removed from the package entry: no export, prop, type member or language-pack key changes. The two catalogue keys the lines used, `fields.richText.format` and `fields.richText.basicEditorHint`, stay in every language pack; nothing reads them now.

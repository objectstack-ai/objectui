---
'@object-ui/plugin-form': minor
---

**A record dialog with no authored layout opens bounded, with a two-column field grid** (objectui#12521). Two defaults of `ModalForm` change. Neither reaches a dialog whose author declared the setting.

- **Size.** A dialog with no `modalSize` derived its width from its inferred column count, and three or more columns derived `full` (95vw). It now derives `lg` or `xl` from the grid it renders and its field count, and never `full`. `inferModalSize` returns `'lg'` for one column and `'xl'` for two or more. An authored `modalSize`, `'full'` included, is used as written.
- **Grid.** A dialog whose form declares no `columns`, and none of whose sections declares any, inferred one to four columns from its field count. It now lays out at two columns from the container's `@md` tier up and one below it, so the phone sheet is unchanged. Every field takes one cell, so fields of one kind share one width. A wide kind (textarea, rich text, markdown, html, an inline grid) and a `span: 'full'` field take the whole row. This covers the flat field list, the object's `fieldGroups` fallback, and sections that declare no columns. A section without `columns` beside sections that declare them keeps the form grid's density, as before.
- **What does not move.** Authored `columns`, a section's `columns` and a field's `colSpan` / `span` render the same grid classes as before. `inferColumns`, and the page form, drawer and detail view that read it, are unchanged. A host that passes a `modalSize` of its own keeps it. That includes the console's New / Edit dialog on an object with twelve or more authorable fields, which passes `full` from the record-surface derivation.

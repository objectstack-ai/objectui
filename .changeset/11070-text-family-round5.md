---
'@object-ui/types': minor
'@object-ui/components': minor
'@object-ui/fields': minor
'@object-ui/plugin-form': minor
'@object-ui/plugin-dashboard': patch
---

The text-family field types and every length reader use `@objectstack/spec`'s own `minLength` / `maxLength`, and the snake_case `min_length` / `max_length` are retired at once, with no alias (objectui#11070, the text-family round). Two switches nothing read, `auto_compute` and `auto_update`, are retired too.

- **Types.** `TextFieldMetadata` and `TextareaFieldMetadata` declare `minLength` and `maxLength`; `MarkdownFieldMetadata`, `HtmlFieldMetadata`, `RichtextFieldMetadata`, `EmailFieldMetadata` and `UrlFieldMetadata` declare `maxLength`. Each is `FieldSchema`'s member by reference, and each replaces the snake_case member the type declared before. `FormulaFieldMetadata.auto_compute` and `SummaryFieldMetadata.auto_update` are removed: nothing in ObjectUI read either.
- **Readers.** The form renderer's built-in `input`, `textarea` and fallback branches, the form's validation rules (`buildValidationRules`), `TextAreaField`, `RichTextField`, `EmbeddableForm`'s default long-text cap and `ObjectForm`'s length forwarding read `maxLength` / `minLength` alone. The built-in branches no longer strip a `max_length` key off the element: nothing reads it, so it is treated like any other undeclared key.
- **Dashboard.** `ObjectDataTable` and `RecordDetailDrawer` no longer copy a lookup's `display_field` onto their internal cell meta. The lookup cell has read the display pointer as `displayField` since objectui#7155, so nothing changes on screen.

`FieldSchema` refuses `min_length`, `max_length`, `auto_compute` and `auto_update` by name, so no spec-compliant producer writes them. A definition served through `ObjectStackAdapter.getObjectSchema` or `MetadataProvider` is unaffected even if it was stored with a snake_case length: the ingestion pass folds `max_length` / `min_length` onto `maxLength` / `minLength` before any reader sees it. Measured with an object-bound `textarea` field declaring `max_length: 111` on `ObjectForm`, served through `ObjectStackAdapter`: the editor has `maxlength="111"` and a `0/111` counter before and after this change.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

The type change is a compile error for TypeScript that writes `min_length`, `max_length`, `auto_compute` or `auto_update` on one of these types (an excess-property error naming the key). Rename the first two to `minLength` / `maxLength`, and delete the other two.

At runtime, a length spelled only `max_length` or `min_length` now applies nowhere the ingestion fold does not run first. Measured before and after this change:

- **A hand-authored `form` document handed straight to the renderer.** A built-in `input` field with `max_length: 5` and a `textarea` field with `max_length: 7` rendered `maxlength="5"` and `maxlength="7"`. They now render no `maxlength`, and the element carries `max_length` as an inert attribute, as it would any key the renderer does not read. The same fields spelled `maxLength` render identically before and after.
- **An object definition served to `ObjectForm` by a `DataSource` other than `ObjectStackAdapter`.** A `textarea` field with `max_length: 111` had `maxlength="111"` and a `0/111` counter; it now has neither. The same field spelled `maxLength` is unchanged.
- **Submit-time validation.** `buildValidationRules` on a field carrying only `max_length: 9` / `min_length: 2` produced `maxLength` and `minLength` rules; it now produces no rules.
- **`EmbeddableForm`.** A custom `textarea` field carrying `max_length: 40` used to opt out of the default cap and got no `maxLength`; it now gets the 5000-character long-text default.

**Fix:** spell the bounds `maxLength` / `minLength`.

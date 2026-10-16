---
'@object-ui/plugin-list': patch
'@object-ui/components': minor
'@object-ui/i18n': minor
---

The list filter builder starts on the view's first column, hides hidden fields, and offers one empty check where "empty" and "null" mean the same records (objectui#11810).

- **Field list.** The list view's Filter panel no longer offers a field the object definition marks `hidden: true` (Organization, Owning Business Unit, the search index). Its fields follow the view's columns in the order the grid shows them, then the other business fields, then the system fields (created / modified / owner). A hidden field stays listed only when the view names it in `filterableFields`, or when a condition the panel already holds filters on it, so a restored filter still shows its field.
- **"Add filter".** A new condition starts on the view's first visible column instead of the hidden Organization field.
- **Empty checks.** On a column whose type cannot hold an empty value other than null (select, lookup, number, date and the other "null only" types of `@objectstack/spec`'s `expandEmptyOperator`), the operator list offers "Is empty" / "Is not empty" and no longer "Is null" / "Is not null": there they match the same records. Text columns and list-valued columns keep both pairs, and the operator list says how they differ ("Is empty" also matches blank text, or an empty list). A stored "Is null" condition on such a column still loads and shows as "Is null". Every `FilterBuilder` consumer gets this offer; what a row can hold (`operatorsForFieldType`) is unchanged.

`@object-ui/i18n` gains two language-pack keys in all ten packs, `filterBuilder.emptyCheckHint.text` and `filterBuilder.emptyCheckHint.list`, which carry that hint. No export, prop or type member is added.

`@object-ui/components` raises its `@objectstack/spec` floor from `^17.0.0` to `^17.5.0`, because its published entry now imports `expandEmptyOperator`, which the spec first exports in 17.5.0.

---
'@object-ui/console': minor
---

The form routes `/f/:slug` and `/forms/:name` render every field with the widget the shared field resolver names for it — the same widget the record form renders (objectui#10179, objectui#10177).

Until now `FormPage` drew its controls with its own switch on the field type. The switch covered only some of the declared field types, and every other type rendered as a plain text box: `image`, `lookup`, `percent`, `richtext`, `signature` and more, with no error or warning. It also never read a field's `widget` key, so `object-ref`, `filter-condition` and `recipient-picker` could not be reached on these routes, and it ignored `multiple` on a `select`.

Now each row goes through `resolveFormWidgetType` and `getLazyFieldWidget` from `@object-ui/fields`. An authored `widget` wins over `type`, and the form view's `widget` wins over the object field's. A `select` with `multiple: true` renders the multi-select widget. The row label reaches the widget according to the widget's own labelling declaration, so a required boolean is named by its label once, not twice. A required radio group is now reachable by its label and exposes its required state.

Some behaviour changes with the widgets:

- Required is announced with `aria-required` and not the native attribute, so the page checks required rows itself before submitting. It refuses a submit that leaves a visible, editable required row empty, and names the empty rows. `false` counts as a value. An untouched required boolean holds no value and is refused, as the record form refuses it.
- Values are whatever the shared widgets emit. For example, a multi-value select submits an array, and a date-time field submits the value the shared date-time widget produces.
- Field types that `@objectstack/spec` does not declare, such as `long_text`, `paragraph`, `integer`, `picklist` and `timestamp`, get the resolver's `text` fallback. Before, the old switch drew a dedicated control for them.
- The page shell is unchanged: public and internal loading, the submit target, the post-submit behaviour, `?recordId=` prefill, `redirect` and `visibleWhen`.
